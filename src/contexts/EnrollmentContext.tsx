import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

interface EnrolledCourse {
  courseId: number;
  enrolledAt: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
  lastLesson: string;
}

interface EnrollmentContextType {
  enrollments: EnrolledCourse[];
  enroll: (courseId: number, firstLesson?: string) => void;
  unenroll: (courseId: number) => void;
  isEnrolled: (courseId: number) => boolean;
  getProgress: (courseId: number) => EnrolledCourse | undefined;
  updateProgress: (courseId: number, progress: number, lastLesson: string) => void;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

const defaultEnrollments: EnrolledCourse[] = [
  { courseId: 1, enrolledAt: "2025-12-15", progress: 68, status: "in-progress", lastLesson: "Module 4: Data Visualization with Matplotlib" },
  { courseId: 2, enrolledAt: "2026-01-20", progress: 32, status: "in-progress", lastLesson: "Module 2: Building Your Brand Voice" },
  { courseId: 3, enrolledAt: "2025-10-01", progress: 100, status: "completed", lastLesson: "Completed!" },
  { courseId: 5, enrolledAt: "2026-02-10", progress: 15, status: "in-progress", lastLesson: "Module 1: HTML & CSS Fundamentals" },
  { courseId: 6, enrolledAt: "2025-11-05", progress: 100, status: "completed", lastLesson: "Completed!" },
];

export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>(defaultEnrollments);

  const enroll = (courseId: number, firstLesson = "Module 1") => {
    if (enrollments.some((e) => e.courseId === courseId)) return;
    setEnrollments((prev) => [
      ...prev,
      {
        courseId,
        enrolledAt: new Date().toISOString().split("T")[0],
        progress: 0,
        status: "not-started",
        lastLesson: firstLesson,
      },
    ]);
    toast.success("Successfully enrolled! Start learning now.");
  };

  const unenroll = (courseId: number) => {
    setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
    toast.info("Course removed from your enrollments.");
  };

  const isEnrolled = (courseId: number) => enrollments.some((e) => e.courseId === courseId);

  const getProgress = (courseId: number) => enrollments.find((e) => e.courseId === courseId);

  const updateProgress = (courseId: number, progress: number, lastLesson: string) => {
    setEnrollments((prev) =>
      prev.map((e) =>
        e.courseId === courseId
          ? {
              ...e,
              progress,
              lastLesson,
              status: progress >= 100 ? "completed" : progress > 0 ? "in-progress" : "not-started",
            }
          : e
      )
    );
  };

  return (
    <EnrollmentContext.Provider value={{ enrollments, enroll, unenroll, isEnrolled, getProgress, updateProgress }}>
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const ctx = useContext(EnrollmentContext);
  if (!ctx) throw new Error("useEnrollment must be used within EnrollmentProvider");
  return ctx;
}
