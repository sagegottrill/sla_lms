-- ============================================================
-- CONNECT HER LMS — Missing Tables Migration (idempotent)
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- Run in Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- PLACEMENT OUTCOMES
-- ============================================================
create table if not exists public.placement_outcomes (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles on delete cascade not null,
  student_name    text not null default '',
  program         text not null default '',
  company         text default '',
  role            text default '',
  location        text default '',
  start_date      text default '',
  status          text not null default 'searching'
                  check (status in ('placed', 'interviewing', 'searching')),
  salary          text default '',
  feedback        int default 0 check (feedback >= 0 and feedback <= 5),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.placement_outcomes enable row level security;

drop policy if exists "Placement outcomes readable by staff"   on public.placement_outcomes;
drop policy if exists "Placement outcomes insertable by staff" on public.placement_outcomes;
drop policy if exists "Placement outcomes updatable by staff"  on public.placement_outcomes;
drop policy if exists "Placement outcomes deletable by staff"  on public.placement_outcomes;

create policy "Placement outcomes readable by staff"
  on public.placement_outcomes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create policy "Placement outcomes insertable by staff"
  on public.placement_outcomes for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create policy "Placement outcomes updatable by staff"
  on public.placement_outcomes for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create policy "Placement outcomes deletable by staff"
  on public.placement_outcomes for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create index if not exists idx_placement_outcomes_user_id on public.placement_outcomes(user_id);
create index if not exists idx_placement_outcomes_status  on public.placement_outcomes(status);

-- ============================================================
-- INTERVIEW SCHEDULES
-- ============================================================
create table if not exists public.interview_schedules (
  id              uuid default gen_random_uuid() primary key,
  created_by      uuid references public.profiles on delete cascade not null,
  candidate       text not null default '',
  role            text default '',
  interview_date  text not null default '',
  interview_time  text default '09:00',
  type            text default 'video'
                  check (type in ('video', 'in-person', 'phone')),
  interviewer     text default '',
  notes           text default '',
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.interview_schedules enable row level security;

drop policy if exists "Interviews readable by staff"   on public.interview_schedules;
drop policy if exists "Interviews insertable by staff" on public.interview_schedules;
drop policy if exists "Interviews updatable by staff"  on public.interview_schedules;
drop policy if exists "Interviews deletable by staff"  on public.interview_schedules;

create policy "Interviews readable by staff"
  on public.interview_schedules for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create policy "Interviews insertable by staff"
  on public.interview_schedules for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create policy "Interviews updatable by staff"
  on public.interview_schedules for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create policy "Interviews deletable by staff"
  on public.interview_schedules for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'program_manager')
    )
  );

create index if not exists idx_interview_schedules_created_by on public.interview_schedules(created_by);
create index if not exists idx_interview_schedules_status     on public.interview_schedules(status);
create index if not exists idx_interview_schedules_date       on public.interview_schedules(interview_date);

-- ============================================================
-- LEAD CAPTURES
-- ============================================================
create table if not exists public.lead_captures (
  id               uuid default gen_random_uuid() primary key,
  email            text not null,
  name             text default '',
  source           text default 'website'
                   check (source in ('website', 'campaign', 'referral', 'social', 'organic', 'paid', 'other')),
  status           text not null default 'new'
                   check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  program_interest text default '',
  notes            text default '',
  converted_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.lead_captures enable row level security;

drop policy if exists "Leads readable by admin"              on public.lead_captures;
drop policy if exists "Leads insertable by anyone (public form)" on public.lead_captures;
drop policy if exists "Leads updatable by admin"             on public.lead_captures;
drop policy if exists "Leads deletable by admin"           on public.lead_captures;

create policy "Leads readable by admin"
  on public.lead_captures for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create policy "Leads insertable by anyone (public form)"
  on public.lead_captures for insert
  with check (true);

create policy "Leads updatable by admin"
  on public.lead_captures for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create policy "Leads deletable by admin"
  on public.lead_captures for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create index if not exists idx_lead_captures_status     on public.lead_captures(status);
create index if not exists idx_lead_captures_email      on public.lead_captures(email);
create index if not exists idx_lead_captures_created_at on public.lead_captures(created_at desc);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
create table if not exists public.system_settings (
  id                              text primary key default 'main',
  inactivity_reminder_days        int default 3,
  assessment_deadline_alert_hours int default 48,
  platform_name                   text default 'CONNECT HER',
  support_email                   text default 'info@sheleadsafrica.org',
  updated_at                      timestamptz default now()
);

alter table public.system_settings enable row level security;

drop policy if exists "System settings readable by authenticated" on public.system_settings;
drop policy if exists "System settings updatable by admin"        on public.system_settings;
drop policy if exists "System settings insertable by admin"       on public.system_settings;

create policy "System settings readable by authenticated"
  on public.system_settings for select
  using (auth.uid() is not null);

create policy "System settings updatable by admin"
  on public.system_settings for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create policy "System settings insertable by admin"
  on public.system_settings for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Seed default row (safe to re-run)
insert into public.system_settings (id, inactivity_reminder_days, assessment_deadline_alert_hours)
values ('main', 3, 48)
on conflict (id) do nothing;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table if not exists public.audit_logs (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles on delete set null,
  action_type     text not null,
  target_resource text,
  target_id       text,
  old_data        jsonb,
  new_data        jsonb,
  ip_address      text,
  created_at      timestamptz default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "Audit logs readable by admin"                on public.audit_logs;
drop policy if exists "Audit logs insertable by service role only"  on public.audit_logs;

create policy "Audit logs readable by admin"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create policy "Audit logs insertable by service role only"
  on public.audit_logs for insert
  with check (true);

create index if not exists idx_audit_logs_user_id     on public.audit_logs(user_id);
create index if not exists idx_audit_logs_action_type on public.audit_logs(action_type);
create index if not exists idx_audit_logs_created_at  on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_target_id   on public.audit_logs(target_id);

-- ============================================================
-- PAYMENTS — ensure indexes exist
-- ============================================================
create index if not exists idx_payments_user_id    on public.payments(user_id);
create index if not exists idx_payments_created_at on public.payments(created_at desc);
create index if not exists idx_payments_status     on public.payments(status);

-- ============================================================
-- NOTIFICATION PREFERENCES (if not in schema.sql)
-- ============================================================
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles on delete cascade,
  frequency text not null default 'instant',
  quiet_start text not null default '22:00',
  quiet_end text not null default '07:00',
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists "Preferences visible to owner" on public.notification_preferences;
drop policy if exists "Preferences upsertable by owner" on public.notification_preferences;
drop policy if exists "Preferences updatable by owner" on public.notification_preferences;
create policy "Preferences visible to owner" on public.notification_preferences
  for select using (auth.uid() = user_id);
create policy "Preferences upsertable by owner" on public.notification_preferences
  for insert with check (auth.uid() = user_id);
create policy "Preferences updatable by owner" on public.notification_preferences
  for update using (auth.uid() = user_id);

-- ============================================================
-- USER NOTIFICATION STATE (if not in schema.sql)
-- ============================================================
create table if not exists public.user_notification_state (
  user_id uuid references public.profiles on delete cascade not null,
  notification_key text not null,
  read boolean not null default false,
  dismissed boolean not null default false,
  updated_at timestamptz default now(),
  primary key (user_id, notification_key)
);
alter table public.user_notification_state enable row level security;
drop policy if exists "Notification state visible to owner" on public.user_notification_state;
drop policy if exists "Notification state insertable by owner" on public.user_notification_state;
drop policy if exists "Notification state updatable by owner" on public.user_notification_state;
create policy "Notification state visible to owner" on public.user_notification_state
  for select using (auth.uid() = user_id);
create policy "Notification state insertable by owner" on public.user_notification_state
  for insert with check (auth.uid() = user_id);
create policy "Notification state updatable by owner" on public.user_notification_state
  for update using (auth.uid() = user_id);
