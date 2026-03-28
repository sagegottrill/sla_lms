import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/siteUrl";
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
  const { login, signup } = useAuth();
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
      // login() awaits profile load so role is correct before navigation (avoids student/onboarding flash).
      navigate("/dashboard");
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
    const { error } = await signup(name, email, password, "student");
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

          <div className="p-5 sm:p-6 w-full overflow-visible">
            {/* Header */}
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-0.5">
              {mode === "login" ? "Log in or create account" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {mode === "login"
                ? "Learn on your own time from top institutions."
                : "Start building practical skills at your own pace."
              }
            </p>

            {/* Form */}
            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3">
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
                {mode === "login" && (
                  <div className="mt-1.5 text-right">
                    <Link
                      to="/forgot-password"
                      onClick={onClose}
                      className="text-xs font-medium text-primary hover:text-primary/90"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (
                  <span className="flex items-center gap-2">
                    {mode === "login" ? "Continue" : "Sign Up"} <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground shrink-0">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${getSiteUrl()}/auth/callback`,
                    queryParams: { access_type: "offline", prompt: "select_account" },
                  },
                });
                if (error) toast.error("Google login failed. Please try again.");
              }}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-4">
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
            <p className="text-[10px] text-muted-foreground/60 text-center mt-3 leading-snug">
              By continuing, you accept our Terms of Use and Privacy Notice.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
