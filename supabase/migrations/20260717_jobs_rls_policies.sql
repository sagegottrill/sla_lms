-- ============================================================
-- Job Opportunities - Row Level Security Policies
-- Date: July 17, 2026
-- Purpose: Restrict job posting to admin, program_manager, and recruiter
-- ============================================================

-- Enable RLS on jobs table (if not already enabled)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Policy 1: Anyone can view open jobs (public visibility)
CREATE POLICY "Anyone can view open jobs"
ON public.jobs
FOR SELECT
USING (status = 'open' OR status IS NULL);

-- Policy 2: Only admin, program_manager, and recruiter can create jobs
CREATE POLICY "Only authorized roles can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'program_manager', 'recruiter')
  )
);

-- Policy 3: Admin, program_manager, recruiter, or job owner can update
CREATE POLICY "Authorized roles and owners can update jobs"
ON public.jobs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role IN ('admin', 'program_manager', 'recruiter')
      OR jobs.posted_by = auth.uid()
    )
  )
);

-- Policy 4: Admin, program_manager, recruiter, or job owner can delete
CREATE POLICY "Authorized roles and owners can delete jobs"
ON public.jobs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role IN ('admin', 'program_manager', 'recruiter')
      OR jobs.posted_by = auth.uid()
    )
  )
);

-- Add helpful comments
COMMENT ON TABLE public.jobs IS 'Job opportunities board. Only admin, program_manager, and recruiter can post.';
