import type { Course, Program } from "@/types";

/** Parse common lesson duration strings into minutes. */
export function parseDurationToMinutes(raw: unknown): number {
  if (raw == null) return 0;
  const s = String(raw).trim().toLowerCase();
  if (!s) return 0;

  // Pure number → treat as minutes
  if (/^\d+(\.\d+)?$/.test(s)) return Math.max(0, Math.round(Number(s)));

  // HH:MM or MM:SS (prefer as minutes:seconds when first part < 60 and no "h")
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) {
    const a = Number(colon[1]);
    const b = Number(colon[2]);
    if (a >= 60) return a * 60 + b;
    return a * 60 + b; // treat as H:MM for course lesson lengths
  }

  let minutes = 0;
  const hours = s.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/);
  if (hours) minutes += Math.round(Number(hours[1]) * 60);
  const mins = s.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?/);
  if (mins) minutes += Math.round(Number(mins[1]));
  if (minutes > 0) return minutes;

  return 0;
}

export function formatDurationMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return h === 1 ? "1 hr" : `${h} hrs`;
  return `${h}h ${rem}m`;
}

/** Sum lesson durations from curriculum JSON; returns "" if nothing parseable. */
export function computeCourseDurationFromCurriculum(curriculum: unknown): string {
  if (!Array.isArray(curriculum)) return "";
  let total = 0;
  for (const mod of curriculum) {
    if (!mod || typeof mod !== "object") continue;
    const items = (mod as { items?: unknown }).items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === "object" && "duration" in item) {
          total += parseDurationToMinutes((item as { duration?: unknown }).duration);
        }
      }
    }
    const modDuration = (mod as { duration?: unknown }).duration;
    if ((!items || !Array.isArray(items) || items.length === 0) && modDuration) {
      total += parseDurationToMinutes(modDuration);
    }
  }
  return formatDurationMinutes(total);
}

export type CourseReview = {
  id?: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  user_id?: string;
};

type CourseRow = Record<string, unknown> & {
  id?: number;
  public_id?: string | null;
  instructor_id?: string | null;
  program_id?: number | string | null;
  post_assessment_url?: string | null;
  post_assessment_title?: string | null;
  title?: string;
  subtitle?: string;
  description?: string;
  instructor?: string;
  instructor_title?: string;
  instructor_bio?: string;
  instructor_avatar?: string;
  category?: string;
  level?: string;
  rating?: number | string;
  review_count?: number | string;
  students?: number | string;
  duration?: string;
  price?: number | string;
  original_price?: number | string | null;
  image?: string | null;
  bestseller?: boolean;
  badge?: string;
  language?: string;
  last_updated?: string | null;
  what_youll_learn?: unknown;
  curriculum?: unknown;
  reviews?: unknown;
  status?: string;
  certificate_config?: unknown;
};

function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function mapLegacyReviews(raw: unknown): CourseReview[] {
  if (!Array.isArray(raw)) return [];
  const out: CourseReview[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const rating = asNumber(o.rating, 0);
    if (rating < 1) continue;
    out.push({
      name: asString(o.name, "Student"),
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      comment: asString(o.comment, ""),
      date: asString(o.date, ""),
      user_id: typeof o.user_id === "string" ? o.user_id : undefined,
      id: typeof o.id === "string" ? o.id : undefined,
    });
  }
  return out;
}

/** Normalize Supabase course rows (snake_case) into the app Course shape. */
export function mapCourseRow(row: CourseRow | null | undefined): Course | undefined {
  if (!row || row.id == null) return undefined;

  const curriculum = Array.isArray(row.curriculum) ? row.curriculum : [];
  const storedDuration = asString(row.duration).trim();
  const duration = storedDuration || computeCourseDurationFromCurriculum(curriculum);

  const reviews = mapLegacyReviews(row.reviews);
  const reviewCount = Math.max(asNumber(row.review_count), reviews.length);
  const rating = asNumber(row.rating, 0);

  return {
    id: Number(row.id),
    public_id: row.public_id ?? null,
    instructor_id: row.instructor_id ?? undefined,
    program_id:
      row.program_id == null || row.program_id === ""
        ? null
        : asNumber(row.program_id),
    postAssessmentUrl:
      row.post_assessment_url ?? (row as { postAssessmentUrl?: string | null }).postAssessmentUrl ?? null,
    postAssessmentTitle:
      row.post_assessment_title ?? (row as { postAssessmentTitle?: string | null }).postAssessmentTitle ?? null,
    title: asString(row.title),
    subtitle: asString(row.subtitle),
    instructor: asString(row.instructor),
    instructorTitle: asString(row.instructor_title ?? (row as { instructorTitle?: string }).instructorTitle),
    instructorBio: asString(row.instructor_bio ?? (row as { instructorBio?: string }).instructorBio),
    instructorAvatar: asString(row.instructor_avatar ?? (row as { instructorAvatar?: string }).instructorAvatar),
    category: asString(row.category),
    level: asString(row.level, "Beginner"),
    rating,
    reviewCount,
    students: asNumber(row.students),
    duration,
    price: asNumber(row.price),
    originalPrice:
      row.original_price == null || row.original_price === ""
        ? undefined
        : asNumber(row.original_price),
    image: asString(row.image, ""),
    bestseller: Boolean(row.bestseller),
    badge: asString(row.badge, "New"),
    language: asString(row.language, "English"),
    lastUpdated: asString(row.last_updated ?? (row as { lastUpdated?: string }).lastUpdated),
    whatYoullLearn: Array.isArray(row.what_youll_learn)
      ? (row.what_youll_learn as string[])
      : Array.isArray((row as { whatYoullLearn?: string[] }).whatYoullLearn)
        ? ((row as { whatYoullLearn?: string[] }).whatYoullLearn as string[])
        : [],
    curriculum: curriculum as Course["curriculum"],
    reviews,
    certificateConfig:
      row.certificate_config && typeof row.certificate_config === "object"
        ? (row.certificate_config as Record<string, unknown>)
        : (row as { certificateConfig?: Record<string, unknown> }).certificateConfig,
  };
}

export function mapCourseRows(rows: unknown): Course[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => mapCourseRow(r as CourseRow))
    .filter((c): c is Course => Boolean(c));
}

type ProgramRow = Record<string, unknown> & {
  id?: number;
  public_id?: string | null;
  title?: string;
  description?: string;
  tagline?: string;
  category?: string;
  image?: string;
  duration?: string;
  start_date?: string;
  deadline?: string;
  price?: number | string;
  original_price?: number | string | null;
  enrolled?: number | string;
  capacity?: number | string;
  course_count?: number | string;
  tag?: string;
  level?: string;
  highlights?: unknown;
  courses?: unknown;
  status?: string;
  certificate_config?: unknown;
  partners?: unknown;
  application_deadline?: string | null;
  post_assessment_url?: string | null;
  post_assessment_title?: string | null;
};

/** Normalize Supabase program rows into the app Program shape. */
export function mapProgramRow(row: ProgramRow | null | undefined): Program | undefined {
  if (!row || row.id == null) return undefined;
  return {
    id: Number(row.id),
    public_id: row.public_id ?? null,
    title: asString(row.title),
    description: asString(row.description),
    category: asString(row.category),
    duration: asString(row.duration),
    startDate: asString(row.start_date ?? (row as { startDate?: string }).startDate),
    enrolled: asNumber(row.enrolled),
    capacity: asNumber(row.capacity),
    price: asNumber(row.price),
    image: asString(row.image, ""),
    highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
    tagline: asString(row.tagline) || undefined,
    courses: Array.isArray(row.courses) ? (row.courses as string[]) : [],
    courseCount: asNumber(row.course_count ?? (row as { courseCount?: number }).courseCount),
    students: asNumber(row.enrolled),
    deadline: asString(row.deadline) || undefined,
    originalPrice:
      row.original_price == null || row.original_price === ""
        ? undefined
        : asNumber(row.original_price),
    level: asString(row.level) || undefined,
    tag: asString(row.tag) || undefined,
    status: asString(row.status) || undefined,
    certificateConfig:
      row.certificate_config && typeof row.certificate_config === "object"
        ? (row.certificate_config as Record<string, unknown>)
        : (row as { certificateConfig?: Record<string, unknown> }).certificateConfig,
    partners: Array.isArray(row.partners)
      ? row.partners
      : Array.isArray((row as { partners?: unknown }).partners)
        ? (row as { partners?: unknown[] }).partners
        : [],
    applicationDeadline:
      row.application_deadline ??
      (row as { applicationDeadline?: string | null }).applicationDeadline ??
      null,
    postAssessmentUrl: row.post_assessment_url || null,
    postAssessmentTitle: row.post_assessment_title || null,
  };
}

export function mapProgramRows(rows: unknown): Program[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => mapProgramRow(r as ProgramRow))
    .filter((p): p is Program => Boolean(p));
}
