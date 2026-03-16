import { supabase } from "@/lib/supabase";
import type { Course, Program, Job } from "@/data/mockData";

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
        .eq("user_id", userId);
      if (error) { console.error("Supabase getUserEnrollments error:", error.message); return []; }
      return data || [];
    }
    return [];
  },

  // -------------------------
  // PROFILES
  // -------------------------
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
      if (error) { console.error("Supabase updateProfile error:", error.message); return null; }
      return data;
    }
    return null;
  },
};
