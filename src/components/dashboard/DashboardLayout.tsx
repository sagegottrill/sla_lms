import { useState, useRef, useEffect } from "react";
import { Outlet, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { Bell, Menu, X, ChevronRight, Home, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import { useGlobalDashboardSync } from "@/hooks/useGlobalDashboardSync";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getProfileLinksForRole } from "@/constants/profileMenu";

export default function DashboardLayout() {
  const { isAuthenticated, appUser, logout, loading, needsOnboarding } = useAuth();
  const { isTheaterMode } = useUIStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // PILLAR 3: Global Realtime DB Synchronization active across all portals
  useGlobalDashboardSync();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setProfileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!loading && isAuthenticated && appUser && needsOnboarding) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, isAuthenticated, appUser, needsOnboarding, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roleLabels: Record<string, string> = {
    student: "Student",
    instructor: "Instructor",
    program_manager: "Program Manager",
    admin: "Administrator",
  };

  // Build breadcrumbs from path
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, i) => ({
    label: segment.replace(/-/g, " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
    href: "/" + pathSegments.slice(0, i + 1).join("/"),
    isLast: i === pathSegments.length - 1,
  }));

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-user-role={appUser?.role ?? ""}>
      {/* Desktop Sidebar (Theater Mode Toggle) */}
      <div 
        className={cn(
          "hidden lg:flex transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
          isTheaterMode ? "w-0 -translate-x-full opacity-0" : "w-64 translate-x-0 opacity-100"
        )}
      >
        <div className="w-64 shrink-0">
          <DashboardSidebar />
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-30 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 z-40 lg:hidden"
            >
              <DashboardSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-foreground capitalize">
              {location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link
              to="/dashboard/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
            </Link>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden ring-1 ring-primary/20">
                  {appUser?.avatar && appUser.avatar !== "undefined" ? (
                    <img src={appUser.avatar} alt={appUser.name} className="w-full h-full object-cover" />
                  ) : (
                    appUser?.name ? appUser.name.charAt(0) : "U"
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-foreground leading-none">{appUser?.name ? appUser.name.split(" ")[0] : "User"}</p>
                </div>
                <ChevronRight className={cn("w-3 h-3 text-muted-foreground transition-transform", profileOpen && "rotate-90")} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="p-4 border-b border-border bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                          {appUser?.avatar && appUser.avatar !== "undefined" ? (
                            <img src={appUser.avatar} alt={appUser.name} className="w-full h-full object-cover" />
                          ) : (
                            appUser?.name ? appUser.name.charAt(0) : "U"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{appUser?.name || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{appUser?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5">
                      {getProfileLinksForRole(appUser?.role).map(({ icon: Icon, label, href }) => (
                        <Link
                          key={label}
                          to={href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-border py-1.5">
                      <button
                        onClick={() => { logout(); navigate("/"); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="hidden lg:flex px-6 pt-3 pb-0 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" />
            </Link>
            {breadcrumbs.slice(1).map(crumb => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3" />
                {crumb.isLast ? (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.href} className="hover:text-primary transition-colors">{crumb.label}</Link>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative" data-lenis-prevent="true">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
