import { useQuery } from '@tanstack/react-query';
import { getInstructorGradingQueue, GradingQueueItem } from '@/services/instructorDashboard';

export function useGradingQueue(instructorId: string | undefined) {
  return useQuery<GradingQueueItem[]>({
    queryKey: ['gradingQueue', instructorId],
    queryFn: () => {
      if (!instructorId) return [];
      return getInstructorGradingQueue(instructorId);
    },
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}
