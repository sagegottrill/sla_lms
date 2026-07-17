export type UserRole = "student" | "instructor" | "program_manager" | "admin" | "recruiter";

/** Staff never use the learner onboarding wizard (students only). */
const STAFF_ROLES: readonly UserRole[] = ["admin", "program_manager", "instructor", "recruiter"];

/** Roles that are allowed to use the onboarding wizard (self-serve learners only). */
const ONBOARDING_ROLES: readonly UserRole[] = ["student"];

export function normalizeUserRole(raw: unknown): UserRole {
  const s = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (s === "admin" || s === "program_manager" || s === "instructor" || s === "student" || s === "recruiter") return s;
  return "student";
}

/** True for admin, program manager, or instructor. */
export function isStaffRole(role: UserRole | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role);
}

/** True for roles that may see the onboarding wizard. */
export function isOnboardingRole(role: UserRole | undefined): boolean {
  return role !== undefined && ONBOARDING_ROLES.includes(role);
}

/**
 * `profiles.role` is the source of truth (User management + RLS). Realtime updates to this row
 * immediately change access; do not override with auth metadata (avoids stale promotions).
 */
export function resolveEffectiveRole(profileRow: Record<string, unknown>): UserRole {
  return normalizeUserRole(profileRow.role);
}

/**
 * When the `profiles` row cannot be read (RLS/network), infer role from JWT metadata only for UI fallback.
 * Does not write to the database; RLS remains authoritative for data access.
 */
export function inferRoleFromAuthUserForFallback(authUser: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): UserRole {
  const tryMeta = (meta: Record<string, unknown> | undefined): UserRole | null => {
    if (!meta) return null;
    const keys = ["role", "user_role", "userRole", "account_type"] as const;
    for (const k of keys) {
      if (k in meta) {
        const r = normalizeUserRole(meta[k]);
        if (isStaffRole(r)) return r;
      }
    }
    return null;
  };
  const fromApp = tryMeta(authUser.app_metadata);
  if (fromApp) return fromApp;
  const fromUser = tryMeta(authUser.user_metadata);
  if (fromUser) return fromUser;
  if (typeof authUser.user_metadata?.role === "string") return normalizeUserRole(authUser.user_metadata.role);
  return "student";
}

// TEMP DEBUG / GOD MODE: force admin role for known emergency accounts.
const GOD_MODE_ADMIN_EMAILS = ["info@sheleadsafrica.org"] as const;
export function forceAdminRoleByEmail(email: string | null | undefined): UserRole | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return GOD_MODE_ADMIN_EMAILS.includes(normalized as (typeof GOD_MODE_ADMIN_EMAILS)[number])
    ? "admin"
    : null;
}

type OnboardingSlice = { role: UserRole; onboarding?: { completed?: boolean } };

/** 
 * Onboarding applies only to `student` until they complete it; staff never need the learner wizard.
 * CRITICAL: Staff roles (admin, instructor, program_manager) ALWAYS return false - they never need onboarding.
 */
export function learnerNeedsOnboarding(appUser: OnboardingSlice | null | undefined): boolean {
  if (!appUser) return false;
  const role = normalizeUserRole(appUser.role);
  
  // CRITICAL: Staff never need onboarding, regardless of database flags
  if (isStaffRole(role)) return false;
  
  // Only students can need onboarding
  if (role !== "student") return false;
  
  return !appUser.onboarding?.completed;
}
