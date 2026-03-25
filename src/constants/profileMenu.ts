import {
  User,
  BookOpen,
  Award,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/contexts/AuthContext";

/** Profile dropdown items for dashboard shell + landing navbar (single source of truth). */
export const dashboardProfileDropdownLinks: Record<
  UserRole,
  { icon: LucideIcon; label: string; href: string }[]
> = {
  student: [
    { icon: User, label: "My Profile", href: "/dashboard/profile" },
    { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
    { icon: Award, label: "Certificates", href: "/dashboard/certificates" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ],
  instructor: [
    { icon: User, label: "My Profile", href: "/dashboard/profile" },
    { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ],
  program_manager: [
    { icon: User, label: "My Profile", href: "/dashboard/profile" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ],
  admin: [
    { icon: User, label: "Profile", href: "/dashboard/profile" },
    { icon: Users, label: "User management", href: "/dashboard/users" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ],
};

export function getProfileLinksForRole(role: UserRole | undefined) {
  if (!role) return dashboardProfileDropdownLinks.student;
  return dashboardProfileDropdownLinks[role] ?? dashboardProfileDropdownLinks.student;
}

/** Landing navbar + mobile sheet: Dashboard, role-specific links, Help Center (single source with dashboard shell). */
export function getLandingProfileMenuItems(role: UserRole | undefined) {
  const links = getProfileLinksForRole(role);
  return [
    { label: "Dashboard", href: "/dashboard" },
    ...links.map(({ label, href }) => ({ label, href })),
    { label: "Help Center", href: "/about" },
  ];
}
