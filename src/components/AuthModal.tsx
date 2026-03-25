import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const { login, signup, appUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleHint, setRoleHint] = useState<"admin" | "program_manager" | null>(null);

  // IMPORTANT:
  // `initialMode` can change while the modal is already mounted/open
  // (e.g., user tried login, then clicked "Join for Free" again).
  // Keep internal UI synced with the parent intent.
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setEmail("");
    setPassword("");
    setName("");
    setShowPass(false);
    setLoading(false);
    setRoleHint(null);
  }, [initialMode, isOpen]);

  // Reset state when mode changes
  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setName("");
    setShowPass(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (!error) {
      toast.success("Welcome back!");
      onClose();
      // Wait up to 1.5s for appUser to load from Supabase, then route by real role
      // All roles share the unified /dashboard endpoint which internally routes them
      const routeByRole = (role?: string) => {
        navigate("/dashboard");
      };
      if (appUser?.role) {
        routeByRole(appUser.role);
      } else {
        // Poll briefly for appUser to load
        let attempts = 0;
        const poll = setInterval(() => {
          attempts++;
          // appUser is updated reactively by AuthContext — check window.__sla_role as a bridge
          const el = document.querySelector('[data-user-role]') as HTMLElement | null;
          const role = el?.dataset?.userRole;
          if (role || attempts > 6) {
            clearInterval(poll);
            routeByRole(role);
          }
        }, 250);
      }
    } else {
      toast.error(error?.message || "Invalid email or password.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signupSchema.safeParse({ name, email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await signup(name, email, password, (roleHint as UserRole) || "student");
    setLoading(false);
    if (!error) {
      toast.success("Account created!");
      onClose();
      navigate("/onboarding");
    } else {
      toast.error(error.message || "Signup failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal card */}
        <div
          className="bg-card w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-full">
            {/* Header */}
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              {mode === "login" ? "Log in or create account" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {mode === "login"
                ? "Learn on your own time from top institutions."
                : "Start building job-ready skills today."
              }
            </p>

            {/* Form */}
            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@email.com"
                  className="w-full px-4 py-3 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={mode === "signup" ? "Minimum 8 characters" : "Your password"}
                    className="w-full px-4 py-3 pr-10 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground h-12 rounded-lg font-semibold text-base hover:bg-primary/90 transition-colors"
              >
                {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (
                  <span className="flex items-center gap-2">
                    {mode === "login" ? "Continue" : "Sign Up"} <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {/* Role selection for local testing */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground/70">
                  {mode === "login" ? "Signing in as" : "Create account as"}
                </span>
                {(["admin", "program_manager"] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleHint(prev => prev === r ? null : r)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      roleHint === r
                        ? "bg-primary text-white border-primary"
                        : "text-muted-foreground border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {r === "admin" ? "Admin" : "Program Manager"}
                  </button>
                ))}
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } });
                  if (error) toast.error('Google login failed. Please try again.');
                }}
                className="w-full flex items-center justify-center gap-3 h-11 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc', options: { redirectTo: window.location.origin + '/dashboard' } });
                  if (error) toast.error('LinkedIn login failed. Please try again.');
                }}
                className="w-full flex items-center justify-center gap-3 h-11 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Continue with LinkedIn
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin + '/dashboard' } });
                  if (error) toast.error('GitHub login failed. Please try again.');
                }}
                className="w-full flex items-center justify-center gap-3 h-11 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                Continue with GitHub
              </button>
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-primary font-semibold hover:text-primary/90 transition-colors"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-primary font-semibold hover:text-primary/90 transition-colors"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>

            {/* Terms */}
            <p className="text-[11px] text-muted-foreground/60 text-center mt-4 leading-relaxed">
              By continuing, you accept our Terms of Use and Privacy Notice.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
