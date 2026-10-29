import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishOAuthUrl } from "../lib/oauth";

/**
 * /auth/callback — browser-flow OAuth return (desktop preview). Same exchange
 * as AuthCallbackPage on the web, routed into the mobile shell.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    void finishOAuthUrl(window.location.href).then((r) => {
      if (r.ok) {
        navigate("/tabs/home", { replace: true });
      } else {
        setMessage(r.error ?? "Could not complete sign-in.");
        setTimeout(() => navigate("/tabs/home", { replace: true }), 2500);
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
