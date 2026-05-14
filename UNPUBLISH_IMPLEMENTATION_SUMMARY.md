# Course Unpublish Feature - Implementation Summary

## Executive Summary

**What was changed:** Added an "Unpublish" button for admin users on the courses management page.

**Risk Level:** 🟢 LOW RISK
- No database schema changes
- No new RLS policies needed
- Uses existing, tested API functions
- Only affects admin users
- Fully reversible action

---

## What This Feature Does

### For Admin Users:
1. Navigate to Dashboard → Courses
2. Hover over any course row
3. See "Unpublish" button (for published courses) or "Publish" button (for draft courses)
4. Click to toggle course visibility
5. Course immediately becomes hidden/visible to students

### For Other Users:
- **No change** - they don't see the button at all

---

## Technical Changes Made

### 1. Single File Modified
**File:** `src/pages/InstructorCoursesPage.tsx`

**Changes:**
- Added 4 new imports (icons, API, toast, query client)
- Added 2 state variables (updatingCourseId, isAdmin)
- Added 1 new function (handleTogglePublish)
- Modified 1 table cell (added Unpublish button)

**Lines Changed:** ~50 lines added/modified out of ~200 total lines

### 2. No Database Changes
- ✅ No new tables
- ✅ No schema modifications
- ✅ No new RLS policies
- ✅ No migrations needed

### 3. No New API Endpoints
- ✅ Uses existing `api.updateCourse()` function
- ✅ Function already tested and in production
- ✅ No new backend code

---

## Why This Is Safe

### 1. Uses Existing Infrastructure
```typescript
// We're using this existing function:
api.updateCourse(courseId, { status: newStatus })

// This function is already used by:
// - Course builder (when saving courses)
// - Instructor dashboard (when editing courses)
// - Program builder (when updating course details)
```

**Proof:** Search codebase for `api.updateCourse` - it's used in 5+ places already.

### 2. RLS Policies Already Exist
```sql
-- This policy has been in production since day 1:
create policy "Staff can update courses"
  on public.courses for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  )
```

**Proof:** Check `supabase/schema.sql` line 270-286

### 3. Status Field Already Exists
```sql
-- This field has been in the schema from the beginning:
status text default 'published'
  check (status in ('draft', 'published', 'archived'))
```

**Proof:** Check `supabase/schema.sql` line 124-125

### 4. Only Admins Can Use It
```typescript
// Button only renders for admins:
{isAdmin && (
  <Button onClick={...}>Unpublish</Button>
)}

// Function checks admin status:
if (!isAdmin) {
  toast.error("Only admins can unpublish courses");
  return;
}
```

### 5. Fully Reversible
- Unpublishing changes status from 'published' to 'draft'
- Publishing changes status from 'draft' to 'published'
- No data is deleted
- No relationships are broken
- Can be undone with one click

---

## What Could Go Wrong (and Mitigations)

### Scenario 1: Admin Accidentally Unpublishes Active Course
**Impact:** Students temporarily can't access the course
**Mitigation:** 
- Admin can immediately re-publish with one click
- No data is lost
- Enrollments remain intact
**Likelihood:** Low (requires deliberate click on hover button)

### Scenario 2: RLS Policy Doesn't Allow Update
**Impact:** Update fails, error message shown
**Mitigation:**
- Error is caught and displayed to user
- No partial updates (transaction-based)
- User can retry or contact support
**Likelihood:** Very Low (RLS policies tested in production)

### Scenario 3: Network Error During Update
**Impact:** Update might not complete
**Mitigation:**
- Loading state prevents double-clicks
- Error message shown to user
- User can retry
- Supabase handles transaction rollback
**Likelihood:** Low (standard network error handling)

### Scenario 4: Two Admins Update Same Course Simultaneously
**Impact:** Last update wins (standard database behavior)
**Mitigation:**
- Query invalidation refreshes UI for both users
- No data corruption (atomic updates)
- Both users see final state after refresh
**Likelihood:** Very Low (rare for two admins to edit same course)

---

## Testing Strategy

### Automated Tests
- ✅ TypeScript compilation (no errors)
- ✅ Linting (no warnings)
- ✅ Build process (successful)

### Manual Tests Required
1. **Happy Path:**
   - [ ] Admin can unpublish published course
   - [ ] Admin can publish draft course
   - [ ] Status updates in UI immediately
   - [ ] Success toast appears

2. **Error Handling:**
   - [ ] Non-admin users don't see button
   - [ ] Error toast appears on failure
   - [ ] Loading state prevents double-clicks

3. **Edge Cases:**
   - [ ] Works with courses that have enrollments
   - [ ] Works with archived courses
   - [ ] Works with newly created courses

### Backend Tests (Run in Browser Console)
See `test-unpublish-backend.md` for detailed test scripts.

---

## Rollback Plan

### If Issues Occur:

#### Option 1: Quick Frontend Rollback (5 minutes)
```bash
# Revert the single file change
git checkout HEAD~1 src/pages/InstructorCoursesPage.tsx
git commit -m "Rollback: Remove unpublish feature"
git push
```

#### Option 2: Full Rollback (2 minutes)
```bash
# Revert the entire commit
git revert <commit-hash>
git push
```

#### Option 3: Emergency Disable (30 seconds)
```typescript
// In InstructorCoursesPage.tsx, change:
const isAdmin = appUser?.role === "admin";
// To:
const isAdmin = false; // Temporarily disable unpublish feature
```

**No database rollback needed** - we didn't change the database!

---

## Comparison with Existing Features

This feature is **less risky** than features already in production:

| Feature | Risk Level | Reason |
|---------|-----------|--------|
| **Course Creation** | 🟡 Medium | Creates new database records |
| **Course Deletion** | 🔴 High | Permanently removes data |
| **Enrollment Management** | 🟡 Medium | Affects student access |
| **Payment Processing** | 🔴 High | Involves money |
| **User Role Changes** | 🔴 High | Affects permissions |
| **Unpublish Course** | 🟢 Low | Only changes status flag, fully reversible |

---

## Stakeholder Communication

### Before Deployment:
**Email Template:**
```
Subject: New Feature: Course Unpublish for Admins

Hi [Stakeholder],

We've added a new feature that allows admins to unpublish courses directly 
from the courses management page.

What it does:
- Admins can now hide courses from students with one click
- Useful for managing test courses or temporarily hiding content
- Fully reversible - can re-publish anytime

How to use:
1. Go to Dashboard → Courses
2. Hover over any course
3. Click "Unpublish" to hide it from students
4. Click "Publish" to make it visible again

This will be deployed on [Date] at [Time].

Let me know if you have any questions!
```

### After Deployment:
```
Subject: Course Unpublish Feature - Now Live

Hi [Stakeholder],

The course unpublish feature is now live and ready to use.

Quick test:
1. Log in as admin
2. Go to Dashboard → Courses
3. Try unpublishing a test course

Everything is working as expected. Let me know if you notice any issues.
```

---

## Monitoring Plan

### What to Monitor (First 24 Hours):

1. **Error Rate:**
   - Check browser console for errors
   - Monitor Supabase logs for RLS violations
   - Watch for failed API calls

2. **Usage Metrics:**
   - How many courses are unpublished?
   - How many times is the feature used?
   - Any patterns in usage?

3. **User Feedback:**
   - Any confusion about the feature?
   - Any requests for improvements?
   - Any bug reports?

### Red Flags to Watch For:
- ❌ Multiple RLS policy violations
- ❌ Courses being unpublished unintentionally
- ❌ Error rate > 5%
- ❌ Student complaints about missing courses

### Green Flags (Feature Working):
- ✅ Admins successfully unpublishing courses
- ✅ No errors in logs
- ✅ UI updates correctly
- ✅ Positive feedback from admins

---

## Future Enhancements (Not in This Release)

1. **Confirmation Dialog:**
   - "Are you sure you want to unpublish this course?"
   - Especially important for courses with active enrollments

2. **Bulk Operations:**
   - Select multiple courses
   - Unpublish all at once

3. **Audit Trail:**
   - Log who unpublished what and when
   - Useful for accountability

4. **Student Notifications:**
   - Notify enrolled students when course is unpublished
   - Explain why and when it will be back

5. **Scheduled Publishing:**
   - Set a date/time to automatically publish/unpublish
   - Useful for time-limited courses

---

## Conclusion

### Summary:
- ✅ Low-risk change (single file, no database changes)
- ✅ Uses existing, tested infrastructure
- ✅ Fully reversible action
- ✅ Only affects admin users
- ✅ Easy to rollback if needed
- ✅ Solves real user need (managing test courses)

### Recommendation:
**SAFE TO DEPLOY** after completing manual testing checklist.

### Next Steps:
1. Run backend verification tests (see `test-unpublish-backend.md`)
2. Complete manual testing checklist (see `UNPUBLISH_VERIFICATION_CHECKLIST.md`)
3. Get stakeholder approval
4. Deploy to staging (if available)
5. Deploy to production
6. Monitor for 24 hours
7. Collect feedback

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** [Your Name]  
**Status:** Ready for Review
