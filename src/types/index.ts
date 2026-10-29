export interface Course {
  id: number;
  /** Opaque id for public URLs when column exists in DB */
  public_id?: string | null;
  /** Set on create; links course to authoring user in Supabase */
  instructor_id?: string;
  /** Optional parent program */
  program_id?: number | null;
  title: string;
  subtitle: string;
  instructor: string;
  instructorTitle: string;
  instructorBio: string;
  instructorAvatar: string;
  category: string;
  level: string;
  rating: number;
  reviewCount: number;
  students: number;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  bestseller: boolean;
  badge: string;
  language: string;
  lastUpdated: string;
  whatYoullLearn: string[];
  curriculum: { module: string; lessons: number; duration: string; items: any[] }[];
  reviews: { name: string; rating: number; comment: string; date: string }[];
  /** Live revenue from successful payments (attached for instructor course lists). */
  revenue?: number;
  /** Editable certificate template (logos, signers, body). */
  certificateConfig?: Record<string, unknown>;
  /** Required post-assessment (e.g. Google Form) that gates the certificate.
      Resolved: course-level value, else inherited from the parent program. */
  postAssessmentUrl?: string | null;
  postAssessmentTitle?: string | null;
}

export interface Program {
  id: number;
  public_id?: string | null;
  title: string;
  description: string;
  category: string;
  duration: string;
  startDate: string;
  enrolled: number;
  capacity: number;
  price: number;
  image: string;
  highlights: string[];
  tagline?: string;
  courses?: string[];
  courseCount?: number;
  students?: number;
  deadline?: string;
  originalPrice?: number;
  level?: string;
  tag?: string;
  status?: string;
  certificateConfig?: Record<string, unknown>;
  partners?: unknown[];
  /** Program-level required post-assessment (Google Form) inherited by its courses. */
  postAssessmentUrl?: string | null;
  postAssessmentTitle?: string | null;
  applicationDeadline?: string | null;
}

// ============================================================================
// API Response Types
// ============================================================================
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

// ============================================================================
// Dashboard & Reports Types
// ============================================================================
export interface ProgramRow {
  id: number;
  name: string;
  total: number;
  finished: number;
  atRisk: number;
  notStarted: number;
  avgProgress: number;
}

export interface Participant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  program: string;
  program_id: number | null;
  progress: number;
  status: string;
  lastActive: string;
}

export interface SystemStats {
  totalUsers: number;
  totalCertificates: number;
  completionRate: number;
  totalHours: number;
}

// ============================================================================
// Notification Preferences Types
// ============================================================================
export interface NotificationChannelPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  frequency: "instant" | "hourly" | "daily";
  quiet_start: string;
  quiet_end: string;
  prefs: Record<string, NotificationChannelPrefs>;
  updated_at?: string;
}

export interface NotifPref {
  key: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}
