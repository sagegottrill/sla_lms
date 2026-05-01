import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { api } from "@/services/api";
import { isCourseOrProgramRouteParam } from "@/lib/publicRoutes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================================================
// ENTERPRISE HOOKS LAYER (Pillar 1)
// Maps raw API calls to robust, cached TanStack hooks
// ============================================================================

// --- COURSES ---
/** @param options.publishedOnly — true = storefront/catalog (only published). false = staff dashboards & CMS (drafts + published). */
export const useCourses = (options?: { publishedOnly?: boolean }) => {
  const { appUser } = useAuth();
  const publishedOnly = options?.publishedOnly ?? false;
  return useQuery({
    queryKey: [...queryKeys.courses.all(appUser?.role), { publishedOnly }] as const,
    queryFn: () => api.getCourses({ publishedOnly }),
    select: (data) => data.success ? data.data : [],
  });
};

/**
 * @param routeOrNumericId — URL `:id` segment (public UUID or legacy number), or a positive number from dashboard builders.
 */
export const useCourse = (routeOrNumericId: string | number | undefined) => {
  const { appUser } = useAuth();
  const enabled =
    routeOrNumericId !== undefined &&
    routeOrNumericId !== null &&
    routeOrNumericId !== "" &&
    (typeof routeOrNumericId === "number"
      ? routeOrNumericId > 0
      : isCourseOrProgramRouteParam(routeOrNumericId));
  const key = routeOrNumericId ?? "";
  return useQuery({
    queryKey: queryKeys.courses.detail(appUser?.role, key),
    queryFn: () =>
      typeof routeOrNumericId === "number"
        ? api.getCourseById(routeOrNumericId)
        : api.getCourseByRouteParam(routeOrNumericId),
    select: (data) => data.success ? data.data : undefined,
    enabled,
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
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
    }
  });
};

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) =>
      api.updateCourse(id, {
        ...updates,
        instructor_id: appUser?.id ?? (updates as any).instructor_id,
      }),
    onSuccess: () => {
      toast.success("Course updated");
    },
    onError: () => {
      toast.error("We couldn't update your course. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.base });
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
    }
  });
};

// --- PROGRAMS ---
/** @param options.activeCatalog — true = landing / programs catalog (hide completed cohorts). false = admin builder lists all. */
export const usePrograms = (options?: { activeCatalog?: boolean }) => {
  const { appUser } = useAuth();
  const activeCatalog = options?.activeCatalog ?? false;
  return useQuery({
    queryKey: [...queryKeys.programs.all(appUser?.role), { activeCatalog }] as const,
    queryFn: () => api.getPrograms({ activeCatalog }),
    select: (data) => data.success ? data.data : [],
  });
};

/**
 * @param routeOrNumericId — URL segment (UUID or legacy number), or positive id from dashboard.
 */
export const useProgram = (routeOrNumericId: string | number | undefined) => {
  const { appUser } = useAuth();
  const enabled =
    routeOrNumericId !== undefined &&
    routeOrNumericId !== null &&
    routeOrNumericId !== "" &&
    (typeof routeOrNumericId === "number"
      ? routeOrNumericId > 0
      : isCourseOrProgramRouteParam(routeOrNumericId));
  const key = routeOrNumericId ?? "";
  return useQuery({
    queryKey: queryKeys.programs.detail(appUser?.role, key),
    queryFn: () =>
      typeof routeOrNumericId === "number"
        ? api.getProgramById(routeOrNumericId)
        : api.getProgramByRouteParam(routeOrNumericId),
    select: (data) => data.success ? data.data : undefined,
    enabled,
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
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
    }
  });
};

export const useUpdateProgramMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) =>
      api.updateProgram(id, updates),
    onSuccess: () => {
      toast.success("Program updated");
    },
    onError: () => {
      toast.error("We couldn't save this program. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.base });
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
    }
  });
};

// --- ENROLLMENTS ---
export const useUserEnrollments = (userId: string | undefined) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.enrollments.user(appUser?.role, userId || ''),
    queryFn: () => api.getUserEnrollments(userId!),
    select: (data) => data.success ? data.data : [],
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
      toast.error("We couldn't enroll that learner. Please try again."),
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
    select: (data) => data.success ? data.data : [],
    enabled: !!instructorId,
  });
};

export const useMyPrograms = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.myPrograms.user(appUser?.id ?? ""),
    queryFn: () => api.getUserPrograms(appUser!.id),
    select: (data) => data.success ? data.data : [],
    enabled: !!appUser?.id,
  });
};

// --- PROFILES ---
export const useProfiles = () => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.profiles.all(appUser?.role),
    queryFn: api.getProfiles,
    select: (data) => data.success ? data.data : [],
  });
};

export const useProfile = (userId: string | undefined) => {
  const { appUser } = useAuth();
  return useQuery({
    queryKey: queryKeys.profiles.detail(appUser?.role, userId || ''),
    queryFn: () => api.getProfile(userId!),
    select: (data) => data.success ? data.data : null,
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

// ============================================================================
// CAMPAIGNS — React Query hooks (replaces useEffect anti-pattern)
// ============================================================================
export const useCampaigns = () => {
  return useQuery({
    queryKey: ['campaigns', 'all'],
    queryFn: api.getCampaigns,
  });
};

export const useCreateCampaignMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.createCampaign>[0]) =>
      api.createCampaign(payload),
    onSuccess: () => toast.success("Campaign created!"),
    onError: () => toast.error("Failed to create campaign. Check Supabase connection/RLS."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};

// ============================================================================
// EMAIL TEMPLATES — React Query hooks (replaces useEffect anti-pattern)
// ============================================================================
export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ['email-templates', 'all'],
    queryFn: api.getEmailTemplates,
  });
};

export const useCreateEmailTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.createEmailTemplate>[0]) =>
      api.createEmailTemplate(payload),
    onSuccess: () => toast.success("Template created"),
    onError: () => toast.error("Failed to create template. Check Supabase connection/RLS."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });
};

export const useUpdateEmailTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.updateEmailTemplate>[0]) =>
      api.updateEmailTemplate(payload),
    onSuccess: () => toast.success("Template saved"),
    onError: () => toast.error("Failed to save template. Check Supabase connection/RLS."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
  });
};

// ============================================================================
// FORUMS — React Query hooks (replaces useEffect anti-pattern)
// ============================================================================
export const useForumThreads = () => {
  return useQuery({
    queryKey: ['forum-threads', 'all'],
    queryFn: api.getForumThreads,
  });
};

export const useCreateForumThreadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.createForumThread>[0]) =>
      api.createForumThread(payload),
    onSuccess: () => toast.success("Thread posted!"),
    onError: () => toast.error("Failed to post thread. Check Supabase connection/RLS."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['forum-threads'] }),
  });
};

// ============================================================================
// PLACEMENT OUTCOMES — React Query hooks
// ============================================================================
export const usePlacementOutcomes = () => {
  return useQuery({
    queryKey: ['placement-outcomes', 'all'],
    queryFn: api.getPlacementOutcomes,
  });
};

export const useCreatePlacementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.createPlacementOutcome>[0]) =>
      api.createPlacementOutcome(payload),
    onSuccess: () => toast.success("Placement outcome logged!"),
    onError: () => toast.error("Failed to save placement. Check Supabase connection/RLS."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['placement-outcomes'] }),
  });
};

export const useUpdatePlacementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      api.updatePlacementOutcome(id, updates),
    onSuccess: () => toast.success("Placement updated"),
    onError: () => toast.error("Failed to update placement."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['placement-outcomes'] }),
  });
};

export const useDeletePlacementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePlacementOutcome(id),
    onSuccess: () => toast.success("Placement removed"),
    onError: () => toast.error("Failed to delete placement."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['placement-outcomes'] }),
  });
};

// ============================================================================
// INTERVIEW SCHEDULES — React Query hooks
// ============================================================================
export const useInterviewSchedules = () => {
  return useQuery({
    queryKey: ['interview-schedules', 'all'],
    queryFn: api.getInterviewSchedules,
  });
};

export const useCreateInterviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.createInterviewSchedule>[0]) =>
      api.createInterviewSchedule(payload),
    onSuccess: () => toast.success("Interview scheduled!"),
    onError: () => toast.error("Failed to schedule interview. Check Supabase connection/RLS."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['interview-schedules'] }),
  });
};

export const useUpdateInterviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      api.updateInterviewSchedule(id, updates),
    onSuccess: () => toast.success("Interview updated"),
    onError: () => toast.error("Failed to update interview."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['interview-schedules'] }),
  });
};

export const useDeleteInterviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInterviewSchedule(id),
    onSuccess: () => toast.success("Interview removed"),
    onError: () => toast.error("Failed to delete interview."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['interview-schedules'] }),
  });
};

// ============================================================================
// LEAD CAPTURES — React Query hooks
// ============================================================================
export const useLeadCaptures = () => {
  return useQuery({
    queryKey: ['lead-captures', 'all'],
    queryFn: api.getLeadCaptures,
  });
};

export const useUpdateLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      api.updateLeadCapture(id, updates),
    onSuccess: () => toast.success("Lead updated"),
    onError: () => toast.error("Failed to update lead."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['lead-captures'] }),
  });
};

export const useDeleteLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteLeadCapture(id),
    onSuccess: () => toast.success("Lead removed"),
    onError: () => toast.error("Failed to delete lead."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['lead-captures'] }),
  });
};
