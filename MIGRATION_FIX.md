# ✅ Migration Syntax Error Fixed

## Issue
```
ERROR: 42601: only WITH CHECK expression allowed for INSERT
```

## Root Cause
RLS policies for INSERT operations were using `USING` clause instead of `WITH CHECK` clause. Additionally, `FOR ALL` policies (which include INSERT) were missing `WITH CHECK` clauses.

## What Was Fixed

### 1. INSERT Policy
```sql
-- BEFORE (❌ Wrong)
CREATE POLICY "System health logs insertable by service role"
  ON system_health_logs FOR INSERT
  TO authenticated
  USING (true);

-- AFTER (✅ Correct)
CREATE POLICY "System health logs insertable by service role"
  ON system_health_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### 2. FOR ALL Policies
All `FOR ALL` policies now have both `USING` and `WITH CHECK` clauses:

```sql
-- BEFORE (❌ Wrong)
CREATE POLICY "Custom roles manageable by admins"
  ON custom_roles FOR ALL
  TO authenticated
  USING (...);

-- AFTER (✅ Correct)
CREATE POLICY "Custom roles manageable by admins"
  ON custom_roles FOR ALL
  TO authenticated
  USING (...)
  WITH CHECK (...);
```

## Policies Fixed
1. ✅ `custom_roles` - "Custom roles manageable by admins"
2. ✅ `user_custom_roles` - "Admins can manage all custom role assignments"
3. ✅ `user_groups` - "User groups manageable by admins and program managers"
4. ✅ `user_group_members` - "User group members manageable by admins and program managers"
5. ✅ `system_health_logs` - "System health logs insertable by service role"
6. ✅ `masquerade_sessions` - "Masquerade sessions manageable by admins"

## PostgreSQL RLS Rules
- **SELECT**: Use `USING` clause only
- **INSERT**: Use `WITH CHECK` clause only
- **UPDATE**: Use `USING` for row selection, `WITH CHECK` for new values
- **DELETE**: Use `USING` clause only
- **ALL**: Must have both `USING` and `WITH CHECK` clauses

## Next Steps
The migration file is now fixed. Run:

```bash
supabase db push
```

The migration should now apply successfully without errors.

---

**Fixed:** May 3, 2026  
**Status:** ✅ Ready for deployment
