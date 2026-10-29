  -- ============================================================
  -- SLA CONNECT HER LMS — Supabase Schema
  -- Run in Supabase: Dashboard → SQL Editor → New query
  --
  -- WHEN TO USE THIS FILE
  -- • Brand-new / empty project: you can run the full script (it DROPs tables
  --   then recreates). You will lose all data if tables already exist.
  -- • Production / existing data: do NOT run the DROP section blindly. Apply
  --   targeted patches only (e.g. supabase/fix_courses_rls.sql for RLS policy
  --   fixes) unless you intend a full reset.
-- • After schema changes, re-check Auth → RLS policies and Storage bucket
--   policies in the dashboard; client RoleGuard is not a substitute for RLS.
-- • Run supabase/storage_setup.sql so profile avatars & course images can upload
--   (creates buckets avatars + courses and storage.objects RLS).
  -- ============================================================

  -- Drop in reverse dependency order for safe re-runs
  drop table if exists public.payments cascade;
  drop table if exists public.enrollments cascade;
  drop table if exists public.jobs cascade;
  drop table if exists public.courses cascade;
  drop table if exists public.programs cascade;
  drop table if exists public.user_resume_drafts cascade;
  drop table if exists public.profiles cascade;
  drop table if exists public.certificates cascade;
  drop table if exists public.portfolio_items cascade;
  drop table if exists public.skills_assessments cascade;
  drop table if exists public.skills_questions cascade;
  drop table if exists public.skills_results cascade;
  drop table if exists public.webhook_events cascade;
  drop table if exists public.marketing_campaigns cascade;
  drop table if exists public.forum_replies cascade;
  drop table if exists public.forum_threads cascade;
  drop table if exists public.email_templates cascade;
  drop table if exists public.saved_reports cascade;
  drop table if exists public.notification_preferences cascade;
  drop table if exists public.user_notification_state cascade;
  drop table if exists public.site_config cascade;
  drop table if exists public.career_milestones cascade;
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
                    check (role in ('student', 'instructor', 'program_manager', 'admin', 'recruiter')),
    avatar_url       text,
    bio              text,
    headline         text,
    location         text,
    linkedin         text,
    career_goal      text,
    skills           jsonb default '[]'::jsonb,   -- string[] — learner/instructor profile skills
    interests        jsonb default '[]'::jsonb, -- string[] — onboarding / recommendations
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
    public_id      uuid not null default gen_random_uuid(),
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
    public_id           uuid not null default gen_random_uuid(),
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
    post_assessment_url text,                        -- required post-assessment (Google Form); certificate gate
    post_assessment_title text default 'Post-Assessment',
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
                    check (status in ('active', 'completed', 'dropped', 'frozen')), -- Added 'frozen'
    progress         numeric default 0,             -- 0–100
    current_lesson   text,
    assessment_opened_at timestamptz,               -- required post-assessment was opened (certificate gate)
    last_accessed    timestamptz default now(),     -- Tracking for "Resume Learning"
    enrolled_at      timestamptz default now(),
    completed_at     timestamptz,
    unique(user_id, course_id),
    unique(user_id, program_id),
    check(course_id is not null or program_id is not null)
  );

  -- Indices for dashboard performance
  create index if not exists idx_enrollments_user_id on public.enrollments(user_id);
  create index if not exists idx_enrollments_status on public.enrollments(status);
  create index if not exists idx_courses_program_id on public.courses(program_id);
  create unique index if not exists idx_courses_public_id on public.courses(public_id);
  create unique index if not exists idx_programs_public_id on public.programs(public_id);

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

  -- COURSES policies (public read for published)
  create policy "Published courses are viewable by everyone"
    on public.courses for select
    using (status = 'published' or auth.uid() is not null);

  -- Split ALL into INSERT/UPDATE/DELETE with explicit WITH CHECK so inserts are not rejected by RLS.
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

  -- JOBS policies (public read)
  create policy "Jobs are viewable by everyone"
    on public.jobs for select using (true);

  create policy "Staff can manage jobs"
    on public.jobs for all
    using (
      exists (
        select 1 from public.profiles
        where id = auth.uid() 
        and role in ('admin', 'program_manager', 'recruiter')
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
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
      ),
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

  -- ============================================================
  -- ADDITIONAL TABLES REQUIRED BY APP (Handover)
  -- ============================================================

  -- Webhook idempotency (used by Paystack Edge Function)
  create table if not exists public.webhook_events (
    id uuid default gen_random_uuid() primary key,
    reference text unique not null,
    payload jsonb,
    processed_at timestamptz default now()
  );
  alter table public.webhook_events enable row level security;
  create policy "Webhook events not readable by clients" on public.webhook_events
    for select using (false);

  -- User certificates
  create table if not exists public.certificates (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    course_id int references public.courses on delete cascade,
    program_id int references public.programs on delete cascade,
    course_title text,
    instructor text,
    duration text,
    credential_id text unique,
    completed_at timestamptz default now()
  );
  alter table public.certificates enable row level security;
  create policy "Certificates visible to owner" on public.certificates
    for select using (auth.uid() = user_id);
  create policy "Certificates insertable by owner" on public.certificates
    for insert with check (auth.uid() = user_id);
  create policy "Certificates updatable by owner" on public.certificates
    for update using (auth.uid() = user_id);

  -- Portfolio items
  create table if not exists public.portfolio_items (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    title text not null,
    type text not null,
    description text default '',
    tags jsonb default '[]'::jsonb,
    file_url text,
    link_url text,
    created_at timestamptz default now()
  );
  alter table public.portfolio_items enable row level security;
  create policy "Portfolio items visible to owner" on public.portfolio_items
    for select using (auth.uid() = user_id);
  create policy "Portfolio items insertable by owner" on public.portfolio_items
    for insert with check (auth.uid() = user_id);
  create policy "Portfolio items deletable by owner" on public.portfolio_items
    for delete using (auth.uid() = user_id);

  -- Skills assessments & results
  create table if not exists public.skills_assessments (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text default '',
    total_questions int default 0,
    course_id int references public.courses on delete set null,
    program_id int references public.programs on delete set null,
    category text not null default '',
    duration text not null default '15 min',
    icon_name text not null default 'Target',
    created_at timestamptz default now(),
    constraint skills_assessments_scope_check check (
      (course_id is null and program_id is null)
      or (course_id is not null and program_id is null)
      or (course_id is null and program_id is not null)
    )
  );
  create index if not exists idx_skills_assessments_course_id on public.skills_assessments (course_id);
  create index if not exists idx_skills_assessments_program_id on public.skills_assessments (program_id);
  alter table public.skills_assessments enable row level security;
  create policy "Assessments readable by authenticated" on public.skills_assessments
    for select using (auth.uid() is not null);

  create table if not exists public.skills_questions (
    id uuid default gen_random_uuid() primary key,
    assessment_id uuid references public.skills_assessments on delete cascade not null,
    question_text text not null,
    options jsonb default '[]'::jsonb,
    correct_index int not null default 0
  );
  alter table public.skills_questions enable row level security;
  create policy "Questions readable by authenticated" on public.skills_questions
    for select using (auth.uid() is not null);

  create policy "Staff insert skills_assessments" on public.skills_assessments
    for insert with check (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
      or (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
        and course_id is not null and program_id is null
        and exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid())
      )
    );
  create policy "Staff update skills_assessments" on public.skills_assessments
    for update using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
      or (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
        and course_id is not null
        and exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid())
      )
    )
    with check (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
      or (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
        and course_id is not null and program_id is null
        and exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid())
      )
    );
  create policy "Staff delete skills_assessments" on public.skills_assessments
    for delete using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
      or (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
        and course_id is not null
        and exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid())
      )
    );

  create policy "Staff insert skills_questions" on public.skills_questions
    for insert with check (
      exists (
        select 1 from public.skills_assessments sa
        where sa.id = assessment_id
        and (
          exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
          or (
            exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
            and sa.course_id is not null
            and exists (select 1 from public.courses c where c.id = sa.course_id and c.instructor_id = auth.uid())
          )
        )
      )
    );
  create policy "Staff update skills_questions" on public.skills_questions
    for update using (
      exists (
        select 1 from public.skills_assessments sa
        where sa.id = assessment_id
        and (
          exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
          or (
            exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
            and sa.course_id is not null
            and exists (select 1 from public.courses c where c.id = sa.course_id and c.instructor_id = auth.uid())
          )
        )
      )
    );
  create policy "Staff delete skills_questions" on public.skills_questions
    for delete using (
      exists (
        select 1 from public.skills_assessments sa
        where sa.id = assessment_id
        and (
          exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'program_manager'))
          or (
            exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
            and sa.course_id is not null
            and exists (select 1 from public.courses c where c.id = sa.course_id and c.instructor_id = auth.uid())
          )
        )
      )
    );

  create table if not exists public.skills_results (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    assessment_id uuid references public.skills_assessments on delete cascade not null,
    score int not null default 0,
    total int not null default 0,
    level_name text,
    created_at timestamptz default now()
  );
  alter table public.skills_results enable row level security;
  create policy "Results visible to owner" on public.skills_results
    for select using (auth.uid() = user_id);
  create policy "Results insertable by owner" on public.skills_results
    for insert with check (auth.uid() = user_id);

  -- Campaigns (email/SMS marketing)
  create table if not exists public.marketing_campaigns (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    name text not null,
    subject text default '',
    audience text default '',
    channel text not null check (channel in ('email','sms','both')),
    scheduled_at timestamptz,
    body text not null default '',
    status text not null default 'draft' check (status in ('draft','scheduled','sent','cancelled')),
    sent_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  alter table public.marketing_campaigns enable row level security;
  create policy "Campaigns readable by authenticated" on public.marketing_campaigns
    for select using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager'))
      OR user_id = auth.uid()
    );
  create policy "Campaigns insertable by staff" on public.marketing_campaigns
    for insert with check (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager'))
    );
  create policy "Campaigns updates/deletes by staff" on public.marketing_campaigns
    for all using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager'))
    );

  -- Forum threads
  create table if not exists public.forum_threads (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    title text not null,
    body text not null,
    category text not null default 'General',
    author_name text not null default '',
    pinned boolean not null default false,
    solved boolean not null default false,
    likes int not null default 0,
    replies_count int not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  alter table public.forum_threads enable row level security;
  create policy "Threads readable by authenticated" on public.forum_threads
    for select using (auth.uid() is not null);
  create policy "Threads insertable by authenticated" on public.forum_threads
    for insert with check (auth.uid() = user_id);
  create policy "Threads updates by owner or staff" on public.forum_threads
    for update using (
      auth.uid() = user_id OR exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager'))
    );

  -- Forum replies
  create table if not exists public.forum_replies (
    id uuid default gen_random_uuid() primary key,
    thread_id uuid references public.forum_threads on delete cascade not null,
    user_id uuid references public.profiles on delete cascade not null,
    body text not null,
    created_at timestamptz default now()
  );
  alter table public.forum_replies enable row level security;
  create policy "Replies readable by authenticated" on public.forum_replies
    for select using (auth.uid() is not null);
  create policy "Replies insertable by authenticated" on public.forum_replies
    for insert with check (auth.uid() = user_id);

  -- Email templates
  create table if not exists public.email_templates (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    name text not null,
    category text not null default 'General',
    subject text not null default '',
    body text not null,
    updated_at timestamptz default now()
  );
  alter table public.email_templates enable row level security;
  create policy "Templates readable by staff" on public.email_templates
    for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager')));
  create policy "Templates insertable by staff" on public.email_templates
    for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager')));
  create policy "Templates updatable by staff" on public.email_templates
    for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager')));
  create policy "Templates deletable by staff" on public.email_templates
    for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','program_manager')));

  -- Saved reports
  create table if not exists public.saved_reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    name text not null,
    metric text not null,
    dimension text not null,
    chart_type text not null,
    date_range text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, name, metric, dimension, chart_type, date_range)
  );
  alter table public.saved_reports enable row level security;
  create policy "Reports readable by owner" on public.saved_reports
    for select using (auth.uid() = user_id);
  create policy "Reports insertable by owner" on public.saved_reports
    for insert with check (auth.uid() = user_id);
  create policy "Reports updatable/deletable by owner" on public.saved_reports
    for all using (auth.uid() = user_id);

  -- Notification preferences
  create table if not exists public.notification_preferences (
    user_id uuid primary key references public.profiles on delete cascade,
    frequency text not null default 'instant',
    quiet_start text not null default '22:00',
    quiet_end text not null default '07:00',
    prefs jsonb not null default '{}'::jsonb,
    updated_at timestamptz default now()
  );
  alter table public.notification_preferences enable row level security;
  create policy "Preferences visible to owner" on public.notification_preferences
    for select using (auth.uid() = user_id);
  create policy "Preferences upsertable by owner" on public.notification_preferences
    for insert with check (auth.uid() = user_id);
  create policy "Preferences updatable by owner" on public.notification_preferences
    for update using (auth.uid() = user_id);

  -- Notification read/dismiss state
  create table if not exists public.user_notification_state (
    user_id uuid references public.profiles on delete cascade not null,
    notification_key text not null,
    read boolean not null default false,
    dismissed boolean not null default false,
    updated_at timestamptz default now(),
    primary key (user_id, notification_key)
  );
  alter table public.user_notification_state enable row level security;
  create policy "Notification state visible to owner" on public.user_notification_state
    for select using (auth.uid() = user_id);
  create policy "Notification state insertable by owner" on public.user_notification_state
    for insert with check (auth.uid() = user_id);
  create policy "Notification state updatable by owner" on public.user_notification_state
    for update using (auth.uid() = user_id);

  -- ============================================================
  -- Career milestones (Income & Career Progression)
  -- ============================================================
  create table if not exists public.career_milestones (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    milestone_date text not null,
    title text not null,
    type text not null check (type in ('education','skill','career','goal')),
    achieved boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  alter table public.career_milestones enable row level security;
  create policy "Milestones readable by owner" on public.career_milestones
    for select using (auth.uid() = user_id);
  create policy "Milestones insertable by owner" on public.career_milestones
    for insert with check (auth.uid() = user_id);
  create policy "Milestones updatable by owner" on public.career_milestones
    for update using (auth.uid() = user_id);
  create policy "Milestones deletable by owner" on public.career_milestones
    for delete using (auth.uid() = user_id);

  -- ============================================================
  -- Resume Builder (JSON draft per user)
  -- ============================================================
  create table if not exists public.user_resume_drafts (
    user_id uuid primary key references public.profiles on delete cascade,
    draft jsonb not null default '{}'::jsonb,
    updated_at timestamptz default now()
  );
  alter table public.user_resume_drafts enable row level security;
  create policy "Resume draft readable by owner" on public.user_resume_drafts
    for select using (auth.uid() = user_id);
  create policy "Resume draft insertable by owner" on public.user_resume_drafts
    for insert with check (auth.uid() = user_id);
  create policy "Resume draft updatable by owner" on public.user_resume_drafts
    for update using (auth.uid() = user_id);


