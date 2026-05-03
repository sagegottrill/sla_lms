import { Link } from 'react-router-dom';
import { coursePathSegment } from '@/lib/publicRoutes';
import { 
  BookOpen, 
  CheckCircle2, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Course {
  id: number;
  title: string;
  progress: number;
}

interface ActivityViewDashboardProps {
  courses: Course[];
  activeTab: 'in_progress' | 'completed';
}

// Mock activity data - in real implementation, this would come from API
const generateMockActivities = (courses: Course[]) => {
  const activities = [];
  const now = new Date();

  courses.forEach((course, idx) => {
    // Progress update
    if (course.progress > 0 && course.progress < 100) {
      activities.push({
        id: `progress-${course.id}`,
        type: 'progress' as const,
        icon: TrendingUp,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        title: 'Progress Update',
        description: `You're ${course.progress}% through ${course.title}`,
        courseTitle: course.title,
        courseId: course.id,
        timestamp: new Date(now.getTime() - idx * 3600000 * 2), // 2 hours apart
      });
    }

    // Completion
    if (course.progress === 100) {
      activities.push({
        id: `complete-${course.id}`,
        type: 'completion' as const,
        icon: Award,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        title: 'Course Completed!',
        description: `Congratulations on completing ${course.title}`,
        courseTitle: course.title,
        courseId: course.id,
        timestamp: new Date(now.getTime() - idx * 3600000 * 5), // 5 hours apart
      });
    }

    // Lesson started
    if (course.progress > 0 && course.progress < 30) {
      activities.push({
        id: `lesson-${course.id}`,
        type: 'lesson' as const,
        icon: BookOpen,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        title: 'Lesson Started',
        description: `Started learning in ${course.title}`,
        courseTitle: course.title,
        courseId: course.id,
        timestamp: new Date(now.getTime() - idx * 3600000 * 8), // 8 hours apart
      });
    }
  });

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export default function ActivityViewDashboard({ courses, activeTab }: ActivityViewDashboardProps) {
  const activities = generateMockActivities(courses);

  if (activities.length === 0) {
    return (
      <div className="text-center p-12 bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl">
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-foreground font-semibold mb-2">No recent activity</p>
        <p className="text-sm text-muted-foreground mb-6">
          Start a course to see your learning activity here.
        </p>
        <Link
          to="/courses"
          className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors group"
            >
              {/* Icon */}
              <div className={`shrink-0 w-10 h-10 rounded-full ${activity.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${activity.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className="font-semibold text-foreground">{activity.title}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                <Link
                  to={`/courses/${coursePathSegment({ id: activity.courseId, title: activity.courseTitle })}`}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                >
                  View Course
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More (placeholder) */}
      {activities.length >= 10 && (
        <div className="mt-6 text-center">
          <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Load More Activity
          </button>
        </div>
      )}
    </div>
  );
}
