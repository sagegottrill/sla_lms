      -- =============================================================================
      -- PRODUCTION RLS BASELINE — SLA Connecta LMS (single source of truth)
      -- =============================================================================
      -- Run manually in Supabase SQL Editor after reviewing SECURITY_BASELINE.md.
      --
      -- Goals:
      --   • No custom JWT claims required (uses profiles.role via subqueries).
      --   • Tighten courses: anon sees only published; authenticated learners do not
      --     see other instructors' drafts.
      --   • Tighten profiles: no world-readable PII; self + staff directory rules.
      --   • Staff can read all payments (admin dashboards) + own rows.
      --
      -- Safe to re-run: DROP POLICY IF EXISTS then CREATE POLICY with stable names.
      -- =============================================================================

      -- ---------------------------------------------------------------------------
      -- 0) Drop legacy / alternate policy names (schema.sql, enterprise_migration,
      --    pillar_1_hardening) so this file is the only authority after apply.
      -- ---------------------------------------------------------------------------
      DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
      DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users and Admins can update profiles" ON public.profiles;

      DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.programs;
      DROP POLICY IF EXISTS "Programs viewable by authenticated" ON public.programs;
      DROP POLICY IF EXISTS "Programs managed by admins" ON public.programs;
      DROP POLICY IF EXISTS "Admins and program managers manage programs" ON public.programs;
      DROP POLICY IF EXISTS "Admins and program managers can insert programs" ON public.programs;
      DROP POLICY IF EXISTS "Admins and program managers can update programs" ON public.programs;
      DROP POLICY IF EXISTS "Admins and program managers can delete programs" ON public.programs;

      DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;
      DROP POLICY IF EXISTS "Courses are selectively viewable" ON public.courses;
      DROP POLICY IF EXISTS "Staff manage courses" ON public.courses;
      DROP POLICY IF EXISTS "Courses access control" ON public.courses;
      DROP POLICY IF EXISTS "Staff can insert courses" ON public.courses;
      DROP POLICY IF EXISTS "Staff can update courses" ON public.courses;
      DROP POLICY IF EXISTS "Staff can delete courses" ON public.courses;

      DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
      DROP POLICY IF EXISTS "Admins manage jobs" ON public.jobs;
      DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;

      DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
      DROP POLICY IF EXISTS "Admins and managers can view all enrollments" ON public.enrollments;
      DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
      DROP POLICY IF EXISTS "Users can update their own enrollment progress" ON public.enrollments;
      DROP POLICY IF EXISTS "View enrollments (Owner/Admin/PM)" ON public.enrollments;
      DROP POLICY IF EXISTS "Update enrollments (Owner/Admin/PM)" ON public.enrollments;
      DROP POLICY IF EXISTS "Enrollments identity isolation" ON public.enrollments;

      DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
      DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
      DROP POLICY IF EXISTS "View payments (Owner/Admin/PM)" ON public.payments;
      DROP POLICY IF EXISTS "Insert payments (Owner)" ON public.payments;
      DROP POLICY IF EXISTS "SuperUser/EdgeFunction update payments" ON public.payments;
      DROP POLICY IF EXISTS "Payments financial isolation" ON public.payments;

      -- Also drop current baseline names so this file is truly re-runnable.
      DROP POLICY IF EXISTS "baseline_profiles_select" ON public.profiles;
      DROP POLICY IF EXISTS "baseline_profiles_insert" ON public.profiles;
      DROP POLICY IF EXISTS "baseline_profiles_update" ON public.profiles;

      DROP POLICY IF EXISTS "baseline_programs_select" ON public.programs;
      DROP POLICY IF EXISTS "baseline_programs_insert" ON public.programs;
      DROP POLICY IF EXISTS "baseline_programs_update" ON public.programs;
      DROP POLICY IF EXISTS "baseline_programs_delete" ON public.programs;

      DROP POLICY IF EXISTS "baseline_courses_select_anon" ON public.courses;
      DROP POLICY IF EXISTS "baseline_courses_select_authenticated" ON public.courses;
      DROP POLICY IF EXISTS "baseline_courses_insert" ON public.courses;
      DROP POLICY IF EXISTS "baseline_courses_update" ON public.courses;
      DROP POLICY IF EXISTS "baseline_courses_delete" ON public.courses;

      DROP POLICY IF EXISTS "baseline_jobs_select" ON public.jobs;
      DROP POLICY IF EXISTS "baseline_jobs_admin_all" ON public.jobs;

      DROP POLICY IF EXISTS "baseline_enrollments_select" ON public.enrollments;
      DROP POLICY IF EXISTS "baseline_enrollments_insert" ON public.enrollments;
      DROP POLICY IF EXISTS "baseline_enrollments_update" ON public.enrollments;

      DROP POLICY IF EXISTS "baseline_payments_select" ON public.payments;
      DROP POLICY IF EXISTS "baseline_payments_insert" ON public.payments;
      DROP POLICY IF EXISTS "baseline_payments_update_admin" ON public.payments;

      DO $$
      BEGIN
        IF to_regclass('public.course_applications') IS NOT NULL THEN
          EXECUTE 'DROP POLICY IF EXISTS "Users can insert own course applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Users can read own course applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Staff and course instructor can read course applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Users can view their own applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Users can create their own applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Instructors can view applications for their courses" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Admins can view all applications" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Admins can update any application" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "baseline_course_applications_select" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "baseline_course_applications_insert" ON public.course_applications';
          EXECUTE 'DROP POLICY IF EXISTS "baseline_course_applications_update" ON public.course_applications';
        END IF;

        IF to_regclass('public.program_applications') IS NOT NULL THEN
          EXECUTE 'DROP POLICY IF EXISTS "Users can view their own applications" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Users can create their own applications" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Program managers can view applications" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Admins can view all applications" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "Staff can update any application" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "baseline_program_applications_select" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "baseline_program_applications_insert" ON public.program_applications';
          EXECUTE 'DROP POLICY IF EXISTS "baseline_program_applications_update" ON public.program_applications';
        END IF;
      END
      $$;

      -- ---------------------------------------------------------------------------
      -- 1) ROLE HELPERS (SECURITY DEFINER to avoid recursive profiles policy checks)
      -- ---------------------------------------------------------------------------
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

      CREATE OR REPLACE FUNCTION public.has_staff_access()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
        SELECT COALESCE(public.current_profile_role() IN ('admin', 'program_manager', 'instructor'), false)
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

      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
        SELECT COALESCE(public.current_profile_role() = 'admin', false)
      $$;

      -- ---------------------------------------------------------------------------
      -- 2) PROFILES
      -- ---------------------------------------------------------------------------
      CREATE POLICY "baseline_profiles_select"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (
          (SELECT auth.uid()) = id
          OR public.is_admin_or_pm()
        );

      CREATE POLICY "baseline_profiles_insert"
        ON public.profiles FOR INSERT
        TO authenticated
        WITH CHECK ((SELECT auth.uid()) = id);

      CREATE POLICY "baseline_profiles_update"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (
          (SELECT auth.uid()) = id
          OR public.is_admin()
        )
        WITH CHECK (
          (SELECT auth.uid()) = id
          OR public.is_admin()
        );

      -- ---------------------------------------------------------------------------
      -- 3) PROGRAMS (public catalog read; staff writes)
      -- ---------------------------------------------------------------------------
      CREATE POLICY "baseline_programs_select"
        ON public.programs FOR SELECT
        USING (true);

      CREATE POLICY "baseline_programs_insert"
        ON public.programs FOR INSERT
        TO authenticated
        WITH CHECK (public.is_admin_or_pm());

      CREATE POLICY "baseline_programs_update"
        ON public.programs FOR UPDATE
        TO authenticated
        USING (public.is_admin_or_pm())
        WITH CHECK (public.is_admin_or_pm());

      CREATE POLICY "baseline_programs_delete"
        ON public.programs FOR DELETE
        TO authenticated
        USING (public.is_admin_or_pm());

      -- ---------------------------------------------------------------------------
      -- 4) COURSES (anon: published only; auth: published + own drafts + staff)
      -- ---------------------------------------------------------------------------
      CREATE POLICY "baseline_courses_select_anon"
        ON public.courses FOR SELECT
        TO anon
        USING (status = 'published');

      CREATE POLICY "baseline_courses_select_authenticated"
        ON public.courses FOR SELECT
        TO authenticated
        USING (
          status = 'published'
          OR instructor_id = (SELECT auth.uid())
          OR public.is_admin_or_pm()
        );

      CREATE POLICY "baseline_courses_insert"
        ON public.courses FOR INSERT
        TO authenticated
        WITH CHECK (public.has_staff_access());

      CREATE POLICY "baseline_courses_update"
        ON public.courses FOR UPDATE
        TO authenticated
        USING (public.has_staff_access())
        WITH CHECK (public.has_staff_access());

      CREATE POLICY "baseline_courses_delete"
        ON public.courses FOR DELETE
        TO authenticated
        USING (public.has_staff_access());

      -- ---------------------------------------------------------------------------
      -- 5) JOBS
      -- ---------------------------------------------------------------------------
      CREATE POLICY "baseline_jobs_select"
        ON public.jobs FOR SELECT
        USING (true);

      CREATE POLICY "baseline_jobs_admin_all"
        ON public.jobs FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

      -- ---------------------------------------------------------------------------
      -- 6) ENROLLMENTS
      -- ---------------------------------------------------------------------------
      CREATE POLICY "baseline_enrollments_select"
        ON public.enrollments FOR SELECT
        TO authenticated
        USING (
          (SELECT auth.uid()) = user_id
          OR public.is_admin_or_pm()
        );

      CREATE POLICY "baseline_enrollments_insert"
        ON public.enrollments FOR INSERT
        TO authenticated
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR public.is_admin_or_pm()
      );

      CREATE POLICY "baseline_enrollments_update"
        ON public.enrollments FOR UPDATE
        TO authenticated
        USING (
          (SELECT auth.uid()) = user_id
          OR public.is_admin_or_pm()
        )
        WITH CHECK (
          (SELECT auth.uid()) = user_id
          OR public.is_admin_or_pm()
        );

      -- ---------------------------------------------------------------------------
      -- 7) PAYMENTS (learners + finance staff)
      -- ---------------------------------------------------------------------------
      CREATE POLICY "baseline_payments_select"
        ON public.payments FOR SELECT
        TO authenticated
        USING (
          (SELECT auth.uid()) = user_id
          OR public.is_admin_or_pm()
        );

      CREATE POLICY "baseline_payments_insert"
        ON public.payments FOR INSERT
        TO authenticated
        WITH CHECK ((SELECT auth.uid()) = user_id);

      CREATE POLICY "baseline_payments_update_admin"
        ON public.payments FOR UPDATE
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

      -- ---------------------------------------------------------------------------
      -- 8) COURSE APPLICATIONS (paid course intake before checkout)
      -- ---------------------------------------------------------------------------
      CREATE TABLE IF NOT EXISTS public.course_applications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        course_id int NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
        full_name text NOT NULL DEFAULT '',
        email text NOT NULL DEFAULT '',
        phone text NOT NULL DEFAULT '',
        goal text,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_course_applications_user_id ON public.course_applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_course_applications_course_id ON public.course_applications(course_id);
      CREATE INDEX IF NOT EXISTS idx_course_applications_status ON public.course_applications(status);
      CREATE INDEX IF NOT EXISTS idx_course_applications_created_at ON public.course_applications(created_at DESC);

      ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "baseline_course_applications_select"
        ON public.course_applications FOR SELECT
        TO authenticated
        USING (
          (SELECT auth.uid()) = user_id
          OR public.is_admin_or_pm()
          OR EXISTS (
            SELECT 1
            FROM public.courses c
            WHERE c.id = course_applications.course_id
              AND c.instructor_id = (SELECT auth.uid())
          )
        );

      CREATE POLICY "baseline_course_applications_insert"
        ON public.course_applications FOR INSERT
        TO authenticated
        WITH CHECK ((SELECT auth.uid()) = user_id);

      CREATE POLICY "baseline_course_applications_update"
        ON public.course_applications FOR UPDATE
        TO authenticated
        USING (
          ((SELECT auth.uid()) = user_id AND status = 'pending')
          OR public.is_admin_or_pm()
        )
        WITH CHECK (
          ((SELECT auth.uid()) = user_id AND status = 'pending')
          OR public.is_admin_or_pm()
        );

      -- ---------------------------------------------------------------------------
      -- 9) PROGRAM APPLICATIONS (optional admin approvals flow)
      -- ---------------------------------------------------------------------------
      CREATE TABLE IF NOT EXISTS public.program_applications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
        program_id int NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
        full_name text NOT NULL,
        phone text NOT NULL DEFAULT '',
        email text NOT NULL,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
        created_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE public.program_applications ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "baseline_program_applications_select"
        ON public.program_applications FOR SELECT
        TO authenticated
        USING (
          user_id = auth.uid()
          OR public.is_admin_or_pm()
        );

      CREATE POLICY "baseline_program_applications_insert"
        ON public.program_applications FOR INSERT
        TO authenticated
        WITH CHECK (
          user_id IS NULL OR user_id = auth.uid()
        );

      CREATE POLICY "baseline_program_applications_update"
        ON public.program_applications FOR UPDATE
        TO authenticated
        USING (public.is_admin_or_pm())
        WITH CHECK (public.is_admin_or_pm());

      -- ---------------------------------------------------------------------------
      -- 10) ENROLLMENT TRIGGER SAFETY (courses without instructor_id must not block enroll)
      -- ---------------------------------------------------------------------------
      CREATE OR REPLACE FUNCTION public.trigger_enrollment_activity()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      DECLARE
        v_instructor_id uuid;
        v_course_title text;
        v_student_name text;
      BEGIN
        IF NEW.course_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT c.instructor_id, c.title
        INTO v_instructor_id, v_course_title
        FROM public.courses c
        WHERE c.id = NEW.course_id;

        IF v_instructor_id IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT p.name INTO v_student_name FROM public.profiles p WHERE p.id = NEW.user_id;

        PERFORM public.create_instructor_activity(
          v_instructor_id,
          NEW.course_id,
          'enrollment',
          NEW.user_id,
          NEW.id,
          COALESCE(v_student_name, 'A student') || ' enrolled in ' || COALESCE(v_course_title, 'a course')
        );

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS enrollment_activity_trigger ON public.enrollments;
      CREATE TRIGGER enrollment_activity_trigger
        AFTER INSERT ON public.enrollments
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_enrollment_activity();
    