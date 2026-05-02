# 🗄️ Database Migration Guide

## Overview
This guide will help you apply the missing tables migration to your Supabase database. The migration creates 5 critical tables needed for the LMS platform.

## ✅ What This Migration Creates

### 1. **placement_outcomes**
- Tracks student job placements and career outcomes
- Fields: company, role, location, salary, status (placed/interviewing/searching)
- Access: Admin and Program Manager only

### 2. **interview_schedules**
- Manages interview scheduling for students
- Fields: candidate, role, interview date/time, type (video/in-person/phone), status
- Access: Admin and Program Manager only

### 3. **lead_captures**
- Stores marketing leads from website forms
- Fields: email, name, source, status, program interest
- Access: Admin only (read/update/delete), Public (insert only for forms)

### 4. **system_settings**
- Platform configuration settings
- Fields: inactivity reminder days, assessment deadline alerts, platform name, support email
- Access: All authenticated users (read), Admin only (write)

### 5. **audit_logs**
- Security audit trail for all system actions
- Fields: user_id, action_type, target_resource, old_data, new_data, ip_address
- Access: Admin only (read), Service role only (write)

## 📋 Prerequisites

Before you begin, ensure you have:
- [ ] Access to your Supabase Dashboard
- [ ] Admin privileges on your Supabase project
- [ ] The migration file: `supabase/missing_tables_migration.sql`

## 🚀 Step-by-Step Migration Instructions

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (Connect Her LMS)

### Step 2: Navigate to SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New query"** button (top right)

### Step 3: Copy Migration SQL
1. Open the file `supabase/missing_tables_migration.sql` in your code editor
2. Select all content (Ctrl+A / Cmd+A)
3. Copy to clipboard (Ctrl+C / Cmd+C)

### Step 4: Paste and Execute
1. Paste the SQL into the Supabase SQL Editor
2. Review the SQL (optional - it's safe to run multiple times)
3. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

### Step 5: Verify Success
You should see a success message like:
```
Success. No rows returned
```

### Step 6: Verify Tables Were Created
1. In the left sidebar, click on **"Table Editor"**
2. You should now see these new tables:
   - `placement_outcomes`
   - `interview_schedules`
   - `lead_captures`
   - `system_settings`
   - `audit_logs`

## ✨ Migration Features

### Idempotent Design
This migration is **safe to run multiple times**:
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `DROP POLICY IF EXISTS` before creating policies
- Uses `CREATE INDEX IF NOT EXISTS`
- Seeds default data with `ON CONFLICT DO NOTHING`

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- **Staff-only tables**: placement_outcomes, interview_schedules
- **Admin-only tables**: lead_captures, audit_logs
- **Public read tables**: system_settings

### Indexes
Optimized indexes are created for:
- Foreign key columns (user_id, created_by)
- Filter columns (status, date fields)
- Sort columns (created_at DESC)

## 🧪 Testing the Migration

After applying the migration, test each table:

### Test 1: System Settings (Should Work)
```sql
SELECT * FROM system_settings;
```
Expected: 1 row with default settings

### Test 2: Placement Outcomes (Admin/PM Only)
```sql
SELECT * FROM placement_outcomes;
```
Expected: Empty result set (no data yet)

### Test 3: Interview Schedules (Admin/PM Only)
```sql
SELECT * FROM interview_schedules;
```
Expected: Empty result set (no data yet)

### Test 4: Lead Captures (Admin Only)
```sql
SELECT * FROM lead_captures;
```
Expected: Empty result set (no data yet)

### Test 5: Audit Logs (Admin Only)
```sql
SELECT * FROM audit_logs;
```
Expected: Empty result set (no data yet)

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solution**: This is normal if you've run the migration before. The migration is idempotent and will skip existing tables.

### Error: "permission denied"
**Solution**: Ensure you're logged in as the project owner or have admin privileges.

### Error: "syntax error"
**Solution**: 
1. Make sure you copied the entire SQL file
2. Check for any accidental modifications
3. Try copying again from the original file

### Tables not showing in Table Editor
**Solution**:
1. Refresh the page (F5)
2. Check the "All tables" filter
3. Verify the SQL ran successfully

## 📊 Post-Migration Checklist

After successful migration:
- [ ] All 5 tables visible in Table Editor
- [ ] System settings table has 1 default row
- [ ] RLS policies are enabled (check Table Editor → Policies tab)
- [ ] Indexes are created (check Table Editor → Indexes tab)
- [ ] Test queries run successfully

## 🎯 Next Steps

After migration is complete:

1. **Test the UI Features**
   - Navigate to Reports page (should load without errors)
   - Navigate to Notification Preferences page (should load without errors)
   - Test placement outcomes tracking (if you have admin access)
   - Test interview scheduling (if you have program manager access)

2. **Verify Data Flow**
   - Create a test lead capture from the landing page
   - Check if it appears in the database
   - Verify RLS policies are working correctly

3. **Monitor Audit Logs**
   - Set up triggers to populate audit_logs (if needed)
   - Verify important actions are being logged

## 🆘 Need Help?

If you encounter issues:
1. Check the Supabase logs (Dashboard → Logs)
2. Verify your user role in the profiles table
3. Check RLS policies are correctly configured
4. Review the SQL migration file for any custom modifications

## 📝 Migration File Location
```
supabase/missing_tables_migration.sql
```

## ✅ Migration Complete!

Once you see all 5 tables in your Supabase dashboard, the migration is complete and your LMS platform is ready to use these new features!
