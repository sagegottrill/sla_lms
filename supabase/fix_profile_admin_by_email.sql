-- Fix admin UI / RLS: set platform admin on profiles by email (run in Supabase SQL Editor).
-- Replace the email, then verify in Table Editor → public.profiles.

begin;

update public.profiles
set
  role = 'admin',
  onboarding_completed = true
where lower(trim(email)) = lower(trim('REPLACE_WITH_ADMIN_EMAIL@example.com'));

commit;
