import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, LayoutDashboard, Users, Settings, LogOut,
  GraduationCap, BarChart3, FolderOpen,
  Bell, Award, Calendar, ChevronLeft, ChevronRight,
  PlusCircle, FileText, DollarSign, UserCheck,
  MessageSquare, TrendingUp, Folder, Building2,
  Megaphone, ChevronDown, Home, Target,
  ClipboardList, ListChecks,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: React.ElementType; href: string; badge?: string };
type NavGroup = { group: string; items: NavItem[] };

const navByRole: Record<UserRole, NavGroup[]> = {
  student: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
        { label: "Calendar", icon: Calendar, href: "/dashboard/calendar" },
      ],
    },
    {
      group: "Learn",
      items: [
        { label: "My Courses", icon: BookOpen, href: "/dashboard/courses" },
        { label: "My Programs", icon: FolderOpen, href: "/dashboard/programs" },
        { label: "Explore Courses", icon: GraduationCap, href: "/courses" },
        { label: "Certificates", icon: Award, href: "/dashboard/certificates" },
      ],
    },
    {
      group: "Profile & tools",
      items: [
        { label: "Portfolio", icon: Folder, href: "/dashboard/portfolio" },
        { label: "Resume Builder", icon: FileText, href: "/dashboard/resume" },
        { label: "Skills Assessment", icon: Target, href: "/dashboard/skills" },
        { label: "Income Tracker", icon: TrendingUp, href: "/dashboard/income" },
        { label: "Forums", icon: MessageSquare, href: "/dashboard/forums" },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "My Profile", icon: UserCheck, href: "/dashboard/profile" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
      ],
    },
  ],
  instructor: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
      ],
    },
    {
      group: "Content",
      items: [
        { label: "My Courses", icon: BookOpen, href: "/dashboard/courses" },
        { label: "Create Course", icon: PlusCircle, href: "/dashboard/courses/new" },
        { label: "Assessments", icon: ListChecks, href: "/dashboard/assessments/setup" },
      ],
    },
    {
      group: "Engage",
      items: [
        { label: "Students", icon: Users, href: "/dashboard/students" },
        { label: "Forums", icon: MessageSquare, href: "/dashboard/forums" },
      ],
    },
    {
      group: "Revenue",
      items: [
        { label: "Earnings", icon: DollarSign, href: "/dashboard/earnings" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
      ],
    },
  ],
  program_manager: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
      ],
    },
    {
      group: "Programs",
      items: [
        { label: "Courses", icon: BookOpen, href: "/dashboard/courses" },
        { label: "Create Course", icon: PlusCircle, href: "/dashboard/courses/new" },
        { label: "Programs", icon: FolderOpen, href: "/dashboard/programs" },
        { label: "Create Program", icon: PlusCircle, href: "/dashboard/programs/new" },
        { label: "Participants", icon: Users, href: "/dashboard/participants" },
        { label: "Assessments", icon: ListChecks, href: "/dashboard/assessments/setup" },
      ],
    },
    {
      group: "Engage",
      items: [
        { label: "Forums", icon: MessageSquare, href: "/dashboard/forums" },
        { label: "Interviews", icon: Building2, href: "/dashboard/interviews" },
      ],
    },
    {
      group: "Insights",
      items: [
        { label: "Reports", icon: FileText, href: "/dashboard/reports" },
        { label: "Report Builder", icon: ClipboardList, href: "/dashboard/report-builder" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
        { label: "Placements", icon: Target, href: "/dashboard/placements" },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
      ],
    },
  ],
  admin: [
    {
      group: "Overview",
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
      ],
    },
    {
      group: "Users & Content",
      items: [
        { label: "Users", icon: Users, href: "/dashboard/users" },
        { label: "Courses", icon: BookOpen, href: "/dashboard/courses" },
        { label: "Programs", icon: FolderOpen, href: "/dashboard/programs" },
        { label: "Participants", icon: UserCheck, href: "/dashboard/participants" },
        { label: "User Roles", icon: UserCheck, href: "/dashboard/roles" },
        { label: "Assessments", icon: ListChecks, href: "/dashboard/assessments/setup" },
      ],
    },
    {
      group: "Engage",
      items: [
        { label: "Forums", icon: MessageSquare, href: "/dashboard/forums" },
        { label: "Placements", icon: Target, href: "/dashboard/placements" },
        { label: "Interviews", icon: Building2, href: "/dashboard/interviews" },
      ],
    },
    {
      group: "Revenue & Growth",
      items: [
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
        { label: "Lead Dashboard", icon: UserCheck, href: "/dashboard/leads" },
        { label: "Payments", icon: DollarSign, href: "/dashboard/payments" },
        { label: "Income Tracking", icon: TrendingUp, href: "/dashboard/income" },
        { label: "Campaigns", icon: Megaphone, href: "/dashboard/campaigns" },
        { label: "Email Templates", icon: FileText, href: "/dashboard/email-templates" },
        { label: "Report Builder", icon: ClipboardList, href: "/dashboard/report-builder" },
        { label: "Issued certificates", icon: Award, href: "/dashboard/certificates" },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
      ],
    },
  ],
};

const roleLabels: Record<UserRole, string> = {
  student: "Student",
  instructor: "Instructor",
  program_manager: "Program Manager",
  admin: "Administrator",
};

const roleColors: Record<UserRole, string> = {
  student:         "bg-primary/10 text-primary",
  instructor:      "bg-primary/10 text-primary",
  program_manager: "bg-secondary/10 text-secondary",
  admin:           "bg-primary/10 text-primary font-bold",
};

export default function DashboardSidebar() {
  const { appUser, logout } = useAuth();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));
  const [mobileDrawerWidth, setMobileDrawerWidth] = useState(() => (typeof window !== "undefined" ? Math.min(window.innerWidth * 0.84, 320) : 300));
  // Default to collapsed on smaller "laptop" widths to reduce visual density.
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const width = window.innerWidth;
    // Keep mobile expanded for tap accuracy; collapse only on laptop widths.
    return width >= 1024 && width < 1280;
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      setMobileDrawerWidth(Math.min(width * 0.84, 320));
      if (width < 1024) {
        // Never collapse on mobile/tablet drawer.
        setCollapsed(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!appUser) return (
    <aside className="relative flex flex-col h-screen bg-background border-r border-border shrink-0 overflow-hidden w-[252px]">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <img src="/sla_logo_transparent.png" alt="SLA" className="h-10 w-auto opacity-70" />
      </div>
      <div className="flex-1 p-3 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </aside>
  );
  const groups = navByRole[appUser.role];

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : (isDesktop ? 252 : mobileDrawerWidth) }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-background border-r border-border shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0 hover:bg-muted/50 transition-colors">
        <AnimatePresence>
          {!collapsed ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src="/sla_logo_transparent.png"
              alt="Logo"
              className="h-10 w-auto shrink-0"
            />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-8 h-8 flex items-center justify-center shrink-0">
               <img src="/sla_logo_transparent.png" alt="SLA" className="h-8 w-auto object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Collapse toggle */}
      {isDesktop && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[60px] -right-3 w-6 h-6 rounded-full bg-background ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:text-primary z-20 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20">
        {groups.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.group];

          return (
            <div key={group.group} className="mb-1">
              {/* Group label */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-4 py-1.25 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  {group.group}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isGroupCollapsed && "-rotate-90")} />
                </button>
              )}
              {collapsed && <div className="mx-3 my-1.5 h-px bg-border" />}

              {/* Items */}
              <AnimatePresence initial={false}>
                {(!isGroupCollapsed || collapsed) && (
                  <motion.div
                    initial={false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-2 space-y-0.5"
                  >
                    {group.items.map((item) => {
                      const active = location.pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 lg:py-2 rounded-xl text-sm font-medium transition-all duration-150",
                            collapsed && "justify-center px-2",
                            active
                              ? "bg-primary/8 text-primary font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 lg:w-4 lg:h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                          <AnimatePresence>
                            {!collapsed && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 truncate">
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {!collapsed && item.badge && (
                            <span className="ml-auto text-[10px] font-bold bg-secondary text-primary rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User card — pinned to bottom */}
      <div className="border-t border-border p-3 shrink-0">
        <div className={cn("flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 ring-1 ring-black/5 dark:ring-white/10 border-0", collapsed && "justify-center p-2")}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary relative shadow-sm overflow-hidden text-center">
            {appUser?.avatar && appUser.avatar !== "undefined" ? (
              <img src={appUser.avatar} alt={appUser.name} className="w-full h-full object-cover" />
            ) : (
              appUser?.name ? appUser.name.charAt(0) : "U"
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{appUser?.name || "User"}</p>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block", roleColors[appUser.role])}>
                  {roleLabels[appUser.role]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link
          to="/"
          className={cn(
            "mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Back to Home" : undefined}
        >
          <Home className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Back to Home</motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Log Out</motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
