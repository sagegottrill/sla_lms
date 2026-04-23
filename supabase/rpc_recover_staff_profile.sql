-- =============================================================================
-- Staff profile recovery (run once in Supabase SQL Editor)
-- =============================================================================
-- Use when `public.profiles.role` is stuck as `student` for admins: client-side
-- UPDATE may fail depending on policies, and VITE_TRUSTED_ADMIN_EMAILS requires a rebuild.
--
-- After this script:
--   1) Insert your login email (must match auth.jwt() ->> 'email'):
--        insert into public.platform_admin_bootstrap_emails (email)
--        values ('you@yourdomain.com') on conflict (email) do nothing;
--   2) In Auth → Users → your user, set App metadata JSON, e.g. { "role": "admin" }
--      (optional if you use the email allowlist only).
--   3) Sign out and back in; the app calls `recover_my_staff_profile` when the row is still student.
-- =============================================================================

create table if not exists public.platform_admin_bootstrap_emails (
  email text primary key
);

comment on table public.platform_admin_bootstrap_emails is
  'Emails allowed to self-promote to admin via recover_my_staff_profile(); rows are added only via SQL Editor, not from the app.';

revoke all on public.platform_admin_bootstrap_emails from public, anon, authenticated;

-- One SECURITY DEFINER RPC: email allowlist OR JWT app_metadata staff (clients cannot forge app_metadata).
create or replace function public.recover_my_staff_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt jsonb := coalesce(auth.jwt(), '{}'::jsonb);
  em text := lower(trim(coalesce(jwt ->> 'email', '')));
  ar text;
begin
  if em is null or em = '' then
    return jsonb_build_object('ok', false, 'reason', 'no_email_in_jwt');
  end if;

  if exists (
    select 1
    from public.platform_admin_bootstrap_emails b
    where lower(trim(b.email)) = em
  ) then
    update public.profiles p
    set role = 'admin', onboarding_completed = true
    where p.id = auth.uid();
    return jsonb_build_object('ok', true, 'via', 'email_allowlist');
  end if;

  ar := lower(trim(coalesce(jwt #>> '{app_metadata,role}', jwt #>> '{app_metadata,user_role}', '')));
  if ar in ('admin', 'instructor', 'program_manager') then
    update public.profiles p
    set role = ar, onboarding_completed = true
    where p.id = auth.uid();
    return jsonb_build_object('ok', true, 'via', 'jwt_app_metadata', 'role', ar);
  end if;

  return jsonb_build_object('ok', false, 'reason', 'no_allowlist_match_and_no_staff_app_metadata');
end;
$$;

comment on function public.recover_my_staff_profile() is
  'Promotes auth.uid() profiles row from allowlist email or JWT app_metadata staff role; SECURITY DEFINER.';

grant execute on function public.recover_my_staff_profile() to authenticated;
