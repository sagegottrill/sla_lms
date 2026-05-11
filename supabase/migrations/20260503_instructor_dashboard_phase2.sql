-- Instructor Dashboard Phase 2: Activity & Planning Tools
-- Migration Date: May 3, 2026

-- ============================================================================
-- 1. INSTRUCTOR ACTIVITY FEED TABLE
-- ============================================================================
-- Stores activity feed items for instructors
CREATE TABLE IF NOT EXISTS instructor_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('submission', 'discussion', 'enrollment', 'completion', 'question', 'comment')) NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  related_item_id UUID,
  activity_text TEXT NOT NULL,
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_instructor_activity_feed_instructor_id ON instructor_activity_feed(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_activity_feed_course_id ON instructor_activity_feed(course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_activity_feed_date ON instructor_activity_feed(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_instructor_activity_feed_read ON instructor_activity_feed(read) WHERE read = FALSE;

-- ============================================================================
-- 2. RLS POLICIES FOR ACTIVITY FEED
-- ============================================================================

-- Enable RLS
ALTER TABLE instructor_activity_feed ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own activity feed
DROP POLICY IF EXISTS "Instructors can view their own activity feed" ON instructor_activity_feed;
CREATE POLICY "Instructors can view their own activity feed"
  ON instructor_activity_feed FOR SELECT
  USING (auth.uid() = instructor_id);

-- System can insert activity feed items
DROP POLICY IF EXISTS "System can insert activity feed items" ON instructor_activity_feed;
CREATE POLICY "System can insert activity feed items"
  ON instructor_activity_feed FOR INSERT
  WITH CHECK (TRUE);

-- Instructors can update their own activity feed (mark as read)
DROP POLICY IF EXISTS "Instructors can update their own activity feed" ON instructor_activity_feed;
CREATE POLICY "Instructors can update their own activity feed"
  ON instructor_activity_feed FOR UPDATE
  USING (auth.uid() = instructor_id);

-- ============================================================================
-- 3. HELPER VIEWS
-- ============================================================================

-- View for upcoming deadlines across instructor courses
CREATE OR REPLACE VIEW instructor_upcoming_deadlines AS
SELECT 
  l.id AS lesson_id,
  l.title AS assignment_title,
  l.due_date,
  l.course_id,
  c.title AS course_title,
  c.instructor_id,
  COUNT(DISTINCT e.user_id) AS expected_submissions,
  COUNT(DISTINCT s.user_id) AS received_submissions,
  COUNT(DISTINCT e.user_id) - COUNT(DISTINCT s.user_id) AS pending_submissions
FROM lessons l
JOIN courses c ON l.course_id = c.id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN submissions s ON l.id = s.lesson_id AND s.submitted_at IS NOT NULL
WHERE l.due_date IS NOT NULL
  AND l.due_date >= NOW()
  AND l.published = TRUE
GROUP BY l.id, l.title, l.due_date, l.course_id, c.title, c.instructor_id
ORDER BY l.due_date ASC;

-- Grant access
GRANT SELECT ON instructor_upcoming_deadlines TO authenticated;

-- View for recent activity with student details
CREATE OR REPLACE VIEW instructor_recent_activity AS
SELECT 
  a.id,
  a.instructor_id,
  a.course_id,
  a.activity_type,
  a.student_id,
  a.related_item_id,
  a.activity_text,
  a.activity_date,
  a.read,
  c.title AS course_title,
  p.name AS student_name,
  p.email AS student_email
FROM instructor_activity_feed a
JOIN courses c ON a.course_id = c.id
LEFT JOIN profiles p ON a.student_id = p.id
ORDER BY a.activity_date DESC;

-- Grant access
GRANT SELECT ON instructor_recent_activity TO authenticated;

-- ============================================================================
-- 4. TRIGGERS FOR AUTOMATIC ACTIVITY FEED
-- ============================================================================

-- Function to create activity feed item
CREATE OR REPLACE FUNCTION create_instructor_activity(
  p_instructor_id UUID,
  p_course_id INTEGER,
  p_activity_type TEXT,
  p_student_id UUID,
  p_related_item_id UUID,
  p_activity_text TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO instructor_activity_feed (
    instructor_id,
    course_id,
    activity_type,
    student_id,
    related_item_id,
    activity_text,
    activity_date
  ) VALUES (
    p_instructor_id,
    p_course_id,
    p_activity_type,
    p_student_id,
    p_related_item_id,
    p_activity_text,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: New submission creates activity
CREATE OR REPLACE FUNCTION trigger_submission_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_instructor_id UUID;
  v_course_id INTEGER;
  v_lesson_title TEXT;
  v_student_name TEXT;
BEGIN
  -- Get instructor and course info
  SELECT c.instructor_id, c.id, l.title
  INTO v_instructor_id, v_course_id, v_lesson_title
  FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE l.id = NEW.lesson_id;

  -- Get student name
  SELECT name INTO v_student_name FROM profiles WHERE id = NEW.user_id;

  -- Create activity
  IF NEW.submitted_at IS NOT NULL AND (OLD.submitted_at IS NULL OR OLD IS NULL) THEN
    PERFORM create_instructor_activity(
      v_instructor_id,
      v_course_id,
      'submission',
      NEW.user_id,
      NEW.id,
      v_student_name || ' submitted ' || v_lesson_title
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS submission_activity_trigger ON submissions;
CREATE TRIGGER submission_activity_trigger
  AFTER INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_submission_activity();

-- Trigger: New enrollment creates activity
CREATE OR REPLACE FUNCTION trigger_enrollment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_instructor_id UUID;
  v_course_title TEXT;
  v_student_name TEXT;
BEGIN
  -- Get instructor and course info
  SELECT c.instructor_id, c.title
  INTO v_instructor_id, v_course_title
  FROM courses c
  WHERE c.id = NEW.course_id;

  -- Get student name
  SELECT name INTO v_student_name FROM profiles WHERE id = NEW.user_id;

  -- Create activity
  PERFORM create_instructor_activity(
    v_instructor_id,
    NEW.course_id,
    'enrollment',
    NEW.user_id,
    NEW.id,
    v_student_name || ' enrolled in ' || v_course_title
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_activity_trigger ON enrollments;
CREATE TRIGGER enrollment_activity_trigger
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_enrollment_activity();

-- Trigger: Course completion creates activity
CREATE OR REPLACE FUNCTION trigger_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_instructor_id UUID;
  v_course_title TEXT;
  v_student_name TEXT;
BEGIN
  -- Only trigger when progress reaches 100
  IF NEW.progress >= 100 AND (OLD.progress < 100 OR OLD IS NULL) THEN
    -- Get instructor and course info
    SELECT c.instructor_id, c.title
    INTO v_instructor_id, v_course_title
    FROM courses c
    WHERE c.id = NEW.course_id;

    -- Get student name
    SELECT name INTO v_student_name FROM profiles WHERE id = NEW.user_id;

    -- Create activity
    PERFORM create_instructor_activity(
      v_instructor_id,
      NEW.course_id,
      'completion',
      NEW.user_id,
      NEW.id,
      v_student_name || ' completed ' || v_course_title
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS completion_activity_trigger ON enrollments;
CREATE TRIGGER completion_activity_trigger
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_completion_activity();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to mark activity as read
CREATE OR REPLACE FUNCTION mark_activity_read(p_activity_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE instructor_activity_feed
  SET read = TRUE
  WHERE id = p_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all activity as read for instructor
CREATE OR REPLACE FUNCTION mark_all_activity_read(p_instructor_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE instructor_activity_feed
  SET read = TRUE
  WHERE instructor_id = p_instructor_id
    AND read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread activity count
CREATE OR REPLACE FUNCTION get_unread_activity_count(p_instructor_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM instructor_activity_feed
  WHERE instructor_id = p_instructor_id
    AND read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE instructor_activity_feed IS 'Activity feed for instructors showing student actions';
COMMENT ON VIEW instructor_upcoming_deadlines IS 'Upcoming assignment deadlines across instructor courses';
COMMENT ON VIEW instructor_recent_activity IS 'Recent activity with student and course details';
COMMENT ON FUNCTION create_instructor_activity IS 'Create a new activity feed item';
COMMENT ON FUNCTION mark_activity_read IS 'Mark a single activity as read';
COMMENT ON FUNCTION mark_all_activity_read IS 'Mark all activities as read for an instructor';
COMMENT ON FUNCTION get_unread_activity_count IS 'Get count of unread activities for an instructor';
