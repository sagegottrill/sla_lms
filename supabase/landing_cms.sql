-- ============================================================
-- SLA CONNECTA LMS — Landing Page CMS Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the site_config table
create table if not exists public.site_config (
  id           text primary key, -- e.g. 'landing_page'
  data         jsonb not null default '{}',
  updated_at   timestamptz default now()
);

-- Enable RLS
alter table public.site_config enable row level security;

-- Policies
create policy "Site config is viewable by everyone"
  on public.site_config for select using (true);

create policy "Admins can update site config"
  on public.site_config for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed initial data
insert into public.site_config (id, data)
values (
  'landing_page',
  '{
    "hero": {
      "title": "Build your empire with the skills of tomorrow.",
      "subtitle": "Join 50,000+ African women accelerating their careers in tech, business, and leadership.",
      "cta_text": "Join the Community"
    },
    "promo": {
      "enabled": false,
      "title": "Data Leadership Accelerator — Only 23 spots left",
      "deadline": "2026-03-31T23:59:59",
      "stats": [
        {"value": "95%", "label": "Completion rate"},
        {"value": "87%", "label": "Hired in 6 months"},
        {"value": "+131%", "label": "Income increase"},
        {"value": "4.9/5", "label": "Learner satisfaction"}
      ]
    },
    "featured_course_ids": [1, 2, 3],
    "featured_program_ids": [1, 2]
  }'
)
on conflict (id) do update set data = excluded.data;
