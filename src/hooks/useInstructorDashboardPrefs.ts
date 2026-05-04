import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInstructorDashboardPreferences,
  updateInstructorDashboardView,
  toggleWidgetVisibility,
  type InstructorDashboardPreferences,
} from '@/services/instructorDashboard';

/**
 * Hook to manage instructor dashboard preferences
 */
export function useInstructorDashboardPrefs(instructorId: string) {
  const queryClient = useQueryClient();

  // Fetch preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery<InstructorDashboardPreferences | null>({
    queryKey: ['instructorDashboardPreferences', instructorId],
    queryFn: () => getInstructorDashboardPreferences(instructorId),
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update view mutation
  const updateViewMutation = useMutation({
    mutationFn: (view: 'card' | 'list' | 'activity') =>
      updateInstructorDashboardView(instructorId, view),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['instructorDashboardPreferences', instructorId],
      });
    },
  });

  // Toggle widget mutation
  const toggleWidgetMutation = useMutation({
    mutationFn: ({ widget, visible }: { widget: string; visible: boolean }) =>
      toggleWidgetVisibility(instructorId, widget, visible),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['instructorDashboardPreferences', instructorId],
      });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updateView: updateViewMutation.mutate,
    toggleWidget: toggleWidgetMutation.mutate,
    isUpdatingView: updateViewMutation.isPending,
    isTogglingWidget: toggleWidgetMutation.isPending,
  };
}
