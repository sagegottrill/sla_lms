import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * OAuth return URL (PKCE). Exchanges ?code=... for a session, then routes into the app.
 * Add this exact URL to Supabase Auth → Redirect URLs (e.g. https://connecther.sheleadsafrica.org/auth/callback).
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeErr) {
          setMessage(exchangeErr.message || "Could not complete sign-in.");
          setTimeout(() => navigate("/", { replace: true }), 1800);
          return;
        }
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        setMessage("Could not complete sign-in.");
        navigate("/", { replace: true });
        return;
      }
      if (session?.user) {
        navigate("/dashboard", { replace: true });
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled) return;
      const {
        data: { session: s2 },
      } = await supabase.auth.getSession();
      if (s2?.user) {
        navigate("/dashboard", { replace: true });
      } else {
        setMessage("Session not found. Check Redirect URLs include this page.");
        setTimeout(() => navigate("/", { replace: true }), 2200);
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
