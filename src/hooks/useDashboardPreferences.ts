import { useQuery } from '@tanstack/react-query';
import { getDashboardPreferences, DashboardPreferences } from '@/services/studentDashboard';

export function useDashboardPreferences(userId: string | undefined) {
  return useQuery<DashboardPreferences | null>({
    queryKey: ['dashboardPreferences', userId],
    queryFn: () => {
      if (!userId) return null;
      return getDashboardPreferences(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
