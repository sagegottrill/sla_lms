import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GraduationCap, PlayCircle, Users } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { api, formatEnrollmentError } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { Btn, Card, PageLoader, ProgressBar, Spinner, Tag } from "@kit";
import { errorText, fmtMoney, friendlyError } from "@kit";
import { useNavigate, useParams } from "react-router-dom";

/** Fully-routed course page (deep-linkable): overview, curriculum, enroll/open. */
export default function CourseDetail() {
  const { id } = useParams();
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: [...queryKeys.courses.base, "mobile-detail", Number(id)],
    queryFn: () => api.getCourseById(Number(id)),
    select: (r) => (r.success ? r.data : undefined),
  });

  const { data: enrollments } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile", appUser?.id],
    queryFn: () => api.getUserEnrollments(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const enrollment = (enrollments ?? []).find((e: any) => String(e.course_id) === String(id) && e.status !== "dropped");

  const enroll = async () => {
    if (!appUser || !course) return;
    setEnrolling(true);
    try {
      const res = await api.enrollUser(appUser.id, course.id);
      if (!res.success) {
        toast.error(formatEnrollmentError(errorText(res.error)));
        return;
      }
      toast.success(`You're enrolled in “${course.title}” 🎉`);
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <PageLoader label="Loading course…" />;
  if (!course)
    return (
      <div className="min-h-[100dvh]">
        <TopBar title="Course" />
        <Card className="mx-4 mt-4 p-5 text-center text-sm text-muted-foreground">Course not found — it may have been unpublished.</Card>
      </div>
    );

  const curriculum: any[] = Array.isArray(course.curriculum) ? course.curriculum : [];
  const lessonsTotal = curriculum.reduce((n, s: any) => n + (s.lessons?.length ?? 0), 0);

  return (
    <div className="min-h-[100dvh] pb-10">
      <TopBar title={course.title} />

      {course.image && <img src={course.image} alt="" className="h-52 w-full object-cover" />}
      <div className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {course.category && <Tag color="blue">{course.category}</Tag>}
          {course.level && <Tag color="gray">{course.level}</Tag>}
          {typeof course.rating === "number" && course.rating > 0 && (
            <span className="text-xs font-semibold text-amber-600">★ {course.rating.toFixed(1)}</span>
          )}
        </div>

        <h1 className="mt-2 font-display text-2xl font-bold leading-tight">{course.title}</h1>
        {course.subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{course.subtitle}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {course.instructor && (
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {course.instructor}</span>
          )}
          {typeof course.students === "number" && (
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.students.toLocaleString()} enrolled</span>
          )}
          {lessonsTotal > 0 && (
            <span className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> {lessonsTotal} lessons</span>
          )}
        </div>

        {enrollment && (
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">Your progress</span>
              <span className="text-muted-foreground">{enrollment.progress ?? 0}%</span>
            </div>
            <ProgressBar value={enrollment.progress ?? 0} className="mt-1.5" />
          </div>
        )}

        {course.description && (
          <Card className="mt-4 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">About this course</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {course.description.replace(/<[^>]*>/g, "")}
            </p>
          </Card>
        )}

        {Array.isArray(course.what_youll_learn) && course.what_youll_learn.length > 0 && (
          <Card className="mt-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you'll learn</p>
            <ul className="mt-2 space-y-1.5">
              {(course.what_youll_learn as string[]).slice(0, 6).map((it, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="text-primary">✓</span>{it}</li>
              ))}
            </ul>
          </Card>
        )}

        {curriculum.length > 0 && (
          <Card className="mt-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Curriculum</p>
            <div className="mt-2 space-y-1.5">
              {curriculum.slice(0, 8).map((sec: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{sec.title ?? `Section ${i + 1}`}</p>
                  <span className="text-[11px] text-muted-foreground">{(sec.lessons ?? []).length ?? ""} lessons</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur pad-bottom-safe">
        {enrollment ? (
          <Btn size="lg" className="w-full rounded-2xl" onClick={() => navigate(`/course/${course.id}/learn`)}>
            {enrollment.progress ? "Continue learning" : "Start course"}
          </Btn>
        ) : (
          <Btn size="lg" loading={enrolling} className="w-full rounded-2xl" onClick={enroll}>
            {enrolling ? "Enrolling…" : course.price && Number(course.price) > 0 ? `Enroll · ${fmtMoney(course.price)}` : "Enroll free"}
          </Btn>
        )}
      </div>
    </div>
  );
}
