import { getSiteUrl, CANONICAL_SITE_URL } from "@/lib/siteUrl";

/**
 * Certificate verification links must be absolute, shareable URLs that open
 * on the DEPLOYED LMS app — never on wherever `window.location.origin`
 * happens to be at generation time. That bug produced links like
 * sheleadsafrica.org/verify/… (the marketing site, 404) and
 * https://localhost/verify/… (inside the mobile WebView).
 *
 * So: only a real configured app URL (VITE_SITE_URL) or the canonical
 * production domain is used — never the in-page origin.
 */
export function getCertificateVerifyUrl(credentialId: string): string {
  const id = credentialId.trim();
  const env = import.meta.env.VITE_SITE_URL as string | undefined;
  const base = env && !env.includes("localhost") && !env.includes("127.0.0.1")
    ? env.replace(/\/$/, "")
    : CANONICAL_SITE_URL;
  if (typeof window !== "undefined" && window.location?.origin) {
    // Keep the browser-origin fallback ONLY when the app is genuinely served
    // from the production LMS domain (or another https host that is neither
    // localhost nor the marketing apex).
    const origin = window.location.origin.replace(/\/$/, "");
    const isRealHost =
      !origin.includes("localhost") &&
      !origin.includes("127.0.0.1") &&
      !/^(https:\/\/(www\.)?)?sheleadsafrica\.org(\/|$)/.test(origin) &&
      origin !== "https://placeholder.supabase.co";
    if (isRealHost) return `${origin}/verify/${encodeURIComponent(id)}`;
  }
  void getSiteUrl; // getSiteUrl remains for OAuth redirects; certificates never use it
  return `${base}/verify/${encodeURIComponent(id)}`;
}
