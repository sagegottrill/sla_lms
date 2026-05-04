import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Eye, 
  EyeOff,
  MoreVertical,
  BookOpen,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Course {
  id: number;
  title: string;
  total_students?: number;
  engagement_score?: number;
  published?: boolean;
  created_at?: string;
}

interface ListViewDashboardProps {
  courses: Course[];
  onPublishToggle?: (courseId: number) => void;
  onDuplicate?: (courseId: number) => void;
  onArchive?: (courseId: number) => void;
}

export default function ListViewDashboard({ 
  courses,
  onPublishToggle,
  onDuplicate,
  onArchive,
}: ListViewDashboardProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center p-12 bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-foreground font-semibold mb-2">No courses yet</p>
        <p className="text-sm text-muted-foreground mb-6">
          Create your first course to start teaching.
        </p>
        <Link to="/instructor/courses/new">
          <Button className="font-bold px-8" size="lg">
            Create Course
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-5">Course</div>
        <div className="col-span-2 hidden md:block">Students</div>
        <div className="col-span-2 hidden lg:block">Engagement</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3 md:col-span-1">Actions</div>
      </div>

      {/* Course List */}
      <div className="divide-y divide-border">
        {courses.map((course) => (
          <div
            key={course.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors items-center"
          >
            {/* Course Title */}
            <div className="col-span-5">
              <Link
                to={`/instructor/courses/${course.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
              >
                {course.title}
              </Link>
              <div className="flex items-center gap-3 mt-1 md:hidden text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {course.total_students || 0}
                </span>
              </div>
            </div>

            {/* Students */}
            <div className="col-span-2 hidden md:flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {course.total_students || 0}
              </span>
            </div>

            {/* Engagement Score */}
            <div className="col-span-2 hidden lg:flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {course.engagement_score ? `${Math.round(course.engagement_score)}%` : 'N/A'}
              </span>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                {course.published ? (
                  <>
                    <Eye className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Published</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Draft</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-3 md:col-span-1 flex items-center justify-end gap-2">
              <Link to={`/instructor/courses/${course.id}`}>
                <Button size="sm" variant="outline" className="font-semibold">
                  Manage
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPublishToggle?.(course.id)}>
                    {course.published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate?.(course.id)}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onArchive?.(course.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
