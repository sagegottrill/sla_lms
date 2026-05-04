import { useUpcomingDeadlines } from '@/hooks/useUpcomingDeadlines';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface UpcomingDeadlinesWidgetProps {
  instructorId: string;
  limit?: number;
  days?: number;
}

export default function UpcomingDeadlinesWidget({ 
  instructorId, 
  limit = 7,
  days = 14 
}: UpcomingDeadlinesWidgetProps) {
  const { data: deadlines = [], isLoading } = useUpcomingDeadlines(instructorId, days);

  const displayDeadlines = limit ? deadlines.slice(0, limit) : deadlines;
  const hasMore = deadlines.length > (limit || 0);

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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-lg text-foreground">Upcoming Deadlines</h2>
          <p className="text-sm text-muted-foreground">
            {deadlines.length === 0 ? 'No deadlines in next 14 days' : `${deadlines.length} deadline${deadlines.length === 1 ? '' : 's'} in next ${days} days`}
          </p>
        </div>
      </div>

      {/* Deadlines List */}
      {deadlines.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No upcoming deadlines</p>
          <p className="text-xs text-muted-foreground">All assignments are scheduled beyond {days} days</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayDeadlines.map((deadline) => {
            const daysUntil = differenceInDays(new Date(deadline.due_date), new Date());
            const isUrgent = daysUntil <= 2;
            const isSoon = daysUntil <= 5;
            const submissionRate = deadline.expected_submissions > 0
              ? Math.round((deadline.received_submissions / deadline.expected_submissions) * 100)
              : 0;

            return (
              <Link
                key={deadline.lesson_id}
                to={`/instructor/courses/${deadline.course_id}/assignments/${deadline.lesson_id}`}
                className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
              >
                <div className="flex items-start gap-3">
                  {/* Date Badge */}
                  <div className={`shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                    isUrgent 
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                      : isSoon
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                      : 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400'
                  }`}>
                    <span className="text-xs font-medium uppercase">
                      {format(new Date(deadline.due_date), 'MMM')}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {format(new Date(deadline.due_date), 'd')}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {deadline.assignment_title}
                      </h3>
                      {isUrgent && (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" title="Due soon!" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {deadline.course_title}
                    </p>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(deadline.due_date), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className={`font-medium ${
                          submissionRate >= 80 
                            ? 'text-green-600 dark:text-green-400'
                            : submissionRate >= 50
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {deadline.received_submissions}/{deadline.expected_submissions}
                        </span>
                        <span className="text-muted-foreground">({submissionRate}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* View All Link */}
          {hasMore && (
            <Link
              to="/instructor/deadlines"
              className="block text-center py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all {deadlines.length} deadlines →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
