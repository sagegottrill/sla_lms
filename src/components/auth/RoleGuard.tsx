import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { normalizeUserRole } from "@/lib/userRole";

type RoleGuardProps = {
  allow: readonly UserRole[];
  children: React.ReactNode;
  /** Where to send users without permission (default: main dashboard) */
  redirectTo?: string;
};

/**
 * Client-side route guard: hides pages from wrong roles when users bookmark or type URLs.
 * Pair with Supabase RLS for real authorization on data.
 */
export function RoleGuard({ allow, children, redirectTo = "/dashboard" }: RoleGuardProps) {
  const { appUser } = useAuth();
  if (!appUser) return <Navigate to="/" replace />;
  const effectiveRole = normalizeUserRole(appUser.role);
  if (!allow.includes(effectiveRole)) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
