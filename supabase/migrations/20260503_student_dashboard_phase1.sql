-- Student Dashboard Phase 1: To-Do List and Dashboard Preferences
-- Migration Date: May 3, 2026

-- ============================================================================
-- 1. USER TO-DO ITEMS TABLE
-- ============================================================================
-- Stores user-created to-do items (personal tasks, reminders)
CREATE TABLE IF NOT EXISTS user_todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_todo_items_user_id ON user_todo_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_todo_items_due_date ON user_todo_items(due_date) WHERE NOT completed AND NOT dismissed;

-- ============================================================================
-- 2. USER DASHBOARD PREFERENCES TABLE
-- ============================================================================
-- Stores user preferences for dashboard customization
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dashboard_view TEXT CHECK (dashboard_view IN ('card', 'list', 'activity')) DEFAULT 'card',
  show_onboarding_banner BOOLEAN DEFAULT TRUE,
  onboarding_banner_dismissals INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user_id ON user_dashboard_preferences(user_id);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE user_todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- User To-Do Items Policies
CREATE POLICY "Users can view their own to-do items"
  ON user_todo_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own to-do items"
  ON user_todo_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own to-do items"
  ON user_todo_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own to-do items"
  ON user_todo_items FOR DELETE
  USING (auth.uid() = user_id);

-- Dashboard Preferences Policies
CREATE POLICY "Users can view their own dashboard preferences"
  ON user_dashboard_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard preferences"
  ON user_dashboard_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard preferences"
  ON user_dashboard_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_todo_items_updated_at
  BEFORE UPDATE ON user_todo_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE user_todo_items IS 'Stores user-created to-do items and personal reminders';
COMMENT ON TABLE user_dashboard_preferences IS 'Stores user preferences for dashboard customization';

COMMENT ON COLUMN user_todo_items.dismissed IS 'Whether the user has dismissed this item from their to-do list';
COMMENT ON COLUMN user_dashboard_preferences.onboarding_banner_dismissals IS 'Number of times user has dismissed the onboarding banner (auto-hide after 3)';
