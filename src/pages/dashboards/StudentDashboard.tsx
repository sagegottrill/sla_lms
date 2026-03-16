import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Clock, TrendingUp, Award, ArrowRight,
  Target, Calendar, Star, Play, ChevronRight, Flame,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useUserEnrollments } from "@/hooks/useQueries";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const goalLabels: Record<string, string> = {
  switch: "Switch careers",
  advance: "Get promoted",
  freelance: "Start freelancing",
  startup: "Build a startup",
  skills: "Learn new skills",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-brand-card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold font-display text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { appUser } = useAuth();
  
  // Enterprise State Management: Direct Cache Subscription
  const { data: enrollmentsRaw = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);
  const { data: allCourses = [], isLoading: loadingCourses } = useCourses();
  
  // Format enrollments from Supabase response (which nests course_id logic)
  // Our backend returns flat items or nested courses(*) depending on the join.
  // For safety, we map it to match the existing UI expectations.
  const enrollments = enrollmentsRaw.map((e: any) => ({
    courseId: e.course_id,
    progress: e.progress,
  }));
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const greeting = `Good ${timeOfDay}, Professional`;

  const careerGoal = appUser?.onboarding?.careerGoal
    ? goalLabels[appUser.onboarding.careerGoal] || appUser.careerGoal || "Building new skills"
    : appUser?.careerGoal || "Building new skills";

  const inProgressCourses = useMemo(() => {
    if (enrollments.length > 0) {
      return enrollments.map((e) => {
        const course = allCourses.find((c) => c.id === e.courseId);
        return course
          ? { id: course.id, title: course.title, instructor: course.instructor, progress: e.progress, image: course.image, duration: course.duration, category: course.category }
          : null;
      }).filter(Boolean);
    }
    return [];
  }, [enrollments, allCourses]);

  const recommendations = useMemo(() => {
    const interests = appUser?.onboarding?.interests ?? [];
    const enrolledIds = new Set(enrollments.map((e) => e.courseId));
    const pool = interests.length > 0
      ? allCourses.filter((c) => interests.includes(c.category) && !enrolledIds.has(c.id))
      : allCourses.filter((c) => !enrolledIds.has(c.id));
    return pool.slice(0, 3).map((c) => ({
      id: c.id, title: c.title, category: c.category, rating: c.rating,
      price: c.price === 0 ? "Free" : `$${c.price}`, image: c.image,
    }));
  }, [appUser, enrollments]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {greeting}, {appUser?.name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-secondary shrink-0" />
              Goal: {careerGoal}
            </p>
          </div>
          <Link to="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-card text-primary-foreground text-sm font-semibold shadow-brand-sm hover:opacity-90 transition-opacity w-fit">
            Explore Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Courses Enrolled", value: enrollments.length, icon: BookOpen, color: "text-primary bg-accent" },
          { label: "Hours Learned", value: `${Math.round(enrollments.reduce((acc, e) => acc + (e.progress / 100 * 20), 0))}h`, icon: Clock, color: "text-secondary bg-accent" },
          { label: "Completed", value: enrollments.filter(e => e.progress === 100).length, icon: Award, color: "text-secondary bg-accent" },
          { label: "Avg Progress", value: `${Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / Math.max(enrollments.length, 1))}%`, icon: Flame, color: "text-primary bg-accent" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* In Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Continue Learning</h2>
            <Link to="/dashboard/courses" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(loadingCourses || loadingEnrollments) ? (
              // Exact-dimension Skeletons for Course Cards to prevent layout shift
              [...Array(2)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4 flex gap-4 h-[88px]">
                  <Skeleton className="w-20 h-14 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-1/4 rounded bg-muted/60" />
                    <Skeleton className="h-5 w-3/4 rounded bg-muted/60" />
                    <Skeleton className="h-2 w-full rounded-full mt-2" />
                  </div>
                </div>
              ))
            ) : inProgressCourses.length > 0 ? (
              inProgressCourses.map((course, i) => (
                <Link key={course.id} to={`/courses/${course.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-2xl border border-border p-4 flex gap-4 hover:shadow-brand-sm transition-shadow cursor-pointer group h-[88px]"
                  >
                    <img src={course.image} alt={course.title} className="w-20 h-14 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs text-secondary font-medium">{course.category}</span>
                          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                          <p className="text-xs text-muted-foreground">{course.instructor}</p>
                        </div>
                        <span className="shrink-0 w-8 h-8 rounded-full gradient-card flex items-center justify-center shadow-brand-sm">
                          <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{course.progress}%</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <p className="text-muted-foreground text-sm">You haven't enrolled in any courses yet.</p>
                <Link to="/courses" className="text-primary font-medium text-sm hover:underline mt-2 inline-block">Browse Catalog</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Deadlines */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Upcoming
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((d) => (
                <div key={d.title} className="flex gap-3 text-sm">
                  <span className={`mt-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                    d.type === "Quiz" ? "bg-accent text-accent-foreground" :
                    d.type === "Live" ? "bg-accent text-primary" : "bg-accent text-primary"
                  }`}>{d.type}</span>
                  <div>
                    <p className="text-foreground font-medium line-clamp-1">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" /> Recommended for You
            </h3>
            {appUser?.onboarding?.interests && appUser.onboarding.interests.length > 0 && (
              <p className="text-[10px] text-muted-foreground mb-4">Based on your interests in {appUser.onboarding.interests.slice(0, 2).join(", ")}</p>
            )}
            {(!appUser?.onboarding?.interests || appUser.onboarding.interests.length === 0) && (
              <p className="text-[10px] text-muted-foreground mb-4">Top rated courses for you</p>
            )}
            <div className="space-y-3">
              {loadingCourses ? (
                // Recommendations Skeletons
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 h-[40px]">
                    <Skeleton className="w-14 h-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-3 w-3/4 rounded" />
                      <Skeleton className="h-2 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              ) : recommendations.length > 0 ? (
                recommendations.map((r) => (
                  <Link key={r.id} to={`/courses/${r.id}`} className="flex gap-3 cursor-pointer group">
                    <img src={r.image} alt={r.title} className="w-14 h-10 rounded-lg object-cover shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 text-gold fill-gold" />
                        <span className="text-xs text-muted-foreground">{r.rating}</span>
                        <span className="text-xs font-semibold text-foreground">{r.price}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                 <p className="text-xs text-muted-foreground py-4 text-center">You're enrolled in everything! Nice work.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
