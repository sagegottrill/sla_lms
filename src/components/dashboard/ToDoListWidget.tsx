import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUpcomingDeadlines } from '@/hooks/useUpcomingDeadlines';
import { dismissToDoItem, completeToDoItem } from '@/services/studentDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { coursePathSegment } from '@/lib/publicRoutes';
import { 
  CheckCircle2, 
  Circle, 
  X, 
  Clock, 
  FileText, 
  BookOpen,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ToDoListWidgetProps {
  userId: string;
  limit?: number;
}

export default function ToDoListWidget({ userId, limit = 7 }: ToDoListWidgetProps) {
  const { data, isLoading } = useUpcomingDeadlines(userId, limit);
  const queryClient = useQueryClient();
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismiss = async (itemId: string, isUserTodo: boolean) => {
    setDismissing(itemId);
    const success = await dismissToDoItem(itemId);
    
    if (success) {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['upcomingDeadlines', userId] });
      if (isUserTodo) {
        queryClient.invalidateQueries({ queryKey: ['userToDoItems', userId] });
      }
    }
    
    setDismissing(null);
  };

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    const success = await completeToDoItem(itemId, !currentStatus);
    
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['userToDoItems', userId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingDeadlines', userId] });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTimeColor = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 24) return 'text-red-600 dark:text-red-400';
    if (hoursUntilDue < 72) return 'text-orange-600 dark:text-orange-400';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">To-Do List</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
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

  const { deadlines = [], todoItems = [] } = data || {};
  
  // Combine and sort all items by due date
  const allItems = [
    ...deadlines.map(d => ({
      id: d.id,
      type: 'deadline' as const,
      title: d.lesson_title,
      subtitle: d.course_title,
      dueDate: d.due_date,
      completed: d.completed,
      submitted: d.submitted,
      lessonType: d.lesson_type,
      courseId: d.course_id,
    })),
    ...todoItems.map(t => ({
      id: t.id,
      type: 'todo' as const,
      title: t.title,
      subtitle: t.description,
      dueDate: t.due_date,
      completed: t.completed,
      submitted: false,
      lessonType: 'todo',
    })),
  ].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const hasItems = allItems.length > 0;

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-foreground">To-Do List</h2>
        {hasItems && (
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {allItems.filter(i => !i.completed).length}
          </span>
        )}
      </div>

      {!hasItems ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">All caught up!</p>
          <p className="text-xs text-muted-foreground">
            No upcoming deadlines or to-do items.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.slice(0, limit).map((item) => (
            <div
              key={item.id}
              className={`group flex items-start gap-3 rounded-xl -mx-1 px-1 py-2 hover:bg-muted/50 transition-colors ${
                item.completed ? 'opacity-60' : ''
              }`}
            >
              {/* Checkbox for user to-dos */}
              {item.type === 'todo' ? (
                <button
                  onClick={() => handleToggleComplete(item.id, item.completed)}
                  className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
                  aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="shrink-0 mt-0.5 text-primary/70">
                  {getIcon(item.lessonType)}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {item.type === 'deadline' ? (
                  <Link
                    to={`/courses/${item.courseId}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <p className={`text-sm font-medium text-foreground line-clamp-1 ${
                      item.completed ? 'line-through' : ''
                    }`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.subtitle}
                    </p>
                  </Link>
                ) : (
                  <div>
                    <p className={`text-sm font-medium text-foreground line-clamp-1 ${
                      item.completed ? 'line-through' : ''
                    }`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Due date */}
                {item.dueDate && !item.completed && (
                  <div className={`flex items-center gap-1 mt-1 text-xs ${getTimeColor(item.dueDate)}`}>
                    <Clock className="w-3 h-3" />
                    <span>Due {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}</span>
                  </div>
                )}

                {/* Submitted badge */}
                {item.type === 'deadline' && item.submitted && !item.completed && (
                  <span className="inline-block mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Submitted
                  </span>
                )}
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(item.id, item.type === 'todo')}
                disabled={dismissing === item.id}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View all link */}
      {allItems.length > limit && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <Link
            to="/dashboard/courses"
            className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
          >
            View all {allItems.length} items →
          </Link>
        </div>
      )}
    </div>
  );
}
