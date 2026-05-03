import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useUserEnrollments } from "@/hooks/useQueries";
import { coursePathSegment } from "@/lib/publicRoutes";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Clock, GraduationCap, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ToDoListWidget from "@/components/dashboard/ToDoListWidget";
import RecentFeedbackWidget from "@/components/dashboard/RecentFeedbackWidget";
import GlobalAnnouncement from "@/components/dashboard/GlobalAnnouncement";
import CalendarWidget from "@/components/dashboard/CalendarWidget";

export default function StudentDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"in_progress" | "completed">("in_progress");
  const navigate = useNavigate();

  const { data: enrollmentsRaw = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);
  const { data: allCourses = [], isLoading: loadingCourses } = useCourses({ publishedOnly: true });

  // Ensure enrollmentsRaw is always an array before mapping
  const safeEnrollmentsRaw = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];
  
  const enrollments = safeEnrollmentsRaw.map((e: any) => ({
    courseId: e.course_id,
    progress: Number(e.progress ?? 0),
  }));

  const inProgressCourses = useMemo(() => {
    return enrollments
      .filter(e => e.progress < 100)
      .map((e) => {
        const c = allCourses.find(course => course.id === e.courseId);
        return c ? { ...c, progress: e.progress } : null;
      }).filter(Boolean);
  }, [enrollments, allCourses]);

  const completedCourses = useMemo(() => {
    return enrollments
      .filter(e => e.progress >= 100)
      .map((e) => {
        const c = allCourses.find(course => course.id === e.courseId);
        return c ? { ...c, progress: e.progress } : null;
      }).filter(Boolean);
  }, [enrollments, allCourses]);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = appUser?.name?.split(" ")[0] || "Professional";
  const careerGoal = appUser?.careerGoal?.trim();
  const onboardingDone = appUser?.onboarding?.completed;

  // Estimate remaining time based on real progress (no fabricated timeseries required).
  const getEstimatedCompletionDate = (progress: number) => {
    const safe = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
    const remainingRatio = (100 - safe) / 100; // 0..1
    const estimatedDays = Math.max(3, Math.round(remainingRatio * 90)); // 3..90
    const d = new Date();
    d.setDate(d.getDate() + estimatedDays);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const currentCourses = activeTab === "in_progress" ? inProgressCourses : completedCourses;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 h-full min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* ————— LEFT COLUMN (WIDGETS) ————— */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-8">
          
          {/* To-Do List Widget */}
          {appUser?.id && <ToDoListWidget userId={appUser.id} limit={7} />}

          {/* Recent Feedback Widget */}
          {appUser?.id && <RecentFeedbackWidget userId={appUser.id} limit={5} />}

          {/* Functional Calendar Widget */}
          {appUser?.id && <CalendarWidget userId={appUser.id} />}
          
        </div>

        {/* ————— RIGHT COLUMN (MAIN CONTENT) ————— */}
        <div className="lg:col-span-8 xl:col-span-9">
          
          {/* Global Announcements */}
          {appUser?.id && <GlobalAnnouncement userId={appUser.id} />}
          
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-display text-foreground font-semibold tracking-tight">
              Good {timeOfDay}, {firstName}
            </h1>
            <p className="mt-2 text-foreground/80 text-base">
              {careerGoal ? (
                <>
                  Your career goal:{" "}
                  <span className="font-bold text-foreground">{careerGoal}</span>{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/settings")}
                    className="ml-2 text-sm text-primary font-semibold hover:text-primary/90 transition-colors"
                  >
                    Edit in settings
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">Set your career goal in settings to personalize reminders.</span>{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/settings")}
                    className="text-sm text-primary font-semibold hover:text-primary/90 transition-colors"
                  >
                    Add goal
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Simplified onboarding banner - dismissible */}
          {appUser?.role === "student" && !onboardingDone && (
            <div className="bg-primary/5 dark:bg-muted/30 border border-border/20 rounded-xl p-3 flex items-center gap-3 mb-4">
              <GraduationCap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground flex-1">
                Complete your profile setup
              </span>
              <button
                type="button"
                onClick={() => navigate("/onboarding")}
                className="text-xs font-semibold text-primary hover:text-primary/90 whitespace-nowrap transition-colors px-3 py-1 rounded-lg hover:bg-primary/10"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {/* TODO: Implement dismiss */}}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pill Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={() => setActiveTab("in_progress")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "in_progress" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-foreground bg-transparent hover:bg-muted border border-transparent hover:border-border"}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setActiveTab("completed")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "completed" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-foreground bg-transparent hover:bg-muted border border-transparent hover:border-border"}`}
            >
              Completed
            </button>
          </div>

          {/* Loading State */}
          {(loadingEnrollments || loadingCourses) && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-4 py-2">
                    <Skeleton className="h-5 w-1/3 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <div className="sm:w-64 space-y-3 py-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Courses List */}
          {!loadingEnrollments && !loadingCourses && (
            <div className="space-y-4">
              {currentCourses.length === 0 ? (
                <div className="text-center p-12 bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl">
                  <p className="text-foreground font-semibold mb-2">No courses {activeTab === "completed" ? "completed" : "in progress"}</p>
                  <p className="text-sm text-muted-foreground mb-6">Explore the catalog to find your next learning journey.</p>
                  <Link to="/courses">
                    <Button className="font-bold px-8" size="lg">Browse Catalog</Button>
                  </Link>
                </div>
              ) : (
                currentCourses.map((c: any, index: number) => (
                  <div key={c.id} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 sm:p-6 flex flex-col md:flex-row gap-6 sm:gap-8 group hover:border-border transition-colors">
                    
                    {/* Left: Course Metas */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Instructor / Org name strictly mimicking the tiny Coursera label */}
                        <div className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground tracking-wider uppercase">SLA</div>
                        <span className="text-xs font-semibold text-muted-foreground">{c.instructor || "CONNECT HER"}</span>
                      </div>
                      
                      <Link to={`/courses/${coursePathSegment(c)}`} className="block">
                        <h3 className="text-lg sm:text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors mb-2">
                          {c.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                        <span>Course</span>
                        <span>·</span>
                        <span>{c.progress}% complete</span>
                        <span>·</span>
                        <span className="truncate">Estimated completion: {getEstimatedCompletionDate(c.progress)}</span>
                      </div>

                      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue-700 rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>

                    {/* Right: Next Action Context */}
                    <div className="rt-col md:w-64 lg:w-72 shrink-0 flex flex-col justify-center sm:border-l sm:border-border sm:pl-8">
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                          {c.progress === 0 ? "Start learning" : `${c.progress}% complete — keep going`}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{c.duration || "Self-paced"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link to={`/courses/${coursePathSegment(c)}`}>
                          <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-9 transition-colors">
                            {c.progress === 0 ? "Start" : "Resume"}
                          </Button>
                        </Link>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

