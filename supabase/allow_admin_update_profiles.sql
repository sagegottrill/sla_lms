-- ============================================================
-- SLA CONNECT HER LMS - Allow Admin/PM to manage profile roles
-- ============================================================
-- Run this on your Supabase DB ONCE (after schema.sql).
--
-- Root cause:
--   `public.profiles` RLS currently allows updates only when
--   `auth.uid() = id` (user can update only their own row).
-- The Admin -> User Management screen updates other users'
-- `profiles.role` / `profiles.name`, so we must add staff policies.
--
-- This script is additive: it does not remove the existing owner policies.

-- Admins and Program Managers can update any profiles row (including `role`)
drop policy if exists "Admins and program managers can update profiles" on public.profiles;
create policy "Admins and program managers can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'program_manager')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'program_manager')
    )
  );

-- Optional but recommended: staff can remove profiles rows
drop policy if exists "Admins and program managers can delete profiles" on public.profiles;
create policy "Admins and program managers can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'program_manager')
    )
  );
