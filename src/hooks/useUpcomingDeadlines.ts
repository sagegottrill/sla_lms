import { useQuery } from '@tanstack/react-query';
import { getInstructorUpcomingDeadlines, UpcomingDeadline } from '@/services/instructorDashboard';

export function useUpcomingDeadlines(instructorId: string | undefined, days: number = 14) {
  return useQuery<UpcomingDeadline[]>({
    queryKey: ['upcomingDeadlines', instructorId, days],
    queryFn: () => {
      if (!instructorId) return [];
      return getInstructorUpcomingDeadlines(instructorId, days);
    },
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}
