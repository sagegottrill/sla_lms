import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Landing page for password recovery emails. Supabase redirects here with a
 * short-lived session (PASSWORD_RECOVERY) so the user can set a new password.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setReady(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You can sign in with your new password.");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src="/sla_logo_transparent.png" alt="She Leads Africa" className="h-8 w-auto" />
        </Link>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Set a new password</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {ready
            ? "Choose a strong password for your account."
            : "Waiting for a valid reset session from your email link…"}
        </p>

        {!ready ? (
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying reset link…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm password</label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full gradient-card text-primary-foreground h-11 rounded-xl font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-primary font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
