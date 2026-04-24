export type UserRole = "student" | "instructor" | "program_manager" | "admin";

/** Staff never use the learner onboarding wizard (students only). */
const STAFF_ROLES: readonly UserRole[] = ["admin", "program_manager", "instructor"];

/** Roles that are allowed to use the onboarding wizard (self-serve learners only). */
const ONBOARDING_ROLES: readonly UserRole[] = ["student"];

export function normalizeUserRole(raw: unknown): UserRole {
  const s = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (s === "admin" || s === "program_manager" || s === "instructor" || s === "student") return s;
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
  if (!isOnboardingRole(appUser.role)) return false;
  return !appUser.onboarding?.completed;
}
