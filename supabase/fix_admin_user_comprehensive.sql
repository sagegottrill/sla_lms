-- ============================================================================
-- COMPREHENSIVE ADMIN USER FIX
-- ============================================================================
-- This script:
-- 1. Identifies the admin user by email (info@sheleadsafrica.org)
-- 2. Updates their role to 'admin' and marks onboarding as completed
-- 3. Creates a trigger to auto-promote GOD_MODE emails to admin on insert/update
-- ============================================================================

-- Step 1: Check current state of admin user
SELECT 
  id, 
  name, 
  email, 
  role, 
  onboarding_completed, 
  created_at,
  updated_at
FROM profiles
WHERE email = 'info@sheleadsafrica.org';

-- Step 2: Update admin user to correct role
UPDATE profiles
SET 
  role = 'admin',
  onboarding_completed = true,
  updated_at = NOW()
WHERE email = 'info@sheleadsafrica.org';

-- Step 3: Verify the update
SELECT 
  id, 
  name, 
  email, 
  role, 
  onboarding_completed, 
  created_at,
  updated_at
FROM profiles
WHERE email = 'info@sheleadsafrica.org';

-- Step 4: Create a function to auto-promote GOD_MODE admin emails
CREATE OR REPLACE FUNCTION auto_promote_god_mode_admins()
RETURNS TRIGGER AS $$
DECLARE
  god_mode_emails TEXT[] := ARRAY['info@sheleadsafrica.org'];
BEGIN
  -- If the email is in the GOD_MODE list, force admin role
  IF NEW.email = ANY(god_mode_emails) THEN
    NEW.role := 'admin';
    NEW.onboarding_completed := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to run on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_auto_promote_god_mode_admins ON profiles;
CREATE TRIGGER trigger_auto_promote_god_mode_admins
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_god_mode_admins();

-- Step 6: Final verification
SELECT 
  id, 
  name, 
  email, 
  role, 
  onboarding_completed
FROM profiles
WHERE email = 'info@sheleadsafrica.org';

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Run this script in your Supabase SQL Editor
-- 2. Clear browser localStorage and cookies for the app
-- 3. Log out and log back in
-- 4. Admin should now go directly to dashboard without onboarding
-- ============================================================================
