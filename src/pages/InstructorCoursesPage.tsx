import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstructorCourses, useCourses, useDeleteCourseMutation } from "@/hooks/useQueries";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, DollarSign, Star, Plus, Search, Loader2, EyeOff, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { coursePathSegment } from "@/lib/publicRoutes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InstructorCoursesPage() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [updatingCourseId, setUpdatingCourseId] = useState<number | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<{ id: number; title: string } | null>(null);

  const deleteMutation = useDeleteCourseMutation();

  const isStaffCatalog =
    appUser?.role === "admin" || appUser?.role === "program_manager";
  const isAdmin = appUser?.role === "admin";

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

  const handleTogglePublish = async (courseId: number, currentStatus: string) => {
    if (!isAdmin) {
      toast.error("Only admins can unpublish courses");
      return;
    }

    const newStatus = currentStatus === "published" ? "draft" : "published";
    const action = newStatus === "published" ? "Publishing" : "Unpublishing";

    setUpdatingCourseId(courseId);
    
    try {
      const response = await api.updateCourse(courseId, { status: newStatus });
      
      if (response.success) {
        toast.success(`Course ${newStatus === "published" ? "published" : "unpublished"} successfully`);
        // Invalidate queries to refresh the course list
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
      } else {
        toast.error(`Failed to ${action.toLowerCase()} course: ${response.error}`);
      }
    } catch (error: any) {
      toast.error(`Error ${action.toLowerCase()} course: ${error.message}`);
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(courseToDelete.id);
      setCourseToDelete(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

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
            className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0 transition-colors"
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
                {filtered.map((course) => {
                  const courseHref = `/courses/${coursePathSegment(course)}`;
                  return (
                  <tr key={course.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={courseHref} className="flex flex-col rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{course.category || "General"}</span>
                         <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                           {course.title}
                         </h3>
                      </Link>
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
                        {(course.revenue || 0) > 0 && <span className="flex items-center gap-1 font-semibold text-primary"><DollarSign className="w-3 h-3" /> {(course.revenue || 0).toLocaleString()}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link to={courseHref}>
                          <Button variant="outline" className="h-8 px-4 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted">
                            Preview
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTogglePublish(course.id, course.status || "draft")}
                            disabled={updatingCourseId === course.id}
                            className="h-8 px-3 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted"
                            title={course.status === "published" ? "Unpublish course" : "Publish course"}
                          >
                            {updatingCourseId === course.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : course.status === "published" ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Publish
                              </>
                            )}
                          </Button>
                        )}
                        <Link to={`/dashboard/courses/new?edit=${course.id}`}>
                          <Button variant="outline" className="h-8 px-4 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted">
                            Manage
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCourseToDelete({ id: course.id, title: course.title })}
                          disabled={deleteMutation.isPending}
                          className="h-8 px-3 text-xs font-semibold rounded-md border-destructive/20 bg-transparent hover:bg-destructive/10 hover:text-destructive text-destructive/80"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong className="text-foreground">"{courseToDelete?.title}"</strong>?
              <br /><br />
              This action cannot be undone. All course content, enrollments, and associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
