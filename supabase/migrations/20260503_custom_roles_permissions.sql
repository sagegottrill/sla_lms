-- =====================================================
-- CUSTOM ROLES & PERMISSIONS SYSTEM
-- =====================================================
-- Brings SLA LMS to Canvas/Moodle level with granular permissions

-- 1. Permissions Registry (All available permissions in the system)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- e.g., "courses.create", "users.delete"
  category TEXT NOT NULL, -- e.g., "courses", "users", "analytics"
  name TEXT NOT NULL, -- Human-readable name
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Custom Roles (Extends base roles with custom permission sets)
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- e.g., "Assistant Instructor", "Content Reviewer"
  base_role TEXT NOT NULL CHECK (base_role IN ('student', 'instructor', 'program_manager', 'admin')),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of permission keys
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Custom Role Assignments (Many-to-many)
CREATE TABLE IF NOT EXISTS user_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, custom_role_id)
);

-- 4. User Groups/Cohorts (For bulk operations)
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT DEFAULT 'cohort' CHECK (group_type IN ('cohort', 'department', 'team', 'custom')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Group Memberships
CREATE TABLE IF NOT EXISTS user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 6. System Health Logs (For monitoring)
CREATE TABLE IF NOT EXISTS system_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- 'database', 'storage', 'email', 'auth'
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Masquerade Sessions (Track admin impersonation)
CREATE TABLE IF NOT EXISTS masquerade_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reason TEXT,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================
INSERT INTO permissions (key, category, name, description) VALUES
  -- Courses
  ('courses.create', 'courses', 'Create Courses', 'Create new courses'),
  ('courses.edit', 'courses', 'Edit Courses', 'Edit existing courses'),
  ('courses.delete', 'courses', 'Delete Courses', 'Delete courses'),
  ('courses.view_all', 'courses', 'View All Courses', 'View all courses including drafts'),
  ('courses.publish', 'courses', 'Publish Courses', 'Publish courses to catalog'),
  ('courses.grade', 'courses', 'Grade Submissions', 'Grade student submissions'),
  
  -- Users
  ('users.create', 'users', 'Create Users', 'Create new user accounts'),
  ('users.edit', 'users', 'Edit Users', 'Edit user profiles and roles'),
  ('users.delete', 'users', 'Delete Users', 'Delete user accounts'),
  ('users.view_all', 'users', 'View All Users', 'View all user profiles'),
  ('users.masquerade', 'users', 'Masquerade As User', 'Act as another user for debugging'),
  ('users.bulk_import', 'users', 'Bulk Import Users', 'Import users via CSV'),
  
  -- Programs
  ('programs.create', 'programs', 'Create Programs', 'Create new programs'),
  ('programs.edit', 'programs', 'Edit Programs', 'Edit existing programs'),
  ('programs.delete', 'programs', 'Delete Programs', 'Delete programs'),
  ('programs.view_all', 'programs', 'View All Programs', 'View all programs'),
  ('programs.enroll', 'programs', 'Enroll Participants', 'Enroll users in programs'),
  
  -- Analytics
  ('analytics.view', 'analytics', 'View Analytics', 'View platform analytics'),
  ('analytics.export', 'analytics', 'Export Reports', 'Export analytics reports'),
  ('analytics.custom_reports', 'analytics', 'Custom Reports', 'Create custom reports'),
  
  -- Revenue
  ('revenue.view', 'revenue', 'View Revenue', 'View revenue dashboard'),
  ('revenue.export', 'revenue', 'Export Revenue', 'Export revenue reports'),
  ('revenue.refund', 'revenue', 'Process Refunds', 'Process payment refunds'),
  
  -- System
  ('system.settings', 'system', 'System Settings', 'Modify system settings'),
  ('system.health', 'system', 'System Health', 'View system health monitoring'),
  ('system.logs', 'system', 'View Logs', 'View system logs'),
  
  -- Participants
  ('participants.view', 'participants', 'View Participants', 'View participant list'),
  ('participants.message', 'participants', 'Message Participants', 'Send messages to participants'),
  ('participants.export', 'participants', 'Export Participants', 'Export participant data')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Permissions: Readable by all authenticated users
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissions readable by authenticated users"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Custom Roles: Admins can manage, others can view
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Custom roles readable by authenticated users"
  ON custom_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Custom roles manageable by admins"
  ON custom_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User Custom Roles: Users can view their own, admins can manage all
ALTER TABLE user_custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own custom roles"
  ON user_custom_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all custom role assignments"
  ON user_custom_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User Groups: Admins and program managers can manage
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User groups readable by staff"
  ON user_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager', 'instructor')
    )
  );

CREATE POLICY "User groups manageable by admins and program managers"
  ON user_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager')
    )
  );

-- User Group Members: Same as user groups
ALTER TABLE user_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User group members readable by staff"
  ON user_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager', 'instructor')
    )
  );

CREATE POLICY "User group members manageable by admins and program managers"
  ON user_group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'program_manager')
    )
  );

-- System Health Logs: Admins only
ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System health logs readable by admins"
  ON system_health_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System health logs insertable by service role"
  ON system_health_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Masquerade Sessions: Admins only
ALTER TABLE masquerade_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Masquerade sessions manageable by admins"
  ON masquerade_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_base_role TEXT;
  v_has_permission BOOLEAN := false;
BEGIN
  -- Get user's base role
  SELECT role INTO v_base_role
  FROM profiles
  WHERE id = p_user_id;
  
  -- Admin has all permissions
  IF v_base_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check custom role permissions
  SELECT EXISTS (
    SELECT 1
    FROM user_custom_roles ucr
    JOIN custom_roles cr ON cr.id = ucr.custom_role_id
    WHERE ucr.user_id = p_user_id
    AND cr.is_active = true
    AND cr.permissions @> to_jsonb(ARRAY[p_permission_key])
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_key TEXT, permission_name TEXT, category TEXT) AS $$
BEGIN
  -- If admin, return all permissions
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin') THEN
    RETURN QUERY
    SELECT p.key, p.name, p.category
    FROM permissions p;
  ELSE
    -- Return custom role permissions
    RETURN QUERY
    SELECT DISTINCT p.key, p.name, p.category
    FROM user_custom_roles ucr
    JOIN custom_roles cr ON cr.id = ucr.custom_role_id
    JOIN permissions p ON p.key = ANY(SELECT jsonb_array_elements_text(cr.permissions))
    WHERE ucr.user_id = p_user_id
    AND cr.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_custom_roles_base_role ON custom_roles(base_role);
CREATE INDEX IF NOT EXISTS idx_user_custom_roles_user_id ON user_custom_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_roles_custom_role_id ON user_custom_roles(custom_role_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_service ON system_health_logs(service);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_checked_at ON system_health_logs(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_masquerade_sessions_admin_user_id ON masquerade_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_masquerade_sessions_target_user_id ON masquerade_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_masquerade_sessions_is_active ON masquerade_sessions(is_active) WHERE is_active = true;

COMMENT ON TABLE permissions IS 'Registry of all available permissions in the system';
COMMENT ON TABLE custom_roles IS 'Custom roles with granular permission sets (Canvas/Moodle style)';
COMMENT ON TABLE user_custom_roles IS 'User assignments to custom roles';
COMMENT ON TABLE user_groups IS 'User groups/cohorts for bulk operations';
COMMENT ON TABLE user_group_members IS 'User memberships in groups';
COMMENT ON TABLE system_health_logs IS 'System health monitoring logs';
COMMENT ON TABLE masquerade_sessions IS 'Admin impersonation sessions for debugging';
