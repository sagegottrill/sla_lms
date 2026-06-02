-- Course Applications Table
-- Migration Date: May 4, 2026
-- Purpose: Store course enrollment applications before payment

-- ============================================================================
-- 1. CREATE COURSE APPLICATIONS TABLE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.role::text
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_pm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(public.current_profile_role() IN ('admin', 'program_manager'), false)
$$;

CREATE TABLE IF NOT EXISTS course_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  goal TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_course_applications_user_id ON course_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_course_id ON course_applications(course_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_status ON course_applications(status);
CREATE INDEX IF NOT EXISTS idx_course_applications_created_at ON course_applications(created_at DESC);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE course_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
DROP POLICY IF EXISTS "Users can view their own applications" ON course_applications;
CREATE POLICY "Users can view their own applications"
  ON course_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications
DROP POLICY IF EXISTS "Users can create their own applications" ON course_applications;
CREATE POLICY "Users can create their own applications"
  ON course_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
DROP POLICY IF EXISTS "Users can update their own pending applications" ON course_applications;
CREATE POLICY "Users can update their own pending applications"
  ON course_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Instructors can view applications for their courses
DROP POLICY IF EXISTS "Instructors can view applications for their courses" ON course_applications;
CREATE POLICY "Instructors can view applications for their courses"
  ON course_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_applications.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON course_applications;
CREATE POLICY "Admins can view all applications"
  ON course_applications FOR SELECT
  USING (public.is_admin_or_pm());

-- Admins can update any application
DROP POLICY IF EXISTS "Admins can update any application" ON course_applications;
CREATE POLICY "Admins can update any application"
  ON course_applications FOR UPDATE
  USING (public.is_admin_or_pm());

-- ============================================================================
-- 4. TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_course_applications_updated_at ON course_applications;
CREATE TRIGGER update_course_applications_updated_at
  BEFORE UPDATE ON course_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE course_applications IS 'Stores course enrollment applications before payment';
COMMENT ON COLUMN course_applications.user_id IS 'User who is applying (can be null for guest applications)';
COMMENT ON COLUMN course_applications.course_id IS 'Course being applied to';
COMMENT ON COLUMN course_applications.status IS 'Application status: pending, approved, rejected, completed';
COMMENT ON COLUMN course_applications.goal IS 'User learning goal or motivation (optional)';
