-- ============================================================================
-- APPLY ALL PENDING MIGRATIONS
-- ============================================================================
-- Date: May 4, 2026
-- Purpose: Apply all 8 pending migrations to Supabase database
-- 
-- INSTRUCTIONS:
-- 1. FIRST run FIX_EXISTING_TABLES.sql (if you have existing tables)
-- 2. THEN run this file
-- 3. Go to Supabase Dashboard → SQL Editor
-- 4. Create a new query
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" button
-- 7. Wait for completion (should take 10-30 seconds)
-- 8. Check for any errors in the output
-- 
-- WHAT THIS DOES:
-- - Creates all missing tables for new features
-- - Sets up RLS policies for security
-- - Creates indexes for performance
-- - Sets up triggers for auto-updates
-- 
-- SAFE TO RUN:
-- - Uses CREATE IF NOT EXISTS (won't break existing tables)
-- - Uses DROP POLICY IF EXISTS (safe policy updates)
-- - All changes are additive (no data loss)
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Custom Roles & Permissions
-- File: 20260503_custom_roles_permissions.sql
-- ============================================================================

-- Create helper function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 2: Student Dashboard Phase 1
-- File: 20260503_student_dashboard_phase1.sql
-- ============================================================================

-- Create lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS lessons (
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

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add is_preview column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'is_preview'
  ) THEN
    ALTER TABLE lessons ADD COLUMN is_preview BOOLEAN DEFAULT false;
  END IF;
  
  -- Add module_name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'module_name'
  ) THEN
    ALTER TABLE lessons ADD COLUMN module_name TEXT NOT NULL DEFAULT 'Module 1';
  END IF;
  
  -- Add order_index column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE lessons ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, order_index);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lessons viewable by enrolled students" ON lessons;
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

DROP POLICY IF EXISTS "Instructors can manage their course lessons" ON lessons;
CREATE POLICY "Instructors can manage their course lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add completed column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'submissions' 
    AND column_name = 'completed'
  ) THEN
    ALTER TABLE submissions ADD COLUMN completed BOOLEAN DEFAULT false;
  END IF;
  
  -- Add completed_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'submissions' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE submissions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_lesson_id ON submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_submissions_completed ON submissions(user_id, completed);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own submissions" ON submissions;
CREATE POLICY "Users can create their own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own submissions" ON submissions;
CREATE POLICY "Users can update their own submissions"
  ON submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 3: Student Dashboard Phase 2
-- File: 20260503_student_dashboard_phase2.sql
-- ============================================================================

-- Create global announcements table
CREATE TABLE IF NOT EXISTS global_announcements (
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

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'active'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add priority column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';
  END IF;
  
  -- Add target_audience column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN target_audience TEXT CHECK (target_audience IN ('all', 'students', 'instructors', 'admins')) DEFAULT 'all';
  END IF;
  
  -- Add expires_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_announcements_active ON global_announcements(active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON global_announcements(target_audience, active);

ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements viewable by target audience" ON global_announcements;
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

DROP POLICY IF EXISTS "Admins can manage announcements" ON global_announcements;
CREATE POLICY "Admins can manage announcements"
  ON global_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create dismissed announcements table
CREATE TABLE IF NOT EXISTS dismissed_announcements (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES global_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

ALTER TABLE dismissed_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own dismissals" ON dismissed_announcements;
CREATE POLICY "Users can manage their own dismissals"
  ON dismissed_announcements FOR ALL
  USING (auth.uid() = user_id);

-- Create user calendar events table
CREATE TABLE IF NOT EXISTS user_calendar_events (
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

CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON user_calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_course ON user_calendar_events(course_id);

ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own calendar events" ON user_calendar_events;
CREATE POLICY "Users can manage their own calendar events"
  ON user_calendar_events FOR ALL
  USING (auth.uid() = user_id);

-- Create user todo items table
CREATE TABLE IF NOT EXISTS user_todo_items (
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

CREATE INDEX IF NOT EXISTS idx_todo_user_completed ON user_todo_items(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todo_due_date ON user_todo_items(user_id, due_date);

ALTER TABLE user_todo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own todos" ON user_todo_items;
CREATE POLICY "Users can manage their own todos"
  ON user_todo_items FOR ALL
  USING (auth.uid() = user_id);

-- Create user dashboard preferences table
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  view_mode TEXT CHECK (view_mode IN ('card', 'list', 'grid')) DEFAULT 'card',
  show_progress BOOLEAN DEFAULT true,
  show_announcements BOOLEAN DEFAULT true,
  show_calendar BOOLEAN DEFAULT true,
  show_todos BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_dashboard_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON user_dashboard_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 4: Instructor Dashboard Phase 1
-- File: 20260503_instructor_dashboard_phase1.sql
-- ============================================================================

-- Create course analytics cache table
CREATE TABLE IF NOT EXISTS course_analytics_cache (
  course_id INTEGER PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  avg_progress NUMERIC(5,2) DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_updated ON course_analytics_cache(last_updated);

ALTER TABLE course_analytics_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view their course analytics" ON course_analytics_cache;
CREATE POLICY "Instructors can view their course analytics"
  ON course_analytics_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_analytics_cache.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Create grading queue view
CREATE OR REPLACE VIEW instructor_grading_queue AS
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

-- ============================================================================
-- MIGRATION 5: Instructor Dashboard Phase 2
-- File: 20260503_instructor_dashboard_phase2.sql
-- ============================================================================

-- Create instructor activity feed table
CREATE TABLE IF NOT EXISTS instructor_activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('enrollment', 'completion', 'submission', 'review', 'payment')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_instructor ON instructor_activity_feed(instructor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_course ON instructor_activity_feed(course_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON instructor_activity_feed(activity_type);

ALTER TABLE instructor_activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view their own activity" ON instructor_activity_feed;
CREATE POLICY "Instructors can view their own activity"
  ON instructor_activity_feed FOR SELECT
  USING (auth.uid() = instructor_id);

-- Create upcoming deadlines view
CREATE OR REPLACE VIEW instructor_upcoming_deadlines AS
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

-- Create recent activity view
CREATE OR REPLACE VIEW instructor_recent_activity AS
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
-- MIGRATION 6: Instructor Dashboard Phase 3
-- File: 20260503_instructor_dashboard_phase3.sql
-- ============================================================================

-- Create instructor dashboard preferences table
CREATE TABLE IF NOT EXISTS instructor_dashboard_preferences (
  instructor_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  view_mode TEXT CHECK (view_mode IN ('card', 'list', 'activity')) DEFAULT 'card',
  visible_widgets JSONB DEFAULT '["grading", "analytics", "deadlines", "activity"]'::jsonb,
  widget_order JSONB DEFAULT '["grading", "analytics", "deadlines", "activity"]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE instructor_dashboard_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can manage their own preferences" ON instructor_dashboard_preferences;
CREATE POLICY "Instructors can manage their own preferences"
  ON instructor_dashboard_preferences FOR ALL
  USING (auth.uid() = instructor_id);

-- Create archived courses table
CREATE TABLE IF NOT EXISTS archived_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  UNIQUE(course_id)
);

CREATE INDEX IF NOT EXISTS idx_archived_instructor ON archived_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_archived_date ON archived_courses(archived_at DESC);

ALTER TABLE archived_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can manage their archived courses" ON archived_courses;
CREATE POLICY "Instructors can manage their archived courses"
  ON archived_courses FOR ALL
  USING (auth.uid() = instructor_id);

-- ============================================================================
-- MIGRATION 7: Course Applications
-- File: 20260504_course_applications.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_applications (
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

CREATE INDEX IF NOT EXISTS idx_course_applications_user_id ON course_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_course_id ON course_applications(course_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_status ON course_applications(status);
CREATE INDEX IF NOT EXISTS idx_course_applications_created_at ON course_applications(created_at DESC);

ALTER TABLE course_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON course_applications;
CREATE POLICY "Users can view their own applications"
  ON course_applications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own applications" ON course_applications;
CREATE POLICY "Users can create their own applications"
  ON course_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pending applications" ON course_applications;
CREATE POLICY "Users can update their own pending applications"
  ON course_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

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

DROP POLICY IF EXISTS "Admins can view all applications" ON course_applications;
CREATE POLICY "Admins can view all applications"
  ON course_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update any application" ON course_applications;
CREATE POLICY "Admins can update any application"
  ON course_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_course_applications_updated_at ON course_applications;
CREATE TRIGGER update_course_applications_updated_at
  BEFORE UPDATE ON course_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 8: Program Applications
-- File: 20260504_program_applications.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_applications (
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

CREATE INDEX IF NOT EXISTS idx_program_applications_user_id ON program_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_program_id ON program_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_program_applications_status ON program_applications(status);
CREATE INDEX IF NOT EXISTS idx_program_applications_created_at ON program_applications(created_at DESC);

ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON program_applications;
CREATE POLICY "Users can view their own applications"
  ON program_applications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own applications" ON program_applications;
CREATE POLICY "Users can create their own applications"
  ON program_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own pending applications" ON program_applications;
CREATE POLICY "Users can update their own pending applications"
  ON program_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

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

DROP TRIGGER IF EXISTS update_program_applications_updated_at ON program_applications;
CREATE TRIGGER update_program_applications_updated_at
  BEFORE UPDATE ON program_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after the migration to verify all tables were created:

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
-- If you see "Migration Complete! All tables created successfully." above,
-- you're ready to test the application!
-- 
-- Next steps:
-- 1. Test course enrollment flow
-- 2. Test program application flow
-- 3. Test instructor dashboard
-- 4. Test student dashboard
-- ============================================================================
