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

**Decision (no weak middle):** the app is committed to **dual identifiers** — internal numeric `id` for staff/builder flows and **UUID `public_id`** for shareable learner URLs when the column is populated. Migrations that add `public_id` + indexes belong in the same story as this doc; do not ship learner routes that only work with numeric ids if you advertise opaque links.

## 3) Rollback & “what we ran today”

- **Vercel / Git builds** do not store SQL. Only **Supabase** holds policies and data. Reverting a deployment does not undo database changes.
- **Cannot auto-revert** `production_rls_baseline.sql` from this repo alone: there is no bundled “previous policy export.” Use **Supabase backups / point-in-time recovery** to go back to a timestamp before a bad run, or keep your own policy export in version control for emergencies.
- **Optional recovery artifacts** (admin bootstrap RPC + email table from `rpc_recover_staff_profile.sql`): remove with `supabase/rollback_optional_recovery_artifacts.sql` if you no longer want them. That script does **not** touch course RLS or course rows.

## 4) Script inventory (what to actually run in prod)

| Run in prod? | File | Purpose |
|--------------|------|---------|
| **Once / agreed** | `production_rls_baseline.sql` | Single agreed RLS story aligned with this app. |
| **If using public links** | `enterprise_public_id_and_indexing.sql` | `public_id` columns + indexes (pairs with §2). |
| **Greenfield / reset** | `schema.sql`, `seed.sql` | Full reset; destructive. |
| **Optional** | `rpc_recover_staff_profile.sql` | Staff profile recovery RPC + allowlist table. |
| **Optional one-offs** | `fix_profile_admin_*.sql` | Manual row fixes by id/email. |
| **Do not mix** | `enterprise_migration.sql`, `pillar_1_hardening.sql` (as alternate RLS) | Different JWT assumptions; conflicts with baseline unless you merge deliberately. |

## 5) Non-negotiables for a trustworthy, maintainable LMS (Supabase)

1. **One production RLS story** — agreed policy set in Supabase, matches how `api.ts` and `AuthContext` assume access (profiles-backed roles, not orphaned JWT claims).
2. **Clear `public_id` story** — §2 + indexing migration in lockstep with routes; no half-measures.
3. **Boring data access** — explicit column projections in `src/services/api.ts` (avoid `select('*')` on app-facing tables); finish stragglers as tables evolve.

Everything else (extra pillars, enterprise polish) is optional until the above three are stable.
