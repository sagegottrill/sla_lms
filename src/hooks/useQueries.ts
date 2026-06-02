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
     mutationFn: async (course: Record<string, unknown>) => {
       const response = await api.createCourse({
         ...course,
         instructor_id: appUser?.id ?? course.instructor_id,
       });
       if (!response.success || !response.data) {
         throw new Error(response.error || "Failed to create course");
       }
       return response.data;
     },
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
     mutationFn: async ({ id, updates }: { id: number; updates: Record<string, unknown> }) => {
       const response = await api.updateCourse(id, {
         ...updates,
         instructor_id: appUser?.id ?? (updates as any).instructor_id,
       });
       if (!response.success || !response.data) {
         throw new Error(response.error || "Failed to update course");
       }
       return response.data;
     },
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
     mutationFn: async (program: any) => {
       const response = await api.createProgram(program);
       if (!response.success || !response.data) {
         throw new Error(response.error || "Failed to create program");
       }
       return response.data;
     },
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
     mutationFn: async ({ id, updates }: { id: number; updates: Record<string, unknown> }) => {
       const response = await api.updateProgram(id, updates);
       if (!response.success || !response.data) {
         throw new Error(response.error || "Failed to update program");
       }
       return response.data;
     },
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

type EnrollMutationMeta = { silentToast?: boolean };

 export const useEnrollUserMutation = () => {
   const queryClient = useQueryClient();
   const { appUser } = useAuth();

   return useMutation({
     mutationFn: async ({ userId, courseId }: { userId: string, courseId: number }) => {
       const response = await api.enrollUser(userId, courseId);
       if (!response.success) {
         throw new Error(response.error || "We couldn't enroll you. Please try again.");
       }
       return response.data;
     },
     
     // PILLAR 2: Optimistic UI 4-Step Sequence
     onMutate: async ({ userId, courseId }) => {
      const role = appUser?.role ?? "student";
      const queryKey = queryKeys.enrollments.user(role, userId);
      
      // 1. Intercept & Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });
 
      // 2. Snapshot prior state for fallback
      const previousEnrollments = queryClient.getQueryData(queryKey);
 
      // 3. Inject optimistic state (cache holds ApiResponse from queryFn, not the select() array)
      const placeholder = {
        id: 'temp-' + Date.now(),
        user_id: userId,
        course_id: courseId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      };
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (old && typeof old === 'object' && 'data' in old && Array.isArray((old as { data: unknown }).data)) {
          const prev = old as { data: unknown[]; success?: boolean; error?: string | null };
          return { ...prev, data: [...prev.data, placeholder], success: true, error: null };
        }
        if (Array.isArray(old)) {
          return [...old, placeholder];
        }
        return { data: [placeholder], error: null, success: true };
      });
 
      // 4. Return context for rollback
      return { previousEnrollments, queryKey, role };
    },

    // Revert on error (Pillar 2 Directive)
    onError: (err, variables, context, mutation) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousEnrollments);
      }
      const meta = mutation.meta as EnrollMutationMeta | undefined;
      if (meta?.silentToast) return;
      const message = err instanceof Error ? err.message : "We couldn't enroll you. Please try again.";
      toast.error(message);
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const meta = mutation.meta as EnrollMutationMeta | undefined;
      if (meta?.silentToast) return;
      toast.success("Enrollment updated");
    },

    onSettled: (_data, _error, variables, context) => {
      const role = context?.role ?? appUser?.role ?? "student";
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.user(role, variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
    }
  });
};

// --- DASHBOARD LISTS (Participants/Students) ---
export const useProgramParticipants = () => {
  return useQuery({
    queryKey: queryKeys.participants.all(),
    queryFn: api.getProgramParticipants,
    select: (data) => data.success ? data.data : [],
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
     mutationFn: async ({ userId, updates }: { userId: string, updates: Record<string, unknown> }) => {
       const response = await api.updateProfile(userId, updates);
       if (!response.success) {
         throw new Error(response.error || "Failed to update profile");
       }
       return response.data;
     },
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
     mutationFn: async (userId: string) => {
       const response = await api.deleteProfile(userId);
       if (!response.success) {
         throw new Error(response.error || "Failed to delete profile");
       }
       return response.data;
     },
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
     select: (response) => response.data,
   });
 };

 export const useInstructorStats = (instructorId: string | undefined) => {
   const { appUser } = useAuth();
   return useQuery({
     queryKey: queryKeys.stats.instructor(appUser?.role, instructorId || ''),
     queryFn: () => api.getInstructorStats(instructorId!),
     enabled: !!instructorId,
     select: (response) => response.data,
   });
 };

 export const useInstructorCourses = (instructorId: string | undefined) => {
   const { appUser } = useAuth();
   return useQuery({
     // Using courses.list for an instructor's specific authored courses
     queryKey: queryKeys.courses.list(appUser?.role, { instructorId }),
     queryFn: () => api.getInstructorCourses(instructorId!),
     enabled: !!instructorId,
     select: (response) => response.data || [],
   });
 };

 // --- SITE CONFIG ---
 export const useSiteConfig = (id: string = 'landing_page') => {
   return useQuery({
     queryKey: ['site-config', id],
     queryFn: async () => {
       const response = await api.getSiteConfig(id);
       if (response.success && response.data) {
         localStorage.setItem(`site_config_${id}`, JSON.stringify(response.data));
         return response.data;
       }
       return null;
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
     mutationFn: async ({ id, data }: { id: string, data: any }) => {
       const response = await api.updateSiteConfig(id, data);
       if (!response.success) {
         throw new Error(response.error || "Failed to update site config");
       }
       return response.data;
     },
     
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

// --- PLATFORM CONFIG (Admin) ---
export const usePlatformConfig = (id: string, opts?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["platform-config", id],
    queryFn: async () => {
      const response = await api.getPlatformConfig(id);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || "Failed to load platform config");
    },
    enabled: opts?.enabled ?? true,
    staleTime: 1000 * 10,
  });
};

export const useUpdatePlatformConfigMutation = () => {
  const queryClient = useQueryClient();
  const { appUser } = useAuth();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.updatePlatformConfig(id, data, appUser?.id);
      if (!response.success) throw new Error(response.error || "Failed to update platform config");
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["platform-config", variables.id] });
    },
  });
};

 // CAMPAIGNS — React Query hooks (replaces useEffect anti-pattern)
 export const useCampaigns = () => {
   return useQuery({
     queryKey: ['campaigns', 'all'],
     queryFn: api.getCampaigns,
     select: (response) => response.data || [],
   });
 };

 export const useCreateCampaignMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (payload: Parameters<typeof api.createCampaign>[0]) => {
       const response = await api.createCampaign(payload);
       if (!response.success) {
         throw new Error(response.error || "Failed to create campaign");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Campaign created!"),
     onError: () => toast.error("Failed to create campaign. Check Supabase connection/RLS."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
   });
 };

 // EMAIL TEMPLATES — React Query hooks (replaces useEffect anti-pattern)
 export const useEmailTemplates = () => {
   return useQuery({
     queryKey: ['email-templates', 'all'],
     queryFn: api.getEmailTemplates,
     select: (response) => response.data || [],
   });
 };

 export const useCreateEmailTemplateMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (payload: Parameters<typeof api.createEmailTemplate>[0]) => {
       const response = await api.createEmailTemplate(payload);
       if (!response.success) {
         throw new Error(response.error || "Failed to create template");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Template created"),
     onError: () => toast.error("Failed to create template. Check Supabase connection/RLS."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
   });
 };

 export const useUpdateEmailTemplateMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (payload: Parameters<typeof api.updateEmailTemplate>[0]) => {
       const response = await api.updateEmailTemplate(payload);
       if (!response.success) {
         throw new Error(response.error || "Failed to update template");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Template saved"),
     onError: () => toast.error("Failed to save template. Check Supabase connection/RLS."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
   });
 };

 // FORUMS — React Query hooks (replaces useEffect anti-pattern)
 export const useForumThreads = () => {
   return useQuery({
     queryKey: ['forum-threads', 'all'],
     queryFn: api.getForumThreads,
     select: (response) => response.data || [],
   });
 };

 export const useCreateForumThreadMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (payload: Parameters<typeof api.createForumThread>[0]) => {
       const response = await api.createForumThread(payload);
       if (!response.success) {
         throw new Error(response.error || "Failed to post thread");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Thread posted!"),
     onError: () => toast.error("Failed to post thread. Check Supabase connection/RLS."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['forum-threads'] }),
   });
 };

 // PLACEMENT OUTCOMES — React Query hooks
 export const usePlacementOutcomes = () => {
   return useQuery({
     queryKey: ['placement-outcomes', 'all'],
     queryFn: api.getPlacementOutcomes,
     select: (response) => response.data || [],
   });
 };

 export const useCreatePlacementMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (payload: Parameters<typeof api.createPlacementOutcome>[0]) => {
       const response = await api.createPlacementOutcome(payload);
       if (!response.success) {
         throw new Error(response.error || "Failed to save placement");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Placement outcome logged!"),
     onError: () => toast.error("Failed to save placement. Check Supabase connection/RLS."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['placement-outcomes'] }),
   });
 };

 export const useUpdatePlacementMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
       const response = await api.updatePlacementOutcome(id, updates);
       if (!response.success) {
         throw new Error(response.error || "Failed to update placement");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Placement updated"),
     onError: () => toast.error("Failed to update placement."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['placement-outcomes'] }),
   });
 };

 export const useDeletePlacementMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => {
       const response = await api.deletePlacementOutcome(id);
       if (!response.success) {
         throw new Error(response.error || "Failed to delete placement");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Placement removed"),
     onError: () => toast.error("Failed to delete placement."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['placement-outcomes'] }),
   });
 };

 // INTERVIEW SCHEDULES — React Query hooks
 export const useInterviewSchedules = () => {
   return useQuery({
     queryKey: ['interview-schedules', 'all'],
     queryFn: api.getInterviewSchedules,
     select: (response) => response.data || [],
   });
 };

 export const useCreateInterviewMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (payload: Parameters<typeof api.createInterviewSchedule>[0]) => {
       const response = await api.createInterviewSchedule(payload);
       if (!response.success) {
         throw new Error(response.error || "Failed to schedule interview");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Interview scheduled!"),
     onError: () => toast.error("Failed to schedule interview. Check Supabase connection/RLS."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['interview-schedules'] }),
   });
 };

 export const useUpdateInterviewMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
       const response = await api.updateInterviewSchedule(id, updates);
       if (!response.success) {
         throw new Error(response.error || "Failed to update interview");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Interview updated"),
     onError: () => toast.error("Failed to update interview."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['interview-schedules'] }),
   });
 };

 export const useDeleteInterviewMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => {
       const response = await api.deleteInterviewSchedule(id);
       if (!response.success) {
         throw new Error(response.error || "Failed to delete interview");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Interview removed"),
     onError: () => toast.error("Failed to delete interview."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['interview-schedules'] }),
   });
 };

 // LEAD CAPTURES — React Query hooks
 export const useLeadCaptures = () => {
   return useQuery({
     queryKey: ['lead-captures', 'all'],
     queryFn: api.getLeadCaptures,
     select: (response) => response.data || [],
   });
 };

 export const useUpdateLeadMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
       const response = await api.updateLeadCapture(id, updates);
       if (!response.success) {
         throw new Error(response.error || "Failed to update lead");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Lead updated"),
     onError: () => toast.error("Failed to update lead."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['lead-captures'] }),
   });
 };

 export const useDeleteLeadMutation = () => {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => {
       const response = await api.deleteLeadCapture(id);
       if (!response.success) {
         throw new Error(response.error || "Failed to delete lead");
       }
       return response.data;
     },
     onSuccess: () => toast.success("Lead removed"),
     onError: () => toast.error("Failed to delete lead."),
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['lead-captures'] }),
   });
 };
