import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface ToDoItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  dismissed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpcomingDeadline {
  id: string;
  course_id: string;
  course_title: string;
  lesson_id: string;
  lesson_title: string;
  lesson_type: 'assignment' | 'quiz' | 'lesson';
  due_date: string;
  completed: boolean;
  submitted: boolean;
}

export interface DashboardPreferences {
  id: string;
  user_id: string;
  dashboard_view: 'card' | 'list' | 'activity';
  show_onboarding_banner: boolean;
  onboarding_banner_dismissals: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TO-DO LIST FUNCTIONS
// ============================================================================

/**
 * Get upcoming deadlines across all enrolled courses
 * Combines course assignments, quizzes, and lessons with due dates
 */
export async function getUpcomingDeadlines(
  userId: string,
  limit: number = 7
): Promise<UpcomingDeadline[]> {
  try {
    // Get user's enrolled courses
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('course_id, courses(id, title)')
      .eq('user_id', userId);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return [];
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    const courseIds = enrollments.map(e => e.course_id);

    // Get lessons with due dates from enrolled courses
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        course_id,
        title,
        type,
        due_date,
        courses(id, title)
      `)
      .in('course_id', courseIds)
      .not('due_date', 'is', null)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(limit);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return [];
    }

    if (!lessons) {
      return [];
    }

    // Check submission status for each lesson
    const deadlines: UpcomingDeadline[] = await Promise.all(
      lessons.map(async (lesson: any) => {
        const { data: submission } = await supabase
          .from('submissions')
          .select('id, status')
          .eq('user_id', userId)
          .eq('lesson_id', lesson.id)
          .maybeSingle();

        return {
          id: lesson.id,
          course_id: lesson.course_id,
          course_title: lesson.courses?.title || 'Unknown Course',
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          lesson_type: lesson.type || 'lesson',
          due_date: lesson.due_date,
          completed: submission?.status === 'completed' || false,
          submitted: !!submission,
        };
      })
    );

    return deadlines;
  } catch (error) {
    console.error('Error in getUpcomingDeadlines:', error);
    return [];
  }
}

/**
 * Get user-created to-do items
 */
export async function getUserToDoItems(userId: string): Promise<ToDoItem[]> {
  try {
    const { data, error } = await supabase
      .from('user_todo_items')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user to-do items:', error);
      return [];
    }

    return (data || []) as ToDoItem[];
  } catch (error) {
    console.error('Error in getUserToDoItems:', error);
    return [];
  }
}

/**
 * Create a new user to-do item
 */
export async function createToDoItem(
  userId: string,
  item: Omit<ToDoItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed' | 'dismissed'>
): Promise<ToDoItem | null> {
  try {
    const { data, error } = await supabase
      .from('user_todo_items')
      .insert({
        user_id: userId,
        ...item,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating to-do item:', error);
      return null;
    }

    return data as ToDoItem;
  } catch (error) {
    console.error('Error in createToDoItem:', error);
    return null;
  }
}

/**
 * Dismiss a to-do item (hide from list)
 */
export async function dismissToDoItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_todo_items')
      .update({ dismissed: true })
      .eq('id', itemId);

    if (error) {
      console.error('Error dismissing to-do item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in dismissToDoItem:', error);
    return false;
  }
}

/**
 * Mark a to-do item as complete
 */
export async function completeToDoItem(itemId: string, completed: boolean = true): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_todo_items')
      .update({ completed })
      .eq('id', itemId);

    if (error) {
      console.error('Error completing to-do item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeToDoItem:', error);
    return false;
  }
}

/**
 * Delete a to-do item
 */
export async function deleteToDoItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_todo_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting to-do item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteToDoItem:', error);
    return false;
  }
}

// ============================================================================
// DASHBOARD PREFERENCES FUNCTIONS
// ============================================================================

/**
 * Get user dashboard preferences
 */
export async function getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching dashboard preferences:', error);
      return null;
    }

    // If no preferences exist, create default ones
    if (!data) {
      return await createDefaultDashboardPreferences(userId);
    }

    return data as DashboardPreferences;
  } catch (error) {
    console.error('Error in getDashboardPreferences:', error);
    return null;
  }
}

/**
 * Create default dashboard preferences for a user
 */
async function createDefaultDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_preferences')
      .insert({
        user_id: userId,
        dashboard_view: 'card',
        show_onboarding_banner: true,
        onboarding_banner_dismissals: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating default dashboard preferences:', error);
      return null;
    }

    return data as DashboardPreferences;
  } catch (error) {
    console.error('Error in createDefaultDashboardPreferences:', error);
    return null;
  }
}

/**
 * Update dashboard view preference
 */
export async function updateDashboardView(
  userId: string,
  view: 'card' | 'list' | 'activity'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_dashboard_preferences')
      .upsert({
        user_id: userId,
        dashboard_view: view,
      });

    if (error) {
      console.error('Error updating dashboard view:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateDashboardView:', error);
    return false;
  }
}

/**
 * Increment onboarding banner dismissals
 * Auto-hides banner after 3 dismissals
 */
export async function incrementOnboardingDismissals(userId: string): Promise<boolean> {
  try {
    // Get current preferences
    const prefs = await getDashboardPreferences(userId);
    if (!prefs) return false;

    const newCount = prefs.onboarding_banner_dismissals + 1;
    const shouldHide = newCount >= 3;

    const { error } = await supabase
      .from('user_dashboard_preferences')
      .update({
        onboarding_banner_dismissals: newCount,
        show_onboarding_banner: !shouldHide,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error incrementing onboarding dismissals:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in incrementOnboardingDismissals:', error);
    return false;
  }
}

/**
 * Manually hide/show onboarding banner
 */
export async function toggleOnboardingBanner(userId: string, show: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_dashboard_preferences')
      .upsert({
        user_id: userId,
        show_onboarding_banner: show,
      });

    if (error) {
      console.error('Error toggling onboarding banner:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in toggleOnboardingBanner:', error);
    return false;
  }
}


// ============================================================================
// RECENT FEEDBACK FUNCTIONS
// ============================================================================

export interface RecentFeedback {
  submission_id: string;
  user_id: string;
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  grade: number;
  feedback: string;
  graded_at: string;
  feedback_viewed: boolean;
  feedback_viewed_at?: string;
  instructor_name?: string;
}

/**
 * Get recent feedback for a student (last 4 weeks)
 */
export async function getRecentFeedback(
  userId: string,
  weeks: number = 4
): Promise<RecentFeedback[]> {
  try {
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));

    const { data, error } = await supabase
      .from('student_recent_feedback')
      .select('*')
      .eq('user_id', userId)
      .gte('graded_at', weeksAgo.toISOString())
      .order('graded_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching recent feedback:', error);
      return [];
    }

    return (data || []) as RecentFeedback[];
  } catch (error) {
    console.error('Error in getRecentFeedback:', error);
    return [];
  }
}

/**
 * Mark feedback as viewed
 */
export async function markFeedbackViewed(submissionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('submissions')
      .update({
        feedback_viewed: true,
        feedback_viewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error marking feedback as viewed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markFeedbackViewed:', error);
    return false;
  }
}

// ============================================================================
// CALENDAR FUNCTIONS
// ============================================================================

export interface CalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'personal' | 'study' | 'deadline' | 'course' | 'other';
  source: 'user' | 'course';
  course_id?: string;
  course_title?: string;
  lesson_id?: string;
}

/**
 * Get all calendar events for a user (course deadlines + personal events)
 */
export async function getCalendarEvents(
  userId: string,
  month: number,
  year: number
): Promise<CalendarEvent[]> {
  try {
    // Get start and end of month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get user's personal calendar events
    const { data: personalEvents, error: personalError } = await supabase
      .from('user_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', startDate.toISOString())
      .lte('event_date', endDate.toISOString());

    if (personalError) {
      console.error('Error fetching personal events:', personalError);
    }

    // Get course deadlines for enrolled courses
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('course_id, courses(id, title)')
      .eq('user_id', userId);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
    }

    const courseIds = enrollments?.map(e => e.course_id) || [];

    const { data: courseDeadlines, error: deadlinesError } = await supabase
      .from('lessons')
      .select('id, title, due_date, course_id, courses(id, title)')
      .in('course_id', courseIds)
      .not('due_date', 'is', null)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString());

    if (deadlinesError) {
      console.error('Error fetching course deadlines:', deadlinesError);
    }

    // Combine all events
    const events: CalendarEvent[] = [
      ...(personalEvents || []).map(e => ({
        id: e.id,
        user_id: e.user_id,
        title: e.title,
        description: e.description,
        event_date: e.event_date,
        event_type: e.event_type,
        source: 'user' as const,
      })),
      ...(courseDeadlines || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        event_date: d.due_date,
        event_type: 'course' as const,
        source: 'course' as const,
        course_id: d.course_id,
        course_title: d.courses?.title,
        lesson_id: d.id,
      })),
    ];

    return events.sort((a, b) => 
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
  } catch (error) {
    console.error('Error in getCalendarEvents:', error);
    return [];
  }
}

/**
 * Create a personal calendar event
 */
export async function createCalendarEvent(
  userId: string,
  event: Omit<CalendarEvent, 'id' | 'user_id' | 'source'>
): Promise<CalendarEvent | null> {
  try {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .insert({
        user_id: userId,
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        event_type: event.event_type === 'course' ? 'deadline' : event.event_type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }

    return {
      ...data,
      source: 'user' as const,
    } as CalendarEvent;
  } catch (error) {
    console.error('Error in createCalendarEvent:', error);
    return null;
  }
}

/**
 * Delete a personal calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCalendarEvent:', error);
    return false;
  }
}

// ============================================================================
// GLOBAL ANNOUNCEMENTS FUNCTIONS
// ============================================================================

export interface GlobalAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  start_date: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get active global announcements
 */
export async function getGlobalAnnouncements(): Promise<GlobalAnnouncement[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('global_announcements')
      .select('*')
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gt.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching global announcements:', error);
      return [];
    }

    return (data || []) as GlobalAnnouncement[];
  } catch (error) {
    console.error('Error in getGlobalAnnouncements:', error);
    return [];
  }
}

/**
 * Get announcements not dismissed by user
 */
export async function getActiveAnnouncementsForUser(userId: string): Promise<GlobalAnnouncement[]> {
  try {
    const allAnnouncements = await getGlobalAnnouncements();

    // Get dismissed announcement IDs
    const { data: dismissed, error } = await supabase
      .from('dismissed_announcements')
      .select('announcement_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching dismissed announcements:', error);
      return allAnnouncements;
    }

    const dismissedIds = new Set(dismissed?.map(d => d.announcement_id) || []);

    return allAnnouncements.filter(a => !dismissedIds.has(a.id));
  } catch (error) {
    console.error('Error in getActiveAnnouncementsForUser:', error);
    return [];
  }
}

/**
 * Dismiss an announcement for a user
 */
export async function dismissAnnouncement(
  userId: string,
  announcementId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dismissed_announcements')
      .insert({
        user_id: userId,
        announcement_id: announcementId,
      });

    if (error) {
      console.error('Error dismissing announcement:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in dismissAnnouncement:', error);
    return false;
  }
}

/**
 * Get dismissed announcements for a user
 */
export async function getDismissedAnnouncements(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('dismissed_announcements')
      .select('announcement_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching dismissed announcements:', error);
      return [];
    }

    return (data || []).map(d => d.announcement_id);
  } catch (error) {
    console.error('Error in getDismissedAnnouncements:', error);
    return [];
  }
}

/**
 * Create a global announcement (admin only)
 */
export async function createGlobalAnnouncement(
  announcement: Omit<GlobalAnnouncement, 'id' | 'created_at' | 'updated_at'>
): Promise<GlobalAnnouncement | null> {
  try {
    const { data, error } = await supabase
      .from('global_announcements')
      .insert(announcement)
      .select()
      .single();

    if (error) {
      console.error('Error creating global announcement:', error);
      return null;
    }

    return data as GlobalAnnouncement;
  } catch (error) {
    console.error('Error in createGlobalAnnouncement:', error);
    return null;
  }
}
