-- Fix admin role for specific user
-- Admin email: info@sheleadsafrica.org

-- Check current state
SELECT id, name, email, role, onboarding_completed, created_at
FROM profiles
WHERE email = 'info@sheleadsafrica.org';

-- Update to admin role and mark onboarding as completed
UPDATE profiles
SET 
  role = 'admin',
  onboarding_completed = true
WHERE email = 'info@sheleadsafrica.org';

-- Verify the update
SELECT id, name, email, role, onboarding_completed, created_at
FROM profiles
WHERE email = 'info@sheleadsafrica.org';
