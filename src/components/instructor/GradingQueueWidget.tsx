import { useGradingQueue } from '@/hooks/useGradingQueue';
import { ClipboardList, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface GradingQueueWidgetProps {
  instructorId: string;
  limit?: number;
}

export default function GradingQueueWidget({ instructorId, limit = 10 }: GradingQueueWidgetProps) {
  const { data: queue = [], isLoading } = useGradingQueue(instructorId);

  const displayQueue = limit ? queue.slice(0, limit) : queue;
  const hasMore = queue.length > (limit || 0);

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
        <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-lg text-foreground">Grading Queue</h2>
          <p className="text-sm text-muted-foreground">
            {queue.length === 0 ? 'All caught up!' : `${queue.length} submission${queue.length === 1 ? '' : 's'} awaiting review`}
          </p>
        </div>
        {queue.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/30">
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">{queue.length}</span>
          </div>
        )}
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
          <p className="text-xs text-muted-foreground">No submissions waiting for review</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayQueue.map((item) => {
            const daysWaiting = Math.floor(
              (Date.now() - new Date(item.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = daysWaiting >= 3;

            return (
              <Link
                key={item.submission_id}
                to={`/instructor/courses/${item.course_id}/grade/${item.submission_id}`}
                className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
              >
                <div className="flex items-start gap-3">
                  {/* Urgency Indicator */}
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    isUrgent ? 'bg-red-500' : 'bg-orange-400'
                  }`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {item.assignment_title}
                      </h3>
                      {isUrgent && (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" title="Urgent: 3+ days waiting" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {item.student_name} • {item.course_title}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(item.submitted_at), { addSuffix: true })}
                        </span>
                      </div>
                      {daysWaiting > 0 && (
                        <span className={`font-medium ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {daysWaiting} day{daysWaiting === 1 ? '' : 's'} waiting
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* View All Link */}
          {hasMore && (
            <Link
              to="/instructor/grading"
              className="block text-center py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all {queue.length} submissions →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
