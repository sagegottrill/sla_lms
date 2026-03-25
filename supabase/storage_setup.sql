-- =============================================================================
-- Supabase Storage — buckets + RLS for profile avatars & course media
--
-- PREREQUISITES (run order)
--   1. Core tables + public.profiles must exist (e.g. supabase/schema.sql).
--   2. Safe to re-run: uses DROP POLICY IF EXISTS + ON CONFLICT for buckets.
--
-- APP CODE MAP (only these use Supabase Storage uploads today)
--   • avatars     — src/services/api.ts uploadAvatar()
--                   Path: "<user-uuid>/avatar.<ext>"
--                   Used by: OnboardingPage, ProfilePage, SettingsPage
--   • courses     — src/pages/CourseBuilderPage.tsx (thumbnails/…)
--                   src/pages/VideoUploadPage.tsx (tus → videos/…)
--
-- NOT using Storage (no extra buckets needed here)
--   • ProgramBuilderPage partner logos — URL.createObjectURL (browser-only)
--   • ProgramApplicationPage resume — File kept in React state only (not uploaded)
--   • CourseAuthoringWizard — simulated upload (toast only)
--
-- CONFLICTS: If you created differently named policies in the Dashboard, you may
--   have overlapping rules. Remove duplicates under Storage → Policies, or drop
--   those policies before re-running this script.
-- =============================================================================

-- Public buckets so getPublicUrl() works for thumbnails & avatars in the UI
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('courses', 'courses', true)
on conflict (id) do update set public = excluded.public;

-- -----------------------------------------------------------------------------
-- avatars: path pattern  "<user-uuid>/avatar.<ext>"  (see api.uploadAvatar)
-- -----------------------------------------------------------------------------
drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own_folder" on storage.objects;
drop policy if exists "avatars_update_own_folder" on storage.objects;
drop policy if exists "avatars_delete_own_folder" on storage.objects;

create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- courses: thumbnails/* and videos/*  (CourseBuilderPage, VideoUploadPage)
-- -----------------------------------------------------------------------------
drop policy if exists "courses_select_public" on storage.objects;
drop policy if exists "courses_insert_staff" on storage.objects;
drop policy if exists "courses_update_staff" on storage.objects;
drop policy if exists "courses_delete_staff" on storage.objects;

create policy "courses_select_public"
  on storage.objects for select
  using (bucket_id = 'courses');

create policy "courses_insert_staff"
  on storage.objects for insert
  with check (
    bucket_id = 'courses'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'instructor', 'program_manager')
    )
  );

create policy "courses_update_staff"
  on storage.objects for update
  using (
    bucket_id = 'courses'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'instructor', 'program_manager')
    )
  )
  with check (
    bucket_id = 'courses'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'instructor', 'program_manager')
    )
  );

create policy "courses_delete_staff"
  on storage.objects for delete
  using (
    bucket_id = 'courses'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'instructor', 'program_manager')
    )
  );
