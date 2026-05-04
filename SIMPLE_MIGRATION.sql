-- ============================================================================
-- SIMPLE MIGRATION - Drop and Recreate Problematic Tables
-- ============================================================================
-- This drops existing incomplete tables and creates them fresh
-- SAFE: Only drops tables that will be recreated immediately
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop problematic tables (they'll be recreated)
-- ============================================================================

DROP TABLE IF EXISTS dismissed_announcements CASCADE;
DROP TABLE IF EXISTS user_calendar_events CASCADE;
DROP TABLE IF EXISTS user_todo_items CASCADE;
DROP TABLE IF EXISTS user_dashboard_preferences CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS global_announcements CASCADE;
DROP TABLE IF EXISTS course_analytics_cache CASCADE;
DROP TABLE IF EXISTS instructor_activity_feed CASCADE;
DROP TABLE IF EXISTS instructor_dashboard_preferences CASCADE;
DROP TABLE IF EXISTS archived_courses CASCADE;
DROP TABLE IF EXISTS course_applications CASCADE;
DROP TABLE IF EXISTS program_applications CASCADE;

-- Drop views
DROP VIEW IF EXISTS instructor_grading_queue CASCADE;
DROP VIEW IF EXISTS instructor_upcoming_deadlines CASCADE;
DROP VIEW IF EXISTS instructor_recent_activity CASCADE;

-- ============================================================================
-- STEP 2: Create helper function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create all tables fresh
-- ============================================================================

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons viewable by enrolled students"
  ON lessons FOR SELECT
  USING (
    is_preview = true OR
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = lessons.course_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage their course lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_lesson_id ON submissions(lesson_id);
CREATE INDEX idx_submissions_completed ON submissions(user_id, completed);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Global announcements table
CREATE TABLE global_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  target_audience TEXT CHECK (target_audience IN ('all', 'students', 'instructors', 'admins')) DEFAULT 'all',
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_announcements_active ON global_announcements(active, created_at DESC);
CREATE INDEX idx_announcements_audience ON global_announcements(target_audience, active);

ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements viewable by target audience"
  ON global_announcements FOR SELECT
  USING (
    active = true AND
    (expires_at IS NULL OR expires_at > NOW()) AND
    (
      target_audience = 'all' OR
      (target_audience = 'students' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')) OR
      (target_audience = 'instructors' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor')) OR
      (target_audience = 'admins' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON global_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Dismissed announcements table
CREATE TABLE dismissed_announcements (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES global_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

ALTER TABLE dismissed_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own dismissals"
  ON dismissed_announcements FOR ALL
  USING (auth.uid() = user_id);

-- User calendar events table
CREATE TABLE user_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  type TEXT CHECK (type IN ('deadline', 'class', 'exam', 'meeting', 'other')) DEFAULT 'other',
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_user_date ON user_calendar_events(user_id, event_date);
CREATE INDEX idx_calendar_course ON user_calendar_events(course_id);

ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar events"
  ON user_calendar_events FOR ALL
  USING (auth.uid() = user_id);

-- User todo items table
CREATE TABLE user_todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_todo_user_completed ON user_todo_items(user_id, completed);
CREATE INDEX idx_todo_due_date ON user_todo_items(user_id, due_date);

ALTER TABLE user_todo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own todos"
  ON user_todo_items FOR ALL
  USING (auth.uid() = user_id);

-- User dashboard preferences table
CREATE TABLE user_dashboard_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  view_mode TEXT CHECK (view_mode IN ('card', 'list', 'grid')) DEFAULT 'card',
  show_progress BOOLEAN DEFAULT true,
  show_announcements BOOLEAN DEFAULT true,
  show_calendar BOOLEAN DEFAULT true,
  show_todos BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON user_dashboard_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Course analytics cache table
CREATE TABLE course_analytics_cache (
  course_id INTEGER PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  avg_progress NUMERIC(5,2) DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_updated ON course_analytics_cache(last_updated);

ALTER TABLE course_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their course analytics"
  ON course_analytics_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_analytics_cache.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Instructor activity feed table
CREATE TABLE instructor_activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('enrollment', 'completion', 'submission', 'review', 'payment')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_instructor ON instructor_activity_feed(instructor_id, created_at DESC);
CREATE INDEX idx_activity_course ON instructor_activity_feed(course_id);
CREATE INDEX idx_activity_type ON instructor_activity_feed(activity_type);

ALTER TABLE instructor_activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own activity"
  ON instructor_activity_feed FOR SELECT
  USING (auth.uid() = instructor_id);

-- Instructor dashboard preferences table
CREATE TABLE instructor_dashboard_preferences (
  instructor_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  view_mode TEXT CHECK (view_mode IN ('card', 'list', 'activity')) DEFAULT 'card',
  visible_widgets JSONB DEFAULT '["grading", "analytics", "deadlines", "activity"]'::jsonb,
  widget_order JSONB DEFAULT '["grading", "analytics", "deadlines", "activity"]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE instructor_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their own preferences"
  ON instructor_dashboard_preferences FOR ALL
  USING (auth.uid() = instructor_id);

-- Archived courses table
CREATE TABLE archived_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  UNIQUE(course_id)
);

CREATE INDEX idx_archived_instructor ON archived_courses(instructor_id);
CREATE INDEX idx_archived_date ON archived_courses(archived_at DESC);

ALTER TABLE archived_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their archived courses"
  ON archived_courses FOR ALL
  USING (auth.uid() = instructor_id);

-- Course applications table
CREATE TABLE course_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_course_applications_user_id ON course_applications(user_id);
CREATE INDEX idx_course_applications_course_id ON course_applications(course_id);
CREATE INDEX idx_course_applications_status ON course_applications(status);
CREATE INDEX idx_course_applications_created_at ON course_applications(created_at DESC);

ALTER TABLE course_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON course_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON course_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications"
  ON course_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Instructors can view applications for their courses"
  ON course_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_applications.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all applications"
  ON course_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any application"
  ON course_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TRIGGER update_course_applications_updated_at
  BEFORE UPDATE ON course_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Program applications table
CREATE TABLE program_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_program_applications_user_id ON program_applications(user_id);
CREATE INDEX idx_program_applications_program_id ON program_applications(program_id);
CREATE INDEX idx_program_applications_status ON program_applications(status);
CREATE INDEX idx_program_applications_created_at ON program_applications(created_at DESC);

ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON program_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON program_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own pending applications"
  ON program_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Program managers can view applications"
  ON program_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('program_manager', 'admin')
    )
  );

CREATE POLICY "Admins can view all applications"
  ON program_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can update any application"
  ON program_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager')
    )
  );

CREATE TRIGGER update_program_applications_updated_at
  BEFORE UPDATE ON program_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: Create views
-- ============================================================================

-- Grading queue view
CREATE VIEW instructor_grading_queue AS
SELECT 
  s.id,
  s.user_id,
  s.lesson_id,
  l.title as lesson_title,
  l.course_id,
  c.title as course_title,
  p.name as student_name,
  s.created_at as submitted_at,
  s.completed
FROM submissions s
JOIN lessons l ON l.id = s.lesson_id
JOIN courses c ON c.id = l.course_id
JOIN profiles p ON p.id = s.user_id
WHERE s.completed = false
ORDER BY s.created_at ASC;

-- Upcoming deadlines view
CREATE VIEW instructor_upcoming_deadlines AS
SELECT 
  c.id as course_id,
  c.title as course_title,
  c.instructor_id,
  'Course Start' as deadline_type,
  c.created_at::date + interval '7 days' as deadline_date,
  'Course launch deadline' as description
FROM courses c
WHERE c.status = 'draft'
  AND c.created_at > NOW() - interval '7 days'
UNION ALL
SELECT 
  e.course_id,
  c.title as course_title,
  c.instructor_id,
  'Grading Due' as deadline_type,
  e.enrolled_at::date + interval '30 days' as deadline_date,
  'Student grading deadline' as description
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.status = 'active'
  AND e.progress < 100
ORDER BY deadline_date ASC;

-- Recent activity view
CREATE VIEW instructor_recent_activity AS
SELECT 
  e.id,
  e.course_id,
  c.title as course_title,
  c.instructor_id,
  'enrollment' as activity_type,
  p.name as user_name,
  'New enrollment' as title,
  e.enrolled_at as created_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN profiles p ON p.id = e.user_id
WHERE e.enrolled_at > NOW() - interval '30 days'
UNION ALL
SELECT 
  s.id,
  l.course_id,
  c.title as course_title,
  c.instructor_id,
  'submission' as activity_type,
  p.name as user_name,
  'Lesson completed' as title,
  s.completed_at as created_at
FROM submissions s
JOIN lessons l ON l.id = s.lesson_id
JOIN courses c ON c.id = l.course_id
JOIN profiles p ON p.id = s.user_id
WHERE s.completed = true
  AND s.completed_at > NOW() - interval '30 days'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'Migration Complete! All tables created successfully.' as status,
  COUNT(*) as new_tables_count
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'lessons',
  'submissions',
  'global_announcements',
  'dismissed_announcements',
  'user_calendar_events',
  'user_todo_items',
  'user_dashboard_preferences',
  'course_analytics_cache',
  'instructor_activity_feed',
  'instructor_dashboard_preferences',
  'archived_courses',
  'course_applications',
  'program_applications'
);

-- ============================================================================
-- DONE!
-- ============================================================================
