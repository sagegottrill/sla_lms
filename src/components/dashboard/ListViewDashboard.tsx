import { Link } from 'react-router-dom';
import { coursePathSegment } from '@/lib/publicRoutes';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Course {
  id: number;
  title: string;
  instructor?: string;
  progress: number;
  duration?: string;
}

interface ListViewDashboardProps {
  courses: Course[];
  activeTab: 'in_progress' | 'completed';
}

export default function ListViewDashboard({ courses, activeTab }: ListViewDashboardProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center p-12 bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl">
        <p className="text-foreground font-semibold mb-2">
          No courses {activeTab === 'completed' ? 'completed' : 'in progress'}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Explore the catalog to find your next learning journey.
        </p>
        <Link to="/courses">
          <Button className="font-bold px-8" size="lg">
            Browse Catalog
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
        <div className="col-span-2 hidden md:block">Instructor</div>
        <div className="col-span-2">Progress</div>
        <div className="col-span-2 hidden lg:block">Duration</div>
        <div className="col-span-3 md:col-span-1">Action</div>
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
                to={`/courses/${coursePathSegment(course)}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
              >
                {course.title}
              </Link>
              <div className="flex items-center gap-2 mt-1 md:hidden">
                <span className="text-xs text-muted-foreground">
                  {course.instructor || 'SLA'}
                </span>
              </div>
            </div>

            {/* Instructor */}
            <div className="col-span-2 hidden md:block">
              <span className="text-sm text-muted-foreground">
                {course.instructor || 'SLA'}
              </span>
            </div>

            {/* Progress */}
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                {course.progress === 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground mb-1">
                    {course.progress}%
                  </div>
                  <Progress value={course.progress} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="col-span-2 hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{course.duration || 'Self-paced'}</span>
            </div>

            {/* Action */}
            <div className="col-span-3 md:col-span-1">
              <Link to={`/courses/${coursePathSegment(course)}`}>
                <Button size="sm" className="w-full md:w-auto font-semibold">
                  {course.progress === 0 ? 'Start' : 'Resume'}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
