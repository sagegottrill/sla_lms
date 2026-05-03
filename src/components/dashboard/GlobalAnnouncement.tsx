import { useState } from 'react';
import { useGlobalAnnouncements } from '@/hooks/useGlobalAnnouncements';
import { dismissAnnouncement } from '@/services/studentDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GlobalAnnouncementProps {
  userId: string;
}

export default function GlobalAnnouncement({ userId }: GlobalAnnouncementProps) {
  const { data: announcements = [], isLoading } = useGlobalAnnouncements(userId);
  const queryClient = useQueryClient();
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismiss = async (announcementId: string) => {
    setDismissing(announcementId);
    const success = await dismissAnnouncement(userId, announcementId);
    
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['globalAnnouncements', userId] });
    }
    
    setDismissing(null);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-100';
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30 text-orange-900 dark:text-orange-100';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-100';
    }
  };

  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (isLoading || announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`border rounded-xl p-4 flex items-start gap-3 ${getPriorityColor(announcement.priority)}`}
        >
          {/* Icon */}
          <div className={`shrink-0 ${getIconColor(announcement.priority)}`}>
            {getPriorityIcon(announcement.priority)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{announcement.title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">{announcement.content}</p>
            <p className="text-xs opacity-70 mt-2">
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => handleDismiss(announcement.id)}
            disabled={dismissing === announcement.id}
            className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors opacity-70 hover:opacity-100"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
