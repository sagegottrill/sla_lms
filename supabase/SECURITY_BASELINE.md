# Security & routing baseline

This repo supports **one production RLS baseline** and **opaque public URLs** for learner-facing courses and programs.

## 1) Row level security (Supabase)

**Canonical script:** `supabase/production_rls_baseline.sql`

- Applies policies that **do not** rely on custom JWT claims (`user_role` etc.). Staff checks use `public.profiles.role` with `(select auth.uid())` in policy expressions, matching how the app works today.
- **Courses:** anonymous users may only `SELECT` rows with `status = 'published'`. Authenticated users may see published courses, courses they instruct, or all courses if their profile role is `instructor`, `program_manager`, or `admin`.
- **Profiles:** no world-readable `SELECT`; users read their own row; `admin` / `program_manager` may read others for operations dashboards.
- **Payments:** users read their own rows; `admin` and `program_manager` may read all (payments UI); `admin` may `UPDATE` (e.g. webhook reconciliation).

**Do not mix** with `supabase/enterprise_migration.sql` in the same project: that file assumes `auth.jwt() ->> 'user_role'`, which this app does not populate unless you add a custom Auth hook. After applying `production_rls_baseline.sql`, treat older policy scripts as **historical reference** unless you intentionally merge changes.

**Apply order (suggested):**

1. Schema / migrations that create tables (e.g. `schema.sql` on greenfield, or your incremental migrations).
2. `enterprise_public_id_and_indexing.sql` (if using `public_id` columns and indexes).
3. `production_rls_baseline.sql`.

Re-run `production_rls_baseline.sql` after policy edits; it uses `DROP POLICY IF EXISTS` with stable `baseline_*` policy names.

## 2) Public IDs vs numeric IDs (app)

- Database columns: `courses.public_id`, `programs.public_id` (UUID), plus internal serial `id`.
- **Learner URLs** prefer UUID when present: `/courses/:id`, `/programs/:id/apply` where `:id` may be **`public_id`** or legacy **numeric `id`** (both accepted).
- **Dashboard / builder** URLs continue to use numeric ids in query strings (e.g. `?edit=123`) for simplicity.

The client resolves a route segment via `api.getCourseByRouteParam` / `api.getProgramByRouteParam` and `src/lib/publicRoutes.ts` helpers.
