-- Fix onboarding_completed for existing users
-- This migration marks all existing users as having completed onboarding
-- to prevent them from being redirected to the onboarding flow

-- Mark all staff (admin, instructor, program_manager) as onboarding completed
UPDATE profiles
SET onboarding_completed = true
WHERE role IN ('admin', 'instructor', 'program_manager')
  AND onboarding_completed = false;

-- Mark all students who have been active as onboarding completed
-- Check if tables exist before querying them
UPDATE profiles
SET onboarding_completed = true
WHERE role = 'student'
  AND onboarding_completed = false
  AND (
    -- Has enrollments (if table exists)
    (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments')
     AND id IN (SELECT DISTINCT user_id FROM enrollments))
    OR
    -- Has been in the system for more than 1 day (likely already onboarded)
    created_at < NOW() - INTERVAL '1 day'
  );

-- Log the changes
DO $$
DECLARE
  staff_count INTEGER;
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO staff_count
  FROM profiles
  WHERE role IN ('admin', 'instructor', 'program_manager')
    AND onboarding_completed = true;
  
  SELECT COUNT(*) INTO student_count
  FROM profiles
  WHERE role = 'student'
    AND onboarding_completed = true;
  
  RAISE NOTICE 'Onboarding fix complete:';
  RAISE NOTICE '  - % staff marked as onboarding completed', staff_count;
  RAISE NOTICE '  - % students marked as onboarding completed', student_count;
END $$;
