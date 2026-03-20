-- ============================================================================
-- CONNECTA SECURITY OPS — PILLAR 1: ENTERPRISE HARDENING
-- Strictly adheres to the Security Ops Blueprint for >50k user scale.
-- ============================================================================

-- 1. ENABLE RLS ON ALL PUBLIC TABLES (Strict Directive)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 2. OPTIMIZED ROLE EXTRACTION (Direct JWT Claim Evaluation)
-- Avoids expensive JOINs on every secure query per the blueprint.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
  -- Extract role directly from the cryptographically signed JWT claim
  -- Prevents sequential table scans by utilizing the current_setting function
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'role')::text;
$$ LANGUAGE sql STABLE;

-- 3. DROP INSECURE LEGACY POLICIES
-- We replace "using (true)" with explicit "TO authenticated" bindings.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.programs;
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Site config is viewable by everyone" ON public.site_config;

-- 4. HARDENED POLICIES (Explicit Binding & Identity Isolation)

-- PROFILES: Students only see themselves; Admins see all.
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR public.get_auth_role() IN ('admin', 'program_manager')
  );

-- PROGRAMS: Read-only for authenticated; Write for Admins.
CREATE POLICY "Programs viewable by authenticated"
  ON public.programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Programs managed by admins"
  ON public.programs FOR ALL
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'program_manager'));

-- COURSES: Published for all authenticated; Drafts for Instructors/Admins.
CREATE POLICY "Courses access control"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    status = 'published' 
    OR instructor_id = auth.uid() 
    OR public.get_auth_role() IN ('admin', 'program_manager')
  );

-- ENROLLMENTS: Identity Isolation (Student can only see their own learning)
CREATE POLICY "Enrollments identity isolation"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.get_auth_role() IN ('admin', 'program_manager')
  );

-- PAYMENTS: Financial Privacy (Most sensitive table)
CREATE POLICY "Payments financial isolation"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.get_auth_role() = 'admin'
  );

-- 5. MANDATORY PERFORMANCE INDEXING (Blueprint Directive)
-- Prevents 100x sequential scan latency as user base hits 50k+.
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id_composite ON public.enrollments(user_id, status);

-- 6. SECURITY DEFINER GUARDRAILS
-- Ensure trigger functions manually validate permissions if they bypass RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Strict manual validation inside security definer (Blueprint Pillar 1, Rule 6)
  -- Ensure we only insert for the authenticating user
  IF (new.id != auth.uid()) THEN
    RAISE EXCEPTION 'Identity mismatch in profile creation';
  END IF;

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    updated_at = now();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
