-- ============================================================
-- SLA CONNECTA LMS — Landing Page CMS Migration (NO MOCK INSERTS)
-- ============================================================
-- This repo previously included demo landing page copy.
-- For real handover, insert your real CMS content manually.
--
-- If you still need the `site_config` table, define it in schema.sql
-- or restore a safe CMS migration without placeholder data.
-- ============================================================

-- Create the site_config table (no mock rows)
create table if not exists public.site_config (
  id           text primary key,
  data         jsonb not null default '{}',
  updated_at   timestamptz default now()
);

-- Enable RLS
alter table public.site_config enable row level security;

-- Policies
create policy "Site config is viewable by everyone"
  on public.site_config for select
  using (true);

create policy "Admins can update site config"
  on public.site_config for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

