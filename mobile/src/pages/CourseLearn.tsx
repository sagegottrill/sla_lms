import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { toVideoEmbedUrl } from "@/lib/videoEmbed";
import { TopBar } from "../components/TopBar";
import { Card, PageLoader, ProgressBar, Spinner } from "@kit";
import { cn, errorText, friendlyError } from "@kit";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, CheckCircle2, ExternalLink, PlayCircle, X } from "lucide-react";

/**
 * LEARN VIEWER — speaks the PRODUCTION curriculum shape stored by the web
 * course builder: sections are `{ module, items: [{ type, title, vimeo_url,
 * content, content_url, ... }], lessons: <count> }`.
 *
 * Progress model is byte-compatible with the web course page:
 *  - `current_lesson` stores a JSON array of completed lesson TITLES (the web
 *    reads it back as a Set). Legacy values are migrated: a plain string is a
 *    single completed title; a bare number (old mobile builds) marks the first
 *    N lessons complete.
 *  - `progress` = completed / total × 100, counted over the same lesson set
 *    the web counts (items with a non-empty title).
 *  - At 100% the enrollment is completed and the certificate is issued +
 *    emailed, exactly like the web does.
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

/** Read completed lesson titles out of the enrollment row (all legacy shapes). */
function parseCompleted(currentLesson: unknown, flatTitles: string[]): Set<string> {
  if (currentLesson === null || currentLesson === undefined || currentLesson === "") return new Set();
  try {
    const saved = typeof currentLesson === "string" ? JSON.parse(currentLesson) : currentLesson;
    if (Array.isArray(saved)) return new Set(saved.map(String).filter(Boolean));
    // Legacy mobile builds stored a bare lesson index/number.
    const n = Number(saved);
    if (Number.isFinite(n) && n > 0) return new Set(flatTitles.slice(0, n));
  } catch {
    // Legacy web fallback: current_lesson is a plain single title.
    if (typeof currentLesson === "string" && currentLesson.trim()) return new Set([currentLesson.trim()]);
  }
  return new Set();
}

export default function CourseLearn() {
  const { id } = useParams();
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [busyLesson, setBusyLesson] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ title: string; embedUrl: string } | null>(null);
  const [reading, setReading] = useState<{ title: string; content: string } | null>(null);

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

  const curriculum = useMemo<any[]>(() => {
    const raw = course?.curriculum;
    return Array.isArray(raw) ? raw : [];
  }, [course?.curriculum]);

  /* Flat lesson index across sections — mirrors the web's allLessons exactly:
     only items with a non-empty title count toward progress. */
  const flat = useMemo(() => {
    const out: Array<{ title: string; type: string; url: string; content: string; embedUrl: string }> = [];
    for (const sec of curriculum) {
      for (const l of lessonsOf(sec)) {
        const title = String(l?.title ?? "").trim();
        if (!title) continue; // web filters empty/placeholder items too
        const url = lessonUrl(l);
        const type = String(l?.type ?? "video").toLowerCase();
        out.push({
          title,
          type,
          url,
          content: String(l?.content ?? ""),
          embedUrl: isEmbeddableVideo(l) ? toVideoEmbedUrl(url) : "",
        });
      }
    }
    return out;
  }, [curriculum]);

  const flatTitles = useMemo(() => flat.map((f) => f.title), [flat]);

  const [completed, setCompleted] = useState<Set<string>>(new Set());

  /* Load persisted completion from the enrollment row (same parse as the web). */
  useEffect(() => {
    setCompleted(parseCompleted(enrollment?.current_lesson, flatTitles));
    // Re-parse only when the stored value or lesson set changes.
  }, [enrollment?.current_lesson, enrollment?.id, flatTitles]);

  const sections = useMemo(
    () =>
      curriculum.map((sec: any, si: number) => ({
        title: sec?.module ?? sec?.title ?? `Section ${si + 1}`,
        lessons: lessonsOf(sec)
          .map((l: any) => {
            const title = String(l?.title ?? "").trim();
            const url = lessonUrl(l);
            const type = String(l?.type ?? "video").toLowerCase();
            return {
              title,
              type,
              url,
              content: String(l?.content ?? ""),
              embedUrl: isEmbeddableVideo(l) ? toVideoEmbedUrl(url) : "",
            };
          })
          .filter((l) => l.title),
      })),
    [curriculum],
  );

  const openLesson = (lesson: { title: string; embedUrl: string; url: string; content: string }) => {
    if (lesson.embedUrl) {
      setPlaying({ title: lesson.title, embedUrl: lesson.embedUrl });
    } else if (lesson.content.trim()) {
      setReading({ title: lesson.title, content: lesson.content });
    } else if (lesson.url) {
      window.open(lesson.url, "_blank", "noopener"); // assessment forms / documents
    } else {
      toast.info("No content available for this lesson yet.");
      return;
    }
    // Opening a lesson completes it, same as the web's course page.
    if (!completed.has(lesson.title)) toggleLesson(lesson.title);
  };

  /** Persist completion exactly the way the web's persistProgress does. */
  const persistProgress = async (nextCompleted: Set<string>) => {
    if (!appUser?.id || !enrollment?.id) return;
    const total = flat.length;
    const done = nextCompleted.size;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    setBusyLesson("__persist");
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({
          progress: pct,
          current_lesson: JSON.stringify(Array.from(nextCompleted)),
          last_accessed: new Date().toISOString(),
          ...(pct >= 100 ? { status: "completed", completed_at: new Date().toISOString() } : {}),
        })
        .eq("id", enrollment.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: [...queryKeys.enrollments.base, "mobile", appUser.id] });
      if (pct >= 100 && total > 0) {
        const certRes = await api.issueCertificate(
          appUser.id,
          Number(id),
          course?.title ?? "Course",
          course?.instructor ?? "SLA",
          course?.duration ?? "",
          (course as any)?.programId ?? (course as any)?.program_id ?? null,
        );
        if (certRes.success && (certRes.data as any)?.newly_issued) {
          toast.success("Course complete! Your certificate is ready 🎓");
          queryClient.invalidateQueries({ queryKey: ["certificates"] });
          try {
            await api.sendCertificateEmail(
              appUser.email,
              appUser.name,
              course?.title ?? "Course",
              (certRes.data as any)?.credential_id || "N/A",
              (certRes.data as any)?.completed_at || new Date().toISOString(),
              (course as any)?.certificateConfig ?? null,
            );
          } catch (emailErr) {
            console.error("Failed to send certificate email:", emailErr);
          }
        }
      }
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setBusyLesson(null);
    }
  };

  const toggleLesson = (title: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      void persistProgress(next);
      return next;
    });
  };

  if (isLoading) return <PageLoader label="Loading course…" />;

  return (
    <div className="min-h-[100dvh]">
      <TopBar title={course?.title ?? "Course"} />

      <div className="px-4 pb-8 pt-2">
        <ProgressBar value={progress} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {completed.size} of {flat.length} lessons done · {progress}% complete
        </p>

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
                      const done = completed.has(lesson.title);
                      const isText = lesson.type !== "video" && !lesson.embedUrl;
                      return (
                        <div key={li} className={cn("flex items-center gap-3 px-4 py-3", done && "opacity-70")}>
                          <button
                            onClick={() => openLesson(lesson)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            {isText ? (
                              <BookOpenText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : !lesson.embedUrl && lesson.url ? (
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
                            onClick={() => toggleLesson(lesson.title)}
                            disabled={busyLesson !== null}
                            className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary disabled:opacity-50"
                          >
                            {busyLesson !== null ? <Spinner className="h-3.5 w-3.5" /> : done ? "Review" : "Mark done"}
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
                Video buffering? Give it a few seconds on slower connections. The lesson is saved as done automatically.
              </p>
            </div>
          </motion.div>
        )}

        {reading && (
          <motion.div
            key="reader"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col bg-background"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{reading.title}</p>
                <p className="text-[11px] text-muted-foreground">{course?.title ?? ""}</p>
              </div>
              <button
                onClick={() => setReading(null)}
                aria-label="Close lesson"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{reading.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
