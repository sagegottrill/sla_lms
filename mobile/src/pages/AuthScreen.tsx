import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, Input } from "@kit";
import { friendlyError, isApp } from "@kit";
import { LEGAL_COMPANY } from "@/lib/legal/company";
import { useAuth } from "@/contexts/AuthContext";
import { isUsingSupabasePlaceholders } from "@/lib/supabase";
import { startGoogleOAuth } from "../lib/oauth";

/**
 * Mobile sign-in / sign-up screen.
 * First thing a cold-start user sees after the splash if no saved session exists.
 */
export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  // Signup consent — same policy acceptance the web modal requires.
  const [consentAccepted, setConsentAccepted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUsingSupabasePlaceholders) {
      toast.error("Backend not configured", {
        description: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing from the root .env.",
      });
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await login(email.trim(), password);
        if (error) toast.error(friendlyError(error.message));
      } else {
        if (!name.trim()) return toast.error("Please enter your name");
        if (password.length < 8) return toast.error("Password must be at least 8 characters"); // web rule
        if (!consentAccepted) return toast.error("Please accept the Terms and Conditions and Privacy Policy to continue.");
        const { error } = await signup(name.trim(), email.trim(), password, "student");
        if (error) {
          toast.error(friendlyError(error.message));
        } else {
          toast.success("Account created!");
          // Web parity: go straight to onboarding (session lands via onAuthStateChange;
          // if email confirmation is required project-wide, the auth screen returns and we ask).
          toast.success("Set up your profile in the next few steps ✨");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      {/* brand band */}
      <div className="relative overflow-hidden bg-primary px-8 pb-10 pt-16 text-white">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/20 blur-2xl"
        />
        <motion.img
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 110, damping: 16 }}
          src="/sla_logo_transparent.png"
          alt="She Leads Africa"
          className="relative w-40 invert brightness-0"
        />
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative mt-6 font-display text-3xl font-bold leading-tight"
        >
          Lead boldly.
          <br />
          Learn anywhere.
        </motion.h1>
        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative mt-2 text-sm text-white/80"
        >
          Courses, programs and community — your SLA campus, in your pocket.
        </motion.p>
      </div>

      {/* form card */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 90, damping: 18 }}
        className="-mt-6 flex-1 rounded-t-3xl bg-background px-6 pt-8"
      >
        <div className="mb-6 flex rounded-xl bg-muted p-1">
          {(["login", "signup"] as const).map((mkey) => (
            <button
              key={mkey}
              onClick={() => setMode(mkey)}
              className={`relative flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${mode === mkey ? "text-white" : "text-muted-foreground"}`}
            >
              {mode === mkey && (
                <motion.span layoutId="auth-pill" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <span className="relative">{mkey === "login" ? "Sign in" : "Create account"}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -14 : 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 14 : -14 }}
            transition={{ duration: 0.18 }}
            onSubmit={submit}
            className="space-y-4"
          >
            {mode === "signup" && (
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            )}
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {mode === "signup" && (
              <div className="mt-1 flex items-start gap-2">
                <input
                  id="mobile-signup-consent"
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <label htmlFor="mobile-signup-consent" className="text-[11px] leading-relaxed text-muted-foreground">
                  I agree to the{" "}
                  <span className="font-medium text-foreground underline underline-offset-2">Terms and Conditions</span> and the{" "}
                  <span className="font-medium text-foreground underline underline-offset-2">Privacy Policy</span>, and I am at least {LEGAL_COMPANY.minimumAge} years old or have the consent of a parent or guardian.
                </label>
              </div>
            )}

            <Btn type="submit" size="lg" loading={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "login" ? "Sign in" : "Create account"}
            </Btn>

            {mode === "login" && (
              <p className="text-center text-xs text-muted-foreground">
                Trouble signing in? Reset your password on the web app — the link flow keeps your account safe.
              </p>
            )}
          </motion.form>
        </AnimatePresence>

        {/* divider + Google — parity with the web login modal */}
        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="shrink-0 text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await startGoogleOAuth();
            } catch (err) {
              toast.error("Google sign-in failed. Please try again.");
              console.error("Google OAuth error:", err);
            }
          }}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-2xl bg-card text-sm font-semibold text-foreground ring-1 ring-black/5 transition-colors active:scale-[0.98] dark:ring-white/10"
        >
          <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {isApp && (
          <p className="mt-6 pb-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            She Leads Africa · version 2.6.0
            <br />
            By continuing, you accept our{" "}
            <span className="font-medium text-foreground underline underline-offset-2">Terms of Use</span> and{" "}
            <span className="font-medium text-foreground underline underline-offset-2">Privacy Notice</span>.
          </p>
        )}
      </motion.div>
    </div>
  );
}
