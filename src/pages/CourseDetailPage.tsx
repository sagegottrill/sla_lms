import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Clock, Users, Play, CheckCircle, ChevronDown, Globe, BookOpen, ArrowLeft, Loader2, Video, Check, Maximize, Minimize, ClipboardList, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse, useUserEnrollments, useEnrollUserMutation, useCourseReviews, useMyCourseReview, useUpsertCourseReviewMutation } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { coursePathSegment, isCourseOrProgramRouteParam } from "@/lib/publicRoutes";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const VideoEmbedFrame = lazy(() => import("@/components/course/VideoEmbedFrame"));

type ActiveTextLesson = {
  title: string;
  type: string;
  content?: string;
  documentUrl?: string;
  loading?: boolean;
};

function isTextLessonType(type: string | undefined): boolean {
  const t = (type || "").toLowerCase();
  return t === "text" || t === "reading";
}

function isDocumentUrl(url: string): boolean {
  const lower = url.split("?")[0].toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".ppt") ||
    lower.endsWith(".pptx")
  );
}

function isFetchableTextUrl(url: string): boolean {
  const lower = url.split("?")[0].toLowerCase();
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm")
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeInvalid = id != null && id !== "" && !isCourseOrProgramRouteParam(id);

  const { appUser, openAuthModal } = useAuth();
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    goal: "",
  });
  
  // Enterprise State Management (Pillar 1): TanStack Query
  const { data: course, isLoading: loadingCourse } = useCourse(id);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);
  const enrollMutation = useEnrollUserMutation();
  const queryClient = useQueryClient();
  const { data: liveReviews = [] } = useCourseReviews(course?.id);
  const { data: myReview } = useMyCourseReview(course?.id, appUser?.id);
  const upsertReview = useUpsertCourseReviewMutation();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (myReview) {
      setReviewRating(myReview.rating || 5);
      setReviewComment(myReview.comment || "");
    }
  }, [myReview]);

  const [openModule, setOpenModule] = useState<number | null>(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<ActiveTextLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [navDimmed, setNavDimmed] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [courseAssessments, setCourseAssessments] = useState<Array<{ id: string; title?: string }>>([]);
  const [savingProgress, setSavingProgress] = useState(false);

  // Calculate enrolled status FIRST before using it
  const enrolled = useMemo(() =>
    !!course && enrollments.some((e: { course_id?: number }) => e.course_id === course.id),
    [course, enrollments]
  );

  const displayReviews = liveReviews.length > 0 ? liveReviews : (course?.reviews ?? []);
  const reviewCount = course?.reviewCount ?? displayReviews.length;
  const ratingValue = Number(course?.rating ?? 0);
  const ratingBuckets = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of displayReviews) {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0))) as 1 | 2 | 3 | 4 | 5;
      counts[star] += 1;
    }
    const total = displayReviews.length || 1;
    return [5, 4, 3, 2, 1].map((s) => ({
      star: s,
      pct: Math.round((counts[s as 1 | 2 | 3 | 4 | 5] / total) * 100),
    }));
  }, [displayReviews]);

  const handleSubmitReview = () => {
    if (!appUser?.id || !course?.id) {
      openAuthModal("login");
      return;
    }
    if (!enrolled) {
      toast.error("Enroll in this course before leaving a review.");
      return;
    }
    upsertReview.mutate({
      courseId: course.id,
      userId: appUser.id,
      rating: reviewRating,
      comment: reviewComment,
      displayName: appUser.name || appUser.email?.split("@")[0] || "Student",
    });
  };
  const canPreviewCourse =
    appUser?.role === "admin" ||
    appUser?.role === "program_manager" ||
    appUser?.role === "instructor";
  const canAccessLessons = enrolled || canPreviewCourse;

  // Flatten all lessons for sidebar + progress calculation
  const allLessons = useMemo(() => {
    if (!course?.curriculum) return [];
    return course.curriculum.flatMap((mod: any) =>
      (mod.items || [])
        .map((item: any) => {
          const contentUrl =
            typeof item === "object"
              ? (item.content_url || item.transcript_url || "")
              : "";
          return {
            title: typeof item === "string" ? item : (item.title || ""),
            url: typeof item === "object" ? (item.vimeo_url || "") : "",
            type: typeof item === "object" ? (item.type || "video") : "video",
            content: typeof item === "object" ? (item.content || "") : "",
            contentUrl,
            duration: typeof item === "object" ? (item.duration || "") : "",
            module: mod.module,
          };
        })
        // Filter out lessons with empty titles to avoid counting invalid/placeholder items
        .filter((lesson: any) => lesson.title && lesson.title.trim() !== "")
    );
  }, [course]);

  // Load persisted lesson completion from enrollment's current_lesson field
  useEffect(() => {
    if (!enrolled || !course) return;
    const enrollment = enrollments.find((e: any) => e.course_id === course.id);
    if (!enrollment?.current_lesson) return;
    try {
      const saved: string[] = JSON.parse(enrollment.current_lesson);
      if (Array.isArray(saved)) setCompletedLessons(new Set(saved));
    } catch {
      // current_lesson may be a plain string (legacy) — treat as single completed lesson
      if (typeof enrollment.current_lesson === "string") {
        setCompletedLessons(new Set([enrollment.current_lesson]));
      }
    }
  }, [enrolled, enrollments, course]);

  const persistProgress = async (nextCompleted: Set<string>) => {
    if (!appUser?.id || !course?.id || !enrolled) return;
    const total = allLessons.length;
    const done = nextCompleted.size;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    setSavingProgress(true);
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({
          progress,
          current_lesson: JSON.stringify(Array.from(nextCompleted)),
          last_accessed: new Date().toISOString(),
          ...(progress >= 100 ? { status: "completed", completed_at: new Date().toISOString() } : {}),
        })
        .eq("user_id", appUser.id)
        .eq("course_id", course.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
      if (progress >= 100) {
        const certRes = await api.issueCertificate(
          appUser.id,
          course.id,
          course.title,
          course.instructor ?? "SLA",
          course.duration ?? "",
          course.program_id ?? null,
        );
        if (certRes.success && certRes.data?.newly_issued) {
          toast.success("Course complete! Your certificate is ready.");
          try {
            await api.sendCertificateEmail(
              appUser.email,
              appUser.name,
              course.title,
              certRes.data?.credential_id || "N/A",
              certRes.data?.completed_at || new Date().toISOString(),
              course.certificateConfig ?? null,
            );
          } catch (emailErr) {
            console.error("Failed to send certificate email:", emailErr);
          }
        }
      }
    } catch (err) {
      console.error("Failed to persist lesson progress:", err);
      toast.error("Could not save your progress. Please try again.");
    } finally {
      setSavingProgress(false);
    }
  };

  const markLessonComplete = (title: string) => {
    if (!enrolled) return;
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.add(title);
      void persistProgress(next);
      return next;
    });
  };

  const toggleLessonComplete = (title: string) => {
    if (!enrolled) return;
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      void persistProgress(next);
      return next;
    });
  };

  const selectLessonVideo = (url: string, lessonTitle?: string) => {
    setActiveVideo(url);
    setActiveLesson(null);
    if (lessonTitle && enrolled) {
      markLessonComplete(lessonTitle);
    }
    window.setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const selectTextLesson = async (lesson: {
    title: string;
    type: string;
    content?: string;
    contentUrl?: string;
  }) => {
    setActiveVideo(null);
    const inline = (lesson.content || "").trim();
    const url = (lesson.contentUrl || "").trim();

    if (inline) {
      setActiveLesson({ title: lesson.title, type: lesson.type, content: inline });
    } else if (url && isDocumentUrl(url)) {
      setActiveLesson({ title: lesson.title, type: lesson.type, documentUrl: url });
    } else if (url && isFetchableTextUrl(url)) {
      setActiveLesson({ title: lesson.title, type: lesson.type, loading: true });
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load lesson content");
        const text = await res.text();
        setActiveLesson({ title: lesson.title, type: lesson.type, content: text });
      } catch (err) {
        console.error("Text lesson fetch failed:", err);
        setActiveLesson({
          title: lesson.title,
          type: lesson.type,
          documentUrl: url,
          content: "",
        });
      }
    } else if (url) {
      // Unknown remote resource — offer open link
      setActiveLesson({ title: lesson.title, type: lesson.type, documentUrl: url });
    } else {
      setActiveLesson({ title: lesson.title, type: lesson.type, content: "" });
    }

    if (lesson.title && enrolled) {
      markLessonComplete(lesson.title);
    }
    window.setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  useEffect(() => {
    if (!course?.id || !appUser?.id) return;
    void api.getSkillsAssessments({ courseId: course.id }).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setCourseAssessments(res.data.map((a: { id: string; title?: string }) => ({ id: a.id, title: a.title })));
      }
    });
  }, [course?.id, appUser?.id]);

  useEffect(() => {
    if (canAccessLessons && !activeVideo && course?.curriculum?.length > 0) {
      const firstMod = course.curriculum[0];
      if (firstMod?.items?.length > 0) {
        const firstItem = firstMod.items[0];
        const url = typeof firstItem === "string" ? "" : (firstItem as any).vimeo_url;
        if (url) setActiveVideo(url);
      }
    }
  }, [canAccessLessons, course, activeVideo]);

  if (routeInvalid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/25 mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">This course link is not valid.</p>
          <Link to="/courses">
            <Button className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 gap-2">
              <ArrowLeft className="w-4 h-4" /> Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingCourse || loadingEnrollments) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="hidden lg:block">
            <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/25 mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Link to="/courses">
            <Button className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 gap-2">
              <ArrowLeft className="w-4 h-4" /> Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const rawCoursePrice = Number(course.price ?? 0);
  const coursePriceNgn = Number.isFinite(rawCoursePrice) ? Math.max(0, rawCoursePrice) : null;
  const isFreeCourse = coursePriceNgn === 0;
  const priceLabel = coursePriceNgn === null
    ? "Price unavailable"
    : coursePriceNgn === 0
      ? "Free"
      : `₦${coursePriceNgn.toLocaleString()}`;

  const handleEnroll = async () => {
    if (!appUser) {
      toast.error("Please log in to enrol.");
      openAuthModal("login");
      return;
    }
    
    toast.promise(
      enrollMutation.mutateAsync(
        { userId: appUser.id, courseId: course.id },
        { meta: { silentToast: true } },
      ),
      {
        loading: "Enrolling...",
        success: "Successfully enrolled in course!",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to enrol. Please try again.",
      },
    );
  };

  const openPaidEnrollModal = () => {
    if (!appUser) {
      toast.error("Please log in to continue to checkout.");
      openAuthModal("login");
      return;
    }
    setEnrollForm({
      fullName: appUser.name || "",
      email: appUser.email || "",
      phone: "",
      goal: "",
    });
    setEnrollModalOpen(true);
  };

  const handleSubmitCourseApplication = async () => {
    if (!appUser || !course) return;
    if (!enrollForm.fullName.trim() || !enrollForm.email.trim() || !enrollForm.phone.trim()) {
      toast.error("Please fill in Full Name, Email, and Phone Number.");
      return;
    }
    if (!enrollForm.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
     setEnrollSubmitting(true);
     try {
       const response = await api.createCourseApplication({
         user_id: appUser.id,
         course_id: course.id,
         full_name: enrollForm.fullName.trim(),
         email: enrollForm.email.trim(),
         phone: enrollForm.phone.trim(),
         goal: enrollForm.goal.trim(),
         status: "pending",
       });
       if (!response.success || !response.data) {
         toast.error("Could not save your details. Please try again.");
         return;
       }
       toast.success("Details saved. Continue to payment.");
       setEnrollModalOpen(false);
       navigate(`/courses/${coursePathSegment(course)}/checkout`);
     } finally {
       setEnrollSubmitting(false);
     }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/courses" className="hover:text-primary">Courses</Link>
          <span>/</span>
          <span className="text-foreground truncate">{course.title}</span>
        </div>
      </div>

      {/* Hero / Player Area */}
      <div ref={playerSectionRef} className="gradient-hero pb-8 scroll-mt-4">
        <div className={`max-w-7xl mx-auto px-6 pt-12 grid ${canAccessLessons && activeVideo && isTheaterMode ? "lg:grid-cols-1" : "lg:grid-cols-3"} gap-8 transition-all duration-300`}>
          <div className={canAccessLessons && (activeVideo || activeLesson) && isTheaterMode ? "lg:col-span-1" : "lg:col-span-2 flex flex-col justify-center"}>
            {canAccessLessons && activeVideo ? (
              <div 
                className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 relative z-10 mb-6 group transition-all duration-300"
                style={{ aspectRatio: '16/9' }}
              >
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className="p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white backdrop-blur flex items-center gap-2 transition-colors"
                  >
                    {isTheaterMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    <span className="text-xs font-semibold">{isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}</span>
                  </button>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  <VideoEmbedFrame videoUrl={activeVideo} />
                </Suspense>
              </div>
            ) : null}

            {canAccessLessons && activeLesson && isTextLessonType(activeLesson.type) ? (
              <div className="w-full bg-card rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 relative z-10 mb-6">
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">{activeLesson.title}</h2>
                  </div>
                  {activeLesson.loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading lesson content…</span>
                    </div>
                  ) : activeLesson.documentUrl && !activeLesson.content ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        This lesson is available as a document. Open it to continue reading.
                      </p>
                      <Button asChild>
                        <a href={activeLesson.documentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open document
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-foreground/90"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {activeLesson.content || (
                        <p className="text-muted-foreground italic">No content available for this lesson yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {!activeVideo && !activeLesson && (
              <>
                <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground text-xs font-semibold mb-4 w-fit">{course.category}</span>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4 leading-tight">
                  {course.title}
                </motion.h1>
                <p className="text-primary-foreground/70 text-lg mb-6">{course.subtitle}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-gold fill-gold" /> <strong className="text-primary-foreground">{ratingValue.toFixed(1)}</strong> ({reviewCount.toLocaleString()} reviews)</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{(course.students ?? 0).toLocaleString()} students</span>
                  {course.duration ? (
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration}</span>
                  ) : null}
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{course.language}</span>
                </div>
                <p className="text-primary-foreground/70 text-sm mt-4">Created by <strong className="text-primary-foreground">{course.instructor}</strong> · Updated {course.lastUpdated}</p>
              </>
            )}

            {canAccessLessons && (activeVideo || activeLesson) && (
               <div>
                  <h1 className="font-display text-2xl font-bold text-primary-foreground mb-2 leading-tight">
                    {course.title}
                  </h1>
                  <p className="text-primary-foreground/70 text-sm">Instructor: <strong className="text-primary-foreground">{course.instructor}</strong></p>
               </div>
            )}
          </div>

          {/* Sticky context card or sidebar for inactive theater mode */}
          {!isTheaterMode && (
             <div className="hidden lg:block relative z-20 lg:col-span-1">
               {canAccessLessons && (activeVideo || activeLesson) ? (
                 /* Checkmark Sidebar — shown next to active video */
                 <div className="sticky top-6 bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }}>
                   {/* Progress Header */}
                   <div className="p-4 border-b border-border bg-primary text-white shrink-0">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-bold">Course Content</span>
                       <span className="text-sm font-bold">{completedLessons.size} / {allLessons.length}</span>
                     </div>
                     <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                       <motion.div
                         className="h-full bg-white rounded-full"
                         animate={{ width: `${Math.round((completedLessons.size / Math.max(allLessons.length, 1)) * 100)}%` }}
                         transition={{ duration: 0.5, ease: "easeOut" }}
                       />
                     </div>
                     <p className="text-[10px] text-white/70 mt-1">{Math.round((completedLessons.size / Math.max(allLessons.length, 1)) * 100)}% complete</p>
                   </div>
                   {/* Lesson List */}
                   <div className="overflow-y-auto divide-y divide-border flex-1">
                     {allLessons.map((lesson: any, idx) => {
                       const isActiveVideo = lesson.url && activeVideo === lesson.url;
                       const isActiveText = isTextLessonType(lesson.type) && activeLesson?.title === lesson.title;
                       const isActive = isActiveVideo || isActiveText;
                       const isDone = completedLessons.has(lesson.title);
                       return (
                         <button
                           key={idx}
                           onClick={() => {
                             if (isTextLessonType(lesson.type)) {
                               void selectTextLesson({
                                 title: lesson.title,
                                 type: lesson.type,
                                 content: lesson.content,
                                 contentUrl: lesson.contentUrl,
                               });
                             } else if (lesson.url) {
                               selectLessonVideo(lesson.url, lesson.title);
                             } else {
                               toast.info("No content for this lesson yet.");
                             }
                           }}
                           className={cn(
                             "w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors",
                             isActive ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/40 border-l-2 border-transparent"
                           )}
                         >
                           {/* Checkmark indicator */}
                           <button
                             onClick={e => {
                               e.stopPropagation();
                               setCompletedLessons(prev => {
                                 const next = new Set(prev);
                                if (next.has(lesson.title)) next.delete(lesson.title);
                                else next.add(lesson.title);
                                 void persistProgress(next);
                                 return next;
                               });
                             }}
                             className={cn(
                               "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                               isDone ? "bg-primary border-primary" : "border-border hover:border-primary"
                             )}
                           >
                             <AnimatePresence>
                               {isDone && (
                                 <motion.div
                                   initial={{ scale: 0 }}
                                   animate={{ scale: 1 }}
                                   exit={{ scale: 0 }}
                                   transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                 >
                                   <Check className="w-3 h-3 text-white" />
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </button>
                           <span className={cn(
                             "flex-1 line-clamp-2 leading-tight",
                             isDone ? "text-muted-foreground line-through" : isActive ? "text-primary font-semibold" : "text-foreground"
                           )}>
                             {lesson.title}
                           </span>
                           {lesson.duration && (
                             <span className="text-[10px] text-muted-foreground shrink-0">{lesson.duration}</span>
                           )}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               ) : (
                 /* Hero Pricing Card */
                 <div className="sticky top-6 bg-card rounded-2xl shadow-brand-lg ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden">
                   {!enrolled && <img src={course.image} alt={course.title} className="w-full aspect-video object-cover" />}
                   <div className="p-6 space-y-4">
                     <div className="flex items-baseline gap-2">
                       <div className="text-3xl font-bold font-display text-foreground">{priceLabel}</div>
                       {course.originalPrice && (
                         <div className="text-lg font-bold text-muted-foreground line-through">₦{course.originalPrice?.toLocaleString()}</div>
                       )}
                     </div>
                     {enrolled ? (
                       <Button disabled className="w-full bg-secondary text-primary rounded-xl h-11 font-semibold opacity-100 flex items-center justify-center gap-2">
                         <CheckCircle className="w-5 h-5" /> Enrolled
                       </Button>
                    ) : isFreeCourse ? (
                       <Button onClick={handleEnroll} disabled={enrollMutation.isPending} className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90">
                         {enrollMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enrol for Free"}
                       </Button>
                    ) : coursePriceNgn === null ? (
                      <Button disabled className="w-full rounded-xl h-11 font-semibold">
                        Price unavailable
                      </Button>
                     ) : (
                       <Button
                         type="button"
                         onClick={openPaidEnrollModal}
                         className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90"
                       >
                         Enrol Now — ₦{coursePriceNgn.toLocaleString()}
                       </Button>
                     )}
                     
                     {!enrolled && (
                       <div className="space-y-2 text-sm text-foreground pt-2 border-t border-border">
                         {[
                           ["Level", course.level],
                           ...(course.duration ? [["Duration", course.duration] as [string, string]] : []),
                           ["Certificate", "Yes, upon completion"],
                           ["Access", "Lifetime + mobile"],
                         ].map(([k, v]) => (
                           <div key={k} className="flex justify-between">
                             <span className="text-muted-foreground">{k}</span>
                             <span className="font-medium">{v}</span>
                           </div>
                         ))}
                       </div>
                     )}

                     {enrolled && (
                         <div className="pt-2 border-t border-border">
                           <p className="text-sm font-semibold text-foreground mb-2">Your Progress</p>
                           <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${allLessons.length > 0 ? Math.round((completedLessons.size / allLessons.length) * 100) : 0}%` }}
                              />
                           </div>
                           <p className="text-xs text-muted-foreground mt-2 text-right flex items-center justify-end gap-1">
                             {savingProgress && <Loader2 className="w-3 h-3 animate-spin" />}
                             {allLessons.length > 0 ? Math.round((completedLessons.size / allLessons.length) * 100) : 0}% completed
                           </p>
                         </div>
                     )}
                   </div>
                 </div>
               )}
             </div>
          )}
        </div>
      </div>

      {/* Mobile enrol bar */}
      {!enrolled && !canPreviewCourse && (
        <div className="lg:hidden sticky top-0 z-20 bg-card border-b border-border p-4 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-foreground">{priceLabel}</span>
            {course.originalPrice && (
                <span className="text-sm font-bold text-muted-foreground line-through">₦{course.originalPrice?.toLocaleString()}</span>
            )}
            </div>
            {isFreeCourse ? (
            <Button onClick={handleEnroll} disabled={enrollMutation.isPending} className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">
                {enrollMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Enrol for Free"}
            </Button>
            ) : coursePriceNgn === null ? (
            <Button disabled className="rounded-xl font-semibold px-6">
                Price unavailable
            </Button>
            ) : (
            <Button type="button" onClick={openPaidEnrollModal} className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">
                Enrol — ₦{coursePriceNgn.toLocaleString()}
            </Button>
            )}
        </div>
      )}

      {/* Main Bottom Section */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
        <div className={cn("space-y-10", "lg:col-span-2")}>
          
          {canAccessLessons && activeVideo && course.whatYoullLearn?.length > 0 && (
             <section className="bg-card p-6 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Course Objectives</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                    {course.whatYoullLearn.slice(0,4).map((item) => (
                    <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                        {item}
                    </div>
                    ))}
                </div>
             </section>
          )}

          {!enrolled && course.whatYoullLearn?.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(Array.isArray(course.whatYoullLearn) ? course.whatYoullLearn : []).map((item: any) => (
                  <div key={item} className="flex gap-3 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Curriculum */}
          {Array.isArray(course.curriculum) && course.curriculum.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">Course Curriculum</h2>
              <div className="space-y-2">
                {course.curriculum.map((mod: any, i) => (
                  <div key={i} className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-xl overflow-hidden bg-card">
                    <button onClick={() => setOpenModule(openModule === i ? null : i)}
                      className={`w-full flex items-center justify-between p-4 transition-colors text-left ${openModule === i ? "bg-accent/50" : "bg-muted/30 hover:bg-muted"}`}>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{mod.module}</span>
                        <span className="text-xs text-muted-foreground ml-3 hidden sm:inline-block">{mod.lessons} lessons · {mod.duration}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openModule === i ? "rotate-180" : ""}`} />
                    </button>
                    {openModule === i && (
                      <div className="divide-y divide-border">
                        {(Array.isArray(mod?.items) ? mod.items : []).map((item: any, j: number) => {
                          const isObj = typeof item === 'object';
                          const title = isObj ? item.title : item;
                          const url = isObj ? item.vimeo_url : "";
                          const lessonType = isObj ? (item.type || "video") : "video";
                          const content = isObj ? item.content : "";
                          const contentUrl = isObj ? (item.content_url || item.transcript_url || "") : "";
                          const duration = isObj ? item.duration : "";
                          const isActiveVideo = url && activeVideo === url;
                          const isActiveText = isTextLessonType(lessonType) && activeLesson?.title === title;
                          const isActive = isActiveVideo || isActiveText;

                          return (
                            <button
                              key={j}
                              onClick={() => {
                                if (!canAccessLessons) { toast.error("Please enrol to access lessons."); return; }
                                if (isTextLessonType(lessonType)) {
                                  void selectTextLesson({
                                    title,
                                    type: lessonType,
                                    content,
                                    contentUrl,
                                  });
                                } else if (url) {
                                  selectLessonVideo(url, title);
                                } else {
                                  toast.info("No content available for this lesson.");
                                }
                              }}
                              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-sm transition-colors ${isActive ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/30 border-l-2 border-transparent"}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {enrolled && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLessonComplete(title);
                                    }}
                                    className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                      completedLessons.has(title) ? "bg-primary border-primary" : "border-border",
                                    )}
                                  >
                                    {completedLessons.has(title) ? <Check className="w-3 h-3 text-white" /> : null}
                                  </button>
                                )}
                                {isTextLessonType(lessonType) ? (
                                  <FileText className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                ) : isActive ? (
                                    <Video className="w-4 h-4 shrink-0 text-primary" />
                                ) : (
                                    <Play className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                )}
                                <span className={cn("truncate", isActive ? "text-primary font-semibold" : "text-muted-foreground", completedLessons.has(title) && "line-through")}>
                                  {title}
                                </span>
                              </div>
                              {duration && <span className="text-xs text-muted-foreground shrink-0">{duration}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {courseAssessments.length > 0 && (
            <section className="bg-card p-6 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg font-bold text-foreground mb-1">Course assessments</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Knowledge checks for this course ({courseAssessments.length}{" "}
                    {courseAssessments.length === 1 ? "quiz" : "quizzes"}).
                  </p>
                  <ul className="space-y-1 mb-4">
                    {courseAssessments.map((a) => (
                      <li key={a.id} className="text-sm text-foreground">
                        {a.title ?? "Assessment"}
                      </li>
                    ))}
                  </ul>
                  {appUser ? (
                    <Link to={`/dashboard/skills?courseId=${course.id}`}>
                      <Button className="rounded-xl gradient-card text-primary-foreground">Take assessments</Button>
                    </Link>
                  ) : (
                    <Link to="/">
                      <Button variant="outline" className="rounded-xl">
                        Log in to take assessments
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Instructor */}
          {course.instructor && !activeVideo && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">Your Instructor</h2>
              <div className="flex gap-4">
                {course.instructorAvatar && <img src={course.instructorAvatar} alt={course.instructor} className="w-16 h-16 rounded-2xl object-cover shrink-0" />}
                <div>
                  <h3 className="font-semibold text-foreground">{course.instructor}</h3>
                  <p className="text-sm text-secondary mb-2">{course.instructorTitle}</p>
                  <p className="text-sm text-muted-foreground">{course.instructorBio}</p>
                </div>
              </div>
            </section>
          )}

          {/* Reviews */}
          {!activeVideo && !activeLesson && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">Student Reviews</h2>

              {enrolled && appUser && (
                <div className="mb-6 p-5 bg-card rounded-2xl shadow-sm border-0 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    {myReview ? "Update your review" : "Leave a review"}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-0.5"
                        aria-label={`${s} stars`}
                      >
                        <Star
                          className={cn(
                            "w-6 h-6",
                            s <= reviewRating ? "text-gold fill-gold" : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="What did you think of this course?"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none"
                  />
                  <Button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={upsertReview.isPending}
                    className="rounded-xl"
                  >
                    {upsertReview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : myReview ? "Update review" : "Submit review"}
                  </Button>
                </div>
              )}

              {displayReviews.length > 0 ? (
                <>
                  <div className="flex items-center gap-4 mb-6 p-6 bg-card shadow-sm border-0 rounded-2xl">
                    <div className="text-center">
                      <div className="text-5xl font-bold font-display text-foreground">{ratingValue.toFixed(1)}</div>
                      <div className="flex justify-center mt-1 gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "w-4 h-4",
                              s <= Math.round(ratingValue) ? "text-gold fill-gold" : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {reviewCount.toLocaleString()} review{reviewCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingBuckets.map(({ star, pct }) => (
                        <div key={star} className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-3">{star}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {displayReviews.map((review, i) => (
                      <div key={review.id || i} className="p-4 bg-card rounded-2xl shadow-sm border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full gradient-card flex items-center justify-center text-sm font-bold text-primary-foreground">
                            {(review.name ?? "S").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{review.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(Math.max(0, Math.min(5, Number(review.rating) || 0)))].map((_, j) => (
                                <Star key={j} className="w-3 h-3 text-gold fill-gold" />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment ? (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {enrolled
                    ? "No reviews yet — be the first to share your experience."
                    : "No reviews yet for this course."}
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      <Dialog open={enrollModalOpen} onOpenChange={setEnrollModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Before you checkout</DialogTitle>
            <DialogDescription>
              Tell us a bit about yourself. We&apos;ll save this with your enrolment request, then you can complete payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                value={enrollForm.fullName}
                onChange={(e) => setEnrollForm((f) => ({ ...f, fullName: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border bg-background text-sm"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={enrollForm.email}
                onChange={(e) => setEnrollForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border bg-background text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input
                value={enrollForm.phone}
                onChange={(e) => setEnrollForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border bg-background text-sm"
                placeholder="+234 …"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">What do you hope to achieve from this course?</label>
              <textarea
                value={enrollForm.goal}
                onChange={(e) => setEnrollForm((f) => ({ ...f, goal: e.target.value }))}
                rows={3}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none"
                placeholder="A short goal or outcome you’re aiming for…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEnrollModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmitCourseApplication()}
              disabled={enrollSubmitting}
              className="gradient-card text-primary-foreground rounded-xl"
            >
              {enrollSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue to checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
