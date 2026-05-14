# Admin Course Unpublish Feature

## Issue
Admin users were unable to unpublish courses that had been published. This was needed to manage test courses and control course visibility.

## Solution
Added unpublish/publish toggle functionality to the **InstructorCoursesPage** that is visible only to admin users.

## Changes Made

### File: `src/pages/InstructorCoursesPage.tsx`

#### 1. Added New Imports
- `EyeOff`, `Eye` icons from lucide-react
- `api` from services
- `toast` from sonner
- `useQueryClient` from @tanstack/react-query

#### 2. Added State Management
- `updatingCourseId`: Tracks which course is currently being updated (for loading state)
- `isAdmin`: Boolean flag to check if current user is an admin

#### 3. New Function: `handleTogglePublish`
```typescript
const handleTogglePublish = async (courseId: number, currentStatus: string) => {
  // Only admins can use this feature
  // Toggles course status between "published" and "draft"
  // Shows loading state during update
  // Displays success/error toasts
  // Refreshes course list after update
}
```

#### 4. Updated UI
- Added "Unpublish" button next to "Manage" button (visible only to admins)
- Button shows:
  - **"Unpublish"** with EyeOff icon when course is published
  - **"Publish"** with Eye icon when course is draft
  - Loading spinner when updating
- Button appears on hover (same behavior as Manage button)

## How It Works

1. **Admin Access**: Only users with `role === "admin"` can see and use the unpublish/publish buttons
2. **Status Toggle**: Clicking the button changes course status:
   - `published` → `draft` (Unpublish)
   - `draft` → `published` (Publish)
3. **Database Update**: Uses existing `api.updateCourse()` to update the course status in Supabase
4. **UI Feedback**: 
   - Shows loading spinner during update
   - Displays success/error toast messages
   - Automatically refreshes the course list
5. **RLS Compliance**: Uses existing RLS policies that allow admins to update courses

## User Experience

### For Admins
1. Navigate to "All courses" page (automatically shown for admins)
2. Hover over any course row
3. See "Unpublish" button (if course is published) or "Publish" button (if course is draft)
4. Click to toggle status
5. See loading indicator
6. Receive confirmation toast
7. Course status updates immediately in the table

### For Non-Admins
- No change in functionality
- Unpublish/Publish buttons are not visible
- Only "Manage" button appears (existing behavior)

## Technical Details

### API Call
```typescript
await api.updateCourse(courseId, { status: newStatus })
```

### Query Invalidation
After successful update, invalidates:
- `["courses"]` - All courses query
- `["instructorCourses"]` - Instructor-specific courses query

### Status Values
- `"published"` - Course is visible to students
- `"draft"` - Course is hidden from students
- `"archived"` - Course is archived (not affected by this feature)

## Testing Checklist

- [x] Admin can see unpublish button on published courses
- [x] Admin can see publish button on draft courses
- [x] Button shows loading state during update
- [x] Success toast appears after successful update
- [x] Error toast appears if update fails
- [x] Course list refreshes after update
- [x] Non-admin users don't see the buttons
- [x] Button only appears on hover
- [x] TypeScript compilation passes with no errors

## Future Enhancements

Potential improvements for future iterations:
1. Bulk unpublish/publish for multiple courses
2. Confirmation dialog before unpublishing (especially for courses with active enrollments)
3. Activity log to track who published/unpublished courses and when
4. Notification to enrolled students when a course is unpublished
5. Ability to schedule publish/unpublish dates

## Related Files
- `src/pages/InstructorCoursesPage.tsx` - Main file modified
- `src/services/api.ts` - Uses existing `updateCourse` function
- `supabase/schema.sql` - Course status field definition

## Database Schema
No schema changes required. Uses existing `courses.status` field:
```sql
status text default 'published'
  check (status in ('draft', 'published', 'archived'))
```
