-- ============================================================================
-- FIX EXISTING TABLES - Add Missing Columns
-- ============================================================================
-- Run this FIRST before APPLY_ALL_MIGRATIONS.sql
-- This adds missing columns to existing tables without breaking anything
-- ============================================================================

-- Fix lessons table
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
    RAISE NOTICE 'Added is_preview to lessons';
  END IF;
  
  -- Add module_name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'module_name'
  ) THEN
    ALTER TABLE lessons ADD COLUMN module_name TEXT NOT NULL DEFAULT 'Module 1';
    RAISE NOTICE 'Added module_name to lessons';
  END IF;
  
  -- Add order_index column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE lessons ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added order_index to lessons';
  END IF;
END $$;

-- Fix submissions table
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
    RAISE NOTICE 'Added completed to submissions';
  END IF;
  
  -- Add completed_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'submissions' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE submissions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added completed_at to submissions';
  END IF;
END $$;

-- Fix global_announcements table
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
    RAISE NOTICE 'Added active to global_announcements';
  END IF;
  
  -- Add priority column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN priority TEXT DEFAULT 'medium';
    RAISE NOTICE 'Added priority to global_announcements';
  END IF;
  
  -- Add target_audience column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN target_audience TEXT DEFAULT 'all';
    RAISE NOTICE 'Added target_audience to global_announcements';
  END IF;
  
  -- Add expires_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'global_announcements' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE global_announcements ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added expires_at to global_announcements';
  END IF;
END $$;

SELECT 'All missing columns added successfully!' as status;
