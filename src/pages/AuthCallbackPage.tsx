import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * OAuth return URL (PKCE). Supabase exchanges ?code=... into a session on
 * this page; then we send the user to the app.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
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
      // Brief wait for PKCE exchange on slow networks
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      const { data: { session: s2 } } = await supabase.auth.getSession();
      if (s2?.user) {
        navigate("/dashboard", { replace: true });
      } else {
        setMessage("Session not found.");
        navigate("/", { replace: true });
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
