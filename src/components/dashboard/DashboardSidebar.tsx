import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, LayoutDashboard, Users, Settings, LogOut,
  GraduationCap, BarChart3, Briefcase, FolderOpen,
  Bell, Award, Calendar, ChevronLeft, ChevronRight,
  PlusCircle, FileText, DollarSign, UserCheck,
  MessageSquare, Video, TrendingUp, Folder, Building2,
  Megaphone, ChevronDown, Home, Target, Smartphone,
  ClipboardList, BellRing,
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
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications", badge: "3" },
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
      group: "Career",
      items: [
        { label: "Portfolio", icon: Folder, href: "/dashboard/portfolio" },
        { label: "Resume Builder", icon: FileText, href: "/dashboard/resume" },
        { label: "Skills Assessment", icon: Target, href: "/dashboard/skills" },
        { label: "Job Board", icon: Briefcase, href: "/dashboard/jobs" },
        { label: "Job Alerts", icon: BellRing, href: "/dashboard/job-alerts" },
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
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications", badge: "2" },
      ],
    },
    {
      group: "Content",
      items: [
        { label: "My Courses", icon: BookOpen, href: "/dashboard/courses" },
        { label: "Create Course", icon: PlusCircle, href: "/dashboard/courses/new" },
        { label: "Video Uploads", icon: Video, href: "/dashboard/videos" },
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
        { label: "Programs", icon: FolderOpen, href: "/dashboard/programs" },
        { label: "Create Program", icon: PlusCircle, href: "/dashboard/programs/new" },
        { label: "Participants", icon: Users, href: "/dashboard/participants" },
        { label: "Video Uploads", icon: Video, href: "/dashboard/videos" },
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
        { label: "Notifications", icon: Bell, href: "/dashboard/notifications", badge: "5" },
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
      ],
    },
    {
      group: "Engage",
      items: [
        { label: "Video Uploads", icon: Video, href: "/dashboard/videos" },
        { label: "Forums", icon: MessageSquare, href: "/dashboard/forums" },
        { label: "Employer Portal", icon: Briefcase, href: "/dashboard/employers" },
        { label: "Placements", icon: Target, href: "/dashboard/placements" },
        { label: "Interviews", icon: Building2, href: "/dashboard/interviews" },
        { label: "Job Board", icon: GraduationCap, href: "/dashboard/jobs" },
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
        { label: "Certificates", icon: Award, href: "/dashboard/certificates" },
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
  student: "bg-accent text-accent-foreground",
  instructor: "bg-primary/20 text-primary",
  program_manager: "bg-secondary/20 text-primary",
  admin: "bg-destructive/15 text-destructive",
};

export default function DashboardSidebar() {
  const { appUser, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  if (!appUser) return (
    <aside className="relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden w-[252px]">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img src="/sla_logo_transparent.png" alt="SLA" className="h-8 w-auto opacity-70" />
      </div>
      <div className="flex-1 p-3 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 rounded-xl bg-muted/60 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </aside>
  );
  const groups = navByRole[appUser.role];

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const totalBadges = groups.flatMap(g => g.items).filter(i => i.badge).reduce((acc, i) => acc + parseInt(i.badge || "0"), 0);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 252 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden"
    >
      {/* Logo — links to home */}
      <Link to="/" className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0 hover:bg-sidebar-accent/50 transition-colors">
        <AnimatePresence>
          {!collapsed ? (
            <motion.img 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              src="/sla_logo_transparent.png" 
              alt="SLA Connecta" 
              className="h-8 w-auto shrink-0" 
            />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-8 h-8 flex items-center justify-center shrink-0">
               <img src="/sla_logo_transparent.png" alt="SLA" className="h-6 w-auto object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[60px] -right-3 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:text-primary z-20 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {groups.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.group];
          const hasActiveItem = group.items.some(i => location.pathname === i.href);

          return (
            <div key={group.group} className="mb-1">
              {/* Group label */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                >
                  {group.group}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isGroupCollapsed && "-rotate-90")} />
                </button>
              )}
              {collapsed && <div className="mx-3 my-1.5 h-px bg-sidebar-border" />}

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
                            "flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                            collapsed && "justify-center px-2",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border/50"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
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
                          {collapsed && item.badge && (
                            <span className="absolute top-0 right-0 text-[8px] font-bold bg-secondary text-primary rounded-full w-3.5 h-3.5 flex items-center justify-center">
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
      <div className="border-t border-sidebar-border p-3 shrink-0 bg-muted/30">
        <div className={cn("flex items-center gap-3 p-2.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer border border-transparent hover:border-sidebar-border/50 bg-background", collapsed && "justify-center p-2")}>
          <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground relative shadow-sm">
            {appUser.name.charAt(0)}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-background" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{appUser.name}</p>
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
            "mt-1 w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent transition-colors",
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
            "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent transition-colors",
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
