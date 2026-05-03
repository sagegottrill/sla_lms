import { useQuery } from '@tanstack/react-query';
import { getUpcomingDeadlines, getUserToDoItems } from '@/services/studentDashboard';
import type { UpcomingDeadline, ToDoItem } from '@/services/studentDashboard';

/**
 * Hook to fetch upcoming deadlines for a student
 * Combines course deadlines and user-created to-do items
 */
export function useUpcomingDeadlines(userId: string | undefined, limit: number = 7) {
  return useQuery({
    queryKey: ['upcomingDeadlines', userId, limit],
    queryFn: async () => {
      if (!userId) return { deadlines: [], todoItems: [] };

      const [deadlines, todoItems] = await Promise.all([
        getUpcomingDeadlines(userId, limit),
        getUserToDoItems(userId),
      ]);

      return { deadlines, todoItems };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch only course deadlines
 */
export function useCourseDeadlines(userId: string | undefined, limit: number = 7) {
  return useQuery({
    queryKey: ['courseDeadlines', userId, limit],
    queryFn: () => {
      if (!userId) return [];
      return getUpcomingDeadlines(userId, limit);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch only user-created to-do items
 */
export function useUserToDoItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['userToDoItems', userId],
    queryFn: () => {
      if (!userId) return [];
      return getUserToDoItems(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
