import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useUserEnrollments } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Clock, CalendarDays, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"in_progress" | "completed">("in_progress");

  const { data: enrollmentsRaw = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);
  const { data: allCourses = [], isLoading: loadingCourses } = useCourses();

  const enrollments = enrollmentsRaw.map((e: any) => ({
    courseId: e.course_id,
    progress: e.progress,
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

  // Derive estimated completion (fake math for UI parity with screenshot)
  const getSimulatedDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const currentCourses = activeTab === "in_progress" ? inProgressCourses : completedCourses;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ————— LEFT COLUMN (WIDGETS) ————— */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          
          {/* Today's Goals Widget */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Today's goals</h2>
            <div className="space-y-4 pl-1">
              <div className="flex items-start gap-3 group cursor-pointer">
                <Star className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <p className="text-sm text-primary font-medium underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary transition-all">
                  Complete any 3 learning items <span className="text-muted-foreground ml-1 no-underline font-normal">0/3</span>
                </p>
              </div>
              <div className="flex items-start gap-3 group cursor-pointer">
                <Star className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <p className="text-sm text-foreground font-medium underline decoration-border underline-offset-4 group-hover:decoration-foreground transition-all">
                  Practice with Coach
                </p>
              </div>
              <div className="flex items-start gap-3 group cursor-pointer">
                <Star className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <p className="text-sm text-foreground font-medium underline decoration-border underline-offset-4 group-hover:decoration-foreground transition-all">
                  Set up a learning plan
                </p>
              </div>
            </div>
          </div>

          {/* Learning Plan Widget (Calendar) */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Learning plan</h2>
            
            <div className="flex items-center gap-1.5 mb-4">
              {['M','T','W','T','F','S','S'].map((day, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className="w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground bg-muted/40 uppercase">
                    {day}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-foreground font-medium underline decoration-border underline-offset-4 hover:decoration-foreground cursor-pointer transition-all mb-6 inline-block">
              Set your learning plan
            </p>

            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm text-foreground">March 2026</span>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-muted rounded-md"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
                <button className="p-1 hover:bg-muted rounded-md"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-foreground/80">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Mo</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Tu</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">We</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Th</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Fr</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Sa</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Su</div>
              
              <div className="p-1.5 text-muted-foreground/40">23</div>
              <div className="p-1.5 text-muted-foreground/40">24</div>
              <div className="p-1.5 text-muted-foreground/40">25</div>
              <div className="p-1.5 text-muted-foreground/40">26</div>
              <div className="p-1.5 text-muted-foreground/40">27</div>
              <div className="p-1.5 text-muted-foreground/40">28</div>
              <div className="p-1.5 text-foreground">1</div>
              
              <div className="p-1.5 text-foreground">2</div>
              <div className="p-1.5 text-foreground">3</div>
              <div className="p-1.5 text-foreground">4</div>
              <div className="p-1.5 text-foreground">5</div>
              <div className="p-1.5 text-foreground">6</div>
              <div className="p-1.5 text-foreground">7</div>
              <div className="p-1.5 text-foreground">8</div>
            </div>
          </div>
          
        </div>

        {/* ————— RIGHT COLUMN (MAIN CONTENT) ————— */}
        <div className="lg:col-span-8 xl:col-span-9">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display text-foreground font-semibold tracking-tight">
              Good {timeOfDay}, {firstName}
            </h1>
            <p className="mt-2 text-foreground/80 text-base">
              Your career goal is to <span className="font-bold text-foreground">change roles</span> <button className="ml-2 text-sm text-primary font-semibold hover:underline">Edit goal</button>
            </p>
          </div>

          {/* Prompt Banner */}
          <div className="bg-[#f0f4f9]/60 dark:bg-muted/30 border border-transparent rounded-2xl p-4 sm:p-6 flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#e8f0fe] text-primary flex items-center justify-center shrink-0">
               <span className="text-xl">🎓</span>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-foreground font-medium text-sm sm:text-base">Let's get started! Which role(s) are you interested in?</span>
              <button className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">Select role</button>
            </div>
          </div>

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
                        <span className="text-xs font-semibold text-muted-foreground">{c.instructor || "Connecta"}</span>
                      </div>
                      
                      <Link to={`/courses/${c.id}`} className="block">
                        <h3 className="text-lg sm:text-xl font-bold font-display text-foreground group-hover:underline underline-offset-4 decoration-primary/50 transition-all mb-2">
                          {c.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                        <span>Course</span>
                        <span>·</span>
                        <span>{c.progress}% complete</span>
                        <span>·</span>
                        <span className="truncate">Estimated completion: {getSimulatedDate(index * 12 + 4)}</span>
                      </div>

                      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue-700 rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>

                    {/* Right: Next Action Context */}
                    <div className="rt-col md:w-64 lg:w-72 shrink-0 flex flex-col justify-center sm:border-l sm:border-border sm:pl-8">
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2">Next: {c.title.split(":")[0] || "Module 1"} Fundamentals</h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Video ({Math.floor(Math.random() * 10) + 2} minutes)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link to={`/courses/${c.id}`}>
                          <Button className="bg-[#0056D2] hover:bg-[#00419e] text-white font-bold px-6 h-9 transition-colors">
                            Resume
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
      
      {/* Help bubble overlay */}
      <div className="fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-white ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-md rounded-full flex items-center justify-center text-primary hover:bg-muted/50 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
