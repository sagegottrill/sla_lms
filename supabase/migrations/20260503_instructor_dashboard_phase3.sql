-- Instructor Dashboard Phase 3: Advanced Features
-- Migration Date: May 3, 2026

-- ============================================================================
-- 1. INSTRUCTOR DASHBOARD PREFERENCES TABLE
-- ============================================================================
-- Stores instructor dashboard preferences and settings
CREATE TABLE IF NOT EXISTS instructor_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dashboard_view TEXT CHECK (dashboard_view IN ('card', 'list', 'activity')) DEFAULT 'card',
  show_grading_queue BOOLEAN DEFAULT TRUE,
  show_analytics BOOLEAN DEFAULT TRUE,
  show_upcoming_deadlines BOOLEAN DEFAULT TRUE,
  show_recent_activity BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_instructor_dashboard_preferences_instructor_id ON instructor_dashboard_preferences(instructor_id);

-- ============================================================================
-- 2. COURSE ARCHIVE TABLE
-- ============================================================================
-- Stores archived courses
CREATE TABLE IF NOT EXISTS archived_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  archived_by UUID NOT NULL REFERENCES profiles(id),
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archive_reason TEXT,
  original_published_status BOOLEAN DEFAULT FALSE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_archived_courses_course_id ON archived_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_archived_courses_archived_by ON archived_courses(archived_by);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE instructor_dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_courses ENABLE ROW LEVEL SECURITY;

-- Instructor Dashboard Preferences Policies
DROP POLICY IF EXISTS "Instructors can view their own preferences" ON instructor_dashboard_preferences;
CREATE POLICY "Instructors can view their own preferences"
  ON instructor_dashboard_preferences FOR SELECT
  USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can insert their own preferences" ON instructor_dashboard_preferences;
CREATE POLICY "Instructors can insert their own preferences"
  ON instructor_dashboard_preferences FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can update their own preferences" ON instructor_dashboard_preferences;
CREATE POLICY "Instructors can update their own preferences"
  ON instructor_dashboard_preferences FOR UPDATE
  USING (auth.uid() = instructor_id);

-- Archived Courses Policies
DROP POLICY IF EXISTS "Instructors can view their archived courses" ON archived_courses;
CREATE POLICY "Instructors can view their archived courses"
  ON archived_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = archived_courses.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can archive their own courses" ON archived_courses;
CREATE POLICY "Instructors can archive their own courses"
  ON archived_courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = archived_courses.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all archived courses" ON archived_courses;
CREATE POLICY "Admins can view all archived courses"
  ON archived_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to get instructor dashboard preferences
CREATE OR REPLACE FUNCTION get_instructor_dashboard_preferences(p_instructor_id UUID)
RETURNS instructor_dashboard_preferences AS $$
DECLARE
  v_prefs instructor_dashboard_preferences;
BEGIN
  SELECT * INTO v_prefs
  FROM instructor_dashboard_preferences
  WHERE instructor_id = p_instructor_id;
  
  -- If no preferences exist, create default ones
  IF NOT FOUND THEN
    INSERT INTO instructor_dashboard_preferences (instructor_id)
    VALUES (p_instructor_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$ LANGUAGE plpgsql;

-- Function to update dashboard view preference
CREATE OR REPLACE FUNCTION update_instructor_dashboard_view(
  p_instructor_id UUID,
  p_view TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO instructor_dashboard_preferences (instructor_id, dashboard_view)
  VALUES (p_instructor_id, p_view)
  ON CONFLICT (instructor_id) DO UPDATE
  SET dashboard_view = EXCLUDED.dashboard_view,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to toggle widget visibility
CREATE OR REPLACE FUNCTION toggle_instructor_widget_visibility(
  p_instructor_id UUID,
  p_widget TEXT,
  p_visible BOOLEAN
)
RETURNS void AS $$
BEGIN
  -- Ensure preferences exist
  PERFORM get_instructor_dashboard_preferences(p_instructor_id);
  
  -- Update specific widget visibility
  CASE p_widget
    WHEN 'grading_queue' THEN
      UPDATE instructor_dashboard_preferences
      SET show_grading_queue = p_visible, updated_at = NOW()
      WHERE instructor_id = p_instructor_id;
    WHEN 'analytics' THEN
      UPDATE instructor_dashboard_preferences
      SET show_analytics = p_visible, updated_at = NOW()
      WHERE instructor_id = p_instructor_id;
    WHEN 'upcoming_deadlines' THEN
      UPDATE instructor_dashboard_preferences
      SET show_upcoming_deadlines = p_visible, updated_at = NOW()
      WHERE instructor_id = p_instructor_id;
    WHEN 'recent_activity' THEN
      UPDATE instructor_dashboard_preferences
      SET show_recent_activity = p_visible, updated_at = NOW()
      WHERE instructor_id = p_instructor_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle course publish status
CREATE OR REPLACE FUNCTION toggle_course_publish_status(p_course_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_status BOOLEAN;
  v_new_status BOOLEAN;
BEGIN
  SELECT published INTO v_current_status
  FROM courses
  WHERE id = p_course_id;
  
  v_new_status := NOT v_current_status;
  
  UPDATE courses
  SET published = v_new_status,
      updated_at = NOW()
  WHERE id = p_course_id;
  
  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate course
CREATE OR REPLACE FUNCTION duplicate_course(
  p_course_id INTEGER,
  p_new_title TEXT,
  p_instructor_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_new_course_id INTEGER;
  v_lesson RECORD;
BEGIN
  -- Insert new course with copied data
  INSERT INTO courses (
    title,
    description,
    instructor_id,
    category,
    level,
    duration,
    price,
    thumbnail_url,
    published
  )
  SELECT 
    p_new_title,
    description,
    p_instructor_id,
    category,
    level,
    duration,
    price,
    thumbnail_url,
    FALSE -- New course starts as draft
  FROM courses
  WHERE id = p_course_id
  RETURNING id INTO v_new_course_id;
  
  -- Copy lessons
  FOR v_lesson IN
    SELECT * FROM lessons WHERE course_id = p_course_id
  LOOP
    INSERT INTO lessons (
      course_id,
      title,
      description,
      content,
      type,
      order_index,
      duration_minutes,
      published
    ) VALUES (
      v_new_course_id,
      v_lesson.title,
      v_lesson.description,
      v_lesson.content,
      v_lesson.type,
      v_lesson.order_index,
      v_lesson.duration_minutes,
      FALSE -- Lessons start unpublished
    );
  END LOOP;
  
  RETURN v_new_course_id;
END;
$$ LANGUAGE plpgsql;

-- Function to archive course
CREATE OR REPLACE FUNCTION archive_course(
  p_course_id INTEGER,
  p_instructor_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_published_status BOOLEAN;
BEGIN
  -- Get current published status
  SELECT published INTO v_published_status
  FROM courses
  WHERE id = p_course_id;
  
  -- Unpublish the course
  UPDATE courses
  SET published = FALSE,
      updated_at = NOW()
  WHERE id = p_course_id;
  
  -- Record in archive table
  INSERT INTO archived_courses (
    course_id,
    archived_by,
    archive_reason,
    original_published_status
  ) VALUES (
    p_course_id,
    p_instructor_id,
    p_reason,
    v_published_status
  );
END;
$$ LANGUAGE plpgsql;

-- Function to unarchive course
CREATE OR REPLACE FUNCTION unarchive_course(p_course_id INTEGER)
RETURNS void AS $$
DECLARE
  v_original_status BOOLEAN;
BEGIN
  -- Get original published status
  SELECT original_published_status INTO v_original_status
  FROM archived_courses
  WHERE course_id = p_course_id
  ORDER BY archived_at DESC
  LIMIT 1;
  
  -- Restore published status
  UPDATE courses
  SET published = v_original_status,
      updated_at = NOW()
  WHERE id = p_course_id;
  
  -- Remove from archive
  DELETE FROM archived_courses
  WHERE course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for instructor_dashboard_preferences updated_at
DROP TRIGGER IF EXISTS update_instructor_dashboard_preferences_updated_at ON instructor_dashboard_preferences;
CREATE TRIGGER update_instructor_dashboard_preferences_updated_at
  BEFORE UPDATE ON instructor_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE instructor_dashboard_preferences IS 'Instructor dashboard view preferences and widget visibility';
COMMENT ON TABLE archived_courses IS 'Archived courses with original status for restoration';
COMMENT ON FUNCTION get_instructor_dashboard_preferences IS 'Get or create instructor dashboard preferences';
COMMENT ON FUNCTION update_instructor_dashboard_view IS 'Update dashboard view preference';
COMMENT ON FUNCTION toggle_instructor_widget_visibility IS 'Toggle visibility of dashboard widgets';
COMMENT ON FUNCTION toggle_course_publish_status IS 'Toggle course published status';
COMMENT ON FUNCTION duplicate_course IS 'Duplicate a course with all lessons';
COMMENT ON FUNCTION archive_course IS 'Archive a course and unpublish it';
COMMENT ON FUNCTION unarchive_course IS 'Restore an archived course';
