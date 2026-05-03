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
