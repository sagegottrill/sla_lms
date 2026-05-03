import { useQuery } from '@tanstack/react-query';
import { getCalendarEvents } from '@/services/studentDashboard';

/**
 * Hook to fetch calendar events for a specific month
 * Combines course deadlines and personal events
 */
export function useCalendarEvents(
  userId: string | undefined,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: ['calendarEvents', userId, month, year],
    queryFn: () => {
      if (!userId) return [];
      return getCalendarEvents(userId, month, year);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
