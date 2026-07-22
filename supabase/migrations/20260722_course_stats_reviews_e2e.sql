-- End-to-end course stats: live student counts, real reviews, rating aggregates.
-- Denormalized columns on courses stay in sync via SECURITY DEFINER triggers.

-- ---------------------------------------------------------------------------
-- 1) course_reviews (one review per enrolled student per course)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id int NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT 'Student',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_reviews_unique_user UNIQUE (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON public.course_reviews(user_id);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_reviews_select" ON public.course_reviews;
CREATE POLICY "course_reviews_select"
  ON public.course_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
        AND (
          c.status = 'published'
          OR c.instructor_id = (SELECT auth.uid())
          OR public.has_staff_access()
        )
    )
  );

DROP POLICY IF EXISTS "course_reviews_insert" ON public.course_reviews;
CREATE POLICY "course_reviews_insert"
  ON public.course_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = (SELECT auth.uid())
        AND e.course_id = course_reviews.course_id
        AND e.status IN ('active', 'completed')
    )
  );

DROP POLICY IF EXISTS "course_reviews_update" ON public.course_reviews;
CREATE POLICY "course_reviews_update"
  ON public.course_reviews FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "course_reviews_delete" ON public.course_reviews;
CREATE POLICY "course_reviews_delete"
  ON public.course_reviews FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 2) Sync courses.students from enrollments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_course_student_count(p_course_id int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_course_id IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.courses c
  SET students = (
    SELECT COUNT(*)::int
    FROM public.enrollments e
    WHERE e.course_id = p_course_id
      AND e.status IN ('active', 'completed')
  )
  WHERE c.id = p_course_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_enrollments_refresh_course_students()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_course_student_count(OLD.course_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_course_student_count(NEW.course_id);
  IF TG_OP = 'UPDATE' AND OLD.course_id IS DISTINCT FROM NEW.course_id THEN
    PERFORM public.refresh_course_student_count(OLD.course_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollments_refresh_course_students ON public.enrollments;
CREATE TRIGGER enrollments_refresh_course_students
  AFTER INSERT OR UPDATE OF course_id, status OR DELETE
  ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enrollments_refresh_course_students();

-- ---------------------------------------------------------------------------
-- 3) Sync courses.rating + review_count (+ legacy reviews jsonb mirror)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_course_review_stats(p_course_id int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_avg numeric(3,1);
  v_count int;
  v_reviews jsonb;
BEGIN
  IF p_course_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0),
    COUNT(*)::int
  INTO v_avg, v_count
  FROM public.course_reviews r
  WHERE r.course_id = p_course_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', COALESCE(NULLIF(trim(r.display_name), ''), 'Student'),
        'rating', r.rating,
        'comment', r.comment,
        'date', to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
        'user_id', r.user_id
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_reviews
  FROM public.course_reviews r
  WHERE r.course_id = p_course_id;

  UPDATE public.courses
  SET
    rating = v_avg,
    review_count = v_count,
    reviews = v_reviews
  WHERE id = p_course_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_course_reviews_refresh_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_course_review_stats(OLD.course_id);
    RETURN OLD;
  END IF;
  PERFORM public.refresh_course_review_stats(NEW.course_id);
  IF TG_OP = 'UPDATE' AND OLD.course_id IS DISTINCT FROM NEW.course_id THEN
    PERFORM public.refresh_course_review_stats(OLD.course_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_reviews_refresh_stats ON public.course_reviews;
CREATE TRIGGER course_reviews_refresh_stats
  AFTER INSERT OR UPDATE OF rating, comment, course_id, display_name OR DELETE
  ON public.course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_course_reviews_refresh_stats();

CREATE OR REPLACE FUNCTION public.set_course_review_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_reviews_set_updated_at ON public.course_reviews;
CREATE TRIGGER course_reviews_set_updated_at
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_course_review_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Sync programs.enrolled from program enrollments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_program_enrolled_count(p_program_id int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_program_id IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.programs p
  SET enrolled = (
    SELECT COUNT(*)::int
    FROM public.enrollments e
    WHERE e.program_id = p_program_id
      AND e.status IN ('active', 'completed')
  )
  WHERE p.id = p_program_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_enrollments_refresh_program_enrolled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_program_enrolled_count(OLD.program_id);
    RETURN OLD;
  END IF;
  PERFORM public.refresh_program_enrolled_count(NEW.program_id);
  IF TG_OP = 'UPDATE' AND OLD.program_id IS DISTINCT FROM NEW.program_id THEN
    PERFORM public.refresh_program_enrolled_count(OLD.program_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollments_refresh_program_enrolled ON public.enrollments;
CREATE TRIGGER enrollments_refresh_program_enrolled
  AFTER INSERT OR UPDATE OF program_id, status OR DELETE
  ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enrollments_refresh_program_enrolled();

-- ---------------------------------------------------------------------------
-- 5) Backfill denormalized counts
-- ---------------------------------------------------------------------------
UPDATE public.courses c
SET students = (
  SELECT COUNT(*)::int
  FROM public.enrollments e
  WHERE e.course_id = c.id
    AND e.status IN ('active', 'completed')
);

UPDATE public.programs p
SET enrolled = (
  SELECT COUNT(*)::int
  FROM public.enrollments e
  WHERE e.program_id = p.id
    AND e.status IN ('active', 'completed')
);

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.courses LOOP
    PERFORM public.refresh_course_review_stats(r.id);
  END LOOP;
END $$;
