import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, ChevronDown, Search, LayoutDashboard, User, Award, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Courses", href: "/courses", hasDropdown: true },
  { label: "Programs", href: "/programs" },
  { label: "For Teams", href: "/for-teams" },
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
  const { isAuthenticated, user, logout } = useAuth();
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? "bg-card/98 backdrop-blur-md shadow-brand-sm" : "bg-card"} border-b border-border`}>
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/sla_logo_transparent.png" alt="SLA Connecta" className="h-11 w-auto hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden lg:flex items-center gap-0.5 shrink-0">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label} className="relative group">
                  <button
                    onMouseEnter={() => setExploreOpen(true)}
                    onMouseLeave={() => setExploreOpen(false)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-muted"
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
                        className="absolute top-full left-0 mt-1 w-60 bg-card rounded-xl shadow-brand-lg border border-border p-2 z-50"
                      >
                        {categories.map((cat) => (
                          <a key={cat} href="/courses" className="block px-3 py-2 text-sm text-foreground/75 hover:text-primary hover:bg-muted rounded-lg transition-colors">
                            {cat}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link key={link.label} to={link.href}
                  className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-muted">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Search bar — centre, grows to fill space */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex items-center max-w-md lg:max-w-lg relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              type="text"
              placeholder="Search courses, programs, skills..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
            />
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button variant="outline" className="hidden sm:inline-flex text-sm font-medium h-9 px-4 rounded-lg gap-2">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Button>
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                      {user.first_name?.charAt(0) || "U"}
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-foreground">{user.first_name}</span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-card rounded-2xl border border-border shadow-lg overflow-hidden z-50"
                      >
                        <div className="p-3.5 border-b border-border">
                          <p className="text-sm font-semibold text-foreground">{`${user.first_name} ${user.last_name || ''}`.trim() || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          {[
                            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
                            { icon: User, label: "My Profile", href: "/dashboard/profile" },
                            { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
                            { icon: Award, label: "Certificates", href: "/dashboard/certificates" },
                            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
                          ].map(({ icon: Icon, label, href }) => (
                            <Link key={label} to={href} onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                              <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-border py-1">
                          <button onClick={() => { logout(); navigate("/"); setProfileOpen(false); }}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium text-foreground/70 hover:text-primary h-9 px-4">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup" className="hidden sm:block">
                  <Button className="text-sm font-semibold gradient-card text-primary-foreground hover:opacity-90 px-5 rounded-lg h-9">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-foreground/70 hover:bg-muted"
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
            className="lg:hidden bg-card border-t border-border overflow-hidden"
          >
            <div className="container px-5 py-4 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={searchValue} onChange={e => setSearchValue(e.target.value)} type="text" placeholder="Search courses..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </form>
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors">
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && user ? (
                <div className="pt-3 mt-2 border-t border-border space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                      {user.first_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{`${user.first_name} ${user.last_name || ''}`.trim() || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/dashboard/profile" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted rounded-xl transition-colors">
                    My Profile
                  </Link>
                  <button onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 text-base font-medium text-destructive hover:bg-destructive/5 rounded-xl transition-colors">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-3 mt-2 border-t border-border">
                  <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl h-11 text-sm">Log In</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl h-11 text-sm gradient-card text-primary-foreground">Sign Up Free</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
