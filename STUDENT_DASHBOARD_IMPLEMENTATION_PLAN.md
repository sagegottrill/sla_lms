# Student Dashboard Implementation Plan
**Status:** Ready to Implement  
**Priority:** HIGH  
**Estimated Timeline:** 3 weeks

---

## Quick Summary

Based on competitive research of Canvas, Moodle, and TalentLMS, we identified **5 critical gaps** in our Student Dashboard:

1. ❌ **No To-Do List** - Students can't see upcoming deadlines across courses
2. ❌ **No Recent Feedback** - Students miss instructor feedback notifications
3. ⚠️ **Broken Calendar** - Non-functional feature that confuses users
4. ❌ **No Global Announcements** - No way to communicate institution-wide updates
5. ❌ **No Dashboard View Options** - One-size-fits-all approach

**Current Grade: C (75/100)**  
**Target Grade: A- (92/100)**

---

## Implementation Phases

### ✅ Phase 1: Critical Fixes (Week 1)
**Priority:** URGENT  
**Goal:** Fix broken features, add to-do list

**Tasks:**
1. Remove broken calendar widget OR make it functional
2. Add To-Do List Widget showing next 7 upcoming assignments
3. Simplify onboarding banner (reduce size, add auto-dismiss)

**Files to Create:**
- `src/components/dashboard/ToDoListWidget.tsx`
- `src/components/dashboard/ToDoItem.tsx`
- `src/hooks/useUpcomingDeadlines.ts`

**Database Changes:**
```sql
CREATE TABLE user_todo_items (...)
CREATE TABLE user_dashboard_preferences (...)
```

**Expected Impact:** Grade improves from C (75) to C+ (78)

---

### ✅ Phase 2: High-Value Additions (Week 2)
**Priority:** HIGH  
**Goal:** Add recent feedback, functional calendar, announcements

**Tasks:**
1. Add Recent Feedback Section (last 4 weeks of graded work)
2. Make Calendar functional with real course deadlines
3. Add Global Announcements system

**Files to Create:**
- `src/components/dashboard/RecentFeedbackWidget.tsx`
- `src/components/dashboard/FeedbackItem.tsx`
- `src/components/dashboard/CalendarWidget.tsx`
- `src/components/dashboard/GlobalAnnouncement.tsx`
- `src/hooks/useRecentFeedback.ts`
- `src/hooks/useCalendarEvents.ts`
- `src/hooks/useGlobalAnnouncements.ts`

**Database Changes:**
```sql
CREATE TABLE global_announcements (...)
CREATE TABLE dismissed_announcements (...)
CREATE TABLE user_calendar_events (...)
ALTER TABLE submissions ADD COLUMN feedback_viewed BOOLEAN
```

**Expected Impact:** Grade improves from C+ (78) to B+ (88)

---

### ✅ Phase 3: Polish & Enhancement (Week 3)
**Priority:** MEDIUM  
**Goal:** Add view options, improve personalization

**Tasks:**
1. Add Dashboard View Options (Card, List, Activity)
2. Enhanced personalization (streaks, badges)
3. Remove help bubble, add proper help system

**Files to Create:**
- `src/components/dashboard/DashboardViewSwitcher.tsx`
- `src/components/dashboard/ListViewDashboard.tsx`
- `src/components/dashboard/ActivityViewDashboard.tsx`
- `src/hooks/useDashboardPreferences.ts`

**Expected Impact:** Grade improves from B+ (88) to A- (92)

---

## API Functions Needed

### To-Do List:
```typescript
getUpcomingDeadlines(userId: string, limit: number = 7)
getUserToDoItems(userId: string)
createToDoItem(userId: string, item: ToDoItem)
dismissToDoItem(itemId: string)
completeToDoItem(itemId: string)
```

### Recent Feedback:
```typescript
getRecentFeedback(userId: string, weeks: number = 4)
markFeedbackViewed(submissionId: string)
```

### Calendar:
```typescript
getCalendarEvents(userId: string, month: number, year: number)
createCalendarEvent(userId: string, event: CalendarEvent)
deleteCalendarEvent(eventId: string)
```

### Announcements:
```typescript
getGlobalAnnouncements()
dismissAnnouncement(userId: string, announcementId: string)
getDismissedAnnouncements(userId: string)
createGlobalAnnouncement(announcement: Announcement) // Admin only
```

---

## Success Metrics

**Quantitative:**
- Deadline adherence: +15%
- Dashboard engagement: +25%
- Feedback review rate: +40%
- Support tickets: -30%

**Qualitative:**
- User satisfaction: 4.5/5
- Feature adoption: 70%+
- Calendar usage: 40%+

---

## Next Steps

1. ✅ Review research report: `LMS_STUDENT_DASHBOARD_RESEARCH_REPORT.md`
2. ⏳ Get stakeholder approval for Phase 1
3. ⏳ Begin Phase 1 implementation
4. ⏳ Test with pilot group of students
5. ⏳ Roll out to all students
6. ⏳ Measure success metrics
7. ⏳ Iterate based on feedback

---

## Related Documents

- **Full Research Report:** `LMS_STUDENT_DASHBOARD_RESEARCH_REPORT.md`
- **Admin Dashboard Research:** `LMS_ADMIN_RESEARCH_REPORT.md`
- **Current Implementation:** `src/pages/dashboards/StudentDashboard.tsx`

---

**Ready to start Phase 1?** Let me know and I'll begin implementing the to-do list widget!
