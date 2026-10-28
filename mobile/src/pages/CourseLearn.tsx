import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { TopBar } from "../components/TopBar";
import { Card, PageLoader, ProgressBar, Spinner, Tag } from "@kit";
import { cn, errorText, friendlyError } from "@kit";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle } from "lucide-react";

/**
 * LEARN VIEWER — curriculum sections and lessons with device-local progress
 * tracking. Progress syncs to the user's enrollment row so the web dashboard
 * and mobile stay in lockstep.
 */
export default function CourseLearn() {
  const { id } = useParams();
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [busyLesson, setBusyLesson] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: [...queryKeys.courses.base, "mobile-detail", Number(id)],
    queryFn: () => api.getCourseById(Number(id)),
    enabled: true,
    select: (r) => (r.success ? r.data : undefined),
  });

  const { data: enrollments } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile", appUser?.id],
    queryFn: () => api.getUserEnrollments(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const enrollment = (enrollments ?? []).find((e: any) => String(e.course_id) === String(id) && e.status !== "dropped");
  const progress = enrollment?.progress ?? 0;
  const current = Number(enrollment?.current_lesson ?? 0);

  const curriculum = useMemo<any[]>(() => {
    const raw = course?.curriculum;
    return Array.isArray(raw) ? raw : [];
  }, [course?.curriculum]);

  const flat = useMemo(() => {
    const out: Array<{ key: string; title: string; type?: string; url?: string }> = [];
    let i = 0;
    for (const sec of curriculum) {
      for (const l of sec.lessons ?? []) {
        out.push({ key: String(i++), title: l.title ?? "Lesson", type: l.type, url: l.url ?? l.video_url });
      }
    }
    return out;
  }, [curriculum]);

  const markLesson = async (lessonIndex: number, done: boolean) => {
    if (!appUser || !enrollment?.id) return;
    setBusyLesson(String(lessonIndex));
    try {
      const safeIndex = Math.round((lessonIndex / Math.max(flat.length, 1)) * 100);
      const { error } = await supabase
        .from("enrollments")
        .update({
          progress: Math.max(progress, safeIndex),
          current_lesson: lessonIndex,
          last_accessed: new Date().toISOString(),
        })
        .eq("id", enrollment.id);
      if (error) {
        toast.error(friendlyError(errorText(error.message ?? error)));
        return;
      }
      queryClient.invalidateQueries({ queryKey: [...queryKeys.enrollments.base, "mobile", appUser.id] });
      if (done && flat.length > 0 && lessonIndex >= flat.length - 1) {
        toast.success("Course complete 🎉 Your certificate should follow shortly!");
      }
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setBusyLesson(null);
    }
  };

  if (isLoading) return <PageLoader label="Loading course…" />;

  return (
    <div className="min-h-[100dvh]">
      <TopBar title={course?.title ?? "Course"} />

      <div className="px-4 pb-8 pt-2">
        <ProgressBar value={progress} />
        <p className="mt-1.5 text-xs text-muted-foreground">{progress}% complete</p>

        {curriculum.length === 0 ? (
          <Card className="mt-6 p-5 text-center text-sm text-muted-foreground">
            This course is being prepared — check back soon.
          </Card>
        ) : (
          <div className="mt-5 space-y-4">
            {curriculum.map((sec: any, si: number) => (
              <Card key={si} className="overflow-hidden">
                <div className="border-b border-border bg-muted/60 px-4 py-3">
                  <p className="text-sm font-semibold">{sec.title ?? `Section ${si + 1}`}</p>
                </div>
                <div className="divide-y divide-border/60">
                  {(sec.lessons ?? []).map((lesson: any, li: number) => {
                    const gi = flat.findIndex((f) => f.title === (lesson.title ?? "Lesson"));
                    const index = gi === -1 ? li : gi;
                    const done = index < current;
                    return (
                      <div key={li} className={cn("flex items-center gap-3 px-4 py-3", done && "opacity-70")}>
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <PlayCircle className="h-5 w-5 shrink-0 text-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{lesson.title ?? `Lesson ${li + 1}`}</p>
                          {lesson.duration_minutes && <p className="text-[11px] text-muted-foreground">{lesson.duration_minutes} min</p>}
                        </div>
                        <button
                          onClick={() => void markLesson(index, true)}
                          disabled={busyLesson === String(index)}
                          className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary disabled:opacity-50"
                        >
                          {busyLesson === String(index) ? <Spinner className="h-3.5 w-3.5" /> : done ? "Review" : "Mark done"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
