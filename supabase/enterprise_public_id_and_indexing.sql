-- =============================================================================
-- Enterprise: public opaque IDs + hot-path indexes (manual run by DBA / Lead)
-- =============================================================================
-- Do NOT run from application code. Review in staging first.
-- Requires: gen_random_uuid() (available by default on Supabase / pgcrypto).
--
-- 1) Adds public_id UUID to courses and programs (non-enumerable external ID).
-- 2) Unique indexes on public_id.
-- 3) B-tree indexes for common RLS / dashboard filters (idempotent).
-- =============================================================================

alter table public.courses add column if not exists public_id uuid default gen_random_uuid();
alter table public.programs add column if not exists public_id uuid default gen_random_uuid();

update public.courses set public_id = gen_random_uuid() where public_id is null;
update public.programs set public_id = gen_random_uuid() where public_id is null;

alter table public.courses alter column public_id set default gen_random_uuid();
alter table public.programs alter column public_id set default gen_random_uuid();

create unique index if not exists idx_courses_public_id on public.courses (public_id);
create unique index if not exists idx_programs_public_id on public.programs (public_id);

create index if not exists idx_courses_instructor_id on public.courses (instructor_id);
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_enrollments_user_id on public.enrollments (user_id);
