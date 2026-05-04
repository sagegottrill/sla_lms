import { useQuery } from '@tanstack/react-query';
import { getInstructorActivityFeed, ActivityFeedItem } from '@/services/instructorDashboard';

export function useActivityFeed(instructorId: string | undefined, hours: number = 48) {
  return useQuery<ActivityFeedItem[]>({
    queryKey: ['activityFeed', instructorId, hours],
    queryFn: () => {
      if (!instructorId) return [];
      return getInstructorActivityFeed(instructorId, hours);
    },
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}
