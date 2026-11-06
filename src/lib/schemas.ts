import { z } from "zod";

/**
 * RUNTIME SCHEMAS FOR SUPABASE ROWS (vault proposal: Zod at the API boundary)
 *
 * These validate the RAW database shapes at the moment they enter the mapping
 * layer. They are deliberately lenient: a drift logs a warning (so shape bugs
 * surface in the console instead of silently corrupting the UI) but never
 * throws — the mappers remain the source of truth.
 */

export const courseRowSchema = z.object({
  id: z.union([z.number(), z.string()]),
  public_id: z.string().optional().nullable(),
  program_id: z.union([z.number(), z.string()]).optional().nullable(),
  instructor_id: z.string().optional().nullable(),
  title: z.string(),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  instructor: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  price: z.union([z.number(), z.string()]).optional().nullable(),
  image: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  what_youll_learn: z.unknown().optional(),
  curriculum: z.unknown().optional(),
  reviews: z.unknown().optional(),
  certificate_config: z.unknown().optional(),
  post_assessment_url: z.string().optional().nullable(),
  post_assessment_title: z.string().optional().nullable(),
});

export const programRowSchema = z.object({
  id: z.union([z.number(), z.string()]),
  public_id: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  price: z.union([z.number(), z.string()]).optional().nullable(),
  capacity: z.union([z.number(), z.string()]).optional().nullable(),
  courses: z.unknown().optional(),
  status: z.enum(["upcoming", "active", "completed"]).optional(),
  post_assessment_url: z.string().optional().nullable(),
  post_assessment_title: z.string().optional().nullable(),
});

export const enrollmentRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  course_id: z.number().optional().nullable(),
  program_id: z.number().optional().nullable(),
  status: z.enum(["active", "completed", "dropped", "frozen"]).optional(),
  progress: z.union([z.number(), z.string()]).optional().nullable(),
  current_lesson: z.string().optional().nullable(),
  assessment_opened_at: z.string().optional().nullable(),
  last_accessed: z.string().optional().nullable(),
});

export type CourseRowInput = z.infer<typeof courseRowSchema>;
export type ProgramRowInput = z.infer<typeof programRowSchema>;
export type EnrollmentRowInput = z.infer<typeof enrollmentRowSchema>;

const warned = new Set<string>();

/** Warn once per unique drift so repeated rows don't spam the console. */
export function warnRowDrift(kind: string, id: unknown, issues: string[]) {
  const key = `${kind}:${String(id)}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(
    `[schema-drift] ${kind} row "${String(id)}" no longer matches its schema — UI mapping may be incomplete. Issues: ${issues.slice(0, 3).join("; ")}`,
  );
}
