import { useState, useRef, useEffect } from "react";
import { Outlet, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { Bell, Search, Menu, X, ChevronRight, Home, User, Settings, LogOut, BookOpen, Award, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout() {
  const { isAuthenticated, appUser, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <DashboardSidebar />
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
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/dashboard/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-card" />
            </Link>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {appUser?.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-foreground leading-none">{appUser?.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{roleLabels[appUser?.role ?? "student"]}</p>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl border border-border shadow-lg overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-card flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                          {appUser?.name.charAt(0)}{appUser?.name.split(" ")[1]?.charAt(0) ?? ""}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{appUser?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{appUser?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="py-1.5">
                      {[
                        { icon: User, label: "My Profile", href: "/dashboard/profile" },
                        { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
                        { icon: Award, label: "Certificates", href: "/dashboard/certificates" },
                        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
                        { icon: HelpCircle, label: "Help & Support", href: "/dashboard/settings" },
                      ].map(({ icon: Icon, label, href }) => (
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

                    {/* Logout */}
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
          <div className="px-6 pt-4 pb-0 flex items-center gap-1.5 text-xs text-muted-foreground">
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
        <main className="flex-1 overflow-y-auto p-6" data-lenis-prevent="true">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
