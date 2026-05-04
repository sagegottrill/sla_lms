import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  toggleCoursePublishStatus,
  duplicateCourse,
  archiveCourse,
  unarchiveCourse,
} from '@/services/instructorDashboard';
import { toast } from 'sonner';

/**
 * Hook to manage bulk course actions
 */
export function useBulkCourseActions() {
  const queryClient = useQueryClient();

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: (courseId: number) => toggleCoursePublishStatus(courseId),
    onSuccess: (newStatus, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success(
        newStatus ? 'Course published successfully' : 'Course unpublished successfully'
      );
    },
    onError: () => {
      toast.error('Failed to update course status');
    },
  });

  // Duplicate course
  const duplicateMutation = useMutation({
    mutationFn: ({
      courseId,
      newTitle,
      instructorId,
    }: {
      courseId: number;
      newTitle: string;
      instructorId: string;
    }) => duplicateCourse(courseId, newTitle, instructorId),
    onSuccess: (newCourseId) => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] });
      if (newCourseId) {
        toast.success('Course duplicated successfully');
      } else {
        toast.error('Failed to duplicate course');
      }
    },
    onError: () => {
      toast.error('Failed to duplicate course');
    },
  });

  // Archive course
  const archiveMutation = useMutation({
    mutationFn: ({
      courseId,
      instructorId,
      reason,
    }: {
      courseId: number;
      instructorId: string;
      reason?: string;
    }) => archiveCourse(courseId, instructorId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] });
      toast.success('Course archived successfully');
    },
    onError: () => {
      toast.error('Failed to archive course');
    },
  });

  // Unarchive course
  const unarchiveMutation = useMutation({
    mutationFn: (courseId: number) => unarchiveCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] });
      toast.success('Course restored successfully');
    },
    onError: () => {
      toast.error('Failed to restore course');
    },
  });

  return {
    togglePublish: togglePublishMutation.mutate,
    duplicate: duplicateMutation.mutate,
    archive: archiveMutation.mutate,
    unarchive: unarchiveMutation.mutate,
    isTogglingPublish: togglePublishMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending,
  };
}
