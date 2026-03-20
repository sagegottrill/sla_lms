-- ============================================================
-- SLA CONNECTA LMS — Enterprise Architecture Migration
-- Pillar 2: Database Architecture & Security & Indexing
-- ============================================================

-- ------------------------------------------------------------
-- 1. DROP EXISTING POLICIES & SETUP TABLES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.programs;
DROP POLICY IF EXISTS "Admins and program managers can manage programs" ON public.programs;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Instructors and admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollment progress" ON public.enrollments;
DROP POLICY IF EXISTS "Admins and managers can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

-- Webhook Idempotency Table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text UNIQUE NOT NULL,
  payload jsonb,
  processed_at timestamptz DEFAULT now()
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No client-side policies; strictly backend/Edge Function access only.

-- ------------------------------------------------------------
-- 2. ENTERPRISE ROW LEVEL SECURITY (JWT Custom Claims)
-- Replacing sub-queries with auth.jwt() ->> 'user_role'
-- ------------------------------------------------------------

-- PROFILES: 
-- Read: Open to authenticated users OR public.
-- Update: Only owner, OR Admin.
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users and Admins can update profiles" 
  ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR (auth.jwt() ->> 'user_role' = 'admin')
  ) WITH CHECK (
    auth.uid() = id OR (auth.jwt() ->> 'user_role' = 'admin')
  );

-- PROGRAMS:
-- Read: Open
-- All other ops: Admin or Program Manager
CREATE POLICY "Programs are viewable by everyone" 
  ON public.programs FOR SELECT USING (true);

CREATE POLICY "Admins and program managers manage programs" 
  ON public.programs FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager')
  ) WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager')
  );

-- COURSES:
-- Read: if published OR user is admin/pm/instructor
-- All other ops: Admin, PM, Instructor
CREATE POLICY "Courses are selectively viewable" 
  ON public.courses FOR SELECT USING (
    status = 'published' OR 
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager', 'instructor')
  );

CREATE POLICY "Staff manage courses" 
  ON public.courses FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager', 'instructor')
  ) WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager', 'instructor')
  );

-- JOBS:
-- Read: Open
-- All other ops: Admin
CREATE POLICY "Jobs are viewable by everyone" 
  ON public.jobs FOR SELECT USING (true);

CREATE POLICY "Admins manage jobs" 
  ON public.jobs FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'admin'
  ) WITH CHECK (
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- ENROLLMENTS:
-- Read: Owner OR Admin/PM
-- Insert: Only Owner
-- Update: Owner (progress) OR Admin/PM
CREATE POLICY "View enrollments (Owner/Admin/PM)" 
  ON public.enrollments FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager')
  );

CREATE POLICY "Users can enroll themselves" 
  ON public.enrollments FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Update enrollments (Owner/Admin/PM)" 
  ON public.enrollments FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager')
  ) WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager')
  );

-- PAYMENTS:
-- Read: Owner OR Admin/PM
-- Insert: Edge Function (but keeping owner insert for legacy)
CREATE POLICY "View payments (Owner/Admin/PM)" 
  ON public.payments FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'user_role' IN ('admin', 'program_manager')
  );

CREATE POLICY "Insert payments (Owner)" 
  ON public.payments FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "SuperUser/EdgeFunction update payments" 
  ON public.payments FOR UPDATE USING (
    auth.jwt() ->> 'user_role' IN ('admin')
  ) WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('admin')
  );

-- ------------------------------------------------------------
-- 3. ENTERPRISE DATABASE INDEXING
-- Engineered for 50,000+ Active Users
-- ------------------------------------------------------------
-- Note: Indexes are created CONCURRENTLY to prevent locking tables during active production use.
-- To run this script without error in Supabase SQL editor, the `CONCURRENTLY` keyword is safely omitted 
-- from simple scripts when tables are small or empty, but used in production. We will use standard CREATE INDEX 
-- here to ensure it runs seamlessly in the web SQL editor which runs inside an implicit transaction block.

-- Foreign Key Composite Indexes (B-Tree)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_program ON public.enrollments (user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses (instructor_id);

-- Generalized Inverted Indexes (GIN) for massive JSONB & Array Search
CREATE INDEX IF NOT EXISTS idx_courses_curriculum_gin ON public.courses USING GIN (curriculum);
CREATE INDEX IF NOT EXISTS idx_courses_whatyoulearn_gin ON public.courses USING GIN (what_youll_learn);
CREATE INDEX IF NOT EXISTS idx_jobs_skills_gin ON public.jobs USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_programs_highlights_gin ON public.programs USING GIN (highlights);

-- Block Range Indexes (BRIN) for massive sequential time-series tables
CREATE INDEX IF NOT EXISTS idx_enrollments_time_brin ON public.enrollments USING BRIN (enrolled_at);
CREATE INDEX IF NOT EXISTS idx_payments_time_brin ON public.payments USING BRIN (created_at);

-- ------------------------------------------------------------
-- SUCCESS MESSAGE
-- ============================================================
-- The environment is now configured with Enterprise RLS and Indexing.
