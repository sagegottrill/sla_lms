export type UserRole = "student" | "instructor" | "program_manager" | "admin";

/** Staff never use the learner onboarding wizard (students only). */
const STAFF_ROLES: readonly UserRole[] = ["admin", "program_manager", "instructor"];

export function normalizeUserRole(raw: unknown): UserRole {
  const s = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (s === "admin" || s === "program_manager" || s === "instructor" || s === "student") return s;
  return "student";
}

/** True for admin, program manager, or instructor. */
export function isStaffRole(role: UserRole | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role);
}

/**
 * `profiles.role` is the source of truth (User management + RLS). Realtime updates to this row
 * immediately change access; do not override with auth metadata (avoids stale promotions).
 */
export function resolveEffectiveRole(profileRow: Record<string, unknown>): UserRole {
  return normalizeUserRole(profileRow.role);
}

type OnboardingSlice = { role: UserRole; onboarding?: { completed?: boolean } };

/** Learner onboarding applies only to students who have not completed the wizard. */
export function learnerNeedsOnboarding(appUser: OnboardingSlice | null | undefined): boolean {
  if (!appUser) return false;
  if (appUser.role !== "student") return false;
  return !appUser.onboarding?.completed;
}
