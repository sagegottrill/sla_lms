# Backend Verification Test Script

## Quick Backend Test (Run This First)

### Test 1: Verify Supabase Connection

Open your browser console (F12) on the app and run:

```javascript
// Test 1: Check Supabase connection
const { supabase } = await import('/src/lib/supabase.ts');
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Connected:', !!supabase);

// Test 2: Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.email);
console.log('User ID:', user?.id);

// Test 3: Get user profile and role
const { data: profile } = await supabase
  .from('profiles')
  .select('id, name, email, role')
  .eq('id', user?.id)
  .single();
console.log('User profile:', profile);
console.log('User role:', profile?.role);
```

**Expected Output:**
- Supabase URL should be your actual Supabase URL (not placeholder)
- User should be logged in
- Profile should show role = 'admin'

---

### Test 2: Verify Courses Table Access

```javascript
// Test: Can we read courses?
const { data: courses, error } = await supabase
  .from('courses')
  .select('id, title, status')
  .limit(5);

console.log('Courses:', courses);
console.log('Error:', error);
```

**Expected Output:**
- Should return array of courses
- Error should be null
- Each course should have id, title, status

---

### Test 3: Verify Update Permission (READ THIS CAREFULLY)

⚠️ **WARNING**: This will actually update a course in your database!

```javascript
// STEP 1: Find a test course
const { data: testCourse } = await supabase
  .from('courses')
  .select('id, title, status')
  .limit(1)
  .single();

console.log('Test course BEFORE:', testCourse);

// STEP 2: Try to update it
const { data: updated, error: updateError } = await supabase
  .from('courses')
  .update({ status: 'draft' })
  .eq('id', testCourse.id)
  .select()
  .single();

console.log('Updated course:', updated);
console.log('Update error:', updateError);

// STEP 3: Verify the change
const { data: verified } = await supabase
  .from('courses')
  .select('id, title, status')
  .eq('id', testCourse.id)
  .single();

console.log('Test course AFTER:', verified);

// STEP 4: Restore original status
const { data: restored } = await supabase
  .from('courses')
  .update({ status: testCourse.status })
  .eq('id', testCourse.id)
  .select()
  .single();

console.log('Restored to original:', restored);
```

**Expected Output:**
- Update should succeed (no error)
- Status should change from 'published' to 'draft'
- Verification should show new status
- Restore should work

**If you get an error:**
- Check the error message
- Verify you're logged in as admin
- Check RLS policies in Supabase dashboard

---

### Test 4: Verify API Layer

```javascript
// Test the API wrapper
const { api } = await import('/src/services/api.ts');

// Get a test course
const coursesResponse = await api.getCourses({ publishedOnly: false });
console.log('API getCourses:', coursesResponse);

const testCourseId = coursesResponse.data[0]?.id;
console.log('Test course ID:', testCourseId);

// Try to update via API
const updateResponse = await api.updateCourse(testCourseId, { 
  status: 'draft' 
});

console.log('API updateCourse response:', updateResponse);
console.log('Success:', updateResponse.success);
console.log('Error:', updateResponse.error);
console.log('Updated data:', updateResponse.data);

// Restore
await api.updateCourse(testCourseId, { 
  status: 'published' 
});
```

**Expected Output:**
- getCourses should return success: true
- updateCourse should return success: true
- data should contain the updated course
- error should be null

---

## Common Issues and Solutions

### Issue 1: "Supabase credentials are not set"
**Solution:** 
1. Check if `.env` file exists in project root
2. Verify it contains:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart dev server: `npm run dev`

### Issue 2: "RLS policy violation" or "permission denied"
**Solution:**
1. Verify you're logged in as admin
2. Check Supabase Dashboard → Authentication → Users
3. Verify your user's role in profiles table:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
   ```
4. If role is not 'admin', update it:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

### Issue 3: "Cannot read property 'id' of undefined"
**Solution:**
1. Make sure you have at least one course in the database
2. Create a test course if needed:
   ```sql
   INSERT INTO courses (title, instructor, category, duration, price, status)
   VALUES ('Test Course', 'Test Instructor', 'Test', '1 hour', 0, 'published');
   ```

### Issue 4: Update succeeds but UI doesn't refresh
**Solution:**
1. Check React Query DevTools (if installed)
2. Verify query invalidation is working
3. Check browser console for errors
4. Try hard refresh (Ctrl+Shift+R)

---

## SQL Verification Queries

Run these in Supabase SQL Editor to verify database state:

### Check RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'courses' 
  AND policyname LIKE '%update%';
```

### Check Your User Role
```sql
SELECT 
  p.id,
  p.email,
  p.role,
  p.name
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

### Check Course Statuses
```sql
SELECT 
  status,
  COUNT(*) as count
FROM courses
GROUP BY status
ORDER BY count DESC;
```

### Test Update Permission Directly
```sql
-- This should work if you're admin
UPDATE courses 
SET status = 'draft' 
WHERE id = 1 
RETURNING id, title, status;

-- Restore it
UPDATE courses 
SET status = 'published' 
WHERE id = 1 
RETURNING id, title, status;
```

---

## Final Verification Checklist

Before pushing to production, verify:

- [ ] Supabase connection works
- [ ] Can read courses from database
- [ ] Can update course status via Supabase client
- [ ] Can update course status via API wrapper
- [ ] RLS policies allow admin to update
- [ ] Query invalidation triggers UI refresh
- [ ] Error handling works (test with invalid course ID)
- [ ] Non-admin users cannot update (test with different role)

---

## If All Tests Pass

✅ **Backend is ready!** The unpublish feature should work correctly.

## If Tests Fail

❌ **DO NOT PUSH TO PRODUCTION**

1. Document which test failed
2. Check the error message
3. Review the "Common Issues" section above
4. Fix the issue
5. Re-run all tests
6. Only push when all tests pass

---

## Need Help?

If tests fail and you can't resolve:

1. Copy the error message
2. Note which test failed
3. Check Supabase logs (Dashboard → Logs)
4. Review RLS policies (Dashboard → Database → Policies)
5. Verify user role in profiles table
