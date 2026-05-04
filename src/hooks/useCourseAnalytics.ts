import { useQuery } from '@tanstack/react-query';
import { getInstructorCourseAnalytics, CourseAnalytics } from '@/services/instructorDashboard';

export function useCourseAnalytics(instructorId: string | undefined) {
  return useQuery<CourseAnalytics[]>({
    queryKey: ['courseAnalytics', instructorId],
    queryFn: () => {
      if (!instructorId) return [];
      return getInstructorCourseAnalytics(instructorId);
    },
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}
