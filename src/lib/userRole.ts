export type UserRole = "student" | "instructor" | "program_manager" | "admin";

/** Staff never use the learner onboarding wizard (students only). */
const STAFF_ROLES: readonly UserRole[] = ["admin", "program_manager", "instructor"];

/** Roles that are allowed to use the onboarding wizard (self-serve learners only). */
const ONBOARDING_ROLES: readonly UserRole[] = ["student"];

export function normalizeUserRole(raw: unknown): UserRole {
  if (raw == null || raw === "") return "student";
  // Strip zero-width / BOM noise occasionally present in CSV imports or hand-edited cells.
  const s0 = String(raw).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const s = s0.toLowerCase().replace(/[\s-]+/g, "_");
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

/** JWT / session user shape for inferring staff when `profiles.role` is still `student`. */
export type JwtRoleClaimsSource = {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function staffRoleFromSingleMeta(meta: Record<string, unknown>): UserRole | null {
  const raw = meta.role ?? meta.user_role ?? meta.userRole ?? meta.roles;
  if (raw == null || raw === "") return null;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const r = normalizeUserRole(item);
      if (isStaffRole(r)) return r;
    }
    return null;
  }
  const r = normalizeUserRole(raw);
  return isStaffRole(r) ? r : null;
}

/**
 * Staff in signed `app_metadata` (service role / hooks), else `user_metadata` (signup options,
 * Dashboard “User metadata”, some OAuth triggers). Prefer app first — safer when both exist.
 */
function staffRoleFromAuthClaims(authUser: JwtRoleClaimsSource | null | undefined): UserRole | null {
  if (!authUser) return null;
  const fromApp = staffRoleFromAppMetadataOnly(authUser);
  if (fromApp) return fromApp;
  return staffRoleFromSingleMeta((authUser.user_metadata || {}) as Record<string, unknown>);
}

/** Staff role from JWT `app_metadata` only (clients cannot forge this). */
export function staffRoleFromAppMetadataOnly(authUser: JwtRoleClaimsSource | null | undefined): UserRole | null {
  if (!authUser) return null;
  return staffRoleFromSingleMeta((authUser.app_metadata || {}) as Record<string, unknown>);
}

/** @deprecated Use JwtRoleClaimsSource */
export type JwtAppMetadataSource = JwtRoleClaimsSource;

/** First non-empty role-like field on a `profiles` row (Supabase column is usually `role`). */
export function rawRoleFromProfileRow(profileRow: Record<string, unknown>): unknown {
  const keys = ["role", "user_role", "userRole", "account_type", "accountType"] as const;
  for (const k of keys) {
    const v = profileRow[k];
    if (v != null && v !== "") return v;
  }
  return null;
}

/** Canonical `UserRole` from a profiles API row (handles alternate keys and messy strings). */
export function roleFromProfileRow(profileRow: Record<string, unknown>): UserRole {
  return normalizeUserRole(rawRoleFromProfileRow(profileRow));
}

/**
 * Prefer `profiles.role` whenever it is not a plain learner row. If the profile still says `student`
 * but the session user carries a staff role in metadata (common when `profiles` was never updated
 * after promotion), use that so staff are not treated as learners.
 */
export function resolveEffectiveRole(
  profileRow: Record<string, unknown>,
  authUser?: JwtRoleClaimsSource | null
): UserRole {
  const profileRole = roleFromProfileRow(profileRow);
  if (profileRole !== "student") return profileRole;
  const fromClaims = staffRoleFromAuthClaims(authUser);
  if (fromClaims) return fromClaims;
  return profileRole;
}

/** When there is no `profiles` row yet (or fetch failed), infer role from session JWT metadata only. */
export function inferRoleFromSessionUser(authUser: JwtRoleClaimsSource | null | undefined): UserRole {
  return resolveEffectiveRole({ role: null }, authUser);
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
