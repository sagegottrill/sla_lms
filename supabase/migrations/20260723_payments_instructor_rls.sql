-- Instructor payment visibility + owner payment updates (earnings / checkout idempotency)
DROP POLICY IF EXISTS "baseline_payments_select_instructor" ON public.payments;
CREATE POLICY "baseline_payments_select_instructor"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = payments.course_id
        AND c.instructor_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "baseline_payments_update_owner" ON public.payments;
CREATE POLICY "baseline_payments_update_owner"
  ON public.payments FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "baseline_certificates_select_staff" ON public.certificates;
CREATE POLICY "baseline_certificates_select_staff"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (public.is_admin_or_pm());

DROP POLICY IF EXISTS "baseline_certificates_select_instructor" ON public.certificates;
CREATE POLICY "baseline_certificates_select_instructor"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = certificates.course_id
        AND c.instructor_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "baseline_certificates_insert_staff" ON public.certificates;
CREATE POLICY "baseline_certificates_insert_staff"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_pm());

-- Program builder fields used by ProgramBuilderPage
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS partners jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS application_deadline timestamptz;

COMMENT ON COLUMN public.programs.partners IS 'Partner orgs shown on program pages [{id,name,logo_url}]';
COMMENT ON COLUMN public.programs.application_deadline IS 'Optional application cutoff datetime';
