-- One-off: user stuck in learner onboarding while intended as platform admin.
-- The app reads `public.profiles.role` first; if it stays `student`, dashboards and onboarding
-- behave as a learner until this row is corrected (or staff role exists in JWT app_metadata).
--
-- Target user id:
--   fa338c41-4aa4-40d1-9f6e-82e9db7da4b8

begin;

update public.profiles
set
  role = 'admin',
  onboarding_completed = true
where id = 'fa338c41-4aa4-40d1-9f6e-82e9db7da4b8';

-- Optional: mirror role into Auth JWT app_metadata so edge functions / RLS that read JWT see admin.
-- Run in Supabase SQL Editor (postgres); adjust if your project uses a different claim shape.
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
-- where id = 'fa338c41-4aa4-40d1-9f6e-82e9db7da4b8';

commit;
