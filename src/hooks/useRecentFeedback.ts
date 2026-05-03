import { useQuery } from '@tanstack/react-query';
import { getRecentFeedback } from '@/services/studentDashboard';

/**
 * Hook to fetch recent feedback for a student
 * Shows graded assignments from the last 4 weeks
 */
export function useRecentFeedback(userId: string | undefined, weeks: number = 4) {
  return useQuery({
    queryKey: ['recentFeedback', userId, weeks],
    queryFn: () => {
      if (!userId) return [];
      return getRecentFeedback(userId, weeks);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
