-- Live sessions / webinars + learner documents bucket metadata support

CREATE TABLE IF NOT EXISTS public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  meeting_url text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  audience text DEFAULT 'all',
  course_id int REFERENCES public.courses(id) ON DELETE SET NULL,
  program_id int REFERENCES public.programs(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_sessions_select" ON public.live_sessions;
DROP POLICY IF EXISTS "live_sessions_staff_all" ON public.live_sessions;

CREATE POLICY "live_sessions_select"
  ON public.live_sessions FOR SELECT
  USING (true);

CREATE POLICY "live_sessions_staff_all"
  ON public.live_sessions FOR ALL
  TO authenticated
  USING (public.has_staff_access())
  WITH CHECK (public.has_staff_access());

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_select_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_own" ON storage.objects;

CREATE POLICY "documents_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documents_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documents_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documents_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow program managers and instructors to manage job posts (not only admin)
DROP POLICY IF EXISTS "baseline_jobs_admin_all" ON public.jobs;
CREATE POLICY "baseline_jobs_staff_all"
  ON public.jobs FOR ALL
  TO authenticated
  USING (public.has_staff_access())
  WITH CHECK (public.has_staff_access());
