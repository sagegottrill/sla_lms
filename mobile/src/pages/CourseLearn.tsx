import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { toVideoEmbedUrl } from "@/lib/videoEmbed";
import { TopBar } from "../components/TopBar";
import { Card, PageLoader, ProgressBar, Spinner, Tag } from "@kit";
import { cn, errorText, friendlyError } from "@kit";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, PlayCircle, X } from "lucide-react";

/**
 * LEARN VIEWER — speaks the PRODUCTION curriculum shape stored by the web
 * course builder: sections are `{ module, items: [{ type, title, vimeo_url,
 * content, content_url, ... }], lessons: <count> }`.
 *
 * Notes:
 *  - `lessons` on each section is a COUNT (number), not an array — iterating
 *    it crashed the app with "number 4 is not iterable". Any non-array
 *    lessons/items value is treated as an empty lesson list.
 *  - Videos embed in-app via the SAME shared converter the web uses
 *    (lib/videoEmbed → player.vimeo.com / youtube embeds).
 *  - Non-video content (assessment forms, documents) opens in the system
 *    browser, like dark-mode-safe external links do elsewhere.
 *  - Progress syncs to the user's enrollment row so the web dashboard and
 *    mobile stay in lockstep.
 */

/** Lessons of a section in either stored shape (items array | lessons array | count). */
function lessonsOf(sec: any): any[] {
  if (Array.isArray(sec?.items)) return sec.items;
  if (Array.isArray(sec?.lessons)) return sec.lessons;
  return [];
}

/** Best play URL of a lesson item, across every field name the builder stores. */
function lessonUrl(l: any): string {
  return String(l?.vimeo_url ?? l?.content_url ?? l?.url ?? l?.video_url ?? l?.transcript_url ?? "");
}

/** Video lessons embed in-app; everything else opens in the system browser. */
function isEmbeddableVideo(l: any): boolean {
  const url = lessonUrl(l);
  const type = String(l?.type ?? "video").toLowerCase();
  if (type !== "video") return false;
  if (!url) return false;
  const isVideoHost = /vimeo\.com|youtube\.com|youtu\.be/.test(url) || /^\d+$/.test(url.trim());
  return isVideoHost;
}

export default function CourseLearn() {
  const { id } = useParams();
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [busyLesson, setBusyLesson] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ title: string; embedUrl: string } | null>(null);

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

  /* Flat lesson index across sections — for progress % and current_lesson. */
  const flat = useMemo(() => {
    const out: Array<{ key: string; title: string; url?: string; type?: string }> = [];
    let i = 0;
    for (const sec of curriculum) {
      for (const l of lessonsOf(sec)) {
        out.push({ key: String(i++), title: l?.title ?? "Lesson", type: l?.type, url: lessonUrl(l) });
      }
    }
    return out;
  }, [curriculum]);

  const sections = useMemo(
    () =>
      curriculum.map((sec: any, si: number) => ({
        title: sec?.module ?? sec?.title ?? `Section ${si + 1}`,
        lessons: lessonsOf(sec).map((l: any) => ({
          title: l?.title ?? "Lesson",
          type: String(l?.type ?? "video").toLowerCase(),
          url: lessonUrl(l),
          embedUrl: isEmbeddableVideo(l) ? toVideoEmbedUrl(lessonUrl(l)) : "",
        })),
      })),
    [curriculum],
  );

  const openLesson = (lesson: { title: string; embedUrl: string; url: string }, lessonIndex: number) => {
    if (lesson.embedUrl) {
      setPlaying({ title: lesson.title, embedUrl: lesson.embedUrl });
    } else if (lesson.url) {
      window.open(lesson.url, "_blank", "noopener"); // assessment forms / documents
    } else {
      toast.info("No content available for this lesson yet.");
      return;
    }
    void markLesson(lessonIndex, false); // opening counts as touching the lesson
  };

  const markLesson = async (lessonIndex: number, done: boolean) => {
    if (!appUser || !enrollment?.id) return;
    setBusyLesson(String(lessonIndex));
    try {
      const safeIndex = lessonIndex >= flat.length - 1 ? 100 : Math.round(((lessonIndex + 1) / Math.max(flat.length, 1)) * 100);
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
            {sections.map((sec, si) => (
              <Card key={si} className="overflow-hidden">
                <div className="border-b border-border bg-muted/60 px-4 py-3">
                  <p className="text-sm font-semibold">{sec.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{sec.lessons.length} lesson{sec.lessons.length === 1 ? "" : "s"}</p>
                </div>
                {sec.lessons.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">Lessons for this module are being prepared.</p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {sec.lessons.map((lesson, li) => {
                      const gi = flat.findIndex((f) => f.title === lesson.title && f.url === lesson.url);
                      const index = gi === -1 ? li : gi;
                      const done = index < current;
                      return (
                        <div key={li} className={cn("flex items-center gap-3 px-4 py-3", done && "opacity-70")}>
                          <button
                            onClick={() => openLesson(lesson, index)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            {isEmbeddableTextType(lesson.type) ? (
                              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : done ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                            ) : (
                              <PlayCircle className="h-5 w-5 shrink-0 text-primary" />
                            )}
                            <span className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{lesson.title}</p>
                            </span>
                          </button>
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
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* In-app player — Vimeo/YouTube embeds, fullscreen-close, user decides when done */}
      <AnimatePresence>
        {playing && (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col bg-black/90 backdrop-blur-sm"
          >
            <div className={cn("flex items-center justify-between gap-3 px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]")}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{playing.title}</p>
                <p className="text-[11px] text-white/60">{course?.title ?? ""}</p>
              </div>
              <button
                onClick={() => setPlaying(null)}
                aria-label="Close player"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mx-4 mb-3 w-auto overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16/9" }}>
              <iframe
                src={playing.embedUrl}
                className="absolute inset-0 h-full w-full"
                title={playing.title}
                frameBorder={0}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            </div>
            <div className="px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
              <p className="text-[11px] leading-relaxed text-white/60">
                Video buffering? Give it a few seconds on slower connections. When you finish, tap your lessons
                <span className="font-semibold text-white/80"> Mark done</span> to keep your progress in sync.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Non-video lesson types render and open as external content (forms, docs). */
function isEmbeddableTextType(type: string): boolean {
  return type !== "video";
}
