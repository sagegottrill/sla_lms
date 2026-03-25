import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================================================
// ENTERPRISE HOOKS LAYER (Pillar 1)
// Maps raw API calls to robust, cached TanStack hooks
// ============================================================================

// --- COURSES ---
export const useCourses = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.courses.all(appUser?.role),
    queryFn: api.getCourses,
  });
};

export const useCourse = (id: number) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.courses.detail(appUser?.role, id),
    queryFn: () => api.getCourseById(id),
    enabled: !!id, // Only fetch if ID exists
  });
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: (course: Record<string, unknown>) =>
      api.createCourse({
        ...course,
        instructor_id: appUser?.id ?? course.instructor_id,
      }),
    onSuccess: () => {
      toast.success("Course created");
    },
    onError: () => {
      toast.error("We couldn't create your course. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.base });
    }
  });
};

// --- PROGRAMS ---
export const usePrograms = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.programs.all(appUser?.role),
    queryFn: api.getPrograms,
  });
};

export const useProgram = (id: number) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.programs.detail(appUser?.role, id),
    queryFn: () => api.getProgramById(id),
    enabled: !!id,
  });
};

export const useCreateProgramMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: (program: any) => api.createProgram(program),
    onSuccess: () => {
      toast.success("Program created");
    },
    onError: () => {
      toast.error("We couldn't create your program. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.base });
    }
  });
};

// --- JOBS ---
export const useJobs = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.jobs.all(appUser?.role),
    queryFn: api.getJobs,
  });
};

export const useCreateJobMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: (job: any) => api.createJob(job),
    onMutate: async (job) => {
      const queryKey = queryKeys.jobs.all(appUser?.role);
      await queryClient.cancelQueries({ queryKey });
      const previousJobs = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => [{ id: 'temp-'+Date.now(), ...job }, ...(old || [])]);
      return { previousJobs, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previousJobs);
      toast.error("We couldn't post that job. Your changes weren't saved.");
    },
    onSuccess: () => {
      toast.success("Job posted");
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
};

export const useUpdateJobMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number, updates: any }) => api.updateJob(id, updates),
    onMutate: async ({ id, updates }) => {
      const queryKey = queryKeys.jobs.all(appUser?.role);
      await queryClient.cancelQueries({ queryKey });
      const previousJobs = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.map((j: any) => j.id === id ? { ...j, ...updates } : j);
      });
      return { previousJobs, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previousJobs);
      toast.error("We couldn't update that job. Please try again.");
    },
    onSuccess: () => {
      toast.success("Job updated");
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
};

export const useDeleteJobMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: (id: number) => api.deleteJob(id),
    onMutate: async (id) => {
      const queryKey = queryKeys.jobs.all(appUser?.role);
      await queryClient.cancelQueries({ queryKey });
      const previousJobs = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.filter((j: any) => j.id !== id);
      });
      return { previousJobs, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previousJobs);
      toast.error("We couldn't delete that job. Your changes were reverted.");
    },
    onSuccess: () => {
      toast.success("Job deleted");
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
};

// --- ENROLLMENTS ---
export const useUserEnrollments = (userId: string | undefined) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.enrollments.user(appUser?.role, userId || ''),
    queryFn: () => api.getUserEnrollments(userId!),
    enabled: !!userId,
  });
};

export const useEnrollUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string, courseId: number }) => 
      api.enrollUser(userId, courseId),
    
    // PILLAR 2: Optimistic UI 4-Step Sequence
    onMutate: async ({ userId, courseId }) => {
      // NOTE: Here we fallback to 'student' assuming enrollment happens mostly there
      // A more robust app context might pass role in the variables payload
      const queryKey = queryKeys.enrollments.user('student', userId);
      
      // 1. Intercept & Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot prior state for fallback
      const previousEnrollments = queryClient.getQueryData(queryKey);

      // 3. Inject optimistic state (Inject placeholder until DB resolves)
      queryClient.setQueryData(queryKey, (old: any) => [
        ...(old || []),
        { id: 'temp-' + Date.now(), user_id: userId, course_id: courseId, status: 'active', enrolled_at: new Date().toISOString() }
      ]);

      // 4. Return context for rollback
      return { previousEnrollments, queryKey };
    },

    // Revert on error (Pillar 2 Directive)
    onError: (err, variables, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousEnrollments);
      }
      toast.error("We couldn't enroll that learner. Please try again.");
    },
    onSuccess: () => {
      toast.success("Enrollment updated");
    },

    onSettled: (data, error, variables, context) => {
      // Final Sync Pass (Pillar 2 Directive)
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    }
  });
};

// --- DASHBOARD LISTS (Participants/Students) ---
export const useProgramParticipants = () => {
  return useQuery({
    queryKey: queryKeys.participants.all(),
    queryFn: api.getProgramParticipants,
  });
};

export const useInstructorStudents = (instructorId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.students.instructor(instructorId ?? ""),
    queryFn: () => api.getInstructorStudents(instructorId!),
    enabled: !!instructorId,
  });
};

export const useMyPrograms = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.myPrograms.user(appUser?.id ?? ""),
    queryFn: () => api.getUserPrograms(appUser!.id),
    enabled: !!appUser?.id,
  });
};

// --- PROFILES ---
export const useProfiles = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.profiles.all(appUser?.role),
    queryFn: api.getProfiles,
  });
};

export const useProfile = (userId: string | undefined) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.profiles.detail(appUser?.role, userId || ''),
    queryFn: () => api.getProfile(userId!),
    enabled: !!userId,
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string, updates: Record<string, unknown> }) => 
      api.updateProfile(userId, updates),
    onMutate: async ({ userId, updates }) => {
      const queryKey = queryKeys.profiles.all(appUser?.role);
      await queryClient.cancelQueries({ queryKey });
      const previousProfiles = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.map((p: any) => p.id === userId ? { ...p, ...updates } : p);
      });
      return { previousProfiles, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousProfiles);
      }
      toast.error("We couldn't save your profile changes.");
    },
    onSuccess: () => {
      toast.success("Profile updated");
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: (userId: string) => api.deleteProfile(userId),
    onMutate: async (userId) => {
      const queryKey = queryKeys.profiles.all(appUser?.role);
      await queryClient.cancelQueries({ queryKey });
      const previousProfiles = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.filter((p: any) => p.id !== userId);
      });
      return { previousProfiles, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey) queryClient.setQueryData(context.queryKey, context.previousProfiles);
      toast.error("We couldn't delete that user. Your changes were reverted.");
    },
    onSuccess: () => {
      toast.success("User removed");
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
};

// --- STATS ---
export const useSystemStats = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.stats.system(appUser?.role),
    queryFn: api.getSystemStats,
  });
};

export const useInstructorStats = (instructorId: string | undefined) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.stats.instructor(appUser?.role, instructorId || ''),
    queryFn: () => api.getInstructorStats(instructorId!),
    enabled: !!instructorId,
  });
};

export const useInstructorCourses = (instructorId: string | undefined) => {
  const { appUser } = useAuth();
  return useQuery({
    // Using courses.list for an instructor's specific authored courses
    queryKey: queryKeys.courses.list(appUser?.role, { instructorId }),
    queryFn: () => api.getInstructorCourses(instructorId!),
    enabled: !!instructorId,
  });
};

// --- SITE CONFIG ---
export const useSiteConfig = (id: string = 'landing_page') => {
  return useQuery({
    queryKey: ['site-config', id],
    queryFn: async () => {
      const data = await api.getSiteConfig(id);
      if (data) {
        localStorage.setItem(`site_config_${id}`, JSON.stringify(data));
      }
      return data;
    },
    // "Speed Efficiency": Load from local cache immediately if available
    initialData: () => {
      const cached = localStorage.getItem(`site_config_${id}`);
      return cached ? JSON.parse(cached) : undefined;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes of "speed" before hard-rechecking
  });
};

export const useUpdateSiteConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      api.updateSiteConfig(id, data),
    
    onMutate: async ({ id, data }) => {
      const queryKey = ['site-config', id];
      await queryClient.cancelQueries({ queryKey });
      const previousConfig = queryClient.getQueryData(queryKey);
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, data);
      
      return { previousConfig, queryKey };
    },

    onError: (err, variables, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousConfig);
      }
      toast.error("We couldn't update settings. Please try again.");
    },
    onSuccess: () => {
      toast.success("Settings updated");
    },

    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    }
  });
};
