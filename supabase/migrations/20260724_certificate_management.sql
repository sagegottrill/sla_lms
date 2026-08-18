-- Enterprise certificate lifecycle: status, revoke, public verify

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_status_check;

ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_status_check
  CHECK (status IN ('active', 'revoked'));

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.certificates.status IS 'active | revoked';
COMMENT ON COLUMN public.certificates.revoked_at IS 'When the credential was revoked';
COMMENT ON COLUMN public.certificates.revoked_by IS 'Staff user who revoked the credential';

-- Staff can revoke / update certificate records
DROP POLICY IF EXISTS "baseline_certificates_update_staff" ON public.certificates;
CREATE POLICY "baseline_certificates_update_staff"
  ON public.certificates FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_pm())
  WITH CHECK (public.is_admin_or_pm());

DROP POLICY IF EXISTS "baseline_certificates_update_instructor" ON public.certificates;
CREATE POLICY "baseline_certificates_update_instructor"
  ON public.certificates FOR UPDATE
  TO authenticated
  USING (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = certificates.course_id
        AND c.instructor_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = certificates.course_id
        AND c.instructor_id = (SELECT auth.uid())
    )
  );

-- Public verification (no auth) — returns limited fields only
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
      'valid', c.status = 'active',
      'status', c.status,
      'credential_id', c.credential_id,
      'course_title', c.course_title,
      'completed_at', c.completed_at,
      'recipient_name', COALESCE(p.name, 'Learner'),
      'org_name', COALESCE(
        NULLIF(trim(courses.certificate_config->>'org_name'), ''),
        NULLIF(trim(programs.certificate_config->>'org_name'), ''),
        'She Leads Africa'
      )
    )
  END
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.courses ON courses.id = c.course_id
  LEFT JOIN public.programs ON programs.id = c.program_id
  WHERE c.credential_id = p_credential_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;
