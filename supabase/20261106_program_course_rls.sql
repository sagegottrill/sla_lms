-- ============================================================
-- SERVER-SIDE PROGRAM COURSE ISOLATION (RLS)
-- Moves the BoostHer/program scoping from the API layer into Postgres so it
-- is enforcement-grade: even a hand-crafted query with the anon key cannot
-- read a program's courses without being a participant.
--
-- Model (courses SELECT):
--   anon            → published GENERAL courses only (program_id is null)
--   authenticated   → published general courses
--                     + published courses of programs they are enrolled in
--                     + their own courses (instructor_id = auth.uid())
--   staff (admin / program_manager / instructor) → every course, any status
-- Writes are unchanged (staff-only policies already in place).
--
-- IDEMPOTENT: safe to re-run. Apply via the Supabase SQL editor or the
-- Management API (POST /v1/projects/{ref}/database/query).
-- ============================================================

-- ── Helpers (security definer so profiles RLS can never break the check) ──
create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_program_participant(p_program_id int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments
    where user_id = auth.uid()
      and program_id = p_program_id
      and status <> 'dropped'
  )
$$;

-- ── Replace every legacy SELECT policy on courses ──
drop policy if exists "Published courses are viewable by everyone" on public.courses;
drop policy if exists "Courses access control" on public.courses;
drop policy if exists "baseline_courses_select_anon" on public.courses;
drop policy if exists "baseline_courses_select_authenticated" on public.courses;
drop policy if exists "courses_select_general_public" on public.courses;
drop policy if exists "courses_select_authenticated" on public.courses;
drop policy if exists "courses_select_staff_all" on public.courses;

create policy "courses_select_general_public"
  on public.courses for select
  to anon
  using (status = 'published' and program_id is null);

create policy "courses_select_authenticated"
  on public.courses for select
  to authenticated
  using (
    (status = 'published' and program_id is null)
    or (status = 'published' and program_id is not null and public.is_program_participant(program_id))
    or public.current_user_role() in ('admin', 'program_manager')
    or instructor_id = auth.uid()
  );

create policy "courses_select_staff_all"
  on public.courses for select
  to authenticated
  using (public.current_user_role() in ('admin', 'program_manager', 'instructor'));
