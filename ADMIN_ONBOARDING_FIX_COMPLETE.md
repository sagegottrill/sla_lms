# Admin Onboarding Issue - Complete Fix

## Problem Summary
Admin user (`info@sheleadsafrica.org`) was being redirected to onboarding and showing as "User" with `role: 'student'` in the database.

## Root Causes Identified

### 1. Database Role Mismatch
- **Issue**: Profile record in database has `role = 'student'` instead of `role = 'admin'`
- **Evidence**: Console log shows `role: 'student'` in ONBOARDING REDIRECT TRACE
- **Impact**: Even though we have `forceAdminRoleByEmail()` in code, the database role was wrong

### 2. User ID Undefined Error
- **Issue**: `user_id=eq.undefined` in enrollments query
- **Evidence**: `GET /rest/v1/enrollments?user_id=eq.undefined 400 (Bad Request)`
- **Impact**: Dashboard queries failing because appUser.id is not set correctly

### 3. Display Name Issue
- **Issue**: Showing "User" instead of admin's actual name
- **Evidence**: Profile data incomplete or not loading correctly
- **Impact**: Poor UX, admin doesn't see their name

## Solutions Implemented

### 1. Database Fix Script
**File**: `supabase/fix_admin_user_comprehensive.sql`

This script:
- ✅ Updates admin user's role to 'admin'
- ✅ Sets `onboarding_completed = true`
- ✅ Creates a database trigger to auto-promote GOD_MODE emails
- ✅ Prevents this issue from happening again in the future

**Key Feature**: Database-level protection via trigger
```sql
CREATE OR REPLACE FUNCTION auto_promote_god_mode_admins()
RETURNS TRIGGER AS $$
DECLARE
  god_mode_emails TEXT[] := ARRAY['info@sheleadsafrica.org'];
BEGIN
  IF NEW.email = ANY(god_mode_emails) THEN
    NEW.role := 'admin';
    NEW.onboarding_completed := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Enhanced Code Protection
**File**: `src/contexts/AuthContext.tsx`

Enhanced `mapProfileRowToAppUser()` function:
- ✅ Extracts email first before any role logic
- ✅ Applies `forceAdminRoleByEmail()` BEFORE `resolveEffectiveRole()`
- ✅ Adds debug logging for GOD_MODE admin detection
- ✅ Ensures email is always a string (not null)

```typescript
const email = typeof data.email === "string" ? data.email : "";
const forcedRole = forceAdminRoleByEmail(email);
const role = forcedRole ?? resolveEffectiveRole(data);

if (forcedRole === "admin") {
  console.log("🔐 GOD_MODE ADMIN DETECTED:", { 
    email, 
    dbRole: data.role, 
    forcedRole, 
    finalRole: role,
    onboardingCompleted 
  });
}
```

### 3. Triple-Layer Protection (Already in Place)
1. **Database Trigger**: Auto-promotes GOD_MODE emails at DB level
2. **Code-Level Force**: `forceAdminRoleByEmail()` in AuthContext
3. **Onboarding Guard**: `learnerNeedsOnboarding()` checks `isStaffRole()` first

## How to Apply the Fix

### Step 1: Run the SQL Script
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/fix_admin_user_comprehensive.sql`
3. Click "Run" to execute the script
4. Verify the output shows `role = 'admin'` and `onboarding_completed = true`

### Step 2: Clear Browser State
1. Open browser DevTools (F12)
2. Go to Application → Storage
3. Clear:
   - Local Storage
   - Session Storage
   - Cookies
4. Or use "Clear Site Data" button

### Step 3: Rebuild and Test
```bash
npm run build
npm run preview
```

### Step 4: Log Out and Log In
1. Log out completely
2. Log back in with admin credentials
3. Should go directly to `/dashboard` without onboarding redirect

## Expected Behavior After Fix

### Console Logs (Success)
```
🔐 GOD_MODE ADMIN DETECTED: {
  email: 'info@sheleadsafrica.org',
  dbRole: 'admin',
  forcedRole: 'admin',
  finalRole: 'admin',
  onboardingCompleted: true
}

ONBOARDING REDIRECT TRACE {
  loading: false,
  isAuthenticated: true,
  role: 'admin',
  needsOnboarding: false,  // ← Should be FALSE
  path: '/dashboard'
}
```

### UI Behavior
- ✅ Admin goes directly to dashboard
- ✅ No onboarding redirect
- ✅ Admin name displays correctly (not "User")
- ✅ Admin sidebar menu shows admin options
- ✅ No `user_id=eq.undefined` errors

## Protection Against Future Issues

### Database Trigger
The trigger ensures that even if someone manually updates the admin user's role in the database, it will be automatically corrected back to 'admin' on the next update.

### Code-Level Force
The `forceAdminRoleByEmail()` function provides a safety net in case the database trigger fails or is disabled.

### Onboarding Logic
The `learnerNeedsOnboarding()` function explicitly checks `isStaffRole()` first, ensuring staff NEVER see onboarding regardless of database flags.

## Verification Checklist

After applying the fix, verify:

- [ ] SQL script executed successfully
- [ ] Admin user's role is 'admin' in database
- [ ] Admin user's `onboarding_completed` is true
- [ ] Database trigger is created and active
- [ ] Browser cache/localStorage cleared
- [ ] Logged out and logged back in
- [ ] Console shows "🔐 GOD_MODE ADMIN DETECTED" log
- [ ] Console shows `needsOnboarding: false`
- [ ] No redirect to `/onboarding`
- [ ] Admin name displays correctly (not "User")
- [ ] No `user_id=eq.undefined` errors
- [ ] Dashboard loads correctly with admin menu

## Rollback Plan

If something goes wrong:

1. **Revert Database Changes**:
```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_auto_promote_god_mode_admins ON profiles;
DROP FUNCTION IF EXISTS auto_promote_god_mode_admins();

-- Manually set role if needed
UPDATE profiles SET role = 'admin' WHERE email = 'info@sheleadsafrica.org';
```

2. **Revert Code Changes**:
```bash
git checkout HEAD -- src/contexts/AuthContext.tsx
```

## Related Files

- `src/contexts/AuthContext.tsx` - Enhanced profile mapping
- `src/lib/userRole.ts` - Role logic and GOD_MODE emails
- `src/components/dashboard/DashboardLayout.tsx` - Onboarding redirect logic
- `src/pages/OnboardingPage.tsx` - Onboarding guard
- `supabase/fix_admin_user_comprehensive.sql` - Database fix script
- `supabase/fix_existing_users_onboarding.sql` - Existing users fix (already applied)

## Notes

- The GOD_MODE email list is in `src/lib/userRole.ts` as `GOD_MODE_ADMIN_EMAILS`
- To add more admin emails, update both the code array and the database trigger
- The trigger runs on BEFORE INSERT OR UPDATE, so it catches all profile changes
- The code-level force runs on every profile load, providing real-time protection

