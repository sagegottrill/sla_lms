-- Run once on existing projects: adds JSON arrays for profile skills & onboarding interests.
alter table public.profiles add column if not exists skills jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists interests jsonb default '[]'::jsonb;

comment on column public.profiles.skills is 'User-selected professional skills (string array in JSON)';
comment on column public.profiles.interests is 'Learning interest category ids from onboarding (string array in JSON)';
