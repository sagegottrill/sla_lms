import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Award,
  FileText,
  Activity as ActivityIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Course {
  id: number;
  title: string;
  total_students?: number;
  engagement_score?: number;
  created_at?: string;
  updated_at?: string;
}

interface ActivityViewDashboardProps {
  courses: Course[];
}

// Mock activity data - in real implementation, this would come from API
const generateInstructorActivities = (courses: Course[]) => {
  const activities = [];
  const now = new Date();

  courses.forEach((course, idx) => {
    // New enrollment
    if (course.total_students && course.total_students > 0) {
      activities.push({
        id: `enrollment-${course.id}`,
        type: 'enrollment' as const,
        icon: Users,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        title: 'New Enrollment',
        description: `${course.total_students} student${course.total_students > 1 ? 's' : ''} enrolled in ${course.title}`,
        courseTitle: course.title,
        courseId: course.id,
        timestamp: new Date(now.getTime() - idx * 3600000 * 2), // 2 hours apart
      });
    }

    // Engagement update
    if (course.engagement_score) {
      activities.push({
        id: `engagement-${course.id}`,
        type: 'engagement' as const,
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        title: 'Engagement Update',
        description: `${Math.round(course.engagement_score)}% engagement in ${course.title}`,
        courseTitle: course.title,
        courseId: course.id,
        timestamp: new Date(now.getTime() - idx * 3600000 * 4), // 4 hours apart
      });
    }

    // Submission received
    activities.push({
      id: `submission-${course.id}`,
      type: 'submission' as const,
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      title: 'New Submission',
      description: `Assignment submitted in ${course.title}`,
      courseTitle: course.title,
      courseId: course.id,
      timestamp: new Date(now.getTime() - idx * 3600000 * 6), // 6 hours apart
    });

    // Course updated
    if (course.updated_at) {
      activities.push({
        id: `update-${course.id}`,
        type: 'update' as const,
        icon: BookOpen,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        title: 'Course Updated',
        description: `You updated ${course.title}`,
        courseTitle: course.title,
        courseId: course.id,
        timestamp: new Date(course.updated_at),
      });
    }
  });

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
};

export default function ActivityViewDashboard({ courses }: ActivityViewDashboardProps) {
  const activities = generateInstructorActivities(courses);

  if (activities.length === 0) {
    return (
      <div className="text-center p-12 bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl">
        <ActivityIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-foreground font-semibold mb-2">No recent activity</p>
        <p className="text-sm text-muted-foreground mb-6">
          Create a course to start seeing activity here.
        </p>
        <Link
          to="/instructor/courses/new"
          className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Create Course
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
                  to={`/instructor/courses/${activity.courseId}`}
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
