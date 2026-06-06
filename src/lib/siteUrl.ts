/** Production LMS URL (custom domain). Used as fallback when window/env are unavailable. */
export const CANONICAL_SITE_URL = "https://connecther.sheleadsafrica.org";

/**
 * Site URL for OAuth/password-reset redirects.
 * Prefer the browser origin so Google login returns to the domain the user is on
 * (e.g. connecther.sheleadsafrica.org, not an old Vercel preview URL).
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  const env = import.meta.env.VITE_SITE_URL as string | undefined;
  if (env && env.trim()) return env.replace(/\/$/, "");
  return CANONICAL_SITE_URL;
}
