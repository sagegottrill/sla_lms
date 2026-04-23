# FIRECRAWL_COMPETITIVE_AUDIT.md

Competitive enterprise audit (Principal Systems Architect + Security Auditor).  
Method: **Live web standards via FireCrawl** → compare against **current repo (`src/`, `supabase/*.sql`)** → produce concrete gaps + exact remediation SQL/code patterns (no code changes applied).

---

## Sources scraped (Phase 1)

- Supabase RLS guide: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- MakerKit RLS best practices (multi-tenant + performance + testing): `https://makerkit.dev/blog/tutorials/supabase-rls-best-practices`
- React performance optimization framework (bundle analysis, lazy loading, SSR, assets): `https://blog.logrocket.com/a-complete-guide-to-react-performance-optimization/`
- Docebo LMS security feature checklist (SSO, encryption, roles, backups, etc.): `https://www.docebo.com/learning-network/blog/lms-security-features/`

---

## 1) Security & Data Isolation (RLS + authorization + enumeration)

### 1.1 Industry Standard Found
- **RLS on every exposed table** in `public` schema; “deny by default” when RLS enabled but no policies. (Supabase docs)
- **Policies should specify roles** via `TO authenticated` / `TO anon` for clarity and performance; don’t rely on implicit role execution. (Supabase docs)
- **Avoid expensive per-row function calls** in policies; wrap auth funcs as `(select auth.uid())` and add indexes on policy-filter columns. (Supabase docs + MakerKit)
- **Multi-tenant / enterprise pattern**: centralize complex permission logic in audited, reusable helpers (often `security definer` functions), but avoid privilege escalation by validating `auth.uid()` inside those functions and placing them in non-exposed schemas. (MakerKit + Supabase docs)
- **RLS failures are often silent** for SELECT/UPDATE/DELETE; requires explicit testing (pgTAP) and operational observability. (MakerKit)
- **Enterprise LMS authorization**: strict role separation, least privilege, SSO support, strong password/MFA, encryption, and audit trails. (Docebo)

### 1.2 Our Current State
- **Base schema policies are permissive in places**:
  - `supabase/schema.sql` includes policies like:
    - `Profiles are viewable by everyone` using `(true)`
    - `Programs are viewable by everyone` using `(true)`
    - `Jobs are viewable by everyone` using `(true)`
    - `Published courses are viewable by everyone` using `(status = 'published' or auth.uid() is not null)` (effectively “everything to authenticated”)
- **Hardened blueprint SQL exists but is not integrated as the “source-of-truth migration”**:
  - `supabase/pillar_1_hardening.sql` defines stricter policies, role extraction helper `public.get_auth_role()` via `request.jwt.claims`, and performance indexes.
  - This is not reflected in `supabase/schema.sql` and therefore may not be applied consistently in production.
- **Primary keys for courses/programs are `serial` integers** (`public.programs.id`, `public.courses.id`), and the frontend routes use numeric IDs (e.g., `/courses/:id`, `/programs/:id/apply`).

### 1.3 The Gap / Mistake
- **Over-broad read policies**:
  - “viewable by everyone” is not enterprise-standard for learner PII (profiles) and often not for internal dashboards.
- **Policy performance patterns not consistently applied**:
  - Many policies use `auth.uid()` without the `(select ...)` wrapper; over time this can create significant overhead.
- **ID enumeration risk**:
  - Numeric IDs + public routes are not inherently insecure, but they are a *common enterprise red flag* unless coupled with strict RLS and careful query shaping.
  - In your current model, “published courses are viewable by everyone” is intended; for programs, “viewable by everyone” exposes full program rows to unauthenticated users.
- **Missing systematic RLS testing**:
  - No evidence in repo of pgTAP-based automated RLS test suite (MakerKit enterprise recommendation).

### 1.4 Actionable Fix (exact SQL patterns)

#### A) Align schema policies with “Pillar 1 hardening” (make it the production baseline)
Apply a migration SQL file (example below) that *replaces* permissive `using(true)` policies with explicit `TO` clauses and strict conditions.

```sql
-- 1) Replace public "everyone" access for profiles with authenticated-only + role/owner
drop policy if exists "Profiles are viewable by everyone" on public.profiles;

create policy "Profiles viewable by authenticated"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'program_manager')
    )
  );

-- Ensure update policy prevents cross-user updates
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Profiles updatable by owner"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
```

#### B) Replace broad “authenticated can see all courses” with tighter rule (optional, enterprise)
If you want authenticated learners to see only published courses, and staff to see drafts:

```sql
drop policy if exists "Published courses are viewable by everyone" on public.courses;

create policy "Courses readable (published or staff/owner)"
  on public.courses for select
  to anon, authenticated
  using (
    status = 'published'
    or (
      (select auth.uid()) is not null
      and (
        instructor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid())
            and p.role in ('admin','program_manager')
        )
      )
    )
  );
```

#### C) Add indexes for columns used in policies (Supabase docs)
```sql
create index if not exists idx_courses_instructor_id on public.courses(instructor_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_enrollments_user_id on public.enrollments(user_id);
```

#### D) Reduce ID enumeration exposure (enterprise “public id” pattern)
Keep internal `serial` IDs if you want, but expose a separate UUID for public routes.

```sql
alter table public.courses add column if not exists public_id uuid default gen_random_uuid();
alter table public.programs add column if not exists public_id uuid default gen_random_uuid();
create unique index if not exists ux_courses_public_id on public.courses(public_id);
create unique index if not exists ux_programs_public_id on public.programs(public_id);
```

Then migrate frontend to use `/courses/:publicId` (UUID) and query by `public_id` instead of numeric `id`.

---

## 2) Architectural Bottlenecks (React Query, state management, API patterns)

### 2.1 Industry Standard Found
- **RLS is not enough**: also enforce “least data” by selecting only required columns and scoping queries with filters to help planners and reduce data exposure. (Supabase docs: “Add filters to every query”)
- **Cache correctness**: enterprise apps enforce consistent query keys, invalidate on mutation, and clear cache on logout. (common TanStack Query practice)
- **Operational readiness**: strong error handling, observable failures, and no “silent” RLS failures masked as empty sets. (MakerKit: silent failures + testing)

### 2.2 Our Current State
- **React Query**:
  - Central query key factory exists: `src/lib/react-query.ts`.
  - Logout clears query cache: `src/contexts/AuthContext.tsx` uses `rq.clear()`.
  - Realtime invalidation exists: `src/hooks/useGlobalDashboardSync.ts`, and is mounted in dashboard layout.
- **API layer often selects `*`**:
  - `src/services/api.ts` uses `.select("*")` across multiple tables (courses/programs/profiles etc.).
- **Some pages still query Supabase directly** instead of using `api.ts` + hook layer (example: `src/pages/ProgramsCatalogPage.tsx` uses `supabase.from("programs").select("*")`).

### 2.3 The Gap / Mistake
- **Over-fetching + increased blast radius**:
  - `select("*")` makes authorization mistakes more costly (more columns exposed).
  - It also increases payload size and frontend processing.
- **Inconsistent data-access abstraction**:
  - When some pages bypass `api.ts`, you lose centralized logging, retries, consistent query keys, and consistent filtering.

### 2.4 Actionable Fix (exact patterns)

#### A) Replace `select("*")` with explicit projections
Example pattern for courses (minimize exposed fields):

```ts
// api.ts (pattern)
supabase
  .from("courses")
  .select("id, public_id, title, subtitle, category, level, price, image, status, created_at")
  .eq("status", "published");
```

#### B) Enforce “filters on every query”
Even if RLS filters, add `.eq()`/`.in()` to help planners (Supabase docs):

```ts
supabase.from("enrollments")
  .select("id, course_id, progress, status, last_accessed")
  .eq("user_id", userId);
```

---

## 3) Performance (React/Vite + heavy video workloads)

### 3.1 Industry Standard Found
- **Measure first**: baseline FCP/LCP/TTI with throttling; use bundle visualizer; remove unused deps; code split heavy features. (LogRocket)
- **Lazy load heavy components** (video players, charts, editors) and route-level chunks. (LogRocket)
- **Optimize images/assets** with CDN, `loading="lazy"`, and `fetchpriority="high"` only for hero assets. (LogRocket)

### 3.2 Our Current State
- **Route-level code splitting exists** via React Router `lazy()` in `src/App.tsx`.
- **Vite build config is minimal** (`vite.config.ts`), and you previously reverted custom `manualChunks` due to production blank-screen risk.
- **Video playback**:
  - `src/pages/CourseDetailPage.tsx` uses an `iframe` embed via `toVideoEmbedUrl(activeVideo)`.
  - This is simpler than shipping a full player, but still can be performance-sensitive (multiple iframes, layout shifts, preloads).

### 3.3 The Gap / Mistake
- **No bundle analysis tooling configured** (visualizer) to systematically track bloat regressions.
- **No explicit image loading strategy** for above-the-fold hero assets vs below-the-fold cards in many components (not audited exhaustively here).
- **Large “index” chunk warning** exists in build output (observed in builds), indicating continued bundle pressure.

### 3.4 Actionable Fix (exact config + component patterns)

#### A) Add a bundle visualizer for Vite (build-time only)
```bash
npm i -D rollup-plugin-visualizer
```

```ts
// vite.config.ts (pattern)
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: "dist/stats.html", gzipSize: true, brotliSize: true }),
  ],
});
```

#### B) Lazy-load heavy non-route components (pattern)
```ts
const HeavyVideoPanel = React.lazy(() => import("./HeavyVideoPanel"));
```

#### C) Image loading policy (pattern)
```tsx
<img src={heroUrl} fetchPriority="high" />
<img src={cardUrl} loading="lazy" decoding="async" />
```

---

## 4) Enterprise LMS Security Feature Checklist (platform-level)

### 4.1 Industry Standard Found (Docebo security features)
- SSL/TLS (HTTPS)
- SSO (SAML/OIDC)
- Data encryption (in transit + at rest)
- Strong role-based permissions
- GDPR/privacy controls
- Password requirements / MFA
- Backups + restore drills

### 4.2 Our Current State
- **Auth**: Supabase Auth in browser with PKCE (`src/lib/supabase.ts`).
- **Roles**: app-level role stored on `profiles.role`; client-side RoleGuard; server-side RLS varies by SQL applied.
- **MFA/SSO**: not evidenced in `src/` (beyond OAuth provider config discussions); no explicit MFA enforcement.
- **Backups**: not represented in app code (expected to be ops-owned).

### 4.3 The Gap / Mistake
- **SSO/MFA policy enforcement is not defined** at the DB policy layer or UI level.
- **RLS strictness depends on which SQL scripts are applied**; you have both permissive and hardened policy sets in repo.

### 4.4 Actionable Fix (exact)
- **Adopt `supabase/pillar_1_hardening.sql` as the “applied baseline”** and remove/avoid permissive policy files in production rollout.
- **If enforcing MFA for sensitive operations** (Supabase docs pattern):

```sql
create policy "Restrict profile updates to MFA users"
on public.profiles
as restrictive
for update
to authenticated
using ((select auth.jwt()->>'aal') = 'aal2');
```

---

## Priority Findings (what to fix first)

1) **RLS policy consolidation**: pick one hardened policy baseline (prefer `pillar_1_hardening.sql` patterns) and ensure production applies it.  
2) **Reduce `select("*")`** on exposed tables; explicitly select fields and add filters.  
3) **Mitigate enumeration**: add `public_id uuid` for public routes (courses/programs) and migrate routing to UUIDs.  
4) **Add performance observability**: bundle visualizer + image loading policy + lazy-load heavy components where needed.  
5) **Add automated RLS tests** (pgTAP) to stop policy regressions (MakerKit standard).

