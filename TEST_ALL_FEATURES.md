# 🧪 COMPREHENSIVE FEATURE TESTING GUIDE

**Date:** May 4, 2026  
**Status:** ✅ All migrations applied successfully  
**Next Step:** Test each critical flow

---

## ✅ MIGRATION STATUS: COMPLETE

All 13 required tables are now in your database:
- course_applications ✅
- program_applications ✅
- lessons ✅
- submissions ✅
- global_announcements ✅
- dismissed_announcements ✅
- user_calendar_events ✅
- instructor_activity_feed ✅
- instructor_dashboard_preferences ✅
- archived_courses ✅
- And 3 more supporting tables ✅

---

## 🎯 CRITICAL FLOWS TO TEST (In Order)

### TEST 1: Course Enrollment Flow ⭐ HIGHEST PRIORITY

**What to Test:**
1. Go to your app: `/courses`
2. Click on any course
3. Click "Enroll Now" button
4. Fill out the enrollment form:
   - Full Name
   - Email
   - Phone
   - Learning Goal (optional)
5. Click "Submit"

**Expected Result:**
- ✅ Form submits successfully
- ✅ See success message (NOT "Could not save your details")
- ✅ Redirect to checkout or confirmation page

**If It Fails:**
- Open browser console (F12)
- Copy the error message
- Tell me the exact error

**Database Check:**
```sql
-- Run this in Supabase SQL Editor to see if data was saved:
SELECT * FROM course_applications 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### TEST 2: Program Application Flow ⭐ HIGH PRIORITY

**What to Test:**
1. Go to `/programs`
2. Click on any program
3. Click "Apply" button
4. Fill out application form:
   - Full Name
   - Email
   - Phone
5. Click "Submit"

**Expected Result:**
- ✅ Form submits successfully
- ✅ See success message
- ✅ Confirmation page shows

**If It Fails:**
- Check browser console
- Copy error message

**Database Check:**
```sql
-- Check if application was saved:
SELECT * FROM program_applications 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### TEST 3: Instructor Dashboard ⭐ HIGH PRIORITY

**What to Test:**
1. Login as instructor (or create instructor account)
2. Go to `/dashboard`
3. Check if you see these 4 widgets:
   - 📝 Grading Queue
   - 📊 Course Analytics
   - ⏰ Upcoming Deadlines
   - 🔔 Recent Activity

**Expected Result:**
- ✅ All 4 widgets visible
- ✅ Widgets show data (or "No data" if empty)
- ✅ No error messages
- ✅ Can switch views (Card/List/Activity)

**If It Fails:**
- Check browser console
- Take screenshot of what you see
- Tell me which widgets are missing

**Database Check:**
```sql
-- Check if instructor preferences work:
SELECT * FROM instructor_dashboard_preferences;

-- Check if analytics cache exists:
SELECT * FROM course_analytics_cache;
```

---

### TEST 4: Student Dashboard ⭐ MEDIUM PRIORITY

**What to Test:**
1. Login as student
2. Go to `/dashboard`
3. Check if you see:
   - Enrolled courses
   - Progress indicators
   - Announcements (if any)
   - Calendar (if any events)

**Expected Result:**
- ✅ Dashboard loads without errors
- ✅ Shows enrolled courses
- ✅ Progress bars work
- ✅ Can switch views

**If It Fails:**
- Check browser console
- Screenshot the dashboard

---

### TEST 5: Course Content Access ⭐ MEDIUM PRIORITY

**What to Test:**
1. Enroll in a course (or use existing enrollment)
2. Go to course page
3. Click on a lesson
4. Try to mark lesson as complete

**Expected Result:**
- ✅ Can access lesson content
- ✅ Can mark lesson complete
- ✅ Progress updates

**Database Check:**
```sql
-- Check if lessons exist:
SELECT * FROM lessons LIMIT 5;

-- Check if submissions work:
SELECT * FROM submissions LIMIT 5;
```

---

### TEST 6: Bulk Course Actions (Instructor) ⭐ LOW PRIORITY

**What to Test:**
1. Login as instructor
2. Go to dashboard
3. Select multiple courses (if UI allows)
4. Try bulk actions:
   - Publish
   - Archive
   - Duplicate

**Expected Result:**
- ✅ Bulk actions work
- ✅ Courses update correctly

---

## 🔍 QUICK VERIFICATION QUERIES

Run these in Supabase SQL Editor to verify everything:

```sql
-- 1. Check all new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'course_applications',
  'program_applications',
  'lessons',
  'submissions',
  'instructor_dashboard_preferences'
)
ORDER BY table_name;

-- 2. Check RLS policies are active
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('course_applications', 'program_applications')
ORDER BY tablename, policyname;

-- 3. Check if any data exists
SELECT 
  'course_applications' as table_name, 
  COUNT(*) as row_count 
FROM course_applications
UNION ALL
SELECT 
  'program_applications', 
  COUNT(*) 
FROM program_applications
UNION ALL
SELECT 
  'lessons', 
  COUNT(*) 
FROM lessons;
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Could not save your details"
**Cause:** RLS policy blocking insert  
**Fix:** Check if user is authenticated  
**SQL Check:**
```sql
-- Check RLS policies:
SELECT * FROM pg_policies 
WHERE tablename = 'course_applications';
```

### Issue 2: Widgets show "No data"
**Cause:** No data in database yet (normal for new setup)  
**Fix:** Create test data or wait for real enrollments

### Issue 3: "Permission denied"
**Cause:** RLS policy too strict  
**Fix:** Check user role in profiles table
```sql
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';
```

### Issue 4: Dashboard doesn't load
**Cause:** Missing view or table  
**Fix:** Re-run SIMPLE_MIGRATION.sql

---

## 📊 SUCCESS CRITERIA

**Ready for Production When:**
- ✅ Course enrollment saves data successfully
- ✅ Program application saves data successfully
- ✅ Instructor dashboard loads all 4 widgets
- ✅ Student dashboard shows enrolled courses
- ✅ No console errors on any page
- ✅ All RLS policies working (users see only their data)

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All 6 tests above pass
- [ ] No console errors
- [ ] Test with real user accounts (not admin)
- [ ] Verify RLS policies (users can't see other users' data)
- [ ] Test on mobile device
- [ ] Have database backup ready
- [ ] Monitor error logs for 24 hours after deployment

---

## 📞 NEXT STEPS

1. **Test Course Enrollment** (Test 1) - Do this first!
2. **Test Program Application** (Test 2) - Do this second!
3. **Test Instructor Dashboard** (Test 3) - Check widgets load
4. **Test Student Dashboard** (Test 4) - Check progress shows
5. **Report Results** - Tell me which tests pass/fail

---

## ✅ WHEN ALL TESTS PASS

You're ready to:
1. Commit final changes
2. Push to GitHub
3. Deploy to production
4. Monitor for 24 hours
5. Celebrate! 🎉

---

**Start with Test 1 (Course Enrollment) and let me know the result!**
