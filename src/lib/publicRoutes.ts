/** UUID v4 pattern for `courses.public_id` / `programs.public_id` URL segments. */
export const UUID_ROUTE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True if `s` is a positive integer id or a canonical public UUID segment. */
export function isCourseOrProgramRouteParam(s: string | undefined): boolean {
  if (!s) return false;
  const t = s.trim();
  if (/^\d+$/.test(t)) return Number(t) >= 1;
  return UUID_ROUTE.test(t);
}

export function coursePathSegment(c: { id: number; public_id?: string | null }): string {
  return c.public_id && UUID_ROUTE.test(String(c.public_id)) ? String(c.public_id) : String(c.id);
}

export function programPathSegment(p: { id: number; public_id?: string | null }): string {
  return coursePathSegment(p);
}
