-- One-off ops script (run once in SQL Editor, then verify in Table Editor).
-- User stuck as learner: `public.profiles.role` drives UI + RLS; keep it aligned with real access.
-- Alternative: set `VITE_TRUSTED_ADMIN_EMAILS` or Auth app_metadata + app sync — see AuthContext.
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
