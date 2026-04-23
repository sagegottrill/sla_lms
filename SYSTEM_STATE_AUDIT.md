# SYSTEM_STATE_AUDIT.md

Principal Cloud Architect pre-launch audit of **State & Data Flow Architecture** across `src/`, focused on identifying:

- UI-collected data never persisted (form payload gaps)
- Storage uploads not linked to DB rows (media leaks / orphaned objects)
- State leakage (auth/session + cache carryover)
- RBAC route protection architecture and gaps

Scope constraints: **analysis-only** (no refactors, no code rewrites).

---

## Pillar 1 — Storage & Upload Matrix (media leak detection)

### A. Confirmed upload call sites (`supabase.storage.from(...).upload(...)`)

#### 1) Course thumbnail upload (Course Builder)
- **File**: `src/pages/CourseBuilderPage.tsx`
- **Bucket**: `courses`
- **Path pattern**: `thumbnails/${courseId}/${Date.now()}.${ext}`
- **Public URL produced**: `supabase.storage.from('courses').getPublicUrl(filePath).data.publicUrl`
- **DB linkage**: **Yes (indirect, via payload)**  
  - The upload handler sets local state: `setImage(publicUrl)`.
  - `handleSave()` includes `image: image.trim() || null` in the mutation payload sent to `api.createCourse()` / `api.updateCourse()`.
- **Leak risk**: **Medium**  
  - If a user uploads a thumbnail and **never clicks Save**, the object is left in storage with no DB reference (expected for client-driven flows unless you implement cleanup).

#### 2) Program partner / sponsor logo upload (Program Builder)
- **File**: `src/pages/ProgramBuilderPage.tsx`
- **Bucket**: `courses` (note: logos stored under a `program-partners/...` prefix inside this bucket)
- **Path pattern**: `program-partners/${programId}/${partnerId}/${Date.now()}.${ext}`
- **Public URL produced**: `supabase.storage.from("courses").getPublicUrl(path).data.publicUrl`
- **DB linkage**: **Yes (indirect, via payload)**  
  - Upload handler updates local partner state: `logoUrl`.
  - `buildPayload()` maps partners into payload:  
    `partners: [{ name, logo_url: p.logoUrl || null }]`
  - Payload is passed into `api.createProgram()` / `api.updateProgram()`.
- **Leak risk**: **Medium** (same pattern as above)  
  - Uploads can exist without DB linkage if the user exits before saving.

#### 3) User avatar upload (API-layer upload)
- **File**: `src/services/api.ts` (`uploadAvatar(userId, file)`)
- **Bucket**: `avatars`
- **Path pattern**: `${userId}/avatar.${ext}`
- **Public URL produced**: `supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl + ?t=${Date.now()}`
- **DB linkage**: **Yes (direct)**  
  - Immediately updates DB: `supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId)`
- **Leak risk**: **Low**  
  - Even if UI navigation happens, the DB update occurs in the same function.

#### 4) Course wizard file uploads (orphan risk)
- **File**: `src/components/dashboard/CourseAuthoringWizard.tsx`
- **Bucket**: `courses`
- **Path pattern**: `thumbnails/${Date.now()}.${ext}` (for *any* file uploaded via the helper)
- **Public URL produced**: `supabase.storage.from("courses").getPublicUrl(path).data.publicUrl`
- **DB linkage**: **No evidence in this file** (see “Confirmed Gap” below)
- **Leak risk**: **High**

### B. Confirmed gaps (upload succeeds, but URL not persisted to DB)

#### GAP-1: `CourseAuthoringWizard` uploads are not wired to any DB mutation
- **What uploads**:
  - Lesson content files: stored into `les.contentLabel` state
  - Course thumbnail/cover: stored into `courseThumbnailUrl` state
- **Why it’s a leak**:
  - The module builds local state with URLs but this file contains **no call** to `api.createCourse()` / `api.updateCourse()` or any other persistence method.
  - Result: storage objects can be uploaded successfully and shown in the wizard UI, but **never written into `courses.image`** or into the course’s `curriculum` structure (unless another parent component persists it; not visible in this file’s scope).
- **Impact**:
  - Orphaned objects in `courses` bucket.
  - Users think “uploaded” means “saved”, but refresh/logout loses linkage.
- **Strike command suggestion (architectural)**:
  - Ensure the wizard’s final publish/save step writes `courseThumbnailUrl` and lesson `contentLabel` URLs into the course record via a defined mutation, or remove uploads until persistence is implemented.

### C. “Landing Page” media upload check

No `supabase.storage` usage was found in the landing page components (`src/components/landing/*`) or in `src/components/dashboard/LandingPageCMS.tsx`.

- **Current behavior**: landing hero uses a static asset path (`/sla_hero_career_fair.jpg`).
- **Conclusion**: **No landing-page hero upload pipeline exists** in `src/` (no bucket upload, no DB linkage needed).

---

## Pillar 2 — Database Mutation Flow (unsaved form data detection)

### A. Mutation surface (API layer)

The following Supabase mutation operators are present in `src/services/api.ts`:

- **Courses**
  - `createCourse()` → `supabase.from("courses").insert(...)`
  - `updateCourse(id, updates)` → `supabase.from("courses").update(...).eq("id", id)`
- **Programs**
  - `createProgram()` → `supabase.from("programs").insert(...)`
  - `updateProgram()` → `supabase.from("programs").update(...).eq("id", id)`
- **Enrollments**
  - `enrollUser(userId, courseId)` → `supabase.from("enrollments").insert(...)`
  - `enrollUserInProgram(userId, programId)` → `supabase.from("enrollments").insert(...)`
  - `dropUserFromCourse(userId, courseId)` → `supabase.from("enrollments").update({ status: "dropped" })...`
- **Profiles**
  - `updateProfile(userId, updates)` → `supabase.from("profiles").update(...)...`
  - `deleteProfile(userId)` → `supabase.from("profiles").delete()...`
  - `assignRole(userId, role)` → `supabase.from("profiles").update({ role })...`
  - `uploadAvatar(userId, file)` → storage upload + `profiles.update({ avatar_url })`
- **Applications**
  - `createProgramApplication(payload)` → `supabase.from("program_applications").insert(...)`
  - `approveProgramApplication(applicationId, userId, programId)` → `program_applications.update({status:"approved"})` + enrollment insert
  - `rejectProgramApplication(applicationId)` → `program_applications.update({status:"rejected"})`
  - `createCourseApplication(payload)` → `supabase.from("course_applications").insert(...)`
- **Site config (Landing CMS data)**
  - `updateSiteConfig(id, configData)` → `supabase.from("site_config").upsert(...)`
- **Other domain mutations (present in api.ts)**
  - certificates insert
  - portfolio_items insert/delete
  - skills_assessments insert/delete (with rollback delete on questions failure)
  - skills_questions insert
  - skills_results insert
  - marketing_campaigns insert
  - forum_threads insert
  - email_templates insert/update
  - saved_reports insert/upsert/delete
  - career_milestones insert
  - user_resume_drafts upsert
  - notification_preferences upsert
  - user_notification_state upsert

### B. UI payload linkage verification (key flows)

#### 1) CourseBuilder form → DB payload completeness
- **File**: `src/pages/CourseBuilderPage.tsx`
- **Fields collected**: title, subtitle, description, instructor, pricing, category/level, language, badge, curriculum, etc.
- **Payload**: assembled in `handleSave()` and passed into `createCourse`/`updateCourse` mutations.
- **Thumbnail linkage**: `image` is included in payload and is fed by upload handler.
- **Gap status**: **No obvious payload omissions** within this file’s defined fields.

#### 2) ProgramBuilder form → DB payload completeness (includes Partners)
- **File**: `src/pages/ProgramBuilderPage.tsx`
- **Partners UI**: partner name list + logo upload per partner
- **Payload**: `buildPayload()` includes:
  - `partners: [{ name, logo_url }]`
  - plus `application_deadline`, `image` (hero image URL), course titles, etc.
- **Gap status**: **Partners are persisted** (not a “collected but unsaved” field).

#### 3) Landing page CMS → DB payload completeness
- **File**: `src/components/dashboard/LandingPageCMS.tsx`
- **Mutation**: `useUpdateSiteConfigMutation()` → `api.updateSiteConfig('landing_page', localConfig)`
- **Gap status**: **All edited localConfig content is persisted as a JSON blob** into `site_config.data`.
  - Note: this is “schema-less” persistence; validation/typing is not enforced at DB boundary.

#### GAP-2 (conditional): Wizard-based course authoring collects state not persisted
- **File**: `src/components/dashboard/CourseAuthoringWizard.tsx`
- **Collected fields**: course title/description/objectives + curriculum + content file URLs.
- **Persistence**: **No mutation call shown**.
- **Status**: **Partially implemented flow** (state exists, persistence not visible).

---

## Pillar 3 — State Leakage & Cache Invalidation

### A. Logout behavior and cache clearance

- **File**: `src/contexts/AuthContext.tsx`
- **Logout implementation**:
  - Calls `supabase.auth.signOut()`
  - Calls `rq.clear()` (React Query client clear)
  - Resets `appUser`, `user`, `session` to null
- **Conclusion**: **React Query cache is completely cleared on logout** (positive control against cross-user cache bleed).

### B. React Query mutation invalidation patterns

Primary mutation hooks are defined in `src/hooks/useQueries.ts`. Observed patterns:

- **Courses mutations**
  - `useCreateCourseMutation`, `useUpdateCourseMutation`
  - Invalidation: `queryKeys.courses.base` and `["site-config"]` onSettled ✅
- **Programs mutations**
  - `useCreateProgramMutation`, `useUpdateProgramMutation`
  - Invalidation: `queryKeys.programs.base` and `["site-config"]` onSettled ✅
- **Enrollment mutation**
  - `useEnrollUserMutation` uses optimistic update and invalidates the exact enrollments queryKey in `onSettled` ✅
- **Profile mutations**
  - `useUpdateProfileMutation` optimistic update + invalidate target profiles list key ✅
  - `useDeleteProfileMutation` optimistic update + invalidate target profiles list key ✅
- **Site config mutation**
  - `useUpdateSiteConfigMutation` optimistic update + invalidates `['site-config', id]` ✅

### C. Global “server-driven” cache invalidation (Realtime)
- **File**: `src/hooks/useGlobalDashboardSync.ts`
- **Mechanism**: subscribes to Supabase Realtime `postgres_changes` on:
  - `courses`, `programs`, `profiles`, `enrollments`, `site_config`
  - invalidates corresponding query keys on any event
- **Conclusion**: this is a strong backstop against stale UI across dashboards **if** the hook is mounted (see gap note below).

#### GAP-3 (integration check): ensure `useGlobalDashboardSync()` is actually mounted
- This file is implemented, but this audit did not confirm where it is invoked (e.g., within `DashboardLayout`).
- If it’s not mounted for authenticated sessions, then only per-mutation invalidations apply.

---

## Pillar 4 — Role-Based Routing (RBAC) Architecture

### A. Role model and enforcement layer

- **Guard component**: `src/components/auth/RoleGuard.tsx`
  - If `!appUser` → redirects to `/`
  - If role not in allowlist → redirects to `redirectTo` (default `/dashboard`)
  - Otherwise renders children
- **Observation**: this is **client-side routing protection** only; data authorization must be enforced in Supabase via **RLS** (not in `src/` scope).

### B. Dashboard surfaces (4 dashboards) and route mapping

In `src/App.tsx`, the protected dashboard routes are nested under `/dashboard` and protected per route via `RoleGuard` allowlists.

#### 1) Student dashboard
- **Primary routes** (no RoleGuard wrapper, available to any authenticated role):
  - `/dashboard` (home)
  - `/dashboard/certificates`
  - `/dashboard/calendar`
  - `/dashboard/notifications`
  - `/dashboard/settings`
  - `/dashboard/profile`
  - `/dashboard/portfolio`
  - `/dashboard/forums`
- **Courses view is role-switched**:
  - `CoursesRoute()` returns:
    - Instructor view if role in `["instructor","admin","program_manager"]`
    - Otherwise student `MyCourses`
- **Programs view is role-switched**:
  - `ProgramsRoute()` returns:
    - Program manager view if role in `["program_manager","admin"]`
    - Otherwise student `MyPrograms`

#### 2) Instructor dashboard
- **Protected routes**:
  - `/dashboard/courses/new` allow `["instructor","admin","program_manager"]`
  - `/dashboard/students` allow `["instructor","admin"]`
  - `/dashboard/earnings` allow `["instructor","admin"]`
  - `/dashboard/analytics` allow `["instructor","program_manager","admin"]`

#### 3) Program Manager dashboard
- **Protected routes**:
  - `/dashboard/programs/new` allow `["program_manager","admin"]`
  - `/dashboard/programs/:programId` allow `["program_manager","admin"]`
  - `/dashboard/participants` allow `["program_manager","admin"]`
  - `/dashboard/reports` allow `["program_manager","admin"]`
  - `/dashboard/analytics` allow `["instructor","program_manager","admin"]`
  - `/dashboard/videos` allow `["admin","instructor","program_manager"]`

#### 4) Admin dashboard
- **Protected routes**:
  - `/dashboard/users` allow `["admin"]`
  - `/dashboard/payments` allow `["admin"]`
  - `/dashboard/roles` allow `["admin"]`
  - `/dashboard/email-templates` allow `["admin"]`
  - `/dashboard/campaigns` allow `["admin"]`
  - plus admin included in multi-role guarded routes above

### C. RBAC gaps / risks

#### GAP-4: Missing “RequireAuth” wrapper at `/dashboard` parent route
- `RoleGuard` checks `!appUser` and redirects to `/`, but the `/dashboard` route element itself (`DashboardLayout`) is not wrapped by a single guard in `App.tsx`.
- This means:
  - If `DashboardLayout` renders sensitive chrome before child guards apply, you can get brief flashes or extra requests.
  - Robust pattern is a single auth gate at the `/dashboard` parent + per-route role gates.
- **Status**: **Partially done** (role gates exist; a parent auth gate is not explicit in `App.tsx`).

---

## Summary — “Strike List” of Confirmed Gaps

- **GAP-1 (High)**: `src/components/dashboard/CourseAuthoringWizard.tsx` uploads to `courses` storage but has **no visible DB persistence** of returned URLs → **orphaned objects + unsaved content** risk.
- **GAP-3 (Medium)**: `src/hooks/useGlobalDashboardSync.ts` is implemented but **mount point not confirmed** in this audit → risk that realtime invalidation is not actually active.
- **GAP-4 (Medium)**: No explicit parent `/dashboard` auth gate in `App.tsx` (only per-route role guards + `DashboardLayout` unguarded at parent route) → potential UI flash / early fetch behavior depending on `DashboardLayout` internals.

If you want, I can extend this audit to include **non-`upload()` storage usage** (e.g., `createSignedUrl`, `remove`, `list`) and cross-check Supabase RLS assumptions per table against the route allowlists—still without changing code.

