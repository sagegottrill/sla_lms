/**
 * Google OAuth for the Capacitor shell.
 *
 * Flow (native): sign-in opens the SYSTEM browser (Google blocks WebView auth),
 * Google returns us via the com.sheleadsafrica.mobile://login-callback deep
 * link (registered in AndroidManifest), and the running app exchanges the PKCE
 * code — the app never loses its webview state.
 *
 * Flow (desktop browser / preview): standard same-tab redirect to
 * /auth/callback, which the mobile router handles like the web app does.
 *
 * NOTE: the deep link must be allow-listed in Supabase → Auth → URL
 * Configuration → Redirect URLs: com.sheleadsafrica.mobile://login-callback
 */
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/lib/supabase";

export const MOBILE_OAUTH_CALLBACK = "com.sheleadsafrica.mobile://login-callback";

export function oauthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) return MOBILE_OAUTH_CALLBACK;
  return `${window.location.origin}/auth/callback`;
}

/** Start Google sign-in. Resolves the browser auth URL (it is opened for you). */
export async function startGoogleOAuth(): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthRedirectUrl(),
      queryParams: { access_type: "offline", prompt: "select_account" },
      ...(native ? { skipBrowserRedirect: true } : {}),
    },
  });
  if (error) throw error;
  if (native && data?.url) {
    // window.open with _target blank outsources to Capacitor → external browser.
    window.open(data.url, "_system");
  }
}

/** Complete an OAuth return URL (deep link or /auth/callback). */
export async function finishOAuthUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  const qIndex = url.indexOf("?");
  if (qIndex === -1) return { ok: false, error: "No authorization payload in the link." };
  const params = new URLSearchParams(url.slice(qIndex + 1));
  const oauthError = params.get("error_description") || params.get("error");
  if (oauthError) return { ok: false, error: oauthError };
  const code = params.get("code");
  if (!code) return { ok: false, error: "No authorization code in the link." };
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Listen for the deep-link OAuth return while the app is alive. Mounted once
 * at the app root, exactly like the web app mounts its global auth modal.
 */
export function listenForOAuthReturn(): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  let handle: { remove: () => void } | null = null;
  let disposed = false;

  App.addListener("appUrlOpen", ({ url }) => {
    if (!url || !url.startsWith(MOBILE_OAUTH_CALLBACK.split("://")[0])) return;
    void finishOAuthUrl(url);
  }).then((h) => {
    if (disposed) void h.remove();
    else handle = h;
  });

  return () => {
    disposed = true;
    void handle?.remove();
  };
}
