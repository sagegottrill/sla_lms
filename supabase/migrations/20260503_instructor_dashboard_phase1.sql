-- Instructor Dashboard Phase 1: Grading Queue & Course Analytics
-- Migration Date: May 3, 2026

-- ============================================================================
-- 1. SUBMISSIONS TABLE UPDATES (for grading queue)
-- ============================================================================
-- Add grading status tracking
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'submissions') THEN
    ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS grading_status TEXT CHECK (grading_status IN ('pending', 'grading', 'graded')) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Index for grading queue queries
CREATE INDEX IF NOT EXISTS idx_submissions_grading_status ON submissions(grading_status) WHERE grading_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON submissions(graded_by);

-- ============================================================================
-- 2. COURSE ANALYTICS CACHE TABLE
-- ============================================================================
-- Stores pre-calculated analytics for performance
CREATE TABLE IF NOT EXISTS course_analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE UNIQUE,
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  avg_progress DECIMAL(5,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  at_risk_students INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_analytics_course_id ON course_analytics_cache(course_id);
CREATE INDEX IF NOT EXISTS idx_course_analytics_last_calculated ON course_analytics_cache(last_calculated);

-- ============================================================================
-- 3. COURSES TABLE UPDATES (for analytics)
-- ============================================================================
-- Add analytics tracking fields
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS last_analytics_update TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5,2) DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- 4. ENROLLMENTS TABLE UPDATES (for at-risk tracking)
-- ============================================================================
-- Add instructor notes and at-risk tracking
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    ALTER TABLE enrollments 
      ADD COLUMN IF NOT EXISTS instructor_notes TEXT,
      ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Index for at-risk queries
CREATE INDEX IF NOT EXISTS idx_enrollments_at_risk ON enrollments(at_risk) WHERE at_risk = TRUE;
CREATE INDEX IF NOT EXISTS idx_enrollments_last_activity ON enrollments(last_activity);

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE course_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Course Analytics Cache Policies
DROP POLICY IF EXISTS "Instructors can view analytics for their courses" ON course_analytics_cache;
CREATE POLICY "Instructors can view analytics for their courses"
  ON course_analytics_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_analytics_cache.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all course analytics" ON course_analytics_cache;
CREATE POLICY "Admins can view all course analytics"
  ON course_analytics_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert/update course analytics" ON course_analytics_cache;
CREATE POLICY "System can insert/update course analytics"
  ON course_analytics_cache FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- 6. HELPER VIEWS
-- ============================================================================

-- View for instructor grading queue
CREATE OR REPLACE VIEW instructor_grading_queue AS
SELECT 
  s.id AS submission_id,
  s.lesson_id,
  s.user_id AS student_id,
  s.submitted_at,
  s.grading_status,
  l.title AS assignment_title,
  l.course_id,
  l.due_date AS assignment_due_date,
  c.title AS course_title,
  c.instructor_id,
  p.name AS student_name,
  p.email AS student_email
FROM submissions s
JOIN lessons l ON s.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.grading_status = 'pending'
  AND s.submitted_at IS NOT NULL
ORDER BY s.submitted_at ASC;

-- Grant access
GRANT SELECT ON instructor_grading_queue TO authenticated;

-- View for course engagement metrics
CREATE OR REPLACE VIEW course_engagement_metrics AS
SELECT 
  c.id AS course_id,
  c.title AS course_title,
  c.instructor_id,
  COUNT(DISTINCT e.user_id) AS total_students,
  COUNT(DISTINCT CASE WHEN e.last_activity > NOW() - INTERVAL '7 days' THEN e.user_id END) AS active_students,
  AVG(e.progress) AS avg_progress,
  COUNT(DISTINCT CASE WHEN e.progress >= 100 THEN e.user_id END)::DECIMAL / NULLIF(COUNT(DISTINCT e.user_id), 0) * 100 AS completion_rate,
  COUNT(DISTINCT CASE WHEN e.at_risk = TRUE THEN e.user_id END) AS at_risk_students
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title, c.instructor_id;

-- Grant access
GRANT SELECT ON course_engagement_metrics TO authenticated;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate course analytics
CREATE OR REPLACE FUNCTION calculate_course_analytics(p_course_id INTEGER)
RETURNS void AS $$
DECLARE
  v_total_students INTEGER;
  v_active_students INTEGER;
  v_avg_progress DECIMAL(5,2);
  v_completion_rate DECIMAL(5,2);
  v_engagement_score DECIMAL(5,2);
  v_at_risk_students INTEGER;
BEGIN
  -- Calculate metrics
  SELECT 
    COUNT(DISTINCT e.user_id),
    COUNT(DISTINCT CASE WHEN e.last_activity > NOW() - INTERVAL '7 days' THEN e.user_id END),
    COALESCE(AVG(e.progress), 0),
    COALESCE(COUNT(DISTINCT CASE WHEN e.progress >= 100 THEN e.user_id END)::DECIMAL / NULLIF(COUNT(DISTINCT e.user_id), 0) * 100, 0),
    COUNT(DISTINCT CASE WHEN e.at_risk = TRUE THEN e.user_id END)
  INTO 
    v_total_students,
    v_active_students,
    v_avg_progress,
    v_completion_rate,
    v_at_risk_students
  FROM enrollments e
  WHERE e.course_id = p_course_id;

  -- Calculate engagement score (0-100)
  -- Formula: (active_students / total_students * 50) + (avg_progress / 2)
  v_engagement_score := CASE 
    WHEN v_total_students > 0 THEN
      (v_active_students::DECIMAL / v_total_students * 50) + (v_avg_progress / 2)
    ELSE 0
  END;

  -- Upsert into cache
  INSERT INTO course_analytics_cache (
    course_id,
    total_students,
    active_students,
    avg_progress,
    completion_rate,
    engagement_score,
    at_risk_students,
    last_calculated
  ) VALUES (
    p_course_id,
    v_total_students,
    v_active_students,
    v_avg_progress,
    v_completion_rate,
    v_engagement_score,
    v_at_risk_students,
    NOW()
  )
  ON CONFLICT (course_id) DO UPDATE SET
    total_students = EXCLUDED.total_students,
    active_students = EXCLUDED.active_students,
    avg_progress = EXCLUDED.avg_progress,
    completion_rate = EXCLUDED.completion_rate,
    engagement_score = EXCLUDED.engagement_score,
    at_risk_students = EXCLUDED.at_risk_students,
    last_calculated = NOW(),
    updated_at = NOW();

  -- Update course table
  UPDATE courses
  SET 
    last_analytics_update = NOW(),
    engagement_score = v_engagement_score
  WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update course analytics cache
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_analytics_cache_updated_at ON course_analytics_cache;
CREATE TRIGGER update_course_analytics_cache_updated_at
  BEFORE UPDATE ON course_analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE course_analytics_cache IS 'Pre-calculated course analytics for performance';
COMMENT ON VIEW instructor_grading_queue IS 'Pending submissions for instructors to grade';
COMMENT ON VIEW course_engagement_metrics IS 'Real-time course engagement metrics';
COMMENT ON FUNCTION calculate_course_analytics IS 'Calculate and cache course analytics';

COMMENT ON COLUMN submissions.grading_status IS 'Status of grading: pending, grading, graded';
COMMENT ON COLUMN submissions.graded_by IS 'Instructor who graded the submission';
COMMENT ON COLUMN enrollments.instructor_notes IS 'Private notes from instructor about student';
COMMENT ON COLUMN enrollments.at_risk IS 'Flag for at-risk students needing attention';
COMMENT ON COLUMN enrollments.last_activity IS 'Last time student was active in course';
COMMENT ON COLUMN courses.last_analytics_update IS 'Last time analytics were calculated';
COMMENT ON COLUMN courses.engagement_score IS 'Overall course engagement score (0-100)';
