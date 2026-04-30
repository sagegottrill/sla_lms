import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInstructorStats, useInstructorCourses } from "@/hooks/useQueries";
import { coursePathSegment } from "@/lib/publicRoutes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Users, DollarSign, Star, TrendingUp, HelpCircle, 
  Settings, ChevronRight, Edit, LineChart, MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function InstructorDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");

  const { data: statsData, isLoading: loadingStats } = useInstructorStats(appUser?.id ?? "");
  const { data: courses = [], isLoading: loadingCourses } = useInstructorCourses(appUser?.id ?? "");

  const publishedCourses = courses.filter((c) => c.status === "published");
  const draftCourses = courses.filter((c) => c.status !== "published");

  const currentCourses = activeTab === "published" ? publishedCourses : draftCourses;

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = appUser?.name?.split(" ")[0] || "Instructor";

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 h-full min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* ————— LEFT COLUMN (WIDGETS) ————— */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-8">
          
          {/* Action Center */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Command Center</h2>
            <div className="space-y-4 pl-1">
              <Link to="/dashboard/courses/new" className="flex items-start gap-3 group cursor-pointer block">
                <Plus className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <p className="text-sm text-foreground font-medium transition-colors group-hover:text-primary">
                  Create a new course
                </p>
              </Link>
              <Link to="/dashboard/earnings" className="flex items-start gap-3 group cursor-pointer block">
                <LineChart className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <p className="text-sm text-foreground font-medium transition-colors group-hover:text-primary">
                  View payout reports
                </p>
              </Link>
              <Link to="/dashboard/profile" className="flex items-start gap-3 group cursor-pointer block">
                <Settings className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <p className="text-sm text-foreground font-medium transition-colors group-hover:text-primary">
                  Edit educator profile
                </p>
              </Link>
            </div>
          </div>

          {/* Core Analytics Widget (Minimalist) */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Global Reach</h2>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Learners</p>
                {loadingStats ? <Skeleton className="h-6 w-20" /> : (
                  <p className="text-2xl font-light text-foreground">{(statsData?.totalStudents ?? 0).toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Avg. Course Rating</p>
                {loadingStats ? <Skeleton className="h-6 w-16" /> : (
                  <p className="text-2xl font-light text-foreground flex items-center gap-2">
                    {statsData?.avgRating ?? "0.0"} <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Payouts</p>
                {loadingStats ? <Skeleton className="h-6 w-24" /> : (
                  <p className="text-2xl font-bold text-primary">₦{(statsData?.totalRevenue ?? 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* ————— RIGHT COLUMN (MAIN CONTENT) ————— */}
        <div className="lg:col-span-8 xl:col-span-9">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-display text-foreground font-semibold tracking-tight">
              Good {timeOfDay}, {firstName}
            </h1>
            <p className="mt-2 text-foreground/80 text-base">
              You currently manage <span className="font-bold text-foreground">{courses.length} courses</span> natively on CONNECT HER.
            </p>
          </div>

          {/* Pill Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-2">
            <button 
              onClick={() => setActiveTab("published")}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === "published" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-foreground bg-transparent hover:bg-muted/80"}`}
            >
              Published ({publishedCourses.length})
            </button>
            <button 
              onClick={() => setActiveTab("drafts")}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === "drafts" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-foreground bg-transparent hover:bg-muted/80"}`}
            >
              Drafts ({draftCourses.length})
            </button>
          </div>

          {/* Loading State */}
          {loadingCourses && (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-4 py-2">
                    <Skeleton className="h-5 w-1/3 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <div className="sm:w-32 space-y-3 py-2 flex flex-col items-end">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Courses List */}
          {!loadingCourses && (
            <div className="space-y-4">
              {currentCourses.length === 0 ? (
                <div className="text-center p-12 bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl flex flex-col items-center">
                  <p className="text-foreground font-semibold mb-2">No {activeTab} courses found</p>
                  <p className="text-sm text-muted-foreground mb-6">Build your curriculum and share your expertise.</p>
                  <Link to="/dashboard/courses/new">
                    <Button className="bg-primary hover:bg-primary/90 font-bold px-8" size="lg">Create Course</Button>
                  </Link>
                </div>
              ) : (
                currentCourses.map((c) => (
                  <div key={c.id} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 sm:p-6 flex flex-col sm:flex-row gap-6 hover:border-border transition-colors group">
                    
                    {/* Image Thumbnail (Minimal) */}
                    {c.image && (
                      <div className="hidden sm:block w-32 shrink-0">
                         <img src={c.image} alt={c.title} className="w-full h-20 object-cover rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0" />
                      </div>
                    )}

                    {/* Left: Course Metas */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Link to={`/courses/${coursePathSegment(c)}`} className="block">
                        <h3 className="text-lg font-bold font-display text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-1">
                          {c.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground/80">{(c.students || 0).toLocaleString()} learners</span>
                        <span className="mx-1">·</span>
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground/80">₦{(c.revenue || 0).toLocaleString()} rev</span>
                        {c.rating && c.rating > 0 && (
                          <>
                            <span className="mx-1">·</span>
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-foreground/80">{c.rating}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="shrink-0 flex items-center gap-3 sm:border-l sm:border-border sm:pl-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                            aria-label={`Open actions for ${c.title}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem asChild className="cursor-pointer font-medium text-xs py-2">
                            <Link
                              to={`/dashboard/courses/new?edit=${c.id}`}
                              className="flex items-center justify-between gap-2"
                            >
                              Manage
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}
          
        </div>
      </div>
      
      {/* Help bubble overlay */}
      <div className="hidden md:block fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-white ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-md rounded-full flex items-center justify-center text-primary hover:bg-muted/50 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

