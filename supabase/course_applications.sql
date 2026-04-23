-- Course pre-enrollment applications (run in Supabase SQL Editor if the table does not exist yet)
-- Stores intake before paid checkout; admins can list via api.getCourseApplications(courseId)

create table if not exists public.course_applications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_id   int not null references public.courses (id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  phone       text not null default '',
  goal        text,
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz default now()
);

create index if not exists idx_course_applications_course_id on public.course_applications (course_id);
create index if not exists idx_course_applications_user_id on public.course_applications (user_id);

alter table public.course_applications enable row level security;

-- Users can create their own application rows
create policy "Users can insert own course applications"
  on public.course_applications for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can read their own applications
create policy "Users can read own course applications"
  on public.course_applications for select
  to authenticated
  using (auth.uid() = user_id);

-- Staff + course instructor can read applications for their courses
create policy "Staff and course instructor can read course applications"
  on public.course_applications for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'program_manager')
    )
    or exists (
      select 1 from public.courses c
      where c.id = course_applications.course_id and c.instructor_id = auth.uid()
    )
  );
      