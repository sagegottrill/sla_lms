        -- =============================================================================
        -- Rollback: optional admin-profile recovery artifacts only
        -- =============================================================================
        -- Safe to run if you applied `rpc_recover_staff_profile.sql` and want it gone.
        -- This does NOT restore previous RLS policies (e.g. before `production_rls_baseline.sql`).
        -- For that, use Supabase Dashboard → Database → Backups / Point-in-time recovery, or
        -- re-apply a saved export of your old policies from your own documentation.
        -- =============================================================================

        drop function if exists public.recover_my_staff_profile();

        drop table if exists public.platform_admin_bootstrap_emails;
