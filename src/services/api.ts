import { supabase } from "@/lib/supabase";
import { UUID_ROUTE } from "@/lib/publicRoutes";
import type { Course, Program } from "@/types";
import { apiResponse, isApiSuccess, handleApiError } from "@/lib/utils/api";

// Feature flag: if real Supabase URL is configured, use live data
const USE_SUPABASE = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes("placeholder")
);

/** Explicit row projections — avoids `select("*")` payload bloat on wide tables. */
const COURSE_COLUMNS =
  "id, public_id, program_id, instructor_id, title, subtitle, description, instructor, instructor_title, instructor_bio, instructor_avatar, category, level, rating, review_count, students, duration, language, last_updated, price, original_price, image, badge, bestseller, what_youll_learn, curriculum, reviews, status, created_at";

const PROGRAM_COLUMNS =
  "id, public_id, title, description, tagline, category, image, duration, start_date, deadline, price, original_price, enrolled, capacity, course_count, tag, level, highlights, courses, status, created_at";

async function fetchCourseRowById(id: number): Promise<Course | undefined> {
  if (!USE_SUPABASE) return undefined;
  const { data, error } = await supabase.from("courses").select(COURSE_COLUMNS).eq("id", id).single();
  if (error) {
    console.error("Supabase getCourseById error:", error.message);
    return undefined;
  }
  return data as Course;
}

async function fetchCourseRowByPublicId(publicId: string): Promise<Course | undefined> {
  if (!USE_SUPABASE) return undefined;
  const { data, error } = await supabase.from("courses").select(COURSE_COLUMNS).eq("public_id", publicId).maybeSingle();
  if (error) {
    console.error("Supabase getCourseByPublicId error:", error.message);
    return undefined;
  }
  return (data ?? undefined) as Course | undefined;
}

async function fetchProgramRowById(id: number): Promise<Program | undefined> {
  if (!USE_SUPABASE) return undefined;
  const { data, error } = await supabase.from("programs").select(PROGRAM_COLUMNS).eq("id", id).single();
  if (error) {
    console.error("Supabase getProgramById error:", error.message);
    return undefined;
  }
  return data as Program;
}

async function fetchProgramRowByPublicId(publicId: string): Promise<Program | undefined> {
  if (!USE_SUPABASE) return undefined;
  const { data, error } = await supabase.from("programs").select(PROGRAM_COLUMNS).eq("public_id", publicId).maybeSingle();
  if (error) {
    console.error("Supabase getProgramByPublicId error:", error.message);
    return undefined;
  }
  return (data ?? undefined) as Program | undefined;
}

const PROFILE_COLUMNS =
  "id, name, email, role, avatar_url, bio, headline, location, linkedin, career_goal, skills, interests, onboarding_completed, joined, created_at, updated_at";

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = String(error.message ?? "").toLowerCase();
  // PostgREST schema-cache missing relation and Postgres undefined_table.
  return error.code === "PGRST205" || error.code === "42P01" || msg.includes("could not find the table");
}

function defaultLandingPageConfig(): Record<string, unknown> {
  return {
    featured_course_ids: [] as number[],
    featured_program_ids: [] as number[],
    promo: { enabled: false, title: "", subtitle: "", deadline: "" },
  };
}

export const api = {
  // -------------------------
  // COURSES
  // -------------------------
  getCourses: async (options?: { publishedOnly?: boolean }): Promise<ApiResponse<Course[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    
    try {
      let q = supabase.from("courses").select(COURSE_COLUMNS).order("created_at", { ascending: false });
      if (options?.publishedOnly) {
        q = q.eq("status", "published");
      }
      const { data, error } = await q;
      
      if (error) {
        console.error("Supabase getCourses error:", error.message);
        return { data: [], error: error.message, success: false };
      }
      
      return { data: (data ?? []) as Course[], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getCourses error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  // Full-text search across courses (title, subtitle, description, instructor)
  searchCourses: async (query: string): Promise<ApiResponse<Course[]>> => {
    if (!USE_SUPABASE || !query.trim()) return { data: [], error: null, success: true };
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(COURSE_COLUMNS)
        .eq("status", "published")
        .or(
          `title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%,instructor.ilike.%${query}%,category.ilike.%${query}%`
        )
        .order("students", { ascending: false })
        .limit(50);
      if (error) {
        console.error("Supabase searchCourses error:", error.message);
        return { data: [], error: error.message, success: false };
      }
      return { data: (data ?? []) as Course[], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase searchCourses error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  createCourse: async (courseData: Partial<Course> & Record<string, unknown>): Promise<ApiResponse<Course | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase.from("courses").insert(courseData).select().single();
      
      if (error) {
        console.error("Supabase createCourse error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase createCourse error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  updateCourse: async (id: number, updates: Partial<Course> & Record<string, unknown>): Promise<ApiResponse<Course | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase updateCourse error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase updateCourse error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  getCourseById: async (id: number): Promise<ApiResponse<Course | undefined>> => {
    if (!USE_SUPABASE) {
      return { data: undefined, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase.from("courses").select(COURSE_COLUMNS).eq("id", id).single();
      
      if (error) {
        console.error("Supabase getCourseById error:", error.message);
        return { data: undefined, error: error.message, success: false };
      }
      
      return { data: data as Course | undefined, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getCourseById error:", error.message);
      return { data: undefined, error: error.message, success: false };
    }
  },

  getCourseByRouteParam: async (param: string | undefined): Promise<ApiResponse<Course | undefined>> => {
    if (!param) {
      return { data: undefined, error: null, success: true };
    }
    
    if (!USE_SUPABASE) {
      return { data: undefined, error: null, success: true };
    }
    
    try {
      if (!param) return { data: undefined, error: null, success: true };
      const t = param.trim();
      if (/^\d+$/.test(t)) {
        const n = Number(t);
        if (!Number.isFinite(n) || n < 1) return { data: undefined, error: null, success: true };
        const result = await this.getCourseById(n);
        return result;
      }
      if (UUID_ROUTE.test(t)) {
        const result = await this.getCourseByPublicId(t);
        return result;
      }
      return { data: undefined, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getCourseByRouteParam error:", error.message);
      return { data: undefined, error: error.message, success: false };
    }
  },

  // -------------------------
  // PROGRAMS
  // -------------------------
  getPrograms: async (options?: { activeCatalog?: boolean }): Promise<ApiResponse<Program[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    
    try {
      let q = supabase.from("programs").select(PROGRAM_COLUMNS).order("created_at", { ascending: false });
      if (options?.activeCatalog) {
        q = q.in("status", ["upcoming", "active"]);
      }
      const { data, error } = await q;
      
      if (error) {
        console.error("Supabase getPrograms error:", error.message);
        return { data: [], error: error.message, success: false };
      }
      
      return { data: (data ?? []) as Program[], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getPrograms error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  getUserPrograms: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    
    if (!userId) {
      return { data: [], error: null, success: true };
    }

    try {
      const { data: programs, error: programsErr } = await supabase
        .from("programs")
        .select(PROGRAM_COLUMNS);

      if (programsErr) {
        console.error("Supabase getUserPrograms programs error:", programsErr.message);
        return { data: [], error: programsErr.message, success: false };
      }

      const programsArr = (programs ?? []).filter(
        (p: any) => Array.isArray(p?.courses) && p.courses.length > 0,
      );
      if (programsArr.length === 0) return { data: [], error: null, success: true };

      const allCourseTitles = Array.from(
        new Set(programsArr.flatMap((p: any) => (p.courses ?? []).filter(Boolean))),
      );
      if (allCourseTitles.length === 0) return { data: [], error: null, success: true };

      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("id,title")
        .in("title", allCourseTitles);

      if (coursesErr) {
        console.error("Supabase getUserPrograms courses error:", coursesErr.message);
        return { data: [], error: coursesErr.message, success: false };
      }

      const coursesArr = (coursesData ?? []) as Array<{ id: number; title: string }>;
      const courseTitleToId = new Map<string, number>(coursesArr.map((c) => [c.title, c.id]));
      const courseIds = coursesArr.map((c) => c.id);
      if (courseIds.length === 0) return { data: [], error: null, success: true };

      const { data: enrollments, error: enrollmentsErr } = await supabase
        .from("enrollments")
        .select("course_id, progress")
        .eq("user_id", userId)
        .in("course_id", courseIds);

      if (enrollmentsErr) {
        console.error("Supabase getUserPrograms enrollments error:", enrollmentsErr.message);
        return { data: [], error: enrollmentsErr.message, success: false };
      }

      const enrollmentByCourseId = new Map<number, { progress: number }>(
        (enrollments ?? []).map((e: any) => [
          e.course_id,
          { progress: typeof e.progress === "number" ? e.progress : 0 },
        ]),
      );

      const mapped = programsArr
        .map((p: any) => {
          const courseTitles: string[] = (p.courses ?? []).filter(Boolean);
          const courseIdList = courseTitles
            .map((t) => courseTitleToId.get(t))
            .filter((id): id is number => typeof id === "number");

          const enrolledCourseIds = courseIdList.filter((cid) => enrollmentByCourseId.has(cid));
          if (enrolledCourseIds.length === 0) return null; // Only show programs the user touched

          const progressValues = enrolledCourseIds.map((cid) => enrollmentByCourseId.get(cid)!.progress);
          const avgProgress = progressValues.reduce((a, v) => a + v, 0) / progressValues.length;
          const progressRounded = Math.round(avgProgress);

          const coursesCompleted = progressValues.filter((v) => v >= 100).length;

          return {
            id: p.id,
            title: p.title ?? "",
            description: p.description ?? "",
            image: p.image ?? "",
            cohort: p.startDate ?? p.deadline ?? "",
            status: progressRounded >= 100 ? "completed" : "active",
            participants: typeof p.enrolled === "number" ? p.enrolled : 0,
            deadline: p.deadline ?? p.startDate ?? "",
            totalCourses: courseTitles.length,
            courses: courseTitles,
            coursesCompleted,
            progress: progressRounded,
            manager: "SLA Program Team",
          };
        })
        .filter(Boolean);

      return { data: mapped as Array<any>, error: null, success: true };
    } catch (err: any) {
      console.error("Supabase getUserPrograms unexpected error:", err?.message ?? err);
      return { data: [], error: err?.message ?? err, success: false };
    }
  },

  createProgram: async (programData: Partial<Program>): Promise<ApiResponse<Program | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase.from("programs").insert(programData).select().single();
      
      if (error) {
        console.error("Supabase createProgram error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase createProgram error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  updateProgram: async (id: number, updates: Partial<Program> & Record<string, unknown>): Promise<ApiResponse<Program | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase.from("programs").update(updates).eq("id", id).select().single();
      
      if (error) {
        console.error("Supabase updateProgram error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase updateProgram error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  getProgramById: async (id: number): Promise<ApiResponse<Program | undefined>> => {
    if (!USE_SUPABASE) {
      return { data: undefined, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase.from("programs").select(PROGRAM_COLUMNS).eq("id", id).single();
      
      if (error) {
        console.error("Supabase getProgramById error:", error.message);
        return { data: undefined, error: error.message, success: false };
      }
      
      return { data: data as Program | undefined, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getProgramById error:", error.message);
      return { data: undefined, error: error.message, success: false };
    }
  },

  getProgramByRouteParam: async (param: string | undefined): Promise<ApiResponse<Program | undefined>> => {
    if (!param) {
      return { data: undefined, error: null, success: true };
    }
    
    if (!USE_SUPABASE) {
      return { data: undefined, error: null, success: true };
    }
    
    try {
      if (!param) return { data: undefined, error: null, success: true };
      const t = param.trim();
      if (/^\d+$/.test(t)) {
        const n = Number(t);
        if (!Number.isFinite(n) || n < 1) return { data: undefined, error: null, success: true };
        const result = await this.getProgramById(n);
        return result;
      }
      if (UUID_ROUTE.test(t)) {
        const result = await this.getProgramByPublicId(t);
        return result;
      }
      return { data: undefined, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getProgramByRouteParam error:", error.message);
      return { data: undefined, error: error.message, success: false };
    }
  },

  // -------------------------
  // ENROLLMENTS
  // -------------------------
  enrollUser: async (userId: string, courseId: number): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("enrollments")
      .insert({ user_id: userId, course_id: courseId, enrolled_at: new Date().toISOString() })
      .select().single();
    if (error) { console.error("Supabase enrollUser error:", error.message); return { data: null, error: error.message, success: false }; }
    return { data, error: null, success: true };
  },

  /** Program-level cohort membership (no course row; `program_id` set, `course_id` null). */
  enrollUserInProgram: async (userId: string, programId: number): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: userId,
        program_id: programId,
        status: "active",
        progress: 0,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { data: null, error: null, success: true };
      }
      console.error("Supabase enrollUserInProgram error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data, error: null, success: true };
  },

  getUserEnrollments: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    
    if (!userId) {
      return { data: [], error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("user_id", userId)
        .order("last_accessed", { ascending: false });
      
      if (error) {
        console.error("Supabase getUserEnrollments error:", error.message);
        return { data: [], error: error.message, success: false };
      }
      
      return { data: data || [], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getUserEnrollments error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  dropAllEnrollmentsForUser: async (userId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: null, success: true };
    }
    
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({
          status: "dropped",
          progress: 0,
          current_lesson: null,
          completed_at: null,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Supabase dropAllEnrollmentsForUser error:", error.message);
        return { data: false, error: error.message, success: false };
      }
      
      return { data: true, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase dropAllEnrollmentsForUser error:", error.message);
      return { data: false, error: error.message, success: false };
    }
  },

  // -------------------------
  // PROGRAM MANAGER: Participants Across Programs
  // -------------------------
  // Combines:
  // - enrollments with program_id set (direct cohort / program membership)
  // - enrollments in courses listed on programs.courses (title-matched to catalog)
  getProgramParticipants: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }

    try {
      const { data: programs, error: programsErr } = await supabase
        .from("programs")
        .select("id,title,courses");

      if (programsErr) {
        console.error("Supabase getProgramParticipants programs error:", programsErr.message);
        return { data: [], error: programsErr.message, success: false };
      }

      const programsArr = programsErr ? [] : (programs ?? []);

      const programById = new Map<number, any>(programsArr.map((p: any) => [p.id as number, p]));
      const programIds = programsArr.map((p: any) => p.id).filter((id: unknown) => id != null);

      const toDate = (v: any) => {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      const merge = (
        map: Map<string, { progress: number; lastActive: Date | null }>,
        key: string,
        progress: number,
        lastActive: Date | null,
      ) => {
        const prev = map.get(key);
        if (!prev) {
          map.set(key, { progress, lastActive });
          return;
        }
        map.set(key, {
          progress: Math.max(prev.progress, progress),
          lastActive:
            prev.lastActive && lastActive
              ? prev.lastActive > lastActive
                ? prev.lastActive
                : lastActive
              : (prev.lastActive ?? lastActive),
        });
      };

      const byProgramUser = new Map<string, { progress: number; lastActive: Date | null }>();

      // A) Direct program enrollments (program_id on enrollments row)
      if (programIds.length > 0) {
        const { data: progEnrolls, error: peErr } = await supabase
          .from("enrollments")
          .select("user_id, program_id, progress, last_accessed, enrolled_at")
          .in("program_id", programIds);

        if (peErr) {
          console.error("Supabase getProgramParticipants program enrollments error:", peErr.message);
        } else {
          for (const e of progEnrolls ?? []) {
            const row = e as {
              user_id?: string;
              program_id?: number | null;
              progress?: number | null;
              last_accessed?: string | null;
              enrolled_at?: string | null;
            };
            if (!row.user_id || row.program_id == null) continue;
            const key = `${row.program_id}:${row.user_id}`;
            const progress = typeof row.progress === "number" ? row.progress : 0;
            const lastActive = toDate(row.last_accessed ?? row.enrolled_at);
            merge(byProgramUser, key, progress, lastActive);
          }
        }
      }

      // B) Course-title path (programs bundle course titles → match catalog course ids)
      const programsWithCourses = programsArr.filter(
        (p: any) => Array.isArray(p?.courses) && p.courses.length > 0,
      );
      const allCourseTitles = Array.from(
        new Set(programsWithCourses.flatMap((p: any) => (p.courses ?? []).filter(Boolean))),
      );

      let enrollArr: Array<{
        user_id: string;
        progress?: number | null;
        last_accessed?: string | null;
        enrolled_at?: string | null;
        course_id: number;
      }> = [];
      const courseIdToTitle = new Map<number, string>();

      if (allCourseTitles.length > 0) {
        const { data: coursesData, error: coursesErr } = await supabase
          .from("courses")
          .select("id,title")
          .in("title", allCourseTitles);

        if (coursesErr) {
          console.error("Supabase getProgramParticipants courses error:", coursesErr.message);
        } else {
          const coursesArr = (coursesData ?? []) as Array<{ id: number; title: string }>;
          coursesArr.forEach((c) => courseIdToTitle.set(c.id, c.title));
          const courseIds = coursesArr.map((c) => c.id);
          if (courseIds.length > 0) {
            const { data: enrollments, error: enrollmentsErr } = await supabase
              .from("enrollments")
              .select("user_id, progress, last_accessed, enrolled_at, course_id")
              .in("course_id", courseIds);

            if (enrollmentsErr) {
              console.error("Supabase getProgramParticipants course enrollments error:", enrollmentsErr.message);
            } else {
              enrollArr = (enrollments ?? []) as typeof enrollArr;
            }
          }
        }

        for (const program of programsWithCourses) {
          const programCourseTitles = new Set<string>((program.courses ?? []).filter(Boolean));

          for (const e of enrollArr) {
            const title = courseIdToTitle.get(e.course_id);
            if (!title || !programCourseTitles.has(title)) continue;
            const progress = typeof e.progress === "number" ? e.progress : 0;
            const lastActive = toDate(e.last_accessed ?? e.enrolled_at);
            const key = `${program.id as number}:${e.user_id}`;
            merge(byProgramUser, key, progress, lastActive);
          }
        }
      }

      const userIds = Array.from(
        new Set(
          [...byProgramUser.keys()].map((k) => {
            const i = k.indexOf(":");
            return i === -1 ? k : k.slice(i + 1);
          }),
        ),
      );

      const profileById = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, name, email, avatar_url")
          .in("id", userIds);

        if (profilesErr) {
          console.error("Supabase getProgramParticipants profiles error:", profilesErr.message);
        } else {
          for (const p of profiles ?? []) {
            profileById.set((p as any).id, p);
          }
        }
      }

      const participants: Array<any> = [];
      const participantUserIds = new Set<string>();
      for (const [key, agg] of byProgramUser.entries()) {
        const colon = key.indexOf(":");
        const programId = Number(key.slice(0, colon));
        const userId = key.slice(colon + 1);
        const program = programById.get(programId);
        if (!program) continue;

        const profile = profileById.get(userId);
        const name = profile?.name ?? profile?.full_name ?? "";
        const email = profile?.email ?? "";
        const programName = program.title ?? "Program";

        const status =
          agg.progress >= 100
            ? "completed"
            : agg.progress >= 30
              ? "on-track"
              : "at-risk";

        participants.push({
          id: `${userId}:${programId}`,
          user_id: userId,
          name,
          email,
          program: programName,
          program_id: programId,
          progress: agg.progress,
          status,
          lastActive: agg.lastActive
            ? agg.lastActive.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "",
        });
        participantUserIds.add(userId);
      }

      // Include all learner profiles so Participants tab is the learner directory source of truth.
      // Some existing projects have non-standard role values (or null roles), so we treat
      // non-staff roles as participants as a safe fallback.
      const { data: allProfiles, error: studentsErr } = await supabase
        .from("profiles")
        .select("id, name, email, role");
      if (studentsErr) {
        console.error("Supabase getProgramParticipants students error:", studentsErr.message);
      } else {
        const isStaffRole = (role: unknown) =>
          typeof role === "string" && ["admin", "program_manager", "instructor"].includes(role);

        for (const s of allProfiles ?? []) {
          if (isStaffRole((s as any).role)) continue;
          const userId = String((s as any).id ?? "");
          if (!userId || participantUserIds.has(userId)) continue;
          const name = (s as any).name ?? (s as any).full_name ?? "";
          const email = (s as any).email ?? "";
          participants.push({
            id: userId,
            user_id: userId,
            name,
            email,
            program: "Not assigned",
            program_id: null,
            progress: 0,
            status: "not-started",
            lastActive: "",
          });
        }
      }

      return { data: participants, error: null, success: true };
    } catch (err: any) {
      console.error("Supabase getProgramParticipants unexpected error:", err?.message ?? err);
      return { data: [], error: err?.message ?? err, success: false };
    }
  },

  // -------------------------
  // INSTRUCTOR: Students enrolled in instructor courses
  // -------------------------
  getInstructorStudents: async (instructorId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    if (!instructorId) {
      return { data: [], error: null, success: true };
    }

    try {
      // 1) instructor courses -> course ids + titles
      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", instructorId);

      if (coursesErr) {
        console.error("Supabase getInstructorStudents courses error:", coursesErr.message);
        return { data: [], error: coursesErr.message, success: false };
      }

      const coursesArr = (coursesData ?? []) as Array<{ id: number; title: string }>;
      const courseIds = coursesArr.map((c) => c.id);
      if (courseIds.length === 0) return { data: [], error: null, success: true };

      const courseIdToTitle = new Map<number, string>(coursesArr.map((c) => [c.id, c.title]));

      // 2) enrollments for those course ids
      const { data: enrollments, error: enrollmentsErr } = await supabase
        .from("enrollments")
        .select("user_id, progress, last_accessed, enrolled_at, course_id")
        .in("course_id", courseIds);

      if (enrollmentsErr) {
        console.error("Supabase getInstructorStudents enrollments error:", enrollmentsErr.message);
        return { data: [], error: enrollmentsErr.message, success: false };
      }

      const enrollArr = (enrollments ?? []) as Array<{
        user_id: string;
        progress?: number | null;
        last_accessed?: string | null;
        enrolled_at?: string | null;
        course_id: number;
      }>;

      const userIds = Array.from(new Set(enrollArr.map((e) => e.user_id).filter(Boolean)));
      if (userIds.length === 0) return { data: [], error: null, success: true };

      // 3) profiles
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", userIds);

      if (profilesErr) {
        console.error("Supabase getInstructorStudents profiles error:", profilesErr.message);
        return { data: [], error: profilesErr.message, success: false };
      }

      const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
      const toDate = (v: any) => {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      // 4) aggregate per user (pick max progress enrollment for course label)
      const byUser = new Map<
        string,
        { progress: number; lastActive: Date | null; courseTitle: string }
      >();

      for (const e of enrollArr) {
        const progress = typeof e.progress === "number" ? e.progress : 0;
        const lastActive = toDate(e.last_accessed ?? e.enrolled_at);
        const courseTitle = courseIdToTitle.get(e.course_id) ?? "Course";

        const prev = byUser.get(e.user_id);
        if (!prev) {
          byUser.set(e.user_id, { progress, lastActive, courseTitle });
        } else {
          byUser.set(e.user_id, {
            progress: Math.max(prev.progress, progress),
            lastActive: prev.lastActive && lastActive
              ? (prev.lastActive > lastActive ? prev.lastActive : lastActive)
              : (prev.lastActive ?? lastActive),
            courseTitle: progress >= prev.progress ? courseTitle : prev.courseTitle,
          });
        }
      }

      const students: Array<any> = [];
      for (const [userId, agg] of byUser.entries()) {
        const profile = profileById.get(userId);
        const name = profile?.name ?? profile?.full_name ?? "";
        const email = profile?.email ?? "";

        const status =
          agg.progress >= 100
            ? "completed"
            : agg.progress >= 30
              ? "active"
              : "at-risk";

        students.push({
          id: userId,
          name,
          email,
          course: agg.courseTitle,
          progress: agg.progress,
          status,
          lastActive: agg.lastActive
            ? agg.lastActive.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "",
        });
      }

      return { data: students, error: null, success: true };
    } catch (err: any) {
      console.error("Supabase getInstructorStudents unexpected error:", err?.message ?? err);
      return { data: [], error: err?.message ?? err, success: false };
    }
  },

  // -------------------------
  // PROFILES
  // -------------------------
  getProfiles: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase getProfiles error:", error.message);
        return { data: [], error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getProfiles error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  getProfile: async (userId: string): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Supabase getProfile error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getProfile error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  updateProfile: async (userId: string, updates: Record<string, unknown>): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select().single();
      
      if (error) {
        console.error("Supabase updateProfile error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase updateProfile error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  deleteProfile: async (userId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: null, success: true };
    }
    
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      
      if (error) {
        console.error("Supabase deleteProfile error:", error.message);
        return { data: false, error: error.message, success: false };
      }
      
      return { data: true, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase deleteProfile error:", error.message);
      return { data: false, error: error.message, success: false };
    }
  },

  // -------------------------
  // ADMIN: Change User Role
  // -------------------------
  updateUserRole: async (userId: string, role: string): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select().single();
      
      if (error) {
        console.error("Supabase updateUserRole error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase updateUserRole error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  // -------------------------
  // PROGRAM APPLICATIONS (Admin approvals)
  // -------------------------
  getPendingProgramApplications: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("program_applications")
      .select("*, profiles(name, email), programs(title)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingRelationError(error)) {
        // Optional enterprise table is not deployed in this Supabase project yet.
        return { data: [], error: null, success: true };
      }
      console.error("getPendingProgramApplications error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  approveProgramApplication: async (applicationId: string, userId: string, programId: number): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) return { data: null, error: null, success: true };
    const { error } = await supabase.from("program_applications").update({ status: "approved" }).eq("id", applicationId);
    if (error && !isMissingRelationError(error)) {
      console.error("approveProgramApplication error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    const result = await api.enrollUserInProgram(userId, programId);
    // Since enrollUserInProgram now returns ApiResponse, we need to handle it
    if (result && result.success) {
      return { data: result.data, error: null, success: true };
    } else {
      return { data: null, error: result?.error || "Failed to enroll user", success: false };
    }
  },

  rejectProgramApplication: async (applicationId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) return { data: false, error: null, success: true };
    const { error } = await supabase.from("program_applications").update({ status: "rejected" }).eq("id", applicationId);
    if (error && !isMissingRelationError(error)) {
      console.error("rejectProgramApplication error:", error.message);
      return { data: false, error: error.message, success: false };
    }
    return { data: true, error: null, success: true };
  },

  createProgramApplication: async (payload: {
    user_id: string | null;
    program_id: number;
    full_name: string;
    phone: string;
    email: string;
    status: "pending";
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) return { data: null, error: null, success: true };
    const { data, error } = await supabase
      .from("program_applications")
      .insert({
        user_id: payload.user_id,
        program_id: payload.program_id,
        full_name: payload.full_name,
        phone: payload.phone,
        email: payload.email,
        status: payload.status,
      })
      .select()
      .single();
    if (error) {
      if (isMissingRelationError(error)) {
        return { data: null, error: null, success: true };
      }
      console.error("createProgramApplication error:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return { data: null, error: error.message, success: false };
    }
    return { data: data, error: null, success: true };
  },

  // -------------------------
  // COURSE APPLICATIONS (pre-checkout intake; admins list per course)
  // -------------------------
  createCourseApplication: async (payload: {
    user_id: string;
    course_id: number;
    full_name: string;
    email: string;
    phone: string;
    goal: string;
    status: "pending";
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("course_applications")
      .insert({
        user_id: payload.user_id,
        course_id: payload.course_id,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        goal: payload.goal,
        status: payload.status,
      })
      .select()
      .single();
    if (error) {
      console.error("createCourseApplication error:", error.message);
      return null;
    }
    return data;
  },

  getCourseApplications: async (courseId: number): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("course_applications")
      .select("*, profiles(name, email)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getCourseApplications error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  // -------------------------
  // AVATAR UPLOAD (bucket `avatars`, path `<userId>/avatar.<ext>` — supabase/storage_setup.sql)
  // -------------------------
  uploadAvatar: async (userId: string, file: File): Promise<string | null> => {
    if (USE_SUPABASE) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { console.error("Avatar upload error:", uploadError.message); return null; }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl + `?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      return publicUrl;
    }
    return null;
  },

  // -------------------------
  // CERTIFICATES
  // -------------------------
  getCertificates: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });
    if (error) {
      console.error("Supabase getCertificates error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  issueCertificate: async (userId: string, courseId: number, courseTitle: string, instructor: string, duration: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("certificates")
        .insert({ user_id: userId, course_id: courseId, course_title: courseTitle, instructor, duration })
        .select().single();
      if (error) { console.error("Supabase issueCertificate error:", error.message); return null; }
      return data;
    }
    return null;
  },

  // -------------------------
  // PORTFOLIO
  // -------------------------
  getPortfolioItems: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getPortfolioItems error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  addPortfolioItem: async (userId: string, item: {
    title: string; type: string; description: string; tags: string[]; file_url?: string; link_url?: string;
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({ user_id: userId, ...item })
        .select().single();
      if (error) {
        console.error("Supabase addPortfolioItem error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase addPortfolioItem error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  deletePortfolioItem: async (itemId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: null, success: true };
    }
    const { error } = await supabase.from("portfolio_items").delete().eq("id", itemId);
    if (error) {
      console.error("Supabase deletePortfolioItem error:", error.message);
      return { data: false, error: error.message, success: false };
    }
    return { data: true, error: null, success: true };
  },

  // -------------------------
  // SYSTEM STATS (Admin / PM)
  // -------------------------
  getSystemStats: async (): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      return { data: { totalUsers: 0, activeCourses: 0, activePrograms: 0, totalRevenue: 0, totalHours: 0, completionRate: 0, totalCertificates: 0, satisfactionScore: "0.0" }, error: null, success: true };
    }
    
    try {
      const [users, courses, programs, payments, enrollments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("programs").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount"),
        supabase.from("enrollments").select("progress")
      ]);
      const totalRevenue = payments.data?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
      
      const enrolls = enrollments.data || [];
      const totalHours = Math.round(enrolls.reduce((acc, e) => acc + ((e.progress || 0) / 100 * 20), 0));
      const totalCertificates = enrolls.filter(e => e.progress === 100).length;
      const completionRate = enrolls.length > 0 
        ? Math.round((totalCertificates / enrolls.length) * 100) 
        : 0;
      
      const coursesData = courses.data || [];
      const satisfactionScore = coursesData.length > 0 
        ? (coursesData.reduce((acc, c) => acc + (c.rating || 0), 0) / coursesData.length).toFixed(1)
        : "0.0";
      
      return {
        data: {
          totalUsers: users.count || 0,
          activeCourses: courses.count || 0,
          activePrograms: programs.count || 0,
          totalRevenue,
          totalHours,
          completionRate,
          totalCertificates,
          satisfactionScore
        },
        error: null,
        success: true
      };
    } catch (error: any) {
      console.error("Supabase getSystemStats error:", error.message);
      return { 
        data: { totalUsers: 0, activeCourses: 0, activePrograms: 0, totalRevenue: 0, totalHours: 0, completionRate: 0, totalCertificates: 0, satisfactionScore: "0.0" }, 
        error: error.message, 
        success: false 
      };
    }
  },

  // -------------------------
  // PAYMENTS LEDGER (Admin)
  // -------------------------
  getPayments: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, created_at, amount, currency, status, reference, method, receipt_id, user_id, course_id, program_id, profiles(name, email), courses(title), programs(title)",
      )
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getPayments error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  // Instructor-scoped payments — only courses owned by this instructor
  getInstructorPayments: async (instructorId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE || !instructorId) return { data: [], error: null, success: true };

    // First get course IDs owned by this instructor
    const { data: courses, error: coursesErr } = await supabase
      .from("courses")
      .select("id, title")
      .eq("instructor_id", instructorId);

    if (coursesErr) {
      console.error("Supabase getInstructorPayments courses error:", coursesErr.message);
      return { data: [], error: coursesErr.message, success: false };
    }

    const courseIds = (courses ?? []).map((c: any) => c.id);
    if (courseIds.length === 0) return { data: [], error: null, success: true };

    const { data, error } = await supabase
      .from("payments")
      .select("id, created_at, amount, currency, status, reference, method, course_id, profiles(name, email), courses(title)")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getInstructorPayments error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  // -------------------------
  // SYSTEM SETTINGS (Admin)
  // -------------------------
  getSystemSettings: async (): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();
    if (error) {
      console.error("Supabase getSystemSettings error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data ?? null, error: null, success: true };
  },

  updateSystemSettings: async (updates: Record<string, unknown>): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("system_settings")
      .upsert(
        { id: "main", ...updates, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      )
      .select()
      .single();
    if (error) {
      console.error("Supabase updateSystemSettings error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data ?? null, error: null, success: true };
  },

  getInstructorStats: async (instructorId: string): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    if (!instructorId) {
      return { data: null, error: null, success: true };
    }
    const { data: courses, error: courseError } = await supabase
      .from("courses")
      .select("id, rating, revenue")
      .eq("instructor_id", instructorId);
    if (courseError) {
      return { data: null, error: courseError.message, success: false };
    }

    const courseIds = (courses ?? []).map((c: any) => c.id).filter((id: unknown) => typeof id === "number");
    let totalStudents = 0;
    if (courseIds.length > 0) {
      const { data: enrollments, error: enrollErr } = await supabase
        .from("enrollments")
        .select("course_id")
        .in("course_id", courseIds)
        .neq("status", "dropped");
      if (enrollErr) {
        console.error("Supabase getInstructorStats enrollments error:", enrollErr.message);
        return { data: null, error: enrollErr.message, success: false };
      }
      totalStudents = (enrollments ?? []).length;
    }

    const totalRevenue = courses.reduce((acc, c) => acc + (c.revenue || 0), 0);
    const avgRating = courses.length > 0
      ? courses.reduce((acc, c) => acc + (c.rating || 0), 0) / courses.length : 0;
    return { 
      data: { totalStudents, activeCourses: courses.length, avgRating: avgRating.toFixed(1), totalRevenue }, 
      error: null, 
      success: true 
    };
  },

  getInstructorCourses: async (instructorId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    if (!instructorId) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("courses")
      .select(COURSE_COLUMNS)
      .eq("instructor_id", instructorId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getInstructorCourses error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data, error: null, success: true };
  },

  // -------------------------
  // SITE CONFIG (CMS)
  // -------------------------
  getSiteConfig: async (id: string = "landing_page"): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      return { data: defaultLandingPageConfig(), error: null, success: true };
    }
    const { data, error } = await supabase.from("site_config").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.error("Supabase getSiteConfig error:", error.message);
      return { data: defaultLandingPageConfig(), error: error.message, success: false };
    }
    if (!data?.data || typeof data.data !== "object") {
      return { data: defaultLandingPageConfig(), error: null, success: true };
    }
    return { data: { ...defaultLandingPageConfig(), ...(data.data as Record<string, unknown>) }, error: null, success: true };
  },

  updateSiteConfig: async (id: string, configData: unknown): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: configData, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("site_config")
      .upsert(
        { id, data: configData, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )
      .select()
      .single();
    if (error) {
      console.error("Supabase updateSiteConfig error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data?.data, error: null, success: true };
  },

  // -------------------------
  // SKILLS ASSESSMENTS
  // -------------------------
  getSkillsAssessments: async (filters?: {
    courseId?: number;
    programId?: number;
    globalOnly?: boolean;
  }): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }

    let query = supabase.from("skills_assessments").select("*").order("created_at", { ascending: false });
    if (filters?.courseId != null) {
      query = query.eq("course_id", filters.courseId);
    } else if (filters?.programId != null) {
      query = query.eq("program_id", filters.programId);
    } else if (filters?.globalOnly) {
      query = query.is("course_id", null).is("program_id", null);
    }
    const { data: assessments, error: aErr } = await query;
    if (aErr) {
      console.error("Supabase getSkillsAssessments error:", aErr.message);
      return { data: [], error: aErr.message, success: false };
    }

    const ids = (assessments || []).map((a) => a.id);
    if (ids.length === 0) return { data: [], error: null, success: true };

    const { data: questions, error: qErr } = await supabase
      .from("skills_questions")
      .select("*")
      .in("assessment_id", ids);
    if (qErr) {
      console.error("Supabase getSkillsQuestions error:", qErr.message);
      return { data: assessments || [], error: null, success: true };
    }

    const parseOptions = (raw: unknown): string[] => {
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === "string") {
        try {
          const j = JSON.parse(raw);
          return Array.isArray(j) ? j : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const result = (assessments || []).map((a: Record<string, unknown>) => ({
      ...a,
      category: typeof a.category === "string" ? a.category : "",
      duration: typeof a.duration === "string" ? a.duration : "15 min",
      icon_name: typeof a.icon_name === "string" ? a.icon_name : "Target",
      questions: (questions || [])
        .filter((q: { assessment_id: string }) => q.assessment_id === a.id)
        .map((q: { id: string; question_text: string; options: unknown; correct_index: number }) => ({
          id: q.id,
          text: q.question_text,
          options: parseOptions(q.options),
          correct: q.correct_index,
        })),
    }));

    return { data: result, error: null, success: true };
  },

  createAssessment: async (payload: {
    title: string;
    description?: string;
    category?: string;
    duration?: string;
    icon_name?: string;
    course_id?: number | null;
    program_id?: number | null;
    questions: Array<{ text: string; options: string[]; correct_index: number }>;
  }): Promise<ApiResponse<string | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const hasCourse = payload.course_id != null;
    const hasProgram = payload.program_id != null;
    if (hasCourse && hasProgram) {
      console.error("createAssessment: cannot set both course_id and program_id");
      return { data: null, error: "cannot set both course_id and program_id", success: false };
    }
    if (!payload.questions?.length) {
      console.error("createAssessment: need at least one question");
      return { data: null, error: "need at least one question", success: false };
    }
    const row = {
      title: payload.title.trim(),
      description: (payload.description ?? "").trim(),
      category: (payload.category ?? "Assessment").trim(),
      duration: (payload.duration ?? "15 min").trim(),
      icon_name: (payload.icon_name ?? "Target").trim(),
      course_id: hasCourse ? payload.course_id! : null,
      program_id: hasProgram ? payload.program_id! : null,
      total_questions: payload.questions.length,
    };
    try {
      const { data: created, error: insErr } = await supabase
        .from("skills_assessments")
        .insert(row)
        .select()
        .single();
      if (insErr || !created) {
        console.error("Supabase createAssessment error:", insErr?.message);
        return { data: null, error: insErr?.message || "Failed to create assessment", success: false };
      }
      const qRows = payload.questions.map((q) => ({
        assessment_id: created.id,
        question_text: q.text.trim(),
        options: q.options.map((o) => String(o).trim()),
        correct_index: Math.max(0, Math.min(q.options.length - 1, q.correct_index)),
      }));
      const { error: qErr } = await supabase.from("skills_questions").insert(qRows);
      if (qErr) {
        console.error("Supabase createAssessment questions error:", qErr.message);
        await supabase.from("skills_assessments").delete().eq("id", created.id);
        return { data: null, error: qErr.message, success: false };
      }
      return { data: created.id as string, error: null, success: true };
    } catch (err: any) {
      console.error("Supabase createAssessment error:", err?.message ?? err);
      return { data: null, error: err?.message ?? err, success: false };
    }
  },

  deleteAssessment: async (assessmentId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: null, success: true };
    }
    const { error } = await supabase.from("skills_assessments").delete().eq("id", assessmentId);
    if (error) {
      console.error("Supabase deleteAssessment error:", error.message);
      return { data: false, error: error.message, success: false };
    }
    return { data: true, error: null, success: true };
  },

  getUserSkillsResults: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("skills_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getUserSkillsResults error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data || [], error: null, success: true };
  },

  saveSkillResult: async (userId: string, assessmentId: string, score: number, total: number, level: string): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    try {
      const { data, error } = await supabase
        .from("skills_results")
        .insert({ user_id: userId, assessment_id: assessmentId, score, total, level_name: level })
        .select().single();
      if (error) {
        console.error("Supabase saveSkillResult error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data: data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase saveSkillResult error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  // Get all results for a specific assessment (instructor/admin view)
  getAssessmentResults: async (assessmentId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) return { data: [], error: null, success: true };
    const { data, error } = await supabase
      .from("skills_results")
      .select("*, profiles(name, email)")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getAssessmentResults error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  // -------------------------
  // MARKETING CAMPAIGNS
  // -------------------------
  getCampaigns: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getCampaigns error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  createCampaign: async (payload: {
    userId: string;
    name: string;
    subject?: string;
    audience?: string;
    channel: "email" | "sms" | "both";
    scheduledAt?: string | null;
    body?: string;
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({
        user_id: payload.userId,
        name: payload.name,
        subject: payload.subject ?? "",
        audience: payload.audience ?? "",
        channel: payload.channel,
        scheduled_at: payload.scheduledAt ? new Date(payload.scheduledAt).toISOString() : null,
        body: payload.body ?? "",
        status: "draft",
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase createCampaign error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data, error: null, success: true };
  },

  // -------------------------
  // FORUMS
  // -------------------------
  getForumThreads: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("forum_threads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getForumThreads error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  createForumThread: async (payload: {
    userId: string;
    title: string;
    body: string;
    category?: string;
    authorName: string;
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("forum_threads")
      .insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        category: payload.category ?? "General",
        author_name: payload.authorName,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase createForumThread error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data, error: null, success: true };
  },

  // -------------------------
  // EMAIL TEMPLATES
  // -------------------------
  getEmailTemplates: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Supabase getEmailTemplates error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  createEmailTemplate: async (payload: {
    userId: string;
    name: string;
    category?: string;
    subject?: string;
    body: string;
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        user_id: payload.userId,
        name: payload.name,
        category: payload.category ?? "General",
        subject: payload.subject ?? "",
        body: payload.body,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase createEmailTemplate error:", error.message);
      return null;
    }
    return data;
  },

  updateEmailTemplate: async (payload: {
    templateId: string;
    body: string;
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("email_templates")
      .update({
        body: payload.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.templateId)
      .select()
      .single();
    if (error) {
      console.error("Supabase updateEmailTemplate error:", error.message);
      return null;
    }
    return data;
  },

  // -------------------------
  // SAVED REPORTS
  // -------------------------
  getSavedReports: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    if (!userId) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("saved_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getSavedReports error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  upsertSavedReport: async (payload: {
    userId: string;
    reportName: string;
    reportData: unknown;
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }
    const { data, error } = await supabase
      .from("saved_reports")
      .upsert(
        { user_id: payload.userId, name: payload.reportName, data: payload.reportData, updated_at: new Date().toISOString() },
        { onConflict: "user_id,name" }
      )
      .select()
      .single();
    if (error) {
      console.error("Supabase upsertSavedReport error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data, error: null, success: true };
  },

  deleteSavedReport: async (reportId: string, userId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: null, success: true };
    }
    const { error } = await supabase
      .from("saved_reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId);
    if (error) {
      console.error("Supabase deleteSavedReport error:", error.message);
      return { data: false, error: error.message, success: false };
    }
    return { data: true, error: null, success: true };
  },

  // -------------------------
  // CAREER MILESTONES
  // -------------------------
  getCareerMilestones: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }
    if (!userId) {
      return { data: [], error: null, success: true };
    }
    const { data, error } = await supabase
      .from("career_milestones")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Supabase getCareerMilestones error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  addCareerMilestone: async (payload: {
    userId: string;
    milestoneDate: string;
    title: string;
    type: "education" | "skill" | "career" | "goal";
    achieved?: boolean;
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("career_milestones")
      .insert({
        user_id: payload.userId,
        milestone_date: payload.milestoneDate,
        title: payload.title,
        type: payload.type,
        achieved: payload.achieved ?? true,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase addCareerMilestone error:", error.message);
      return null;
    }
    return data;
  },

  // -------------------------
  // RESUME BUILDER (draft JSON)
  // -------------------------
  getResumeDraft: async (userId: string) => {
    if (!USE_SUPABASE) return null;
    if (!userId) return null;
    const { data, error } = await supabase
      .from("user_resume_drafts")
      .select("draft")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("Supabase getResumeDraft error:", error.message);
      return null;
    }
    return (data?.draft ?? null) as Record<string, unknown> | null;
  },

  upsertResumeDraft: async (userId: string, draft: Record<string, unknown>) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("user_resume_drafts")
      .upsert(
        {
          user_id: userId,
          draft,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (error) {
      console.error("Supabase upsertResumeDraft error:", error.message);
      return null;
    }
    return data;
  },

  // -------------------------
  // NOTIFICATIONS (Prefs + Read/Dismiss)
  // -------------------------
  getNotificationPreferences: async (userId: string): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) return { data: null, error: null, success: true };
    if (!userId) return { data: null, error: null, success: true };
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("Supabase getNotificationPreferences error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    return { data: data ?? null, error: null, success: true };
  },

  upsertNotificationPreferences: async (payload: {
    userId: string;
    frequency?: string;
    quietStart?: string;
    quietEnd?: string;
    prefs?: Record<string, any>;
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) return { data: null, error: null, success: true };
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: payload.userId,
            frequency: payload.frequency ?? "instant",
            quiet_start: payload.quietStart ?? "22:00",
            quiet_end: payload.quietEnd ?? "07:00",
            prefs: payload.prefs ?? {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();
      if (error) {
        console.error("Supabase upsertNotificationPreferences error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data: data, error: null, success: true };
    } catch (err: any) {
      return { data: null, error: err?.message ?? String(err), success: false };
    }
  },

  getUserNotificationState: async (userId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) return { data: [], error: null, success: true };
    if (!userId) return { data: [], error: null, success: true };
    const { data, error } = await supabase
      .from("user_notification_state")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      console.error("Supabase getUserNotificationState error:", error.message);
      return { data: [], error: error.message, success: false };
    }
    return { data: data ?? [], error: null, success: true };
  },

  upsertUserNotificationState: async (payload: {
    userId: string;
    notificationKey: string;
    read?: boolean;
    dismissed?: boolean;
  }): Promise<ApiResponse<any | null>> => {
    if (!USE_SUPABASE) return { data: null, error: null, success: true };
    try {
      const { data, error } = await supabase
        .from("user_notification_state")
        .upsert(
          {
            user_id: payload.userId,
            notification_key: payload.notificationKey,
            read: payload.read ?? false,
            dismissed: payload.dismissed ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,notification_key" }
        )
        .select()
        .single();
      if (error) {
        console.error("Supabase upsertUserNotificationState error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data: data, error: null, success: true };
    } catch (err: any) {
      return { data: null, error: err?.message ?? String(err), success: false };
    }
  },

  // -------------------------
  // TWILIO SMS/WHATSAPP NOTIFICATIONS
  // -------------------------
  sendTwilioMessage: async (payload: {
    to: string;
    message: string;
    channel?: "sms" | "whatsapp";
  }): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      console.warn("Supabase not configured. Cannot send Twilio message.");
      return { data: null, error: "Supabase not configured", success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke("twilio-notify", {
        body: payload,
      });

      if (error) {
        console.error("Twilio Edge Function error:", error.message);
        return { data: null, error: error.message || "Failed to send message", success: false };
      }

      return { data: data, error: null, success: true };
    } catch (err: any) {
      console.error("sendTwilioMessage error:", err?.message ?? err);
      return { data: null, error: err?.message ?? err, success: false };
    }
  },

  // -------------------------
  // SENDGRID EMAIL
  // -------------------------
  sendEmail: async (payload: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    templateId?: string;
    templateData?: Record<string, unknown>;
    replyTo?: string;
  }): Promise<ApiResponse<{ recipients: number }>> => {
    if (!USE_SUPABASE) return { data: { recipients: 0 }, error: null, success: true };
    try {
      const { data, error } = await supabase.functions.invoke("send-email", { body: payload });
      if (error) {
        console.error("send-email Edge Function error:", error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data, error: null, success: true };
    } catch (err: any) {
      console.error("sendEmail error:", err?.message ?? err);
      return { data: null, error: err?.message ?? err, success: false };
    }
  },

  // -------------------------
  // PLACEMENT OUTCOMES
  // -------------------------
  getPlacementOutcomes: async () => {
    if (!USE_SUPABASE) return [];
    const { data, error } = await supabase
      .from("placement_outcomes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getPlacementOutcomes error:", error.message);
      return [];
    }
    return data ?? [];
  },

  createPlacementOutcome: async (payload: {
    userId: string;
    studentName: string;
    program: string;
    company?: string;
    role?: string;
    location?: string;
    startDate?: string;
    status: "placed" | "interviewing" | "searching";
    salary?: string;
    feedback?: number;
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("placement_outcomes")
      .insert({
        user_id: payload.userId,
        student_name: payload.studentName,
        program: payload.program,
        company: payload.company ?? "",
        role: payload.role ?? "",
        location: payload.location ?? "",
        start_date: payload.startDate ?? "",
        status: payload.status,
        salary: payload.salary ?? "",
        feedback: payload.feedback ?? 0,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase createPlacementOutcome error:", error.message);
      throw error;
    }
    return data;
  },

  updatePlacementOutcome: async (id: string, updates: Record<string, unknown>) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("placement_outcomes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase updatePlacementOutcome error:", error.message);
      throw error;
    }
    return data;
  },

  deletePlacementOutcome: async (id: string) => {
    if (!USE_SUPABASE) return false;
    const { error } = await supabase
      .from("placement_outcomes")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase deletePlacementOutcome error:", error.message);
      return false;
    }
    return true;
  },

  // -------------------------
  // INTERVIEW SCHEDULES
  // -------------------------
  getInterviewSchedules: async () => {
    if (!USE_SUPABASE) return [];
    const { data, error } = await supabase
      .from("interview_schedules")
      .select("*")
      .order("interview_date", { ascending: true });
    if (error) {
      console.error("Supabase getInterviewSchedules error:", error.message);
      return [];
    }
    return data ?? [];
  },

  createInterviewSchedule: async (payload: {
    createdBy: string;
    candidate: string;
    role?: string;
    interviewDate: string;
    interviewTime?: string;
    type?: "video" | "in-person" | "phone";
    interviewer?: string;
    notes?: string;
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("interview_schedules")
      .insert({
        created_by: payload.createdBy,
        candidate: payload.candidate,
        role: payload.role ?? "",
        interview_date: payload.interviewDate,
        interview_time: payload.interviewTime ?? "09:00",
        type: payload.type ?? "video",
        interviewer: payload.interviewer ?? "",
        notes: payload.notes ?? "",
        status: "pending",
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase createInterviewSchedule error:", error.message);
      throw error;
    }
    return data;
  },

  updateInterviewSchedule: async (id: string, updates: Record<string, unknown>) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("interview_schedules")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase updateInterviewSchedule error:", error.message);
      throw error;
    }
    return data;
  },

  deleteInterviewSchedule: async (id: string) => {
    if (!USE_SUPABASE) return false;
    const { error } = await supabase
      .from("interview_schedules")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase deleteInterviewSchedule error:", error.message);
      return false;
    }
    return true;
  },

  // -------------------------
  // LEAD CAPTURES
  // -------------------------
  getLeadCaptures: async () => {
    if (!USE_SUPABASE) return [];
    const { data, error } = await supabase
      .from("lead_captures")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getLeadCaptures error:", error.message);
      return [];
    }
    return data ?? [];
  },

  createLeadCapture: async (payload: {
    email: string;
    name?: string;
    source?: string;
    programInterest?: string;
    notes?: string;
  }) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("lead_captures")
      .insert({
        email: payload.email,
        name: payload.name ?? "",
        source: payload.source ?? "website",
        program_interest: payload.programInterest ?? "",
        notes: payload.notes ?? "",
        status: "new",
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase createLeadCapture error:", error.message);
      throw error;
    }
    return data;
  },

  updateLeadCapture: async (id: string, updates: Record<string, unknown>) => {
    if (!USE_SUPABASE) return null;
    const { data, error } = await supabase
      .from("lead_captures")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase updateLeadCapture error:", error.message);
      throw error;
    }
    return data;
  },

  deleteLeadCapture: async (id: string) => {
    if (!USE_SUPABASE) return false;
    const { error } = await supabase
      .from("lead_captures")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase deleteLeadCapture error:", error.message);
      return false;
    }
    return true;
  },

  // -------------------------
  // MASQUERADE (Act As User)
  // -------------------------
  startMasquerade: async (adminUserId: string, targetUserId: string, reason?: string): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: "Supabase not configured", success: false };
    }

    try {
      // Create masquerade session record
      const { data: sessionData, error: sessionError } = await supabase
        .from("masquerade_sessions")
        .insert({
          admin_user_id: adminUserId,
          target_user_id: targetUserId,
          reason: reason || "Admin debugging",
          is_active: true,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Supabase startMasquerade error:", sessionError.message);
        return { data: null, error: sessionError.message, success: false };
      }

      // Get target user profile
      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("id", targetUserId)
        .single();

      if (profileError) {
        console.error("Supabase startMasquerade profile error:", profileError.message);
        return { data: null, error: profileError.message, success: false };
      }

      return {
        data: {
          session: sessionData,
          targetUser: targetProfile,
        },
        error: null,
        success: true,
      };
    } catch (error: any) {
      console.error("Supabase startMasquerade error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  endMasquerade: async (sessionId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: "Supabase not configured", success: false };
    }

    try {
      const { error } = await supabase
        .from("masquerade_sessions")
        .update({
          ended_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Supabase endMasquerade error:", error.message);
        return { data: false, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase endMasquerade error:", error.message);
      return { data: false, error: error.message, success: false };
    }
  },

  // -------------------------
  // SYSTEM HEALTH MONITORING
  // -------------------------
  getSystemHealth: async (): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      return {
        data: {
          database: "unknown",
          storage: "unknown",
          email: "unknown",
        },
        error: null,
        success: true,
      };
    }

    try {
      const health: any = {
        database: "healthy",
        storage: "healthy",
        email: "healthy",
        timestamp: new Date().toISOString(),
      };

      // Test database connection
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
      const dbTime = Date.now() - dbStart;

      if (dbError) {
        health.database = "down";
        health.databaseError = dbError.message;
      } else if (dbTime > 1000) {
        health.database = "degraded";
      }
      health.databaseResponseTime = dbTime;

      // Test storage (check if bucket exists)
      const storageStart = Date.now();
      const { error: storageError } = await supabase.storage.from("avatars").list("", { limit: 1 });
      const storageTime = Date.now() - storageStart;

      if (storageError) {
        health.storage = "degraded";
        health.storageError = storageError.message;
      } else if (storageTime > 2000) {
        health.storage = "degraded";
      }
      health.storageResponseTime = storageTime;

      // Log health check
      await supabase.from("system_health_logs").insert([
        {
          service: "database",
          status: health.database,
          response_time_ms: dbTime,
          error_message: health.databaseError || null,
        },
        {
          service: "storage",
          status: health.storage,
          response_time_ms: storageTime,
          error_message: health.storageError || null,
        },
      ]);

      return { data: health, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getSystemHealth error:", error.message);
      return {
        data: {
          database: "down",
          storage: "down",
          email: "unknown",
          error: error.message,
        },
        error: error.message,
        success: false,
      };
    }
  },

  getSystemHealthHistory: async (hours: number = 24): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }

    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("system_health_logs")
        .select("*")
        .gte("checked_at", since)
        .order("checked_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Supabase getSystemHealthHistory error:", error.message);
        return { data: [], error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getSystemHealthHistory error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  // -------------------------
  // USER GROUPS / COHORTS
  // -------------------------
  getUserGroups: async (): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: [], success: true };
    }

    try {
      const { data, error } = await supabase
        .from("user_groups")
        .select("*, user_group_members(count)")
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase getUserGroups error:", error.message);
        return { data: [], error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getUserGroups error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },

  createUserGroup: async (groupData: {
    name: string;
    description?: string;
    group_type?: string;
  }): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }

    try {
      const { data, error } = await supabase
        .from("user_groups")
        .insert(groupData)
        .select()
        .single();

      if (error) {
        console.error("Supabase createUserGroup error:", error.message);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase createUserGroup error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  addUserToGroup: async (groupId: string, userId: string): Promise<ApiResponse<any>> => {
    if (!USE_SUPABASE) {
      return { data: null, error: null, success: true };
    }

    try {
      const { data, error } = await supabase
        .from("user_group_members")
        .insert({
          group_id: groupId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase addUserToGroup error:", error.message);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase addUserToGroup error:", error.message);
      return { data: null, error: error.message, success: false };
    }
  },

  removeUserFromGroup: async (groupId: string, userId: string): Promise<ApiResponse<boolean>> => {
    if (!USE_SUPABASE) {
      return { data: false, error: null, success: true };
    }

    try {
      const { error } = await supabase
        .from("user_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) {
        console.error("Supabase removeUserFromGroup error:", error.message);
        return { data: false, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error: any) {
      console.error("Supabase removeUserFromGroup error:", error.message);
      return { data: false, error: error.message, success: false };
    }
  },

  getGroupMembers: async (groupId: string): Promise<ApiResponse<any[]>> => {
    if (!USE_SUPABASE) {
      return { data: [], error: null, success: true };
    }

    try {
      const { data, error } = await supabase
        .from("user_group_members")
        .select("*, profiles(id, name, email, role, avatar_url)")
        .eq("group_id", groupId);

      if (error) {
        console.error("Supabase getGroupMembers error:", error.message);
        return { data: [], error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error: any) {
      console.error("Supabase getGroupMembers error:", error.message);
      return { data: [], error: error.message, success: false };
    }
  },
};
