import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, ChevronRight, Search, Users, X, PlayCircle, GraduationCap } from "lucide-react";
import { api, formatEnrollmentError } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { Btn, Card, Empty, Input, PageLoader, ProgressBar, Spinner, Tag } from "@kit";
import { errorText, fmtDate, fmtMoney, friendlyError } from "@kit";

/**
 * MY COURSES TAB — every enrollment with real progress, plus a searchable
 * catalog with one-tap enrollment. Detail sheets open inline via ?open=.
 */
export default function MyCourses() {
  const { appUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const view = params.get("view") ?? "my";
  const openId = params.get("open");

  const { data: enrollments, isLoading } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile", appUser?.id],
    queryFn: () => api.getUserEnrollments(appUser!.id),
    enabled: !!appUser && view === "my",
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { data: catalog, isLoading: loadingCatalog } = useQuery({
    queryKey: [...queryKeys.courses.base, "mobile-catalog", q],
    queryFn: () => api.searchCourses(q),
    enabled: view === "catalog",
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const rows = useMemo(() => {
    const list = (enrollments ?? []).filter((e: any) => e.status !== "dropped");
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((e: any) => (e.courses?.title ?? "").toLowerCase().includes(needle));
  }, [enrollments, q]);

  const openEnrollment = rows.find((e: any) => String(e.id) === String(openId));

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">My Learning</h1>
          <div className="flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
            {(["my", "catalog"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setParams(v === "my" ? {} : { view: v })}
                className={`rounded-md px-3 py-1.5 transition-colors ${view === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
              >
                {v === "my" ? "Continue" : "Browse"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-2.5">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={view === "my" ? "Search your courses…" : "Search the catalog…"}
            className="pl-11"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
          />
        </div>
      </div>

      <div className="px-4 pb-4 pt-4">
        {view === "my" ? (
          isLoading ? (
            <PageLoader label="Loading your courses…" />
          ) : rows.length === 0 ? (
            <Empty
              icon={BookOpen}
              title={q ? "No matching course" : "No courses yet"}
              sub={q ? "Try a different search." : "Browse the catalog and enroll — your progress syncs here."}
            />
          ) : (
            <div className="space-y-3">
              {rows.map((e: any) => (
                <Card key={e.id} onClick={() => setParams({ open: String(e.id) })} className="p-3.5">
                  <div className="flex gap-3">
                    {e.courses?.image ? (
                      <img src={e.courses.image} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{e.courses?.title ?? "Course"}</p>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={e.progress ?? 0} className="h-1.5 flex-1" />
                        <span className="text-[11px] font-semibold text-muted-foreground">{e.progress ?? 0}%</span>
                      </div>
                      <div className="mt-1.5 text-[11px] text-muted-foreground">
                        {(e.progress ?? 0) >= 100 ? "Completed 🎉" : `Last accessed ${fmtDate(e.last_accessed)}`}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : loadingCatalog ? (
          <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
        ) : (catalog ?? []).length === 0 ? (
          <Empty icon={Search} title="No courses found" sub="Try another search term." />
        ) : (
          <div className="space-y-3">
            {(catalog ?? []).map((c) => (
              <Card key={c.id} onClick={() => setParams({ open: `catalog:${c.id}` })} className="p-3.5">
                <div className="flex gap-3">
                  {c.image ? (
                    <img src={c.image} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary/60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{c.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {c.category && <Tag color="violet">{c.category}</Tag>}
                      {typeof c.rating === "number" && c.rating > 0 && (
                        <span className="text-[11px] font-semibold text-amber-600">★ {c.rating.toFixed(1)}</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {c.price && Number(c.price) > 0 ? fmtMoney(c.price) : "Free"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* enrollment detail sheet */}
      {openEnrollment && (
        <CourseSheet
          enrollment={openEnrollment}
          course={openEnrollment.courses}
          onClose={() => setParams({})}
        />
      )}

      {/* catalog detail sheet */}
      {typeof openId === "string" && openId.startsWith("catalog:") && (
        <CatalogSheet courseId={Number(openId.slice("catalog:".length))} onClose={() => setParams({})} />
      )}
    </div>
  );
}

/* ───────────────────────────── Enrollment sheet ───────────────────────────── */

function CourseSheet({ enrollment, course, onClose }: { enrollment: any; course: any; onClose: () => void }) {
  const navigate = useNavigate();
  const progress = enrollment.progress ?? 0;
  const curriculum: any[] = Array.isArray(course?.curriculum) ? course.curriculum : [];

  return (
    <Sheet onClose={onClose}>
      {course?.image && <img src={course.image} alt="" className="h-40 w-full object-cover" />}
      <div className="p-5">
        <Tag color="blue">{course?.category ?? "Course"}</Tag>
        <h2 className="mt-2 font-display text-xl font-bold leading-tight">{course?.title}</h2>
        {course?.instructor && <p className="mt-1 text-sm text-muted-foreground">by {course.instructor}</p>}

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <ProgressBar value={progress} className="mt-2" />
        </div>

        {curriculum.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Curriculum</p>
            <div className="mt-2 space-y-1.5">
              {curriculum.slice(0, 6).map((sec: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                  <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{sec.title ?? `Section ${i + 1}`}</p>
                  <span className="text-[11px] text-muted-foreground">{(sec.lessons ?? []).length ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Btn size="lg" className="mt-6 w-full rounded-2xl" onClick={() => navigate(`/course/${course.id}/learn`)}>
          {progress > 0 && progress < 100 ? "Continue learning" : progress >= 100 ? "Review course" : "Start course"}
        </Btn>
      </div>
    </Sheet>
  );
}

/* ─────────────────────────────── Catalog sheet ────────────────────────────── */

function CatalogSheet({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: [...queryKeys.courses.base, "mobile-detail", courseId],
    queryFn: () => api.getCourseById(courseId),
    select: (r) => (r.success ? r.data : undefined),
  });

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
      onClose();
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : (
        <>
          {course?.image && <img src={course.image} alt="" className="h-40 w-full object-cover" />}
          <div className="p-5">
            <div className="flex items-center gap-2">
              {course?.category && <Tag color="blue">{course.category}</Tag>}
              {course?.level && <Tag color="gray">{course.level}</Tag>}
            </div>
            <h2 className="mt-2 font-display text-xl font-bold leading-tight">{course?.title}</h2>
            {course?.subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{course.subtitle}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {course?.instructor && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> {course.instructor}
                </span>
              )}
              {typeof course?.students === "number" && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {course.students.toLocaleString()} enrolled
                </span>
              )}
            </div>

            {course?.description && (
              <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-foreground/85">
                {course.description.replace(/<[^>]*>/g, "")}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/70 p-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Price</p>
                <p className="font-display text-lg font-bold">
                  {course?.price && Number(course.price) > 0 ? fmtMoney(course.price) : "Free"}
                </p>
              </div>
              {typeof course?.duration === "string" && course.duration && (
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Duration</p>
                  <p className="font-semibold">{course.duration}</p>
                </div>
              )}
            </div>

            <Btn size="lg" loading={enrolling} className="mt-4 w-full rounded-2xl" onClick={enroll}>
              {enrolling ? "Enrolling…" : course?.price && Number(course.price) > 0 ? `Enroll · ${fmtMoney(course.price)}` : "Enroll free"}
            </Btn>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Paid courses: complete payment on the web app, then your enrollment syncs here automatically.
            </p>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ──────────────────────────────── Sheet shell ─────────────────────────────── */

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-3xl bg-card pb-10"
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
