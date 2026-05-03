-- Student Dashboard Phase 2: Recent Feedback, Calendar, Global Announcements
-- Migration Date: May 3, 2026

-- ============================================================================
-- 1. GLOBAL ANNOUNCEMENTS TABLE
-- ============================================================================
-- Stores institution-wide announcements visible to all users
CREATE TABLE IF NOT EXISTS global_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active announcements (without NOW() predicate to avoid immutability error)
CREATE INDEX IF NOT EXISTS idx_global_announcements_dates 
  ON global_announcements(start_date, end_date);

-- ============================================================================
-- 2. DISMISSED ANNOUNCEMENTS TABLE
-- ============================================================================
-- Tracks which users have dismissed which announcements
CREATE TABLE IF NOT EXISTS dismissed_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES global_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dismissed_announcements_user_id ON dismissed_announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_announcements_announcement_id ON dismissed_announcements(announcement_id);

-- ============================================================================
-- 3. USER CALENDAR EVENTS TABLE
-- ============================================================================
-- Stores personal calendar events created by users
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT CHECK (event_type IN ('personal', 'study', 'deadline', 'other')) DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_date ON user_calendar_events(event_date);

-- ============================================================================
-- 4. SUBMISSIONS TABLE (for feedback tracking)
-- ============================================================================
-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content TEXT,
  status TEXT CHECK (status IN ('draft', 'submitted', 'graded', 'completed')) DEFAULT 'draft',
  grade NUMERIC(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  feedback_viewed BOOLEAN DEFAULT FALSE,
  feedback_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Add columns if table already exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'submissions') THEN
    ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS feedback_viewed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS feedback_viewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Index for recent feedback queries
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_lesson_id ON submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_submissions_graded ON submissions(graded_at) WHERE graded_at IS NOT NULL;

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submissions (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
CREATE POLICY "Users can insert their own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own submissions" ON submissions;
CREATE POLICY "Users can update their own submissions"
  ON submissions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can view submissions for their courses" ON submissions;
CREATE POLICY "Instructors can view submissions for their courses"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = submissions.lesson_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can update submissions for their courses" ON submissions;
CREATE POLICY "Instructors can update submissions for their courses"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = submissions.lesson_id
      AND c.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. LESSONS TABLE (for calendar integration)
-- ============================================================================
-- Create lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  type TEXT CHECK (type IN ('lesson', 'assignment', 'quiz', 'video', 'reading')) DEFAULT 'lesson',
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_date TIMESTAMP WITH TIME ZONE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table already exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons') THEN
    ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_due_date ON lessons(due_date) WHERE due_date IS NOT NULL;

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lessons (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Everyone can view published lessons" ON lessons;
CREATE POLICY "Everyone can view published lessons"
  ON lessons FOR SELECT
  USING (published = TRUE);

DROP POLICY IF EXISTS "Instructors can view their own lessons" ON lessons;
CREATE POLICY "Instructors can view their own lessons"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can insert lessons for their courses" ON lessons;
CREATE POLICY "Instructors can insert lessons for their courses"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can update their own lessons" ON lessons;
CREATE POLICY "Instructors can update their own lessons"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can delete their own lessons" ON lessons;
CREATE POLICY "Instructors can delete their own lessons"
  ON lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = lessons.course_id
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enrolled students can view published lessons" ON lessons;
CREATE POLICY "Enrolled students can view published lessons"
  ON lessons FOR SELECT
  USING (
    published = TRUE AND
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = lessons.course_id
      AND e.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Global Announcements Policies (everyone can read active announcements)
CREATE POLICY "Everyone can view active global announcements"
  ON global_announcements FOR SELECT
  USING (
    start_date <= NOW() AND 
    (end_date IS NULL OR end_date > NOW())
  );

CREATE POLICY "Admins can insert global announcements"
  ON global_announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update global announcements"
  ON global_announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete global announcements"
  ON global_announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Dismissed Announcements Policies
CREATE POLICY "Users can view their own dismissed announcements"
  ON dismissed_announcements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissed announcements"
  ON dismissed_announcements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissed announcements"
  ON dismissed_announcements FOR DELETE
  USING (auth.uid() = user_id);

-- User Calendar Events Policies
CREATE POLICY "Users can view their own calendar events"
  ON user_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events"
  ON user_calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
  ON user_calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
  ON user_calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Trigger for global_announcements updated_at
CREATE TRIGGER update_global_announcements_updated_at
  BEFORE UPDATE ON global_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_calendar_events updated_at
CREATE TRIGGER update_user_calendar_events_updated_at
  BEFORE UPDATE ON user_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER VIEW FOR RECENT FEEDBACK
-- ============================================================================
-- View to easily query recent feedback for students
CREATE OR REPLACE VIEW student_recent_feedback AS
SELECT 
  s.id AS submission_id,
  s.user_id,
  s.lesson_id,
  s.grade,
  s.feedback,
  s.graded_at,
  COALESCE(s.feedback_viewed, FALSE) AS feedback_viewed,
  s.feedback_viewed_at,
  l.title AS lesson_title,
  l.course_id,
  c.title AS course_title,
  p.name AS instructor_name
FROM submissions s
JOIN lessons l ON s.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
LEFT JOIN profiles p ON c.instructor_id = p.id
WHERE s.graded_at IS NOT NULL
ORDER BY s.graded_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON student_recent_feedback TO authenticated;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE global_announcements IS 'Institution-wide announcements visible to all users';
COMMENT ON TABLE dismissed_announcements IS 'Tracks which users have dismissed which announcements';
COMMENT ON TABLE user_calendar_events IS 'Personal calendar events created by users';
COMMENT ON VIEW student_recent_feedback IS 'View for easily querying recent graded submissions with feedback';

COMMENT ON COLUMN submissions.feedback_viewed IS 'Whether the student has viewed the feedback';
COMMENT ON COLUMN submissions.feedback_viewed_at IS 'When the student viewed the feedback';
COMMENT ON COLUMN lessons.due_date IS 'Assignment/lesson due date for calendar integration';
COMMENT ON COLUMN lessons.reminder_date IS 'Optional reminder date before the due date';
