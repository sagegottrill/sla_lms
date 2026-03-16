-- ============================================================
-- SLA CONNECTA LMS — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Drop in reverse dependency order for safe re-runs
drop table if exists public.payments cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.jobs cascade;
drop table if exists public.courses cascade;
drop table if exists public.programs cascade;
drop table if exists public.profiles cascade;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ============================================================
-- PROFILES (synced from auth.users)
-- ============================================================
create table public.profiles (
  id               uuid references auth.users on delete cascade primary key,
  name             text not null default '',
  email            text,
  role             text not null default 'student'
                   check (role in ('student', 'instructor', 'program_manager', 'admin')),
  avatar_url       text,
  bio              text,
  headline         text,
  location         text,
  linkedin         text,
  career_goal      text,
  onboarding_completed boolean default false,
  joined           timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- PROGRAMS
-- ============================================================
create table public.programs (
  id             serial primary key,               -- integer to match frontend
  title          text not null,
  description    text not null default '',
  tagline        text,
  category       text,
  image          text,
  duration       text not null default '',
  start_date     text,
  deadline       text,
  price          numeric not null default 0,
  original_price numeric,
  enrolled       int default 0,
  capacity       int default 100,
  course_count   int default 0,
  tag            text,
  level          text,
  highlights     jsonb default '[]',              -- string[]
  courses        jsonb default '[]',              -- string[] (course names list)
  status         text default 'upcoming'
                 check (status in ('upcoming', 'active', 'completed')),
  created_at     timestamptz default now()
);

-- ============================================================
-- COURSES
-- ============================================================
create table public.courses (
  id                  serial primary key,          -- integer to match frontend
  program_id          int references public.programs on delete set null,
  instructor_id       uuid references public.profiles on delete set null,
  title               text not null,
  subtitle            text not null default '',
  description         text,
  instructor          text not null default '',
  instructor_title    text,
  instructor_bio      text,
  instructor_avatar   text,
  category            text not null default '',
  level               text default 'Beginner',
  rating              numeric(3,1) default 0,
  review_count        int default 0,
  students            int default 0,
  duration            text not null default '',
  language            text default 'English',
  last_updated        text,
  price               numeric not null default 0,
  original_price      numeric,
  image               text,
  badge               text default 'New',
  bestseller          boolean default false,
  what_youll_learn    jsonb default '[]',          -- string[]
  curriculum          jsonb default '[]',          -- {module, lessons, duration, items[]}[]
  reviews             jsonb default '[]',          -- {name, rating, comment, date}[]
  status              text default 'published'
                      check (status in ('draft', 'published', 'archived')),
  created_at          timestamptz default now()
);

-- ============================================================
-- JOBS
-- ============================================================
create table public.jobs (
  id          serial primary key,
  title       text not null,
  company     text not null,
  location    text not null default '',
  type        text not null default 'Full-time',
  salary      text,
  skills      jsonb default '[]',                 -- string[]
  posted      text,
  logo        text,
  description text,
  created_at  timestamptz default now()
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
create table public.enrollments (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles on delete cascade not null,
  course_id        int references public.courses on delete cascade,
  program_id       int references public.programs on delete cascade,
  status           text default 'active'
                   check (status in ('active', 'completed', 'dropped')),
  progress         numeric default 0,             -- 0–100
  current_lesson   text,
  enrolled_at      timestamptz default now(),
  completed_at     timestamptz,
  unique(user_id, course_id),
  unique(user_id, program_id),
  check(course_id is not null or program_id is not null)
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade not null,
  course_id   int references public.courses on delete cascade,
  program_id  int references public.programs on delete cascade,
  amount      numeric not null,
  currency    text default 'NGN',
  status      text default 'pending'
              check (status in ('pending', 'successful', 'failed')),
  reference   text not null unique,
  method      text not null,
  receipt_id  text,
  created_at  timestamptz default now(),
  check(course_id is not null or program_id is not null)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.programs   enable row level security;
alter table public.courses    enable row level security;
alter table public.jobs       enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments   enable row level security;

-- PROFILES policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- PROGRAMS policies (public read)
create policy "Programs are viewable by everyone"
  on public.programs for select using (true);

create policy "Admins and program managers can manage programs"
  on public.programs for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'program_manager')
    )
  );

-- COURSES policies (public read for published)
create policy "Published courses are viewable by everyone"
  on public.courses for select
  using (status = 'published' or auth.uid() is not null);

create policy "Instructors and admins can manage courses"
  on public.courses for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  );

-- JOBS policies (public read)
create policy "Jobs are viewable by everyone"
  on public.jobs for select using (true);

create policy "Admins can manage jobs"
  on public.jobs for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ENROLLMENTS policies
create policy "Users can view their own enrollments"
  on public.enrollments for select using (auth.uid() = user_id);

create policy "Users can enroll themselves"
  on public.enrollments for insert with check (auth.uid() = user_id);

create policy "Users can update their own enrollment progress"
  on public.enrollments for update using (auth.uid() = user_id);

create policy "Admins and managers can view all enrollments"
  on public.enrollments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'program_manager')
    )
  );

-- PAYMENTS policies
create policy "Users can view their own payments"
  on public.payments for select using (auth.uid() = user_id);

create policy "Users can insert their own payments"
  on public.payments for insert with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on sign up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- HELPER: updated_at trigger for profiles
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
