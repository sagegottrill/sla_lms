import { useCourseAnalytics } from '@/hooks/useCourseAnalytics';
import { BarChart3, Users, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface CourseAnalyticsWidgetProps {
  instructorId: string;
  limit?: number;
}

export default function CourseAnalyticsWidget({ instructorId, limit = 5 }: CourseAnalyticsWidgetProps) {
  const { data: analytics = [], isLoading } = useCourseAnalytics(instructorId);

  const displayAnalytics = limit ? analytics.slice(0, limit) : analytics;
  const hasMore = analytics.length > (limit || 0);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEngagementBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-50 dark:bg-green-950/20';
    if (score >= 50) return 'bg-orange-50 dark:bg-orange-950/20';
    return 'bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-lg text-foreground">Course Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {analytics.length === 0 ? 'No courses yet' : `Performance across ${analytics.length} course${analytics.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* Analytics List */}
      {analytics.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No courses yet</p>
          <p className="text-xs text-muted-foreground mb-4">Create your first course to see analytics</p>
          <Link
            to="/instructor/courses/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create Course
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAnalytics.map((course) => {
            const engagementScore = Math.round(course.engagement_score);
            const activeRate = course.total_students > 0 
              ? Math.round((course.active_students / course.total_students) * 100)
              : 0;

            return (
              <Link
                key={course.course_id}
                to={`/instructor/courses/${course.course_id}/analytics`}
                className="block p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
              >
                {/* Course Title & Engagement Score */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
                    {course.course_title}
                  </h3>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${getEngagementBgColor(engagementScore)}`}>
                    <TrendingUp className={`w-3 h-3 ${getEngagementColor(engagementScore)}`} />
                    <span className={`text-xs font-semibold ${getEngagementColor(engagementScore)}`}>
                      {engagementScore}%
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Total Students */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Students</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{course.total_students}</p>
                  </div>

                  {/* Active Rate */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{activeRate}%</p>
                  </div>

                  {/* At Risk */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">At Risk</span>
                    </div>
                    <p className={`text-sm font-semibold ${course.at_risk_students > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {course.at_risk_students}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Avg Progress</span>
                    <span className="text-xs font-medium text-foreground">{Math.round(course.avg_progress)}%</span>
                  </div>
                  <Progress value={course.avg_progress} className="h-1.5" />
                </div>
              </Link>
            );
          })}

          {/* View All Link */}
          {hasMore && (
            <Link
              to="/instructor/analytics"
              className="block text-center py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all {analytics.length} courses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
