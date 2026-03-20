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

  createCourse: async (courseData: Partial<Course>) => {
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
};
