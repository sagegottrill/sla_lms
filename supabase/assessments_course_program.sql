  -- ============================================================
  -- Link skills assessments to courses and programs + staff RLS
  -- Run on Supabase SQL editor after schema.sql / existing DB.
  -- ============================================================

  alter table public.skills_assessments
    add column if not exists course_id integer references public.courses (id) on delete set null;

  alter table public.skills_assessments
    add column if not exists program_id integer references public.programs (id) on delete set null;

  alter table public.skills_assessments
    add column if not exists category text not null default '';

  alter table public.skills_assessments
    add column if not exists duration text not null default '15 min';

  alter table public.skills_assessments
    add column if not exists icon_name text not null default 'Target';

  -- One scope per row: global, course-only, or program-only
  do $$
  begin
    alter table public.skills_assessments
      add constraint skills_assessments_scope_check check (
        (course_id is null and program_id is null)
        or (course_id is not null and program_id is null)
        or (course_id is null and program_id is not null)
      );
  exception
    when duplicate_object then null;
  end $$;

  create index if not exists idx_skills_assessments_course_id on public.skills_assessments (course_id);
  create index if not exists idx_skills_assessments_program_id on public.skills_assessments (program_id);

  -- -------------------------
  -- RLS: staff can manage assessments + questions
  -- -------------------------

  drop policy if exists "Staff insert skills_assessments" on public.skills_assessments;
  create policy "Staff insert skills_assessments"
    on public.skills_assessments for insert
    with check (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'program_manager')
      )
      or (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'instructor'
        )
        and course_id is not null
        and program_id is null
        and exists (
          select 1 from public.courses c
          where c.id = course_id and c.instructor_id = auth.uid()
        )
      )
    );

  drop policy if exists "Staff update skills_assessments" on public.skills_assessments;
  create policy "Staff update skills_assessments"
    on public.skills_assessments for update
    using (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'program_manager')
      )
      or (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'instructor'
        )
        and course_id is not null
        and exists (
          select 1 from public.courses c
          where c.id = course_id and c.instructor_id = auth.uid()
        )
      )
    )
    with check (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'program_manager')
      )
      or (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'instructor'
        )
        and course_id is not null
        and program_id is null
        and exists (
          select 1 from public.courses c
          where c.id = course_id and c.instructor_id = auth.uid()
        )
      )
    );

  drop policy if exists "Staff delete skills_assessments" on public.skills_assessments;
  create policy "Staff delete skills_assessments"
    on public.skills_assessments for delete
    using (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'program_manager')
      )
      or (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'instructor'
        )
        and course_id is not null
        and exists (
          select 1 from public.courses c
          where c.id = course_id and c.instructor_id = auth.uid()
        )
      )
    );

  drop policy if exists "Staff insert skills_questions" on public.skills_questions;
  create policy "Staff insert skills_questions"
    on public.skills_questions for insert
    with check (
      exists (
        select 1 from public.skills_assessments sa
        where sa.id = assessment_id
        and (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'program_manager')
          )
          or (
            exists (
              select 1 from public.profiles p
              where p.id = auth.uid() and p.role = 'instructor'
            )
            and sa.course_id is not null
            and exists (
              select 1 from public.courses c
              where c.id = sa.course_id and c.instructor_id = auth.uid()
            )
          )
        )
      )
    );

  drop policy if exists "Staff update skills_questions" on public.skills_questions;
  create policy "Staff update skills_questions"
    on public.skills_questions for update
    using (
      exists (
        select 1 from public.skills_assessments sa
        where sa.id = assessment_id
        and (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'program_manager')
          )
          or (
            exists (
              select 1 from public.profiles p
              where p.id = auth.uid() and p.role = 'instructor'
            )
            and sa.course_id is not null
            and exists (
              select 1 from public.courses c
              where c.id = sa.course_id and c.instructor_id = auth.uid()
            )
          )
        )
      )
    );

  drop policy if exists "Staff delete skills_questions" on public.skills_questions;
  create policy "Staff delete skills_questions"
    on public.skills_questions for delete
    using (
      exists (
        select 1 from public.skills_assessments sa
        where sa.id = assessment_id
        and (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'program_manager')
          )
          or (
            exists (
              select 1 from public.profiles p
              where p.id = auth.uid() and p.role = 'instructor'
            )
            and sa.course_id is not null
            and exists (
              select 1 from public.courses c
              where c.id = sa.course_id and c.instructor_id = auth.uid()
            )
          )
        )
      )
    );
