export type UserRole = "student" | "instructor" | "program_manager" | "admin";

/** Staff never use the learner onboarding wizard (students only). */
const STAFF_ROLES: readonly UserRole[] = ["admin", "program_manager", "instructor"];

/** Roles that are allowed to use the onboarding wizard (self-serve learners only). */
const ONBOARDING_ROLES: readonly UserRole[] = ["student"];

export function normalizeUserRole(raw: unknown): UserRole {
  if (raw == null || raw === "") return "student";
  const s = String(raw).toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (
    s === "admin" ||
    s === "administrator" ||
    s === "superadmin" ||
    s === "super_admin" ||
    s === "executive_admin" ||
    s === "executive_administrator" ||
    s === "school_admin" ||
    s === "platform_admin" ||
    s === "sysadmin" ||
    s === "sys_admin" ||
    s === "super_user"
  )
    return "admin";
  // e.g. "district_administrator" after normalization (avoid bare *_admin — e.g. program_admin).
  if (s.endsWith("_administrator")) return "admin";
  if (s === "program_manager" || s === "programme_manager") return "program_manager";
  if (s === "instructor" || s === "teacher" || s === "educator" || s === "tutor") return "instructor";
  if (s === "student" || s === "learner") return "student";
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

type OnboardingSlice = { role: UserRole; onboarding?: { completed?: boolean } };

/** Onboarding applies to new `student` accounts until they complete it. */
export function learnerNeedsOnboarding(appUser: OnboardingSlice | null | undefined): boolean {
  if (!appUser) return false;
  // Staff must never enter the learner funnel, even if `onboarding_completed` is false in DB.
  if (isStaffRole(appUser.role)) return false;
  if (!isOnboardingRole(appUser.role)) return false;
  return !appUser.onboarding?.completed;
}
