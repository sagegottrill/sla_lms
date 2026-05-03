import { Link } from 'react-router-dom';
import { useRecentFeedback } from '@/hooks/useRecentFeedback';
import { markFeedbackViewed } from '@/services/studentDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface RecentFeedbackWidgetProps {
  userId: string;
  limit?: number;
}

export default function RecentFeedbackWidget({ userId, limit = 5 }: RecentFeedbackWidgetProps) {
  const { data: feedbackList = [], isLoading } = useRecentFeedback(userId, 4);
  const queryClient = useQueryClient();

  const handleViewFeedback = async (submissionId: string, feedbackViewed: boolean) => {
    if (!feedbackViewed) {
      await markFeedbackViewed(submissionId);
      queryClient.invalidateQueries({ queryKey: ['recentFeedback', userId] });
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeIcon = (grade: number) => {
    if (grade >= 90) return <TrendingUp className="w-4 h-4" />;
    if (grade >= 70) return <CheckCircle2 className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Recent Feedback</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentFeedback = feedbackList.slice(0, limit);
  const hasNewFeedback = recentFeedback.some(f => !f.feedback_viewed);

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-foreground">Recent Feedback</h2>
        {hasNewFeedback && (
          <span className="text-xs font-semibold text-white bg-primary px-2 py-1 rounded-full">
            New
          </span>
        )}
      </div>

      {recentFeedback.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">No recent feedback</p>
          <p className="text-xs text-muted-foreground">
            Feedback from graded assignments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentFeedback.map((feedback) => (
            <Link
              key={feedback.submission_id}
              to={`/courses/${feedback.course_id}`}
              onClick={() => handleViewFeedback(feedback.submission_id, feedback.feedback_viewed)}
              className="group flex items-start gap-3 rounded-xl -mx-1 px-1 py-2 hover:bg-muted/50 transition-colors"
            >
              {/* Grade Badge */}
              <div className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                feedback.feedback_viewed ? 'bg-muted' : 'bg-primary/10'
              }`}>
                <span className={`text-sm font-bold ${
                  feedback.feedback_viewed ? 'text-muted-foreground' : getGradeColor(feedback.grade)
                }`}>
                  {feedback.grade}
                </span>
                <span className="text-[10px] text-muted-foreground">%</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors ${
                    !feedback.feedback_viewed ? 'font-semibold' : ''
                  }`}>
                    {feedback.lesson_title}
                  </p>
                  {!feedback.feedback_viewed && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {feedback.course_title}
                </p>

                {/* Feedback preview */}
                {feedback.feedback && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1 italic">
                    "{feedback.feedback}"
                  </p>
                )}

                {/* Time and instructor */}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(feedback.graded_at), { addSuffix: true })}</span>
                  {feedback.instructor_name && (
                    <>
                      <span>·</span>
                      <span>{feedback.instructor_name}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* View all link */}
      {feedbackList.length > limit && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <Link
            to="/dashboard/grades"
            className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
          >
            View all feedback →
          </Link>
        </div>
      )}
    </div>
  );
}
