-- ============================================================
-- SLA CONNECT HER LMS — Admin setup (trial / production)
-- Run in Supabase: Dashboard → SQL → New query
-- ============================================================
--
-- PASSWORDS NEVER GO IN THIS FILE. Set the password only in:
--   Dashboard → Authentication → Users → Add user / Reset password
--
-- Trial admin email: info@sheleadsafrica.org
--
-- STEP 1 — Create the Auth user (if they do not exist yet)
--   • Authentication → Users → Add user
--   • Email: info@sheleadsafrica.org
--   • Password: (choose in the form — do not paste secrets into SQL or git)
--   • Turn ON "Auto Confirm User" (or confirm via email) so they can log in
--
-- STEP 2 — Link profile row to admin role (run the block below)
-- ============================================================

insert into public.profiles (id, name, email, role)
select u.id, 'SLA Admin', u.email, 'admin'
from auth.users u
where lower(u.email) = lower('info@sheleadsafrica.org')
on conflict (id) do update set
  name  = 'SLA Admin',
  role  = 'admin',
  email = excluded.email;

-- If the insert above affects 0 rows, the email is not in auth.users yet — do Step 1 first.

-- ============================================================
-- Verification
-- ============================================================
select id, name, email, role, created_at
from public.profiles
where lower(email) = lower('info@sheleadsafrica.org');

select id, email, email_confirmed_at, created_at
from auth.users
where lower(email) = lower('info@sheleadsafrica.org');

-- ============================================================
-- Other SLA roles (uncomment and run after those users exist in Auth)
-- ============================================================

-- update public.profiles set role = 'admin' where lower(email) = lower('content@sheleadsafrica.org');
-- update public.profiles set role = 'program_manager' where lower(email) = lower('programs@sheleadsafrica.org');

-- ============================================================
-- OPTIONAL: Program manager — create user in Auth first, then:
-- ============================================================

-- insert into public.profiles (id, name, email, role)
-- select u.id, 'SLA Programs', u.email, 'program_manager'
-- from auth.users u
-- where lower(u.email) = lower('programs@sheleadsafrica.org')
-- on conflict (id) do update set
--   name = 'SLA Programs',
--   role = 'program_manager',
--   email = excluded.email;

-- ============================================================
-- Admins + program managers overview
-- ============================================================
select id, name, email, role, created_at
from public.profiles
where role in ('admin', 'program_manager')
order by role, email;
