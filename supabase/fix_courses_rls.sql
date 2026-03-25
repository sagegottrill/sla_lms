-- Run this in the Supabase SQL editor on an existing project if course/program inserts fail with:
-- "new row violates row-level security policy"
-- Replaces broad FOR ALL policies with explicit INSERT/UPDATE/DELETE + WITH CHECK.

-- PROGRAMS
drop policy if exists "Admins and program managers can manage programs" on public.programs;
drop policy if exists "Admins and program managers can insert programs" on public.programs;
drop policy if exists "Admins and program managers can update programs" on public.programs;
drop policy if exists "Admins and program managers can delete programs" on public.programs;

create policy "Admins and program managers can insert programs"
  on public.programs for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'program_manager')
    )
  );

create policy "Admins and program managers can update programs"
  on public.programs for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'program_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'program_manager')
    )
  );

create policy "Admins and program managers can delete programs"
  on public.programs for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'program_manager')
    )
  );

-- COURSES
drop policy if exists "Instructors and admins can manage courses" on public.courses;
drop policy if exists "Staff can insert courses" on public.courses;
drop policy if exists "Staff can update courses" on public.courses;
drop policy if exists "Staff can delete courses" on public.courses;

create policy "Staff can insert courses"
  on public.courses for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  );

create policy "Staff can update courses"
  on public.courses for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  );

create policy "Staff can delete courses"
  on public.courses for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  );
