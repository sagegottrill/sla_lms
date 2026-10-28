import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, Input } from "@kit";
import { friendlyError, isApp } from "@kit";
import { useAuth } from "@/contexts/AuthContext";
import { isUsingSupabasePlaceholders } from "@/lib/supabase";

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
        if (password.length < 6) return toast.error("Password must be at least 6 characters");
        const { error } = await signup(name.trim(), email.trim(), password, "student");
        if (error) {
          toast.error(friendlyError(error.message));
        } else {
          toast.success("Welcome to She Leads Africa! Confirm your email if prompted, then sign in.");
          setMode("login");
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

        {isApp && (
          <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
            She Leads Africa · version 1.0.0
            <br />
            By continuing you agree to the SLA terms of use.
          </p>
        )}
      </motion.div>
    </div>
  );
}
