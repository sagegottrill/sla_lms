import { supabase } from "@/lib/supabase";
import type { Course, Program, Job } from "@/types";

// Feature flag: if real Supabase URL is configured, use live data
const USE_SUPABASE = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes("placeholder")
);

export const api = {
  // -------------------------
  // COURSES
  // -------------------------
  getCourses: async (): Promise<Course[]> => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("courses").select("*").order("id");
      if (error) { console.error("Supabase getCourses error:", error.message); return []; }
      return (data ?? []) as Course[];
    }
    return [];
  },

  createCourse: async (courseData: Partial<Course> & Record<string, unknown>) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("courses").insert(courseData).select().single();
      if (error) { console.error("Supabase createCourse error:", error.message); throw error; }
      return data;
    }
    return null;
  },

  getCourseById: async (id: number): Promise<Course | undefined> => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
      if (error) { console.error("Supabase getCourseById error:", error.message); return undefined; }
      return data as Course;
    }
    return undefined;
  },

  // -------------------------
  // PROGRAMS
  // -------------------------
  getPrograms: async (): Promise<Program[]> => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("programs").select("*").order("id");
      if (error) { console.error("Supabase getPrograms error:", error.message); return []; }
      return (data ?? []) as Program[];
    }
    return [];
  },

  // -------------------------
  // USER PROGRAMS
  // -------------------------
  // Derives a "program dashboard card" per user by:
  // - reading program.courses (stored as course titles)
  // - mapping those titles to course ids
  // - pulling enrollments for the user across those course ids
  getUserPrograms: async (userId: string) => {
    if (!USE_SUPABASE) return [];
    if (!userId) return [];

    try {
      const { data: programs, error: programsErr } = await supabase
        .from("programs")
        .select("*");

      if (programsErr) {
        console.error("Supabase getUserPrograms programs error:", programsErr.message);
        return [];
      }

      const programsArr = (programs ?? []).filter(
        (p: any) => Array.isArray(p?.courses) && p.courses.length > 0,
      );
      if (programsArr.length === 0) return [];

      const allCourseTitles = Array.from(
        new Set(programsArr.flatMap((p: any) => (p.courses ?? []).filter(Boolean))),
      );
      if (allCourseTitles.length === 0) return [];

      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("id,title")
        .in("title", allCourseTitles);

      if (coursesErr) {
        console.error("Supabase getUserPrograms courses error:", coursesErr.message);
        return [];
      }

      const coursesArr = (coursesData ?? []) as Array<{ id: number; title: string }>;
      const courseTitleToId = new Map<string, number>(coursesArr.map((c) => [c.title, c.id]));
      const courseIds = coursesArr.map((c) => c.id);
      if (courseIds.length === 0) return [];

      const { data: enrollments, error: enrollmentsErr } = await supabase
        .from("enrollments")
        .select("course_id, progress")
        .eq("user_id", userId)
        .in("course_id", courseIds);

      if (enrollmentsErr) {
        console.error("Supabase getUserPrograms enrollments error:", enrollmentsErr.message);
        return [];
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

      return mapped as Array<any>;
    } catch (err: any) {
      console.error("Supabase getUserPrograms unexpected error:", err?.message ?? err);
      return [];
    }
  },

  createProgram: async (programData: Partial<Program>) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("programs").insert(programData).select().single();
      if (error) { console.error("Supabase createProgram error:", error.message); throw error; }
      return data;
    }
    return null;
  },

  getProgramById: async (id: number): Promise<Program | undefined> => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("programs").select("*").eq("id", id).single();
      if (error) { console.error("Supabase getProgramById error:", error.message); return undefined; }
      return data as Program;
    }
    return undefined;
  },

  // -------------------------
  // JOBS
  // -------------------------
  getJobs: async (): Promise<Job[]> => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("jobs").select("*").order("id");
      if (error) { console.error("Supabase getJobs error:", error.message); return []; }
      return (data ?? []) as Job[];
    }
    return [];
  },

  createJob: async (jobData: Partial<Job>) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("jobs").insert(jobData).select().single();
      if (error) { console.error("Supabase createJob error:", error.message); throw error; }
      return data;
    }
    return null;
  },

  updateJob: async (id: number, updates: Partial<Job>) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select().single();
      if (error) { console.error("Supabase updateJob error:", error.message); throw error; }
      return data;
    }
    return null;
  },

  deleteJob: async (id: number) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) { console.error("Supabase deleteJob error:", error.message); throw error; }
    }
  },

  // -------------------------
  // ENROLLMENTS
  // -------------------------
  enrollUser: async (userId: string, courseId: number) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({ user_id: userId, course_id: courseId, enrolled_at: new Date().toISOString() })
        .select().single();
      if (error) { console.error("Supabase enrollUser error:", error.message); return null; }
      return data;
    }
    return null;
  },

  getUserEnrollments: async (userId: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("user_id", userId)
        .order("last_accessed", { ascending: false });
      if (error) { console.error("Supabase getUserEnrollments error:", error.message); return []; }
      return data || [];
    }
    return [];
  },

  // Admin: drop learner enrollments from active programs/courses.
  dropAllEnrollmentsForUser: async (userId: string) => {
    if (USE_SUPABASE) {
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
        throw error;
      }
      return true;
    }
    return false;
  },

  // -------------------------
  // PROGRAM MANAGER: Participants Across Programs
  // -------------------------
  // Derives a "participant per user per program" view by:
  // - reading programs.courses (stored as course titles by ProgramBuilderPage)
  // - mapping those titles to course ids
  // - pulling enrollments for those course ids
  // - aggregating progress per user within each program
  getProgramParticipants: async () => {
    if (!USE_SUPABASE) return [];

    try {
      const { data: programs, error: programsErr } = await supabase
        .from("programs")
        .select("id,title,courses");

      if (programsErr) {
        console.error("Supabase getProgramParticipants programs error:", programsErr.message);
        return [];
      }

      const programsArr = (programs ?? []).filter(
        (p: any) => Array.isArray(p?.courses) && p.courses.length > 0,
      );
      if (programsArr.length === 0) return [];

      const allCourseTitles = Array.from(
        new Set(programsArr.flatMap((p: any) => (p.courses ?? []).filter(Boolean))),
      );
      if (allCourseTitles.length === 0) return [];

      // Step 1: titles -> course ids
      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("id,title")
        .in("title", allCourseTitles);

      if (coursesErr) {
        console.error("Supabase getProgramParticipants courses error:", coursesErr.message);
        return [];
      }

      const coursesArr = (coursesData ?? []) as Array<{ id: number; title: string }>;
      const courseIdToTitle = new Map<number, string>(
        coursesArr.map((c) => [c.id, c.title]),
      );
      const courseIds = coursesArr.map((c) => c.id);
      if (courseIds.length === 0) return [];

      // Step 2: enrollments for those course ids
      const { data: enrollments, error: enrollmentsErr } = await supabase
        .from("enrollments")
        .select("user_id, progress, last_accessed, enrolled_at, course_id")
        .in("course_id", courseIds);

      if (enrollmentsErr) {
        console.error("Supabase getProgramParticipants enrollments error:", enrollmentsErr.message);
        return [];
      }

      const enrollArr = (enrollments ?? []) as Array<{
        user_id: string;
        progress?: number | null;
        last_accessed?: string | null;
        enrolled_at?: string | null;
        course_id: number;
      }>;

      const userIds = Array.from(new Set(enrollArr.map((e) => e.user_id).filter(Boolean)));
      if (userIds.length === 0) return [];

      // Step 3: profiles (for names/emails)
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, name, full_name, email, avatar_url")
        .in("id", userIds);

      if (profilesErr) {
        console.error("Supabase getProgramParticipants profiles error:", profilesErr.message);
        return [];
      }

      const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));
      const toDate = (v: any) => {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      // Step 4: aggregate per program + user
      const participants: Array<any> = [];
      for (const program of programsArr) {
        const programName = program.title ?? program.cohort ?? program.name ?? "Program";
        const programCourseTitles = new Set<string>((program.courses ?? []).filter(Boolean));

        const byUser = new Map<
          string,
          { progress: number; lastActive: Date | null }
        >();

        for (const e of enrollArr) {
          const title = courseIdToTitle.get(e.course_id);
          if (!title || !programCourseTitles.has(title)) continue;

          const progress = typeof e.progress === "number" ? e.progress : 0;
          const lastActive = toDate(e.last_accessed ?? e.enrolled_at);

          const prev = byUser.get(e.user_id);
          if (!prev) {
            byUser.set(e.user_id, { progress, lastActive });
          } else {
            byUser.set(e.user_id, {
              progress: Math.max(prev.progress, progress),
              lastActive: prev.lastActive && lastActive ? (prev.lastActive > lastActive ? prev.lastActive : lastActive) : (prev.lastActive ?? lastActive),
            });
          }
        }

        for (const [userId, agg] of byUser.entries()) {
          const profile = profileById.get(userId);
          const name = profile?.name ?? profile?.full_name ?? "";
          const email = profile?.email ?? "";

          const status =
            agg.progress >= 100
              ? "completed"
              : agg.progress >= 30
                ? "on-track"
                : "at-risk";

          participants.push({
            id: userId,
            name,
            email,
            program: programName,
            progress: agg.progress,
            status,
            lastActive: agg.lastActive
              ? agg.lastActive.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "",
          });
        }
      }

      return participants;
    } catch (err: any) {
      console.error("Supabase getProgramParticipants unexpected error:", err?.message ?? err);
      return [];
    }
  },

  // -------------------------
  // INSTRUCTOR: Students enrolled in instructor courses
  // -------------------------
  getInstructorStudents: async (instructorId: string) => {
    if (!USE_SUPABASE) return [];
    if (!instructorId) return [];

    try {
      // 1) instructor courses -> course ids + titles
      const { data: coursesData, error: coursesErr } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", instructorId);

      if (coursesErr) {
        console.error("Supabase getInstructorStudents courses error:", coursesErr.message);
        return [];
      }

      const coursesArr = (coursesData ?? []) as Array<{ id: number; title: string }>;
      const courseIds = coursesArr.map((c) => c.id);
      if (courseIds.length === 0) return [];

      const courseIdToTitle = new Map<number, string>(coursesArr.map((c) => [c.id, c.title]));

      // 2) enrollments for those course ids
      const { data: enrollments, error: enrollmentsErr } = await supabase
        .from("enrollments")
        .select("user_id, progress, last_accessed, enrolled_at, course_id")
        .in("course_id", courseIds);

      if (enrollmentsErr) {
        console.error("Supabase getInstructorStudents enrollments error:", enrollmentsErr.message);
        return [];
      }

      const enrollArr = (enrollments ?? []) as Array<{
        user_id: string;
        progress?: number | null;
        last_accessed?: string | null;
        enrolled_at?: string | null;
        course_id: number;
      }>;

      const userIds = Array.from(new Set(enrollArr.map((e) => e.user_id).filter(Boolean)));
      if (userIds.length === 0) return [];

      // 3) profiles
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, name, full_name, email, avatar_url")
        .in("id", userIds);

      if (profilesErr) {
        console.error("Supabase getInstructorStudents profiles error:", profilesErr.message);
        return [];
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
            lastActive: prev.lastActive && lastActive ? (prev.lastActive > lastActive ? prev.lastActive : lastActive) : (prev.lastActive ?? lastActive),
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

      return students;
    } catch (err: any) {
      console.error("Supabase getInstructorStudents unexpected error:", err?.message ?? err);
      return [];
    }
  },

  // -------------------------
  // PROFILES
  // -------------------------
  getProfiles: async () => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { console.error("Supabase getProfiles error:", error.message); return []; }
      return data;
    }
    return [];
  },

  getProfile: async (userId: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) { console.error("Supabase getProfile error:", error.message); return null; }
      return data;
    }
    return null;
  },

  updateProfile: async (userId: string, updates: Record<string, unknown>) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select().single();
      if (error) { console.error("Supabase updateProfile error:", error.message); throw error; }
      return data;
    }
    return null;
  },

  deleteProfile: async (userId: string) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) { console.error("Supabase deleteProfile error:", error.message); throw error; }
    }
  },

  // -------------------------
  // ADMIN: Change User Role
  // -------------------------
  updateUserRole: async (userId: string, role: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select().single();
      if (error) { console.error("Supabase updateUserRole error:", error.message); return null; }
      return data;
    }
    return null;
  },

  // -------------------------
  // AVATAR UPLOAD
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
  getCertificates: async (userId: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });
      if (error) { console.error("Supabase getCertificates error:", error.message); return []; }
      return data || [];
    }
    return [];
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
  getPortfolioItems: async (userId: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) { console.error("Supabase getPortfolioItems error:", error.message); return []; }
      return data || [];
    }
    return [];
  },

  addPortfolioItem: async (userId: string, item: {
    title: string; type: string; description: string; tags: string[]; file_url?: string; link_url?: string;
  }) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({ user_id: userId, ...item })
        .select().single();
      if (error) { console.error("Supabase addPortfolioItem error:", error.message); return null; }
      return data;
    }
    return null;
  },

  deletePortfolioItem: async (itemId: string) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", itemId);
      if (error) { console.error("Supabase deletePortfolioItem error:", error.message); }
    }
  },

  // -------------------------
  // SYSTEM STATS (Admin / PM)
  // -------------------------
  getSystemStats: async () => {
    if (USE_SUPABASE) {
      const [users, courses, programs, payments, enrollments] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("programs").select("*", { count: "exact", head: true }),
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
        totalUsers: users.count || 0,
        activeCourses: courses.count || 0,
        activePrograms: programs.count || 0,
        totalRevenue,
        totalHours,
        completionRate,
        totalCertificates,
        satisfactionScore
      };
    }
    return { totalUsers: 0, activeCourses: 0, activePrograms: 0, totalRevenue: 0, totalHours: 0, completionRate: 0, totalCertificates: 0, satisfactionScore: "0.0" };
  },

  getInstructorStats: async (instructorId: string) => {
    if (USE_SUPABASE) {
      const { data: courses, error: courseError } = await supabase
        .from("courses")
        .select("id, students, rating, revenue")
        .eq("instructor_id", instructorId);
      if (courseError) return null;
      const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0);
      const totalRevenue = courses.reduce((acc, c) => acc + (c.revenue || 0), 0);
      const avgRating = courses.length > 0
        ? courses.reduce((acc, c) => acc + (c.rating || 0), 0) / courses.length : 0;
      return { totalStudents, activeCourses: courses.length, avgRating: avgRating.toFixed(1), totalRevenue };
    }
    return null;
  },

  getInstructorCourses: async (instructorId: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("courses").select("*").eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data;
    }
    return [];
  },

  // -------------------------
  // SITE CONFIG (CMS)
  // -------------------------
  getSiteConfig: async (id: string = "landing_page") => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from("site_config").select("*").eq("id", id).single();
      if (error) { console.error("Supabase getSiteConfig error:", error.message); return null; }
      return data.data;
    }
    return null;
  },

  updateSiteConfig: async (id: string, configData: unknown) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("site_config")
        .update({ data: configData, updated_at: new Date().toISOString() })
        .eq("id", id).select().single();
      if (error) { console.error("Supabase updateSiteConfig error:", error.message); throw error; }
      return data.data;
    }
    return configData;
  },

  // -------------------------
  // SKILLS ASSESSMENTS
  // -------------------------
  getSkillsAssessments: async () => {
    if (USE_SUPABASE) {
      const { data: assessments, error: aErr } = await supabase.from("skills_assessments").select("*");
      if (aErr) { console.error("Supabase getSkillsAssessments error:", aErr.message); return []; }
      
      const { data: questions, error: qErr } = await supabase.from("skills_questions").select("*");
      if (qErr) { console.error("Supabase getSkillsQuestions error:", qErr.message); return assessments || []; }

      // Map questions into assessments
      return (assessments || []).map(a => ({
        ...a,
        questions: (questions || []).filter(q => q.assessment_id === a.id).map(q => ({
          id: q.id,
          text: q.question_text,
          options: q.options,
          correct: q.correct_index
        }))
      }));
    }
    return [];
  },

  getUserSkillsResults: async (userId: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("skills_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) { console.error("Supabase getUserSkillsResults error:", error.message); return []; }
      return data || [];
    }
    return [];
  },

  saveSkillResult: async (userId: string, assessmentId: string, score: number, total: number, level: string) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from("skills_results")
        .insert({ user_id: userId, assessment_id: assessmentId, score, total, level_name: level })
        .select().single();
      if (error) { console.error("Supabase saveSkillResult error:", error.message); return null; }
      return data;
    }
    return null;
  },

  // -------------------------
  // MARKETING CAMPAIGNS
  // -------------------------
  getCampaigns: async () => {
    if (!USE_SUPABASE) return [];
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getCampaigns error:", error.message);
      return [];
    }
    return data ?? [];
  },

  createCampaign: async (payload: {
    userId: string;
    name: string;
    subject?: string;
    audience?: string;
    channel: "email" | "sms" | "both";
    scheduledAt?: string | null;
    body?: string;
  }) => {
    if (!USE_SUPABASE) return null;
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
      return null;
    }
    return data;
  },

  // -------------------------
  // FORUMS
  // -------------------------
  getForumThreads: async () => {
    if (!USE_SUPABASE) return [];
    const { data, error } = await supabase
      .from("forum_threads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getForumThreads error:", error.message);
      return [];
    }
    return data ?? [];
  },

  createForumThread: async (payload: {
    userId: string;
    title: string;
    body: string;
    category?: string;
    authorName: string;
  }) => {
    if (!USE_SUPABASE) return null;
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
      return null;
    }
    return data;
  },

  // -------------------------
  // EMAIL TEMPLATES
  // -------------------------
  getEmailTemplates: async () => {
    if (!USE_SUPABASE) return [];
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Supabase getEmailTemplates error:", error.message);
      return [];
    }
    return data ?? [];
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
  getSavedReports: async (userId: string) => {
    if (!USE_SUPABASE) return [];
    if (!userId) return [];
    const { data, error } = await supabase
      .from("saved_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase getSavedReports error:", error.message);
      return [];
    }
    return data ?? [];
  },

  upsertSavedReport: async (payload: {
    userId: string;
    reportId?: string;
    name: string;
    metric: string;
    dimension: string;
    chartType: string;
    dateRange: string;
  }) => {
    if (!USE_SUPABASE) return null;
    const row: Record<string, unknown> = {
      user_id: payload.userId,
      name: payload.name,
      metric: payload.metric,
      dimension: payload.dimension,
      chart_type: payload.chartType,
      date_range: payload.dateRange,
      updated_at: new Date().toISOString(),
    };

    // Only include `id` when editing an existing report.
    if (payload.reportId) row.id = payload.reportId;

    const query = payload.reportId
      ? supabase.from("saved_reports").upsert(row, { onConflict: "id" }).select().single()
      : supabase.from("saved_reports").insert(row).select().single();

    const { data, error } = await query;
    if (error) {
      console.error("Supabase upsertSavedReport error:", error.message);
      return null;
    }
    return data;
  },

  deleteSavedReport: async (reportId: string, userId: string) => {
    if (!USE_SUPABASE) return false;
    const { error } = await supabase
      .from("saved_reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", userId);
    if (error) {
      console.error("Supabase deleteSavedReport error:", error.message);
      return false;
    }
    return true;
  },

  // -------------------------
  // CAREER MILESTONES
  // -------------------------
  getCareerMilestones: async (userId: string) => {
    if (!USE_SUPABASE) return [];
    if (!userId) return [];
    const { data, error } = await supabase
      .from("career_milestones")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Supabase getCareerMilestones error:", error.message);
      return [];
    }
    return data ?? [];
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
  getNotificationPreferences: async (userId: string) => {
    if (!USE_SUPABASE) return null;
    if (!userId) return null;
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      // If no row exists, treat as null (new user)
      return null;
    }
    return data;
  },

  upsertNotificationPreferences: async (payload: {
    userId: string;
    frequency?: string;
    quietStart?: string;
    quietEnd?: string;
    prefs?: Record<string, any>;
  }) => {
    if (!USE_SUPABASE) return null;
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
      return null;
    }
    return data;
  },

  getUserNotificationState: async (userId: string) => {
    if (!USE_SUPABASE) return [];
    if (!userId) return [];
    const { data, error } = await supabase
      .from("user_notification_state")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      console.error("Supabase getUserNotificationState error:", error.message);
      return [];
    }
    return data ?? [];
  },

  upsertUserNotificationState: async (payload: {
    userId: string;
    notificationKey: string;
    read?: boolean;
    dismissed?: boolean;
  }) => {
    if (!USE_SUPABASE) return null;
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
      return null;
    }
    return data;
  },
};
