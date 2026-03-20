import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// ENTERPRISE STATE MANAGEMENT: QUERY CLIENT CONFIGURATION
// Pillar 1: Strict Separation of Server and Client State
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data like courses and jobs doesn't change every second.
      // 5 minutes stale time prevents excessive refething on tab focus
      // while guaranteeing users see relatively fresh data.
      staleTime: 1000 * 60 * 5, 
      
      // Keep inactive queries in memory for 30 minutes before garbage collection
      gcTime: 1000 * 60 * 30,
      
      // Enterprise dashboard standard: Refetch on window focus to ensure
      // data consistency if they left the tab open overnight.
      refetchOnWindowFocus: true,

      // Prevent infinite retry loops on catastrophic backend failure (e.g. 500 block)
      retry: 2,
    },
    mutations: {
      // Global mutation error handling can go here if needed,
      // but usually handled per-mutation for optimistic UI rollback
      retry: 0, 
    }
  },
});

// ============================================================================
// QUERY KEY FACTORY
// Enforces strict, typo-free cache invalidation across the application
// ============================================================================
export const queryKeys = {
  // Courses
  courses: {
    base: ['courses'] as const,
    all: (role: string = 'public') => ['courses', role, 'all'] as const,
    list: (role: string = 'public', filters: Record<string, any>) => ['courses', role, 'list', filters] as const,
    detail: (role: string = 'public', id: number) => ['courses', role, 'detail', { id }] as const,
  },
  
  // Programs
  programs: {
    base: ['programs'] as const,
    all: (role: string = 'public') => ['programs', role, 'all'] as const,
    detail: (role: string = 'public', id: number) => ['programs', role, 'detail', { id }] as const,
  },

  // Jobs
  jobs: {
    base: ['jobs'] as const,
    all: (role: string = 'public') => ['jobs', role, 'all'] as const,
  },

  // Enrollments
  enrollments: {
    base: ['enrollments'] as const,
    all: (role: string = 'admin') => ['enrollments', role, 'all'] as const,
    user: (role: string = 'public', userId: string) => ['enrollments', role, 'list', { userId }] as const,
  },

  // Users/Profiles
  profiles: {
    base: ['profiles'] as const,
    all: (role: string = 'admin') => ['profiles', role, 'all'] as const,
    detail: (role: string = 'public', userId: string) => ['profiles', role, 'detail', { userId }] as const,
  },

  // System/Analytics Stats
  stats: {
    base: ['stats'] as const,
    system: (role: string = 'admin') => ['stats', role, 'analytics'] as const,
    instructor: (role: string = 'instructor', instructorId: string) => ['stats', role, 'metrics', { instructorId }] as const,
  }
};
