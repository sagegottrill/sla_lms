-- ============================================================================
-- CHECK EXISTING SCHEMA
-- ============================================================================
-- Run this to see what columns exist in your current tables
-- ============================================================================

-- Check lessons table structure
SELECT 
  'lessons' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lessons'
ORDER BY ordinal_position;

-- Check submissions table structure
SELECT 
  'submissions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;

-- Check global_announcements table structure
SELECT 
  'global_announcements' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'global_announcements'
ORDER BY ordinal_position;

-- List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
