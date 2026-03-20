-- ============================================================
-- SLA CONNECTA LMS — Admin Setup SQL
-- Run this ONCE in Supabase SQL Editor after schema.sql + seed.sql
-- ============================================================

-- Upsert the SLA Admin profile
insert into public.profiles (id, name, email, role)
values (
  '831f16e7-d36d-4485-b005-1e68ff568665',
  'SLA Admin',
  'admin@sheleadsafrica.org',
  'admin'
)
on conflict (id)
do update set
  name  = 'SLA Admin',
  role  = 'admin',
  email = 'admin@sheleadsafrica.org';

-- ============================================================
-- Verification — confirm admin is set correctly
-- ============================================================
select id, name, email, role, created_at
from public.profiles
where role = 'admin';

-- ============================================================
-- To promote your team to their specific roles, you can use
-- the Dashboard → Users page, OR run these shortcuts for the
-- 3 official SLA administrative accounts:
-- ============================================================

-- update public.profiles set role = 'admin' where email = 'info@sheleadsafrica.org';
-- update public.profiles set role = 'admin' where email = 'content@sheleadsafrica.org';
-- update public.profiles set role = 'program_manager' where email = 'programs@sheleadsafrica.org';


-- ============================================================
-- STEP 3 (OPTIONAL): Create a Program Manager account
-- When ready:
--   1. Go to Supabase Auth → Add User
--   2. Create: programs@sheleadsafrica.org
--   3. Copy the UUID and replace the placeholder below
--   4. Uncomment the block and run it
-- ============================================================

-- insert into public.profiles (id, name, email, role)
-- values (
--   '<PASTE_PROGRAM_MGR_UUID_HERE>',
--   'SLA Programs',
--   'programs@sheleadsafrica.org',
--   'program_manager'
-- )
-- on conflict (id)
-- do update set
--   name  = 'SLA Programs',
--   role  = 'program_manager',
--   email = 'programs@sheleadsafrica.org';

-- ============================================================
-- QUICK VERIFICATION
-- Run this to confirm the admin accounts are set up correctly
-- ============================================================
select id, name, email, role, created_at
from public.profiles
where role in ('admin', 'program_manager')
order by role;

-- ============================================================
-- OPTIONAL: Promote any existing user to admin by email
-- If the admin already signed up via the /signup page,
-- run this instead (replace the email below):
-- ============================================================
-- update public.profiles
-- set role = 'admin'
-- where email = 'your-admin@email.com';
