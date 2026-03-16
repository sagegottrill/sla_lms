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
    all: ['courses'] as const,
    list: (filters: Record<string, any>) => ['courses', 'list', filters] as const,
    detail: (id: number) => ['courses', 'detail', id] as const,
  },
  
  // Programs
  programs: {
    all: ['programs'] as const,
    detail: (id: number) => ['programs', 'detail', id] as const,
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
  },

  // Enrollments
  enrollments: {
    all: ['enrollments'] as const,
    user: (userId: string) => ['enrollments', 'user', userId] as const,
  },

  // Users/Profiles
  profiles: {
    detail: (userId: string) => ['profiles', 'detail', userId] as const,
  }
};
