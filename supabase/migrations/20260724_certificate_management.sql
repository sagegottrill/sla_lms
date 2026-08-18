-- Certificate lifecycle: status, revoke, public verify
-- Deadlock-safe: no FKs, no CHECK rewrite, no extra table locks in the same DDL.
-- If this still times out, wait 10s and run it again (another request was holding the table).

SET lock_timeout = '8s';
SET statement_timeout = '60s';

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_by uuid;

UPDATE public.certificates
SET status = 'active'
WHERE status IS NULL;

COMMENT ON COLUMN public.certificates.status IS 'active | revoked';
COMMENT ON COLUMN public.certificates.revoked_at IS 'When the credential was revoked';
COMMENT ON COLUMN public.certificates.revoked_by IS 'Staff user who revoked the credential';

DROP POLICY IF EXISTS "baseline_certificates_update_staff" ON public.certificates;
CREATE POLICY "baseline_certificates_update_staff"
  ON public.certificates FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_pm())
  WITH CHECK (public.is_admin_or_pm());

-- Public verification (no auth) — limited fields only, no extra table DDL locks
CREATE OR REPLACE FUNCTION public.verify_certificate(p_credential_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.id IS NULL THEN NULL
    ELSE jsonb_build_object(
      'valid', COALESCE(c.status, 'active') = 'active',
      'status', COALESCE(c.status, 'active'),
      'credential_id', c.credential_id,
      'course_title', c.course_title,
      'completed_at', c.completed_at,
      'recipient_name', COALESCE(p.name, 'Learner'),
      'org_name', 'She Leads Africa'
    )
  END
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.credential_id = p_credential_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;
