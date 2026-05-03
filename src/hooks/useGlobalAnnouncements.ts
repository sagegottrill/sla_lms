import { useQuery } from '@tanstack/react-query';
import { getActiveAnnouncementsForUser } from '@/services/studentDashboard';

/**
 * Hook to fetch active global announcements for a user
 * Excludes announcements the user has dismissed
 */
export function useGlobalAnnouncements(userId: string | undefined) {
  return useQuery({
    queryKey: ['globalAnnouncements', userId],
    queryFn: () => {
      if (!userId) return [];
      return getActiveAnnouncementsForUser(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: true,
  });
}
