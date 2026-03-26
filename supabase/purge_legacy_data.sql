-- ============================================================
-- SLA CONNECT HER LMS — Database Purge Script
-- Run this in Supabase SQL Editor to wipe legacy test data
-- ============================================================

-- DANGER: This will delete ALL data in the following tables!
-- Use with caution on production databases.

-- 1. Truncate tables in reverse dependency order
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.enrollments CASCADE;
TRUNCATE TABLE public.courses CASCADE;
TRUNCATE TABLE public.programs CASCADE;
TRUNCATE TABLE public.jobs CASCADE;
TRUNCATE TABLE public.webhook_events CASCADE;

-- 2. Optional: If you want to delete all user profiles as well
-- (Except for the Admin profile created in admin_setup.sql)
-- DELETE FROM public.profiles WHERE id != '831f16e7-d36d-4485-b005-1e68ff568665';

-- 3. Reset sequences so new IDs start from 1
SELECT setval('public.courses_id_seq', 1, false);
SELECT setval('public.programs_id_seq', 1, false);
SELECT setval('public.jobs_id_seq', 1, false);

-- ============================================================
-- After running this, your dashboard will be truly empty.
-- ============================================================

