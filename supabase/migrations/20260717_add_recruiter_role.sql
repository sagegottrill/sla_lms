-- ============================================================
-- ADD RECRUITER ROLE
-- Date: 2026-07-17
-- Description: Add 'recruiter' as a valid role for job posting functionality
-- ============================================================

-- Step 1: Drop the existing role constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add the new constraint with 'recruiter' included
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'instructor', 'program_manager', 'admin', 'recruiter'));

-- Step 3: Update RLS policies to include recruiter role where appropriate

-- Programs: Allow recruiters to view (but not modify)
-- No change needed - programs are already viewable by everyone

-- Courses: Allow recruiters to view
-- No change needed - published courses already viewable by everyone

-- Jobs: Allow recruiters to manage job postings
DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;

CREATE POLICY "Staff can manage jobs"
  ON public.jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'program_manager', 'recruiter')
    )
  );

-- ============================================================
-- VERIFICATION QUERY (run separately to test)
-- ============================================================
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'profiles_role_check';
