/**
 * Canonical site URL for OAuth redirects. Set VITE_SITE_URL in production
 * (e.g. https://sla-lms.vercel.app) so redirects match Supabase "Redirect URLs".
 */
export function getSiteUrl(): string {
  const env = import.meta.env.VITE_SITE_URL as string | undefined;
  if (env && env.trim()) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
