import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface GradingQueueItem {
  submission_id: string;
  lesson_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  assignment_title: string;
  course_id: number;
  course_title: string;
  submitted_at: string;
  assignment_due_date?: string;
  grading_status: 'pending' | 'grading' | 'graded';
}

export interface CourseAnalytics {
  course_id: number;
  course_title: string;
  total_students: number;
  active_students: number;
  avg_progress: number;
  completion_rate: number;
  engagement_score: number;
  at_risk_students: number;
  last_calculated: string;
}

export interface GradingStats {
  total_pending: number;
  total_graded_today: number;
  avg_grading_time_hours: number;
  oldest_pending_days: number;
}

export interface UpcomingDeadline {
  lesson_id: string;
  assignment_title: string;
  due_date: string;
  course_id: number;
  course_title: string;
  expected_submissions: number;
  received_submissions: number;
  pending_submissions: number;
}

export interface ActivityFeedItem {
  id: string;
  instructor_id: string;
  course_id: number;
  course_title: string;
  activity_type: 'submission' | 'discussion' | 'enrollment' | 'completion' | 'question' | 'comment';
  student_id?: string;
  student_name?: string;
  student_email?: string;
  related_item_id?: string;
  activity_text: string;
  activity_date: string;
  read: boolean;
}

// ============================================================================
// GRADING QUEUE FUNCTIONS
// ============================================================================

/**
 * Get pending submissions for instructor across all their courses
 */
export async function getInstructorGradingQueue(
  instructorId: string
): Promise<GradingQueueItem[]> {
  try {
    const { data, error } = await supabase
      .from('instructor_grading_queue')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('submitted_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching grading queue:', error);
      return [];
    }

    return (data || []) as GradingQueueItem[];
  } catch (error) {
    console.error('Error in getInstructorGradingQueue:', error);
    return [];
  }
}

/**
 * Get pending submissions for a specific course
 */
export async function getCourseGradingQueue(
  courseId: number
): Promise<GradingQueueItem[]> {
  try {
    const { data, error } = await supabase
      .from('instructor_grading_queue')
      .select('*')
      .eq('course_id', courseId)
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error('Error fetching course grading queue:', error);
      return [];
    }

    return (data || []) as GradingQueueItem[];
  } catch (error) {
    console.error('Error in getCourseGradingQueue:', error);
    return [];
  }
}

/**
 * Mark submission as graded
 */
export async function markSubmissionGraded(
  submissionId: string,
  instructorId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('submissions')
      .update({
        grading_status: 'graded',
        graded_at: new Date().toISOString(),
        graded_by: instructorId,
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error marking submission as graded:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markSubmissionGraded:', error);
    return false;
  }
}

/**
 * Get grading statistics for instructor
 */
export async function getGradingStats(
  instructorId: string
): Promise<GradingStats | null> {
  try {
    // Get total pending
    const { count: totalPending } = await supabase
      .from('instructor_grading_queue')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructorId);

    // Get graded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: gradedToday } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('graded_by', instructorId)
      .gte('graded_at', today.toISOString());

    // Get oldest pending
    const { data: oldestPending } = await supabase
      .from('instructor_grading_queue')
      .select('submitted_at')
      .eq('instructor_id', instructorId)
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single();

    const oldestPendingDays = oldestPending
      ? Math.floor((Date.now() - new Date(oldestPending.submitted_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      total_pending: totalPending || 0,
      total_graded_today: gradedToday || 0,
      avg_grading_time_hours: 0, // TODO: Calculate from data
      oldest_pending_days: oldestPendingDays,
    };
  } catch (error) {
    console.error('Error in getGradingStats:', error);
    return null;
  }
}

// ============================================================================
// COURSE ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get analytics for all instructor courses
 */
export async function getInstructorCourseAnalytics(
  instructorId: string
): Promise<CourseAnalytics[]> {
  try {
    // Get instructor's courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId);

    if (coursesError || !courses) {
      console.error('Error fetching instructor courses:', coursesError);
      return [];
    }

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return [];
    }

    // Get analytics from cache
    const { data, error } = await supabase
      .from('course_analytics_cache')
      .select(`
        course_id,
        total_students,
        active_students,
        avg_progress,
        completion_rate,
        engagement_score,
        at_risk_students,
        last_calculated,
        courses!inner(title)
      `)
      .in('course_id', courseIds)
      .order('engagement_score', { ascending: false });

    if (error) {
      console.error('Error fetching course analytics:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      course_id: item.course_id,
      course_title: item.courses?.title || 'Unknown Course',
      total_students: item.total_students,
      active_students: item.active_students,
      avg_progress: item.avg_progress,
      completion_rate: item.completion_rate,
      engagement_score: item.engagement_score,
      at_risk_students: item.at_risk_students,
      last_calculated: item.last_calculated,
    }));
  } catch (error) {
    console.error('Error in getInstructorCourseAnalytics:', error);
    return [];
  }
}

/**
 * Get detailed analytics for a specific course
 */
export async function getCourseDetailedAnalytics(
  courseId: number
): Promise<CourseAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('course_analytics_cache')
      .select(`
        *,
        courses!inner(title)
      `)
      .eq('course_id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course detailed analytics:', error);
      return null;
    }

    return {
      course_id: data.course_id,
      course_title: data.courses?.title || 'Unknown Course',
      total_students: data.total_students,
      active_students: data.active_students,
      avg_progress: data.avg_progress,
      completion_rate: data.completion_rate,
      engagement_score: data.engagement_score,
      at_risk_students: data.at_risk_students,
      last_calculated: data.last_calculated,
    };
  } catch (error) {
    console.error('Error in getCourseDetailedAnalytics:', error);
    return null;
  }
}

/**
 * Calculate and cache course analytics
 */
export async function calculateCourseAnalytics(
  courseId: number
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('calculate_course_analytics', {
      p_course_id: courseId,
    });

    if (error) {
      console.error('Error calculating course analytics:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in calculateCourseAnalytics:', error);
    return false;
  }
}

/**
 * Get at-risk students for a course
 */
export async function getAtRiskStudents(courseId: number) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        user_id,
        progress,
        last_activity,
        instructor_notes,
        profiles!inner(name, email)
      `)
      .eq('course_id', courseId)
      .eq('at_risk', true);

    if (error) {
      console.error('Error fetching at-risk students:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      user_id: item.user_id,
      name: item.profiles?.name,
      email: item.profiles?.email,
      progress: item.progress,
      last_activity: item.last_activity,
      instructor_notes: item.instructor_notes,
    }));
  } catch (error) {
    console.error('Error in getAtRiskStudents:', error);
    return [];
  }
}

/**
 * Get course engagement metrics (real-time)
 */
export async function getCourseEngagementMetrics(courseId: number) {
  try {
    const { data, error } = await supabase
      .from('course_engagement_metrics')
      .select('*')
      .eq('course_id', courseId)
      .single();

    if (error) {
      console.error('Error fetching engagement metrics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCourseEngagementMetrics:', error);
    return null;
  }
}

// ============================================================================
// UPCOMING DEADLINES FUNCTIONS
// ============================================================================

/**
 * Get upcoming deadlines for instructor across all courses
 */
export async function getInstructorUpcomingDeadlines(
  instructorId: string,
  days: number = 14
): Promise<UpcomingDeadline[]> {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('instructor_upcoming_deadlines')
      .select('*')
      .eq('instructor_id', instructorId)
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }

    return (data || []) as UpcomingDeadline[];
  } catch (error) {
    console.error('Error in getInstructorUpcomingDeadlines:', error);
    return [];
  }
}

/**
 * Get upcoming deadlines for a specific course
 */
export async function getCourseUpcomingDeadlines(
  courseId: number,
  days: number = 14
): Promise<UpcomingDeadline[]> {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('instructor_upcoming_deadlines')
      .select('*')
      .eq('course_id', courseId)
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching course deadlines:', error);
      return [];
    }

    return (data || []) as UpcomingDeadline[];
  } catch (error) {
    console.error('Error in getCourseUpcomingDeadlines:', error);
    return [];
  }
}

// ============================================================================
// ACTIVITY FEED FUNCTIONS
// ============================================================================

/**
 * Get recent activity for instructor
 */
export async function getInstructorActivityFeed(
  instructorId: string,
  hours: number = 48
): Promise<ActivityFeedItem[]> {
  try {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    const { data, error } = await supabase
      .from('instructor_recent_activity')
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('activity_date', hoursAgo.toISOString())
      .order('activity_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }

    return (data || []) as ActivityFeedItem[];
  } catch (error) {
    console.error('Error in getInstructorActivityFeed:', error);
    return [];
  }
}

/**
 * Get activity for specific course
 */
export async function getCourseActivityFeed(
  courseId: number,
  hours: number = 48
): Promise<ActivityFeedItem[]> {
  try {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    const { data, error } = await supabase
      .from('instructor_recent_activity')
      .select('*')
      .eq('course_id', courseId)
      .gte('activity_date', hoursAgo.toISOString())
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching course activity:', error);
      return [];
    }

    return (data || []) as ActivityFeedItem[];
  } catch (error) {
    console.error('Error in getCourseActivityFeed:', error);
    return [];
  }
}

/**
 * Mark activity as read
 */
export async function markActivityRead(activityId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('mark_activity_read', {
      p_activity_id: activityId,
    });

    if (error) {
      console.error('Error marking activity as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markActivityRead:', error);
    return false;
  }
}

/**
 * Mark all activity as read
 */
export async function markAllActivityRead(instructorId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('mark_all_activity_read', {
      p_instructor_id: instructorId,
    });

    if (error) {
      console.error('Error marking all activity as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllActivityRead:', error);
    return false;
  }
}

/**
 * Get unread activity count
 */
export async function getUnreadActivityCount(instructorId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_unread_activity_count', {
      p_instructor_id: instructorId,
    });

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in getUnreadActivityCount:', error);
    return 0;
  }
}
