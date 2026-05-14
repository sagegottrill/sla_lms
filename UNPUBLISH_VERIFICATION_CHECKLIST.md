# Course Unpublish Feature - Verification Checklist

## ⚠️ CRITICAL: Pre-Deployment Verification Required

This document outlines the complete verification process before pushing to production.

---

## 1. DATABASE SCHEMA VERIFICATION ✅

### Courses Table Structure
```sql
-- From supabase/schema.sql (lines 96-128)
create table public.courses (
  id                  serial primary key,
  ...
  status              text default 'published'
                      check (status in ('draft', 'published', 'archived')),
  created_at          timestamptz default now()
);
```

**Status:** ✅ VERIFIED
- `status` field exists
- Accepts values: 'draft', 'published', 'archived'
- Default is 'published'

---

## 2. RLS POLICIES VERIFICATION ✅

### Update Policy for Courses
```sql
-- From supabase/schema.sql (lines 270-286)
create policy "Staff can update courses"
  on public.courses for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'instructor', 'program_manager')
    )
  );
```

**Status:** ✅ VERIFIED
- Admins CAN update courses (role = 'admin')
- Instructors CAN update courses (role = 'instructor')
- Program managers CAN update courses (role = 'program_manager')
- Policy includes both USING and WITH CHECK clauses

---

## 3. API LAYER VERIFICATION ✅

### updateCourse Function
```typescript
// From src/services/api.ts (lines 150-173)
updateCourse: async (id: number, updates: Partial<Course> & Record<string, unknown>): Promise<ApiResponse<Course | null>> => {
  if (!USE_SUPABASE) {
    return { data: null, error: null, success: true };
  }
  
  try {
    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase updateCourse error:", error.message);
      return { data: null, error: error.message, success: false };
    }
    
    return { data: data, error: null, success: true };
  } catch (error: any) {
    console.error("Supabase updateCourse error:", error.message);
    return { data: null, error: error.message, success: false };
  }
}
```

**Status:** ✅ VERIFIED
- Function exists and is properly typed
- Returns ApiResponse with success/error handling
- Uses Supabase client correctly
- Includes error logging

---

## 4. REACT QUERY INTEGRATION ✅

### Query Invalidation
```typescript
// From src/hooks/useQueries.ts
queryClient.invalidateQueries({ queryKey: ["courses"] });
queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
```

**Status:** ✅ VERIFIED
- Query keys match the ones used in useCourses hook
- Invalidation will trigger automatic refetch
- UI will update automatically after status change

---

## 5. FRONTEND IMPLEMENTATION ✅

### InstructorCoursesPage Changes
```typescript
// New imports
import { api } from "@/services/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EyeOff, Eye } from "lucide-react";

// New state
const [updatingCourseId, setUpdatingCourseId] = useState<number | null>(null);
const isAdmin = appUser?.role === "admin";

// New function
const handleTogglePublish = async (courseId: number, currentStatus: string) => {
  if (!isAdmin) {
    toast.error("Only admins can unpublish courses");
    return;
  }
  // ... implementation
}
```

**Status:** ✅ VERIFIED
- All imports are correct
- State management is proper
- Function has proper error handling
- TypeScript types are correct

---

## 6. SUPABASE CONNECTION VERIFICATION

### Environment Variables Required
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Status:** ⚠️ NEEDS VERIFICATION
- Check `.env` file exists (not tracked in git)
- Verify credentials are set correctly
- Test connection to Supabase

### How to Verify:
```bash
# Check if .env file exists
ls -la .env

# Verify Supabase connection (check browser console)
# Should NOT see: "Supabase credentials are not set in .env!"
```

---

## 7. TESTING CHECKLIST

### Before Pushing to Production:

#### A. Database Tests
- [ ] Verify courses table exists in Supabase
- [ ] Verify status field accepts 'draft', 'published', 'archived'
- [ ] Verify RLS policy "Staff can update courses" exists
- [ ] Test admin user can update course status via SQL:
  ```sql
  -- Run in Supabase SQL Editor (as admin user)
  UPDATE courses SET status = 'draft' WHERE id = <test_course_id>;
  SELECT id, title, status FROM courses WHERE id = <test_course_id>;
  ```

#### B. API Tests
- [ ] Test API call in browser console:
  ```javascript
  // In browser console (logged in as admin)
  const { api } = await import('/src/services/api.ts');
  const result = await api.updateCourse(1, { status: 'draft' });
  console.log(result);
  ```

#### C. UI Tests (Manual)
- [ ] Log in as admin user
- [ ] Navigate to Dashboard → Courses
- [ ] Verify "All courses" heading appears (not "My courses")
- [ ] Hover over a published course row
- [ ] Verify "Unpublish" button appears
- [ ] Click "Unpublish" button
- [ ] Verify loading spinner appears
- [ ] Verify success toast appears
- [ ] Verify course status changes to "draft" in table
- [ ] Verify button changes to "Publish"
- [ ] Click "Publish" button
- [ ] Verify course status changes back to "published"

#### D. Permission Tests
- [ ] Log in as instructor (non-admin)
- [ ] Navigate to Dashboard → Courses
- [ ] Verify "Unpublish" button does NOT appear
- [ ] Log in as student
- [ ] Verify cannot access courses management page

#### E. Edge Cases
- [ ] Test with course that has enrollments
- [ ] Test with course that is already draft
- [ ] Test with course that is archived
- [ ] Test network error handling (disconnect internet)
- [ ] Test concurrent updates (two admins updating same course)

---

## 8. ROLLBACK PLAN

If issues occur in production:

### Immediate Rollback (Frontend Only)
```bash
# Revert the InstructorCoursesPage.tsx changes
git revert <commit-hash>
git push
```

### Database Rollback (If Needed)
```sql
-- No database changes were made, so no rollback needed
-- RLS policies already existed
```

---

## 9. MONITORING AFTER DEPLOYMENT

### What to Monitor:
1. **Error Logs**: Check browser console for errors
2. **Supabase Logs**: Monitor for RLS policy violations
3. **User Reports**: Watch for complaints about course visibility
4. **Database**: Monitor for unexpected status changes

### Key Metrics:
- Number of unpublish operations per day
- Error rate for updateCourse API calls
- RLS policy violation count

---

## 10. KNOWN LIMITATIONS

1. **No Confirmation Dialog**: Unpublishing happens immediately without confirmation
   - **Risk**: Accidental unpublish of active courses
   - **Mitigation**: Only admins can unpublish, and it's reversible

2. **No Notification to Students**: Students enrolled in unpublished courses are not notified
   - **Risk**: Students may be confused if course disappears
   - **Mitigation**: Document this behavior for admins

3. **No Audit Trail**: No record of who unpublished a course and when
   - **Risk**: Cannot track who made changes
   - **Mitigation**: Consider adding audit logging in future

4. **No Bulk Operations**: Can only unpublish one course at a time
   - **Risk**: Time-consuming for multiple courses
   - **Mitigation**: Future enhancement

---

## 11. FINAL VERIFICATION BEFORE PUSH

### Pre-Push Command Checklist:
```bash
# 1. Verify TypeScript compilation
npm run build

# 2. Check for linting errors
npm run lint

# 3. Verify no console errors in dev mode
npm run dev
# Then open browser and check console

# 4. Run any existing tests
npm test  # if tests exist
```

### Manual Verification:
- [ ] Code compiles without errors
- [ ] No TypeScript errors in IDE
- [ ] No console errors in browser
- [ ] Feature works as expected in local environment
- [ ] Tested with actual Supabase database (not mock data)
- [ ] Verified admin permissions work correctly
- [ ] Verified non-admin users cannot see the button

---

## 12. DEPLOYMENT STEPS

### Step 1: Backup Current State
```bash
# Create a backup branch
git checkout -b backup-before-unpublish-feature
git push origin backup-before-unpublish-feature
```

### Step 2: Deploy to Staging (If Available)
```bash
# Deploy to staging environment first
git checkout staging
git merge main
git push origin staging
# Test thoroughly in staging
```

### Step 3: Deploy to Production
```bash
# Only after staging verification
git checkout main
git push origin main
```

### Step 4: Post-Deployment Verification
- [ ] Test unpublish feature in production
- [ ] Verify no errors in production logs
- [ ] Confirm with stakeholder that feature works

---

## 13. COMMUNICATION PLAN

### Before Deployment:
- [ ] Notify stakeholders of new feature
- [ ] Document how to use unpublish feature
- [ ] Explain limitations and edge cases

### After Deployment:
- [ ] Send confirmation email to stakeholders
- [ ] Provide quick start guide
- [ ] Set up support channel for questions

---

## ✅ FINAL SIGN-OFF

**Developer Verification:**
- [ ] All code changes reviewed
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Rollback plan ready

**Stakeholder Approval:**
- [ ] Feature demonstrated
- [ ] Limitations explained
- [ ] Approval received

**Production Ready:**
- [ ] All checklist items completed
- [ ] Backup created
- [ ] Monitoring in place
- [ ] Support team notified

---

## 🚨 STOP - DO NOT PUSH UNTIL:

1. ✅ You have verified the feature works in your local environment
2. ✅ You have tested with actual Supabase database
3. ✅ You have confirmed admin permissions work
4. ✅ You have tested error scenarios
5. ✅ You have stakeholder approval
6. ✅ You have a rollback plan ready

---

**Last Updated:** [Current Date]
**Verified By:** [Your Name]
**Status:** PENDING VERIFICATION
