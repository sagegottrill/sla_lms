# 🚀 RUN THIS NOW - Admin Fix

## Your Admin Email
`info@sheleadsafrica.org`

## Step 1: Run SQL (1 minute)
1. Open **Supabase Dashboard**
2. Click **SQL Editor**
3. Copy ALL content from: `supabase/fix_admin_user_comprehensive.sql`
4. Paste and click **Run**
5. Wait for ✅ success

## Step 2: Clear Browser (30 seconds)
1. Press **F12**
2. **Application** → **Storage** → **Clear Site Data**
3. Close DevTools

## Step 3: Test (30 seconds)
1. **Log out**
2. **Log in** with `info@sheleadsafrica.org`
3. Should go to `/dashboard` ✅

## Success Check
Open console (F12) and look for:
```
🔐 GOD_MODE ADMIN DETECTED: {
  email: 'info@sheleadsafrica.org',
  ...
}
```

## If It Works
- ✅ No onboarding redirect
- ✅ Your name shows (not "User")
- ✅ Admin menu visible
- ✅ Dashboard loads

## If It Doesn't Work
1. Check SQL ran successfully
2. Try **Incognito/Private window**
3. Hard refresh: **Ctrl+Shift+R**

---

**Total Time**: 2 minutes  
**Files to Run**: `supabase/fix_admin_user_comprehensive.sql`  
**Your Email**: `info@sheleadsafrica.org`
