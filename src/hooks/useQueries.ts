import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { api } from "@/services/api";

// ============================================================================
// ENTERPRISE HOOKS LAYER (Pillar 1)
// Maps raw API calls to robust, cached TanStack hooks
// ============================================================================

// --- COURSES ---
export const useCourses = () => {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: api.getCourses,
  });
};

export const useCourse = (id: number) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => api.getCourseById(id),
    enabled: !!id, // Only fetch if ID exists
  });
};

// --- PROGRAMS ---
export const usePrograms = () => {
  return useQuery({
    queryKey: queryKeys.programs.all,
    queryFn: api.getPrograms,
  });
};

export const useProgram = (id: number) => {
  return useQuery({
    queryKey: queryKeys.programs.detail(id),
    queryFn: () => api.getProgramById(id),
    enabled: !!id,
  });
};

// --- JOBS ---
export const useJobs = () => {
  return useQuery({
    queryKey: queryKeys.jobs.all,
    queryFn: api.getJobs,
  });
};

// --- ENROLLMENTS ---
export const useUserEnrollments = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.enrollments.user(userId || ''),
    queryFn: () => api.getUserEnrollments(userId!),
    enabled: !!userId,
  });
};

export const useEnrollUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string, courseId: number }) => 
      api.enrollUser(userId, courseId),
    onSuccess: (data, variables) => {
      // Invalidate enrollments so dashboard reflects the new course
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.user(variables.userId) });
    }
  });
};

// --- PROFILES ---
export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId || ''),
    queryFn: () => api.getProfile(userId!),
    enabled: !!userId,
  });
};
