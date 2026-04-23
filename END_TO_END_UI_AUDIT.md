# END_TO_END_UI_AUDIT.md

End-to-End Data Mapping Audit (Principal Full-Stack Architect)  
Objective: identify **“Invisible Backend Features”** and **“Orphaned Data”** where Supabase DB fields / `src/services/api.ts` capabilities exist but are **not rendered**, **not editable**, or **not wired** to UI.

**Rules complied with**: analysis-only, no code changes.

---

## 1) Orphaned Database Columns (data with no UI)

> Source of truth used: `supabase/schema.sql` (core tables) + observed UI pages/components under `src/pages` + `src/components`.

### `public.profiles` (table)
- **Column `interests` (jsonb)**: **no UI to edit/view** (Admin or User).  
  - **Table**: `public.profiles.interests`  
  - **Missing UI**: an “Interests” editor (chips/multi-select) in `src/pages/ProfilePage.tsx` and/or `src/pages/SettingsPage.tsx`.
- **Column `onboarding_completed` (boolean)**: **not visible** to Admin and not clearly visible to user (beyond onboarding flow).  
  - **Table**: `public.profiles.onboarding_completed`  
  - **Missing UI**: Admin Users detail row indicator in `src/pages/AdminUsersPage.tsx` (or similar).
- **Column `joined` / `created_at` / `updated_at`**: **not shown** anywhere for Admin/User.  
  - **Table**: `public.profiles.joined`, `created_at`, `updated_at`  
  - **Missing UI**: “Account created” / “Joined” timestamps on Profile/Users.

### `public.programs` (table)
- **Column `tagline` (text)**: **no UI to edit** and **not rendered** in catalog/cohort pages.  
  - **Table**: `public.programs.tagline`  
  - **Missing UI**: tagline input in `src/pages/ProgramBuilderPage.tsx` and display in `src/pages/ProgramsCatalogPage.tsx` / landing program cards.
- **Column `level` (text)**: **no UI to edit/view**.  
  - **Table**: `public.programs.level`  
  - **Missing UI**: program level selector in `src/pages/ProgramBuilderPage.tsx` + display badge in `src/pages/ProgramsCatalogPage.tsx`.
- **Column `enrolled` (int)**: **not rendered as authoritative** and may be stale/derived; UI typically derives participants from enrollments elsewhere.  
  - **Table**: `public.programs.enrolled`  
  - **Missing UI**: Admin/program-manager “enrollment count source of truth” indicator (whether it’s computed vs stored).
- **Column `course_count` (int)**: UI uses selected courses length; may not display stored `course_count`.  
  - **Table**: `public.programs.course_count`  
  - **Missing UI**: Admin/program-manager detail view showing stored DB values vs computed.
- **Column `created_at` (timestamptz)**: **not displayed**.  
  - **Table**: `public.programs.created_at`  
  - **Missing UI**: “Created” timestamp in program listings and cohort page.
- **Schema drift risk**: UI uses `application_deadline` but `supabase/schema.sql` programs definition does **not** include it.  
  - **File evidence**: `src/pages/ProgramBuilderPage.tsx`, `src/pages/ProgramsCatalogPage.tsx` reference `application_deadline`.  
  - **Gap**: missing/unclear migration path for production; column exists only if separately added.

### `public.courses` (table)
- **Column `rating` / `review_count`**: **no Admin UI to edit** and Student UI may not render authoritative values everywhere.  
  - **Table**: `public.courses.rating`, `review_count`  
  - **Missing UI**: Admin “Reviews & Rating” management surface (or read-only analytics view).
- **Column `students` (int)**: this stored count is **not clearly rendered as authoritative** (metrics often computed from `enrollments`).  
  - **Table**: `public.courses.students`  
  - **Missing UI**: Admin/instructor course detail “enrolled students (computed vs stored)” field.
- **Column `program_id`**: no explicit UI for linking a course to a program via `program_id` (program composition is currently by course *title* arrays).  
  - **Table**: `public.courses.program_id`  
  - **Missing UI**: ProgramBuilder “attach course by ID” (or CourseBuilder “belongs to program”) control.
- **Columns `created_at`**: not displayed.  
  - **Table**: `public.courses.created_at`  
  - **Missing UI**: created timestamp for admin/instructor course lists.

### `public.enrollments` (table)
- **Column `current_lesson`**: not rendered (no “resume from exact lesson id” UI).  
  - **Table**: `public.enrollments.current_lesson`  
  - **Missing UI**: Resume UI that deep-links to stored `current_lesson`.
- **Column `completed_at`**: not clearly displayed in course completion history (beyond certificates).  
  - **Table**: `public.enrollments.completed_at`  
  - **Missing UI**: completed timestamp visible in `src/pages/MyCourses.tsx` or `src/pages/CertificatesPage.tsx`.
- **Column `status='frozen'` support**: UI shows “Frozen” tab, but audit did not confirm any backend mutation that sets `status='frozen'`.  
  - **Table**: `public.enrollments.status`  
  - **Gap**: Admin/instructor control to freeze/unfreeze enrollments is missing.

### `public.payments` (table)
- **Payments ledger is not rendered** (only an aggregate “Total Revenue” via stats; the transactions table is placeholder).  
  - **Table**: `public.payments.*`  
  - **UI file**: `src/pages/PaymentsPage.tsx`  
  - **Missing UI**: actual payments table rows (customer, course/program, status, reference, method, created_at).
- **Potential missing API surface**: audit did not confirm a dedicated `api.getPayments()` or equivalent list function used by `PaymentsPage`.  
  - **File**: `src/services/api.ts` (no direct evidence in this audit window)  
  - **Gap**: DB exists but no UI/API wiring for detailed transactions.

### `public.jobs` (table)
- **Table exists but no functional UI is exposed** (dashboard route redirects away from jobs).  
  - **Table**: `public.jobs.*`  
  - **File evidence**: `src/App.tsx` redirects `/dashboard/jobs` → `/dashboard/courses`  
  - **Gap**: jobs board UI (student view) + job CRUD UI (admin view) is missing.

---

## 2) “Dead End” API Calls (functions/hooks written but not used)

> Method: scan `src/services/api.ts` exported members and cross-check imports/usages across `src/pages/**` and `src/components/**`.

### Confirmed “dead end” *pattern*: API functionality exists but UI doesn’t expose it fully
- **Payments**: `public.payments` schema exists, and `PaymentsPage` exists, but UI does not call a payments listing API and does not render ledger rows.  
  - **Files**: `supabase/schema.sql`, `src/pages/PaymentsPage.tsx`
  - **Missing UI wiring**: payments list query + table rendering.

### Items that are **not dead ends** (wired into UI)
- **Saved reports** API functions are used.  
  - **API**: `api.getSavedReports`, `api.upsertSavedReport`, `api.deleteSavedReport`  
  - **UI**: `src/pages/ReportBuilderPage.tsx`
- **Marketing campaigns** API functions are used.  
  - **API**: `api.getCampaigns`, `api.createCampaign`  
  - **UI**: `src/pages/CampaignsPage.tsx`
- **Notification preferences + notification state** are used.  
  - **API**: `api.getNotificationPreferences`, `api.upsertNotificationPreferences`, `api.getUserNotificationState`, `api.upsertUserNotificationState`  
  - **UI**: `src/pages/NotificationPrefsPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/NotificationsPage.tsx`
- **Certificates** are used.  
  - **API**: `api.getCertificates`  
  - **UI**: `src/pages/CertificatesPage.tsx`

### High-risk candidate dead ends (require deeper verification)
These are present in DB schema and/or `api.ts` but were not confirmed as end-to-end rendered within the files sampled for this audit:
- **Jobs**: schema present; route redirects; likely no UI uses jobs list.
  - **Table**: `public.jobs`
  - **Missing UI**: `JobsPage` route + API usage.
- **Webhook events / audit logging**: schema scripts exist (`supabase/pillar_4_audit_logging.sql`) but no UI surface was confirmed.
  - **File**: `supabase/pillar_4_audit_logging.sql`
  - **Missing UI**: Admin audit log viewer/dashboard.

---

## 3) Silent Mutations (backend write with weak/no UI feedback)

> Goal: find mutation actions (POST/PUT/DELETE) that do not produce an explicit success/failure state for the user (toast, redirect, close modal, optimistic update, etc.).

### Confirmed “silent/weak feedback” mutations
- **Notification preference upserts triggered by toggles lack explicit error feedback**  
  - **File**: `src/pages/SettingsPage.tsx`
  - **Behavior**:
    - Toggling calls `api.upsertNotificationPreferences(...)` inside state updates.
    - UI shows `toast.info(...)` about the toggle event, but **no toast/error handling** for network/RLS failure in the `.then(...)` chain.
  - **Missing UI**: toast/error boundary when upsert fails + rollback to previous toggle state.

- **Bulk notification state writes have no success/failure feedback**  
  - **File**: `src/pages/NotificationsPage.tsx`
  - **Mutations**:
    - `markAllRead()` → multiple `api.upsertUserNotificationState(...)`
    - `markRead()` / `deleteNotif()` → `api.upsertUserNotificationState(...)`
  - **Missing UI**:
    - For failures: any toast/error indicator that the read/dismiss state was not persisted.
    - Optional success: “Saved” indicator or sync state.

### Mutations that **do** have explicit feedback (not silent)
- **Campaign creation** has clear success/failure toasts + closes modal.  
  - **File**: `src/pages/CampaignsPage.tsx`
- **Saved report create/update/delete** has explicit toasts and local state updates.  
  - **File**: `src/pages/ReportBuilderPage.tsx`
- **Course/program create/update** flows use mutation hooks with toasts and navigations.  
  - **Files**: `src/hooks/useQueries.ts`, `src/pages/CourseBuilderPage.tsx`, `src/pages/ProgramBuilderPage.tsx`

---

## 4) Admin Configuration Blind Spots (system behavior hidden from Admin UI)

### Confirmed blind spots / mismatches
- **“Smart Reminder thresholds” are hardcoded in learner notifications, not controlled by Admin UI**
  - **UI display**: `src/pages/NotificationsPage.tsx` shows reminders like “After 3 days of no activity” and uses hard-coded logic: `now - lastMs <= 3 * daysMs`.
  - **Admin control**: `src/pages/dashboards/AdminDashboard.tsx` stores reminder thresholds into `localStorage` keys (`sla_reminder_inactivity_days`, `sla_reminder_deadline_hours`) but the notification engine does **not read** these values.
  - **Gap**: Admin settings exist but do not affect actual system behavior (false sense of control).
  - **Missing UI/component**: a DB-backed `system_settings` configuration + notification engine that reads it (or removal of admin control UI until wired).

- **Payments operational controls are absent**
  - **Schema exists**: `public.payments`
  - **Admin UI**: `src/pages/PaymentsPage.tsx` displays placeholders (“Settled Txs: 0”, no ledger rows)
  - **Gap**: Admin cannot inspect payment failures, references, or method/currency from the DB.

- **Jobs feature is present in schema but hidden in routing**
  - **Schema exists**: `public.jobs`
  - **Router**: `src/App.tsx` redirects `/dashboard/jobs` away
  - **Gap**: “Jobs” is an invisible backend feature with no admin controls or student viewing experience.

---

## Final “Fix Assignment” Checklist (strict, actionable)

- **[DB → UI gap]** `public.programs.tagline`: add editor + render on cards.  
  - **Table**: `public.programs`  
  - **Missing UI**: `src/pages/ProgramBuilderPage.tsx` input + `src/pages/ProgramsCatalogPage.tsx` display.

- **[DB → UI gap]** `public.programs.level`: add editor + render badge.  
  - **Table**: `public.programs`  
  - **Missing UI**: builder field + catalog display.

- **[Schema drift gap]** `programs.application_deadline`: UI references it; ensure schema/migration exists in prod.  
  - **Files**: `src/pages/ProgramBuilderPage.tsx`, `src/pages/ProgramsCatalogPage.tsx`  
  - **Missing artifact**: authoritative schema migration in `supabase/schema.sql` or dedicated migration file applied in prod.

- **[DB → UI gap]** `public.payments.*`: build actual payments ledger UI.  
  - **Table**: `public.payments`  
  - **Missing UI**: `src/pages/PaymentsPage.tsx` should query and render transactions.

- **[DB → UI gap]** `public.jobs.*`: expose jobs UI or remove schema/route references.  
  - **Table**: `public.jobs`  
  - **Missing UI**: student jobs list + admin job CRUD; currently route is redirected in `src/App.tsx`.

- **[Silent mutation]** Settings toggles write to DB without failure feedback.  
  - **File**: `src/pages/SettingsPage.tsx`  
  - **Missing UI**: toast/error/rollback if `api.upsertNotificationPreferences` fails.

- **[Silent mutation]** Notification read/dismiss state writes without error feedback.  
  - **File**: `src/pages/NotificationsPage.tsx`  
  - **Missing UI**: error feedback if `api.upsertUserNotificationState` fails.

- **[Admin blind spot]** Admin reminder controls do not control reminder engine.  
  - **Files**: `src/pages/dashboards/AdminDashboard.tsx`, `src/pages/NotificationsPage.tsx`  
  - **Missing UI**: a single source of truth for thresholds (DB or shared config) that both Admin + notifications read.

