# End-to-End Test Checklist
**Date:** May 4, 2026  
**Purpose:** Verify all critical user flows work before deployment

---

## 🎯 CRITICAL FLOWS TO TEST

### 1. STUDENT ENROLLMENT FLOW
**Path:** Browse Course → View Details → Enroll → Checkout → Access Course

#### Test Steps:
- [ ] Browse courses catalog
- [ ] Click on a course
- [ ] View course details page
- [ ] Click "Enroll Now" button
- [ ] Fill enrollment form (name, email, phone)
- [ ] Submit form
- [ ] Redirect to checkout
- [ ] Complete payment
- [ ] Access course content

#### Required Tables:
- ✅ `courses` - EXISTS
- ✅ `enrollments` - EXISTS
- ⚠️ `course_applications` - CREATED (needs migration)
- ⚠️ `payments` - NEEDS CHECK

#### Potential Issues:
1. ❌ `course_applications` table not in database yet
2. ❌ Checkout page might fail if payments table missing
3. ❌ Enrollment might fail if RLS policies too strict

---

### 2. PROGRAM APPLICATION FLOW
**Path:** Browse Programs → View Details → Apply → Submit Application

#### Test Steps:
- [ ] Browse programs catalog
- [ ] Click on a program
- [ ] View program details
- [ ] Click "Apply" button
- [ ] Fill application form
- [ ] Submit application
- [ ] See confirmation

#### Required Tables:
- ✅ `programs` - EXISTS
- ⚠️ `program_applications` - CREATED (needs migration)

#### Potential Issues:
1. ❌ `program_applications` table not in database yet
2. ❌ Application submission might fail

---

### 3. INSTRUCTOR DASHBOARD FLOW
**Path:** Login as Instructor → View Dashboard → Manage Courses

#### Test Steps:
- [ ] Login as instructor
- [ ] View instructor dashboard
- [ ] See grading queue widget
- [ ] See course analytics widget
- [ ] See upcoming deadlines widget
- [ ] See recent activity widget
- [ ] Switch dashboard views (Card/List/Activity)
- [ ] Toggle widget visibility
- [ ] Manage courses (publish/unpublish)
- [ ] Duplicate a course
- [ ] Archive a course

#### Required Tables:
- ✅ `courses` - EXISTS
- ⚠️ `instructor_grading_queue` - VIEW (Phase 1)
- ⚠️ `course_analytics_cache` - TABLE (Phase 1)
- ⚠️ `instructor_upcoming_deadlines` - VIEW (Phase 2)
- ⚠️ `instructor_recent_activity` - VIEW (Phase 2)
- ⚠️ `instructor_dashboard_preferences` - TABLE (Phase 3)
- ⚠️ `archived_courses` - TABLE (Phase 3)

#### Potential Issues:
1. ❌ Phase 1, 2, 3 migrations not applied yet
2. ❌ Views might not exist
3. ❌ Dashboard preferences might fail

---

### 4. STUDENT DASHBOARD FLOW
**Path:** Login as Student → View Dashboard → Access Courses

#### Test Steps:
- [ ] Login as student
- [ ] View student dashboard
- [ ] See enrolled courses
- [ ] See progress indicators
- [ ] See upcoming deadlines
- [ ] See announcements
- [ ] Switch dashboard views
- [ ] Click on a course
- [ ] Access course content
- [ ] Mark lessons complete
- [ ] Track progress

#### Required Tables:
- ✅ `enrollments` - EXISTS
- ⚠️ `global_announcements` - TABLE (Phase 2)
- ⚠️ `dismissed_announcements` - TABLE (Phase 2)
- ⚠️ `user_calendar_events` - TABLE (Phase 2)
- ⚠️ `lessons` - TABLE (Phase 2)
- ⚠️ `submissions` - TABLE (Phase 2)
- ⚠️ `dashboard_preferences` - TABLE (Phase 3)

#### Potential Issues:
1. ❌ Student dashboard Phase 2, 3 migrations not applied
2. ❌ Progress tracking might fail
3. ❌ Announcements might not show

---

### 5. COURSE CONTENT ACCESS FLOW
**Path:** Enrolled Course → Watch Videos → Complete Lessons → Get Certificate

#### Test Steps:
- [ ] Access enrolled course
- [ ] See course curriculum
- [ ] Click on a lesson
- [ ] Watch video
- [ ] Mark lesson complete
- [ ] Progress saves automatically
- [ ] Complete all lessons
- [ ] Get certificate

#### Required Tables:
- ✅ `enrollments` - EXISTS
- ⚠️ `lessons` - TABLE (needs check)
- ⚠️ `submissions` - TABLE (needs check)
- ⚠️ `certificates` - TABLE (needs check)

#### Potential Issues:
1. ❌ Lesson completion might not save
2. ❌ Progress calculation might fail
3. ❌ Certificate generation might fail

---

### 6. ADMIN DASHBOARD FLOW
**Path:** Login as Admin → Manage Users → Manage Courses → View Analytics

#### Test Steps:
- [ ] Login as admin
- [ ] View admin dashboard
- [ ] See all users
- [ ] Edit user roles
- [ ] View all courses
- [ ] Approve/reject applications
- [ ] View analytics
- [ ] Manage payments

#### Required Tables:
- ✅ `profiles` - EXISTS
- ✅ `courses` - EXISTS
- ⚠️ `course_applications` - CREATED
- ⚠️ `program_applications` - CREATED
- ⚠️ `payments` - NEEDS CHECK

#### Potential Issues:
1. ❌ Applications tables not in database
2. ❌ Admin might not see pending applications

---

## 🔍 DATABASE TABLES STATUS

### ✅ CONFIRMED EXISTING:
- `profiles` - User accounts
- `courses` - Course catalog
- `programs` - Program catalog
- `enrollments` - Course enrollments

### ⚠️ CREATED BUT NOT MIGRATED:
- `course_applications` - Migration file created
- `program_applications` - Migration file created
- `instructor_dashboard_preferences` - Phase 3 migration
- `archived_courses` - Phase 3 migration
- `course_analytics_cache` - Phase 1 migration
- `instructor_activity_feed` - Phase 2 migration
- `global_announcements` - Student Phase 2
- `dismissed_announcements` - Student Phase 2
- `user_calendar_events` - Student Phase 2
- `lessons` - Student Phase 2
- `submissions` - Student Phase 2
- `dashboard_preferences` - Student Phase 3

### ❓ NEEDS VERIFICATION:
- `payments` - Payment processing
- `certificates` - Certificate generation
- `assessments` - Skills assessments

---

## 🚨 CRITICAL ISSUES FOUND

### 1. MIGRATIONS NOT APPLIED
**Impact:** HIGH  
**Issue:** All new tables exist only as migration files, not in database  
**Fix Required:** Apply all migrations to Supabase

**Migrations to Apply:**
1. `20260503_instructor_dashboard_phase1.sql`
2. `20260503_instructor_dashboard_phase2.sql`
3. `20260503_instructor_dashboard_phase3.sql`
4. `20260503_student_dashboard_phase2.sql`
5. `20260503_student_dashboard_phase3.sql`
6. `20260504_course_applications.sql`
7. `20260504_program_applications.sql`

### 2. MISSING CORE TABLES
**Impact:** HIGH  
**Issue:** Some core tables might not exist

**Need to Check:**
- `payments` table
- `certificates` table
- `assessments` table
- `lessons` table (might be in migration)
- `submissions` table (might be in migration)

### 3. API RESPONSE FORMAT INCONSISTENCY
**Impact:** MEDIUM  
**Issue:** Some API functions return `null` instead of `ApiResponse`  
**Status:** FIXED for `createCourseApplication`

**Need to Check:**
- All other API functions in `src/services/api.ts`

### 4. RLS POLICIES TOO STRICT
**Impact:** MEDIUM  
**Issue:** Users might not be able to insert/update their own data  
**Need to Check:**
- `course_applications` policies
- `program_applications` policies
- `enrollments` policies

---

## 🔧 IMMEDIATE ACTIONS NEEDED

### BEFORE DEPLOYMENT:

1. **Apply All Migrations** (CRITICAL)
   ```bash
   # Connect to Supabase and run:
   supabase db reset
   # OR apply each migration manually
   ```

2. **Verify Core Tables Exist**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **Test Enrollment Flow**
   - Create test user
   - Try to enroll in course
   - Check if data saves

4. **Test Application Flow**
   - Try to apply to program
   - Check if application saves

5. **Test Dashboard Widgets**
   - Login as instructor
   - Check if widgets load
   - Check if data shows

---

## 📋 TESTING CHECKLIST

### Pre-Deployment Tests:
- [ ] All migrations applied successfully
- [ ] All tables exist in database
- [ ] All RLS policies working
- [ ] Enrollment form saves data
- [ ] Application form saves data
- [ ] Course content accessible
- [ ] Progress tracking works
- [ ] Dashboard widgets load
- [ ] View switching works
- [ ] Bulk actions work

### Post-Deployment Tests:
- [ ] Student can browse courses
- [ ] Student can enroll
- [ ] Student can access content
- [ ] Student can complete lessons
- [ ] Instructor can see dashboard
- [ ] Instructor can manage courses
- [ ] Admin can see applications
- [ ] Payments process correctly
- [ ] Certificates generate

---

## 🎯 RISK ASSESSMENT

### HIGH RISK (Will Break):
1. ❌ Enrollment forms - tables don't exist
2. ❌ Application forms - tables don't exist
3. ❌ Instructor dashboard widgets - tables/views don't exist
4. ❌ Student dashboard features - tables don't exist

### MEDIUM RISK (Might Break):
1. ⚠️ Progress tracking - depends on lessons table
2. ⚠️ Certificate generation - depends on certificates table
3. ⚠️ Payment processing - depends on payments table

### LOW RISK (Should Work):
1. ✅ Course browsing - uses existing courses table
2. ✅ User authentication - uses existing profiles table
3. ✅ Basic navigation - no database dependencies

---

## 🚀 DEPLOYMENT RECOMMENDATION

**STATUS:** ⚠️ NOT READY FOR PRODUCTION

**Reason:** Critical database migrations not applied

**Required Before Deployment:**
1. Apply all 7 pending migrations
2. Verify all tables exist
3. Test enrollment flow end-to-end
4. Test application flow end-to-end
5. Test dashboard widgets
6. Verify RLS policies

**Estimated Time to Fix:** 30-60 minutes

---

## 📞 NEXT STEPS

1. **STOP** - Don't deploy yet
2. **APPLY MIGRATIONS** - Run all pending migrations
3. **TEST** - Test each critical flow
4. **VERIFY** - Check database tables exist
5. **DEPLOY** - Only after all tests pass

**Want me to help apply the migrations and test each flow?**
