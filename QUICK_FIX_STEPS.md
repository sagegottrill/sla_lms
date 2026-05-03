# Quick Fix Steps - Admin Onboarding Issue

## 🚨 Problem
Admin user showing as "User" with `role: 'student'` and being redirected to onboarding.

## ✅ Solution (3 Steps)

### Step 1: Run SQL Script in Supabase
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste from: `supabase/fix_admin_user_comprehensive.sql`
3. Click **Run**
4. Verify output shows `role = 'admin'`

### Step 2: Clear Browser Data
1. Press **F12** (DevTools)
2. Go to **Application** → **Storage**
3. Click **Clear Site Data**
4. Close DevTools

### Step 3: Test
1. **Log out** completely
2. **Log back in** with admin credentials
3. Should go directly to `/dashboard` ✅

## 🔍 What to Look For

### Success Indicators
- ✅ Console shows: `🔐 GOD_MODE ADMIN DETECTED`
- ✅ Console shows: `needsOnboarding: false`
- ✅ No redirect to `/onboarding`
- ✅ Admin name displays (not "User")
- ✅ No `user_id=eq.undefined` errors

### If Still Not Working
1. Check SQL script ran successfully
2. Verify email in script matches: `info@sheleadsafrica.org`
3. Try hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
4. Check browser console for the "🔐 GOD_MODE ADMIN DETECTED" log

## 📋 What Was Fixed

### Code Changes
- ✅ Enhanced `mapProfileRowToAppUser()` in `src/contexts/AuthContext.tsx`
- ✅ Added debug logging for GOD_MODE admin detection
- ✅ Ensured email extraction happens before role logic

### Database Changes
- ✅ Updated admin user's role to 'admin'
- ✅ Set `onboarding_completed = true`
- ✅ Created trigger to auto-promote GOD_MODE emails
- ✅ Prevents issue from happening again

## 📚 Full Documentation
See `ADMIN_ONBOARDING_FIX_COMPLETE.md` for complete details.

