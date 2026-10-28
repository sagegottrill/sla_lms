/**
 * Shared Supabase client for the mobile app.
 *
 * Same project, same URL/keys as the web app (envDir points at the repo root).
 * Session storage is the WebView's own localStorage, which Capacitor persists
 * across app launches (per-app origin, cleared only if the user wipes app data).
 *
 * Deliberately NOT an async Capacitor-Preferences adapter: the auth bootstrap
 * reads storage synchronously, so an async bridge stalls startup (splash hang).
 *
 * Every Supabase HTTP call is wrapped with a hard timeout so no single network
 * request can ever freeze the boot path again.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

export const isUsingSupabasePlaceholders =
  supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder_key";

if (isUsingSupabasePlaceholders) {
  console.warn("Supabase credentials are not set. Using placeholder values.");
}

/** Fetch wrapper: abort any request still pending after 15s (boot safety). */
const timeoutFetch: typeof fetch = (input, init) => {
  const signal = init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)])
    : AbortSignal.timeout(15_000);
  return fetch(input, { ...init, signal });
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: timeoutFetch },
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // deep-link callbacks handled by the app shell, not URLs
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Surface any unhandled boot-time failure so Splash can show it instead of an
// endless logo (the ErrorBoundary in AppMobile also reports here).
const bootErrors: string[] = [];
window.addEventListener("error", (e) => {
  bootErrors.push(String(e?.error ?? e?.message ?? e));
  (window as any).__slaBootErrors = bootErrors;
});
window.addEventListener("unhandledrejection", (e) => {
  bootErrors.push(String((e as PromiseRejectionEvent)?.reason?.message ?? e?.reason ?? "rejection"));
  (window as any).__slaBootErrors = bootErrors;
});
