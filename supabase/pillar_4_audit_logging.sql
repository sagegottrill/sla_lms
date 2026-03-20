-- ============================================================================
-- CONNECTA SECURITY OPS — PILLAR 4: COMPLIANCE AUDIT LOGGING
-- Strictly adheres to the Security Ops Blueprint (Who, What, When, Outcome).
-- ============================================================================

-- 1. CREATE COMPLIANCE AUDIT TABLE
-- Immutable, chronological evidence for SOC 2 / FERPA compliance.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           uuid REFERENCES auth.users(id),
    action_type       text NOT NULL, -- e.g., 'AUTH_LOGIN', 'PAYMENT_SUCCESS', 'GRADE_CHANGE'
    target_resource   text NOT NULL, -- e.g., 'profiles', 'payments', 'enrollments'
    target_id         text,          -- ID of the affected resource
    old_data          jsonb,         -- State BEFORE the action (the "delta")
    new_data          jsonb,         -- State AFTER the action
    ip_address        inet,          -- Originating IP (Pillar 1 Directive)
    user_agent        text,
    outcome           text DEFAULT 'success', -- 'success', 'failure'
    created_at        timestamptz DEFAULT (now() AT TIME ZONE 'UTC') -- Forced UTC (Blueprint Directive)
);

-- 2. ENFORCE IMMUTABILITY (Blueprint Directive)
-- Audit logs must be append-only. No UPDATE or DELETE allowed.
CREATE OR REPLACE FUNCTION public.enforce_audit_log_immutability()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_modification
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE PROCEDURE public.enforce_audit_log_immutability();

-- 3. ENABLE RLS (Audit logs are strictly for Admins)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are strictly viewable by admins"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.get_auth_role() = 'admin');

-- 4. PERFORMANCE INDEXING
CREATE INDEX IF NOT EXISTS idx_audit_user_action ON public.audit_logs(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at);

-- 5. REUSABLE AUDIT HELPER
CREATE OR REPLACE FUNCTION public.log_action(
    p_user_id uuid,
    p_action text,
    p_resource text,
    p_target_id text,
    p_old jsonb DEFAULT NULL,
    p_new jsonb DEFAULT NULL,
    p_outcome text DEFAULT 'success'
) RETURNS void AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action_type, target_resource, target_id, old_data, new_data, outcome)
    VALUES (p_user_id, p_action, p_resource, p_target_id, p_old, p_new, p_outcome);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. AUDIT TRIGGER FOR SENSITIVE TABLES (Example: Profiles)
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger AS $$
BEGIN
    PERFORM public.log_action(
        auth.uid(),
        'PROFILE_UPDATE',
        'profiles',
        new.id::text,
        row_to_json(old),
        row_to_json(new)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_profiles
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.audit_profile_changes();
