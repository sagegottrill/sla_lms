# ⚡ Quick Start - Unpublish Feature

## 🎯 What You Need to Know

**Feature:** Admin users can now unpublish courses with one click  
**Files Changed:** 1 (InstructorCoursesPage.tsx)  
**Database Changes:** 0 (none)  
**Risk Level:** 🟢 Low  
**Time to Test:** 15 minutes  
**Time to Deploy:** 5 minutes  
**Time to Rollback:** 30 seconds  

---

## ✅ Pre-Deployment Checklist (15 min)

### 1. Environment Check (2 min)
```bash
# Verify .env exists
cat .env | grep VITE_SUPABASE

# Start dev server
npm run dev

# Open http://localhost:5173
# Check console - should NOT see "Supabase credentials are not set"
```

### 2. Backend Test (5 min)
Open browser console (F12):
```javascript
// Test connection
const { supabase } = await import('/src/lib/supabase.ts');
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.email);

// Test role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user?.id)
  .single();
console.log('Role:', profile?.role); // Should be 'admin'

// Test read
const { data, error } = await supabase
  .from('courses')
  .select('id, title, status')
  .limit(1);
console.log('Can read:', !!data, 'Error:', error); // Should be true, null
```

### 3. Update Test (5 min)
⚠️ Uses a real course - pick a test course!
```javascript
// Get test course
const { data: course } = await supabase
  .from('courses')
  .select('id, title, status')
  .limit(1)
  .single();
console.log('Before:', course);

// Update
const { data: updated, error } = await supabase
  .from('courses')
  .update({ status: 'draft' })
  .eq('id', course.id)
  .select()
  .single();
console.log('After:', updated, 'Error:', error); // Error should be null

// Restore
await supabase
  .from('courses')
  .update({ status: course.status })
  .eq('id', course.id);
console.log('Restored');
```

### 4. UI Test (3 min)
1. Log in as admin
2. Go to Dashboard → Courses
3. Hover over a published course
4. Click "Unpublish"
5. Verify: loading spinner → success toast → status changes
6. Click "Publish" to restore

---

## 🚀 Deployment (5 min)

### If All Tests Pass:
```bash
# 1. Commit
git add src/pages/InstructorCoursesPage.tsx
git commit -m "feat: Add unpublish functionality for admin users"

# 2. Push
git push origin main

# 3. Verify
# - Check build succeeds
# - Test in production
# - Monitor for errors
```

---

## 🔄 Rollback (30 sec)

### If Something Goes Wrong:
```bash
# Quick revert
git revert HEAD
git push
```

### Or Emergency Disable:
```typescript
// In InstructorCoursesPage.tsx line 20:
const isAdmin = false; // Disable feature
```

---

## 📊 What to Monitor (24 hours)

**Watch for:**
- ❌ Errors in browser console
- ❌ RLS violations in Supabase logs
- ❌ Student complaints about missing courses

**Success indicators:**
- ✅ Admins can unpublish/publish
- ✅ No errors
- ✅ UI updates correctly

---

## 🆘 Troubleshooting

### "Supabase credentials are not set"
```bash
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### "Your role is not admin"
```sql
-- In Supabase SQL Editor:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### "Permission denied" or "RLS violation"
```sql
-- Verify policy exists:
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'courses' 
  AND policyname = 'Staff can update courses';
```

---

## 📚 Full Documentation

For detailed information, see:
- **READY_TO_DEPLOY.md** - Complete deployment guide
- **DEPLOYMENT_SUMMARY.md** - Executive summary
- **test-unpublish-backend.md** - Detailed test scripts
- **UNPUBLISH_VERIFICATION_CHECKLIST.md** - Full checklist

---

## ✅ Final Check

Before pushing, confirm:
- [ ] All 4 tests passed
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Stakeholder approved
- [ ] You understand rollback plan

---

## 🎉 You're Ready!

**Tests pass?** → Deploy  
**Tests fail?** → Fix issues first  
**Questions?** → Read full documentation  

**Good luck! 🚀**
