import { useActivityFeed } from '@/hooks/useActivityFeed';
import { 
  Activity, 
  FileText, 
  MessageSquare, 
  UserPlus, 
  Award,
  HelpCircle,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { markActivityRead } from '@/services/instructorDashboard';
import { useQueryClient } from '@tanstack/react-query';

interface RecentActivityWidgetProps {
  instructorId: string;
  limit?: number;
  hours?: number;
}

export default function RecentActivityWidget({ 
  instructorId, 
  limit = 10,
  hours = 48 
}: RecentActivityWidgetProps) {
  const { data: activities = [], isLoading } = useActivityFeed(instructorId, hours);
  const queryClient = useQueryClient();

  const displayActivities = limit ? activities.slice(0, limit) : activities;
  const hasMore = activities.length > (limit || 0);
  const unreadCount = activities.filter(a => !a.read).length;

  const handleActivityClick = async (activityId: string) => {
    await markActivityRead(activityId);
    queryClient.invalidateQueries({ queryKey: ['activityFeed', instructorId] });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return FileText;
      case 'discussion':
        return MessageSquare;
      case 'enrollment':
        return UserPlus;
      case 'completion':
        return Award;
      case 'question':
        return HelpCircle;
      case 'comment':
        return MessageCircle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'submission':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20';
      case 'discussion':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20';
      case 'enrollment':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
      case 'completion':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20';
      case 'question':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20';
      case 'comment':
        return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20';
    }
  };

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
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-lg text-foreground">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            {activities.length === 0 ? 'No activity in last 48 hours' : `${activities.length} event${activities.length === 1 ? '' : 's'} in last ${hours} hours`}
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/30">
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{unreadCount}</span>
          </div>
        )}
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
          <p className="text-xs text-muted-foreground">Student activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayActivities.map((activity) => {
            const Icon = getActivityIcon(activity.activity_type);
            const colorClass = getActivityColor(activity.activity_type);

            return (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity.id)}
                className={`p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                  !activity.read ? 'bg-muted/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground mb-1 line-clamp-2">
                      {activity.activity_text}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="line-clamp-1">{activity.course_title}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!activity.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2" />
                  )}
                </div>
              </div>
            );
          })}

          {/* View All Link */}
          {hasMore && (
            <Link
              to="/instructor/activity"
              className="block text-center py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all {activities.length} activities →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
