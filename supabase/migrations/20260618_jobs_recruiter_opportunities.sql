-- Recruiter self-serve job postings + apply links for Opportunities board

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS application_url text,
  ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open' CHECK (status IN ('open', 'closed'));

DROP POLICY IF EXISTS "baseline_jobs_staff_all" ON public.jobs;
DROP POLICY IF EXISTS "baseline_jobs_admin_all" ON public.jobs;
DROP POLICY IF EXISTS "baseline_jobs_insert_auth" ON public.jobs;
DROP POLICY IF EXISTS "baseline_jobs_update_auth" ON public.jobs;
DROP POLICY IF EXISTS "baseline_jobs_delete_auth" ON public.jobs;

CREATE POLICY "baseline_jobs_insert_auth"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    posted_by = (SELECT auth.uid())
    OR public.has_staff_access()
  );

CREATE POLICY "baseline_jobs_update_auth"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    posted_by = (SELECT auth.uid())
    OR public.has_staff_access()
  )
  WITH CHECK (
    posted_by = (SELECT auth.uid())
    OR public.has_staff_access()
  );

CREATE POLICY "baseline_jobs_delete_auth"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    posted_by = (SELECT auth.uid())
    OR public.has_staff_access()
  );
