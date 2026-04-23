/**
 * Comma-separated emails in `VITE_TRUSTED_ADMIN_EMAILS` (Vercel / .env) are promoted to
 * `profiles.role = admin` on login when the row is wrong. Only people with deploy access can
 * set this; remove addresses after fixing `public.profiles` in Supabase.
 */
const TRUSTED = new Set(
  String(import.meta.env.VITE_TRUSTED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isTrustedBootstrapAdmin(email: string | undefined | null): boolean {
  if (!email || TRUSTED.size === 0) return false;
  return TRUSTED.has(email.trim().toLowerCase());
}
