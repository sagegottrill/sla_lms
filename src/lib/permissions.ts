/**
 * PERMISSIONS SYSTEM
 * Canvas/Moodle-style granular permissions for SLA LMS
 */

export const PERMISSIONS = {
  // Courses
  COURSES: {
    CREATE: "courses.create",
    EDIT: "courses.edit",
    DELETE: "courses.delete",
    VIEW_ALL: "courses.view_all",
    PUBLISH: "courses.publish",
    GRADE: "courses.grade",
  },
  
  // Users
  USERS: {
    CREATE: "users.create",
    EDIT: "users.edit",
    DELETE: "users.delete",
    VIEW_ALL: "users.view_all",
    MASQUERADE: "users.masquerade",
    BULK_IMPORT: "users.bulk_import",
  },
  
  // Programs
  PROGRAMS: {
    CREATE: "programs.create",
    EDIT: "programs.edit",
    DELETE: "programs.delete",
    VIEW_ALL: "programs.view_all",
    ENROLL: "programs.enroll",
  },
  
  // Analytics
  ANALYTICS: {
    VIEW: "analytics.view",
    EXPORT: "analytics.export",
    CUSTOM_REPORTS: "analytics.custom_reports",
  },
  
  // Revenue
  REVENUE: {
    VIEW: "revenue.view",
    EXPORT: "revenue.export",
    REFUND: "revenue.refund",
  },
  
  // System
  SYSTEM: {
    SETTINGS: "system.settings",
    HEALTH: "system.health",
    LOGS: "system.logs",
  },
  
  // Participants
  PARTICIPANTS: {
    VIEW: "participants.view",
    MESSAGE: "participants.message",
    EXPORT: "participants.export",
  },
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

export interface Permission {
  key: PermissionKey;
  category: string;
  name: string;
  description?: string;
}

export interface CustomRole {
  id: string;
  name: string;
  base_role: "student" | "instructor" | "program_manager" | "admin";
  description?: string;
  permissions: PermissionKey[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  group_type: "cohort" | "department" | "team" | "custom";
  created_at: string;
  updated_at: string;
}

/**
 * Default permissions for base roles (backward compatibility)
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin: Object.values(PERMISSIONS).flatMap(category => Object.values(category)),
  
  program_manager: [
    PERMISSIONS.COURSES.VIEW_ALL,
    PERMISSIONS.PROGRAMS.CREATE,
    PERMISSIONS.PROGRAMS.EDIT,
    PERMISSIONS.PROGRAMS.VIEW_ALL,
    PERMISSIONS.PROGRAMS.ENROLL,
    PERMISSIONS.ANALYTICS.VIEW,
    PERMISSIONS.ANALYTICS.EXPORT,
    PERMISSIONS.PARTICIPANTS.VIEW,
    PERMISSIONS.PARTICIPANTS.MESSAGE,
    PERMISSIONS.PARTICIPANTS.EXPORT,
  ],
  
  instructor: [
    PERMISSIONS.COURSES.CREATE,
    PERMISSIONS.COURSES.EDIT,
    PERMISSIONS.COURSES.VIEW_ALL,
    PERMISSIONS.COURSES.PUBLISH,
    PERMISSIONS.COURSES.GRADE,
    PERMISSIONS.ANALYTICS.VIEW,
    PERMISSIONS.PARTICIPANTS.VIEW,
  ],
  
  student: [],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userRole: string,
  userPermissions: PermissionKey[],
  requiredPermission: PermissionKey
): boolean {
  // Admin has all permissions
  if (userRole === "admin") return true;
  
  // Check custom permissions
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Check default role permissions
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  return defaultPerms.includes(requiredPermission);
}

/**
 * Get all permissions for a user (base role + custom roles)
 */
export function getUserPermissions(
  userRole: string,
  customRolePermissions: PermissionKey[] = []
): PermissionKey[] {
  const basePermissions = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  const allPermissions = [...new Set([...basePermissions, ...customRolePermissions])];
  return allPermissions;
}

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = [
  { key: "courses", label: "Courses", icon: "BookOpen" },
  { key: "users", label: "Users", icon: "Users" },
  { key: "programs", label: "Programs", icon: "FolderOpen" },
  { key: "analytics", label: "Analytics", icon: "BarChart3" },
  { key: "revenue", label: "Revenue", icon: "DollarSign" },
  { key: "system", label: "System", icon: "Settings" },
  { key: "participants", label: "Participants", icon: "UserCheck" },
] as const;
