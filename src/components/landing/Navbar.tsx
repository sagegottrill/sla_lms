import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Search, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Courses", href: "/courses", hasDropdown: true },
  { label: "Programs", href: "/programs" },
  { label: "For Employers", href: "/for-teams" },
  { label: "About", href: "/about" },
];

const categories = [
  "Data Science & Analytics",
  "Technology & Engineering",
  "Business & Entrepreneurship",
  "Leadership & Management",
  "Finance & Investing",
  "Career Development",
];

export default function Navbar() {
  const { isAuthenticated, appUser, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      scrolled ? "bg-white shadow-md border-b border-border" : "bg-white border-b border-border/60"
    )}>
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/sla_logo_transparent.png" alt="She Leads Africa" className="h-14 w-auto hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex items-center gap-0.5 shrink-0">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label} className="relative group">
                  <button
                    onMouseEnter={() => setExploreOpen(true)}
                    onMouseLeave={() => setExploreOpen(false)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-normal text-foreground/75 hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  >
                    {link.label} <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {exploreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        onMouseEnter={() => setExploreOpen(true)}
                        onMouseLeave={() => setExploreOpen(false)}
                        className="absolute top-full left-0 mt-1 w-60 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10 border-0 py-2 z-50"
                      >
                        {categories.map((cat) => (
                          <a key={cat} href="/courses" className="block px-5 py-2.5 text-sm font-normal text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors">
                            {cat}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link key={link.label} to={link.href}
                  className="px-3 py-2 text-sm font-normal text-foreground/75 hover:text-primary transition-colors rounded-lg hover:bg-muted">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex items-center max-w-md lg:max-w-lg relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              type="text"
              placeholder="What do you want to learn?"
              className="w-full pl-9 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all font-medium"
            />
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {isAuthenticated && appUser ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button variant="outline" className="hidden sm:inline-flex text-sm font-normal h-9 px-4 rounded-lg gap-2 border-border text-foreground bg-transparent hover:bg-muted transition-all">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Button>
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                      {appUser?.avatar && appUser.avatar !== "undefined" ? (
                        <img src={appUser.avatar} alt={appUser.name} className="w-full h-full object-cover" />
                      ) : (
                        appUser?.name ? appUser.name.charAt(0).toUpperCase() : "U"
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground">{appUser?.name ? appUser.name.split(" ")[0] : "User"}</span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden z-50"
                      >
                        {/* User identity */}
                        <div className="px-5 pt-4 pb-3 border-b border-border/60">
                          <p className="text-sm font-semibold text-foreground">{appUser?.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{appUser?.email}</p>
                        </div>

                        {/* Menu items — no icons, clean Coursera text style */}
                        <div className="py-2">
                          {(appUser?.role === "admin" || appUser?.role === "program_manager"
                            ? [
                                { label: "Dashboard",       href: "/dashboard" },
                                { label: "Profile",         href: "/dashboard/profile" },
                                { label: "Settings",        href: "/dashboard/settings" },
                                { label: "Help Center",     href: "/about" },
                              ]
                            : [
                                { label: "Profile",         href: "/dashboard/profile" },
                                { label: "My Courses",      href: "/dashboard/courses" },
                                { label: "Accomplishments", href: "/dashboard/certificates" },
                                { label: "Settings",        href: "/dashboard/settings" },
                                { label: "Help Center",     href: "/about" },
                              ]
                          ).map(({ label, href }) => (
                            <Link
                              key={label}
                              to={href}
                              onClick={() => setProfileOpen(false)}
                              className="block px-5 py-2.5 text-sm text-foreground/85 hover:text-primary hover:bg-muted/50 transition-colors font-medium"
                            >
                              {label}
                            </Link>
                          ))}
                          <button
                            onClick={() => { logout(); navigate("/"); setProfileOpen(false); }}
                            className="block w-full text-left px-5 py-2.5 text-sm text-foreground/85 hover:text-primary hover:bg-muted/50 transition-colors font-medium"
                          >
                            Log Out
                          </button>
                        </div>


                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => openAuthModal("login")}>
                  <Button variant="ghost" className="hidden sm:inline-flex text-sm font-normal text-foreground/75 hover:text-primary hover:bg-muted h-9 px-4">
                    Log In
                  </Button>
                </button>
                <button onClick={() => openAuthModal("signup")} className="hidden sm:block">
                  <Button className="text-sm font-bold bg-primary text-white hover:bg-primary/90 px-5 rounded-lg h-9 shadow-sm">
                    Join for Free
                  </Button>
                </button>
              </>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-muted"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-border overflow-hidden"
          >
            <div className="container px-5 py-4 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={searchValue} onChange={e => setSearchValue(e.target.value)} type="text" placeholder="Search courses..." className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </form>
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors min-h-[44px] flex items-center">
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && appUser ? (
                <div className="pt-3 mt-2 border-t border-border space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                      {appUser?.avatar ? (
                        <img src={appUser.avatar} alt={appUser.name} className="w-full h-full object-cover" />
                      ) : (
                        appUser?.name ? appUser.name.charAt(0) : 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{appUser?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{appUser?.email}</p>
                    </div>
                  </div>
                  {(appUser?.role === "admin" || appUser?.role === "program_manager"
                    ? [
                        { label: "Dashboard",       href: "/dashboard" },
                        { label: "Profile",         href: "/dashboard/profile" },
                        { label: "Settings",        href: "/dashboard/settings" },
                      ]
                    : [
                        { label: "Dashboard",       href: "/dashboard" },
                        { label: "My Courses",      href: "/dashboard/courses" },
                        { label: "Accomplishments", href: "/dashboard/certificates" },
                        { label: "Profile",         href: "/dashboard/profile" },
                        { label: "Settings",        href: "/dashboard/settings" },
                      ]
                  ).map(({ label, href }) => (
                    <Link key={label} to={href} onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors">
                      {label}
                    </Link>
                  ))}
                  <button onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors">
                    Log Out
                  </button>

                </div>
              ) : (
                <div className="flex gap-3 pt-3 mt-2 border-t border-border">
                  <button className="flex-1" onClick={() => { setMobileOpen(false); openAuthModal("login"); }}>
                    <Button variant="outline" className="w-full rounded-xl h-11 text-sm">Log In</Button>
                  </button>
                  <button className="flex-1" onClick={() => { setMobileOpen(false); openAuthModal("signup"); }}>
                    <Button className="w-full rounded-xl h-11 text-sm bg-primary text-white">Join for Free</Button>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
