import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// ENTERPRISE STATE MANAGEMENT: QUERY CLIENT CONFIGURATION
// Pillar 1: Strict Separation of Server and Client State
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data like courses and programs doesn't change every second.
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
    detail: (role: string = 'public', routeKey: string | number) =>
      ['courses', role, 'detail', { key: routeKey }] as const,
  },
  
  // Programs
  programs: {
    base: ['programs'] as const,
    all: (role: string = 'public') => ['programs', role, 'all'] as const,
    detail: (role: string = 'public', routeKey: string | number) =>
      ['programs', role, 'detail', { key: routeKey }] as const,
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
  },

  // Dashboard lists
  participants: {
    base: ['participants'] as const,
    all: () => ['participants', 'all'] as const,
  },
  students: {
    base: ['students'] as const,
    instructor: (instructorId: string) => ['students', 'instructor', { instructorId }] as const,
  },

  myPrograms: {
    base: ['myPrograms'] as const,
    user: (userId: string) => ['myPrograms', 'user', { userId }] as const,
  },

  // Placement Outcomes
  placementOutcomes: {
    base: ['placementOutcomes'] as const,
    all: () => ['placementOutcomes', 'all'] as const,
  },

  // Interview Schedules
  interviewSchedules: {
    base: ['interviewSchedules'] as const,
    all: () => ['interviewSchedules', 'all'] as const,
  },

  // Lead Captures
  leadCaptures: {
    base: ['leadCaptures'] as const,
    all: () => ['leadCaptures', 'all'] as const,
  },

  // System Settings
  systemSettings: {
    base: ['systemSettings'] as const,
    main: () => ['systemSettings', 'main'] as const,
  },

  // Audit Logs
  auditLogs: {
    base: ['auditLogs'] as const,
    all: () => ['auditLogs', 'all'] as const,
  },

  // Program Applications
  programApplications: {
    base: ['programApplications'] as const,
    all: () => ['programApplications', 'all'] as const,
    pending: () => ['programApplications', 'pending'] as const,
  },

  // Course Applications
  courseApplications: {
    base: ['courseApplications'] as const,
    all: (courseId: number) => ['courseApplications', courseId] as const,
  },

  // Saved Reports
  savedReports: {
    base: ['savedReports'] as const,
    all: (userId: string) => ['savedReports', userId] as const,
  },

  // Reports
  reports: {
    base: ['reports'] as const,
    all: () => ['reports', 'all'] as const,
  },

  // Skills Assessments
  skillsAssessments: {
    base: ['skillsAssessments'] as const,
    all: () => ['skillsAssessments', 'all'] as const,
  },

  // Skills Questions
  skillsQuestions: {
    base: ['skillsQuestions'] as const,
    all: () => ['skillsQuestions', 'all'] as const,
  },

  // Skills Results
  skillsResults: {
    base: ['skillsResults'] as const,
    all: (userId: string) => ['skillsResults', userId] as const,
  },

  // Campaigns
  campaigns: {
    base: ['campaigns'] as const,
    all: () => ['campaigns', 'all'] as const,
  },

  // Forum Threads
  forumThreads: {
    base: ['forumThreads'] as const,
    all: () => ['forumThreads', 'all'] as const,
  },

  // Email Templates
  emailTemplates: {
    base: ['emailTemplates'] as const,
    all: () => ['emailTemplates', 'all'] as const,
  },

  // Notification Preferences
  notificationPreferences: {
    base: ['notificationPreferences'] as const,
    all: () => ['notificationPreferences', 'all'] as const,
  },

  // User Notification State
  userNotificationState: {
    base: ['userNotificationState'] as const,
    all: (userId: string) => ['userNotificationState', userId] as const,
  },

  // Career Milestones
  careerMilestones: {
    base: ['careerMilestones'] as const,
    all: (userId: string) => ['careerMilestones', userId] as const,
  },

  // User Resume Drafts
  userResumeDrafts: {
    base: ['userResumeDrafts'] as const,
    all: (userId: string) => ['userResumeDrafts', userId] as const,
  },

  // Site Config
  siteConfig: {
    base: ['siteConfig'] as const,
    all: (id: string) => ['siteConfig', id] as const,
  },
};
