import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: api.getCourses,
  });
};

export const useCourse = (id: number) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => api.getCourseById(id),
    enabled: !!id,
  });
};

export const usePrograms = () => {
  return useQuery({
    queryKey: ['programs'],
    queryFn: api.getPrograms,
  });
};

export const useProgram = (id: number) => {
  return useQuery({
    queryKey: ['program', id],
    queryFn: () => api.getProgramById(id),
    enabled: !!id,
  });
};

export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
  });
};
