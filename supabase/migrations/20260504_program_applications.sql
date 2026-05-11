-- Program Applications Table
-- Migration Date: May 4, 2026
-- Purpose: Store program enrollment applications

-- ============================================================================
-- 1. CREATE PROGRAM APPLICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_program_applications_user_id ON program_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_program_id ON program_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_status ON program_applications(status);
CREATE INDEX IF NOT EXISTS idx_program_applications_created_at ON program_applications(created_at DESC);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
DROP POLICY IF EXISTS "Users can view their own applications" ON program_applications;
CREATE POLICY "Users can view their own applications"
  ON program_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications
DROP POLICY IF EXISTS "Users can create their own applications" ON program_applications;
CREATE POLICY "Users can create their own applications"
  ON program_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own pending applications
DROP POLICY IF EXISTS "Users can update their own pending applications" ON program_applications;
CREATE POLICY "Users can update their own pending applications"
  ON program_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Program managers can view applications for their programs
DROP POLICY IF EXISTS "Program managers can view applications" ON program_applications;
CREATE POLICY "Program managers can view applications"
  ON program_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('program_manager', 'admin')
    )
  );

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON program_applications;
CREATE POLICY "Admins can view all applications"
  ON program_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins and program managers can update any application
DROP POLICY IF EXISTS "Staff can update any application" ON program_applications;
CREATE POLICY "Staff can update any application"
  ON program_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager')
    )
  );

-- ============================================================================
-- 4. TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_program_applications_updated_at ON program_applications;
CREATE TRIGGER update_program_applications_updated_at
  BEFORE UPDATE ON program_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE program_applications IS 'Stores program enrollment applications';
COMMENT ON COLUMN program_applications.user_id IS 'User who is applying (can be null for guest applications)';
COMMENT ON COLUMN program_applications.program_id IS 'Program being applied to';
COMMENT ON COLUMN program_applications.status IS 'Application status: pending, approved, rejected, completed';
