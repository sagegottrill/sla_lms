import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstructorCourses, useCourses } from "@/hooks/useQueries";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, DollarSign, Star, Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstructorCoursesPage() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const isStaffCatalog =
    appUser?.role === "admin" || appUser?.role === "program_manager";

  const { data: allCourses = [], isLoading: loadingAll } = useCourses({
    publishedOnly: false,
  });
  const { data: myCourses = [], isLoading: loadingMine } = useInstructorCourses(
    isStaffCatalog ? undefined : appUser?.id
  );

  const courses = isStaffCatalog ? allCourses : myCourses;
  const isLoading = isStaffCatalog ? loadingAll : loadingMine;

  const filtered = useMemo(
    () =>
      courses.filter((c) =>
        (c.title ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [courses, search]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">
            {isStaffCatalog ? "All courses" : "My courses"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? "Syncing curriculum..."
              : isStaffCatalog
                ? `${courses.length} course${courses.length === 1 ? "" : "s"} on the platform (published and draft).`
                : `${courses.length} courses managed by you.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/dashboard/courses/new')}
            className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors"
          >
            Create New Course
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm">
            All Content
          </div>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={isStaffCatalog ? "Search all courses..." : "Search your library..."}
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" 
          />
        </div>
      </div>

      {/* Roster / Table */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" />
            <p className="text-sm">Fetching catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card/20">
             <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
             <p className="text-foreground font-medium mb-1">No courses found</p>
             <p className="text-sm text-muted-foreground">
               {isStaffCatalog
                 ? "No courses in the database yet, or your account cannot read the courses table."
                 : "Start building your curriculum today."}
             </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/20 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Course</th>
                  {isStaffCatalog && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                      Listed instructor
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Metrics</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{course.category || "General"}</span>
                         <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                           {course.title}
                         </h3>
                      </div>
                    </td>
                    {isStaffCatalog && (
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-[180px]">
                        <span className="line-clamp-2" title={String((course as { instructor?: string }).instructor ?? "")}>
                          {(course as { instructor?: string }).instructor || "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize ${
                        course.status === "published" 
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(course.students || 0).toLocaleString()}</span>
                        {(course.rating || 0) > 0 && <span className="flex items-center gap-1 text-foreground/80"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {course.rating}</span>}
                        {(course.revenue || 0) > 0 && <span className="flex items-center gap-1 font-semibold text-[#0056D2]"><DollarSign className="w-3 h-3" /> {(course.revenue || 0).toLocaleString()}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/courses/new?edit=${course.id}`}>
                        <Button variant="outline" className="h-8 px-4 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          Manage
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
