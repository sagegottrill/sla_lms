# Twilio Integration - Deployment Checklist

## Pre-Deployment

### 1. Twilio Account Setup
- [ ] Create Twilio account at https://www.twilio.com
- [ ] Verify your email address
- [ ] Complete phone number verification
- [ ] Note your Account SID (starts with "AC...")
- [ ] Note your Auth Token (from Twilio Console)
- [ ] Purchase a phone number with SMS capabilities
- [ ] (Optional) Enable WhatsApp sandbox or get WhatsApp Business approval

### 2. Supabase Project Setup
- [ ] Ensure Supabase project is created
- [ ] Verify Supabase CLI is installed: `supabase --version`
- [ ] Link to your project: `supabase link --project-ref your-project-ref`
- [ ] Verify you have admin access to Supabase Dashboard

---

## Deployment Steps

### Step 1: Set Environment Variables

**Option A: Using Supabase Dashboard**
1. [ ] Go to Supabase Dashboard → Settings → Edge Functions
2. [ ] Click "Add new secret"
3. [ ] Add the following secrets:
   ```
   TWILIO_ACCOUNT_SID = AC...your_sid_here
   TWILIO_AUTH_TOKEN = your_auth_token_here
   TWILIO_PHONE_NUMBER = +1234567890
   TWILIO_WHATSAPP_NUMBER = whatsapp:+1234567890
   ```

**Option B: Using Supabase CLI**
```bash
supabase secrets set TWILIO_ACCOUNT_SID=AC...your_sid_here
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### Step 2: Deploy Edge Function

```bash
# Navigate to project root
cd /path/to/your/project

# Deploy the function
supabase functions deploy twilio-notify

# Verify deployment
supabase functions list
```

**Expected Output:**
```
┌──────────────┬─────────┬────────────────────┐
│ NAME         │ STATUS  │ UPDATED            │
├──────────────┼─────────┼────────────────────┤
│ twilio-notify│ ACTIVE  │ 2024-XX-XX XX:XX   │
└──────────────┴─────────┴────────────────────┘
```

### Step 3: Test Edge Function

**Local Test (Optional):**
```bash
# Start local function server
supabase functions serve twilio-notify

# In another terminal, test with curl
curl -X POST http://localhost:54321/functions/v1/twilio-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "+1234567890",
    "message": "Test message from She Leads Africa",
    "channel": "sms"
  }'
```

**Production Test:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/twilio-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "+1234567890",
    "message": "Test message from She Leads Africa",
    "channel": "sms"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "messageSid": "SM...",
  "status": "queued",
  "channel": "sms"
}
```

### Step 4: Deploy Frontend Changes

```bash
# Build the frontend
npm run build
# or
bun run build

# Deploy to your hosting provider (Vercel, Netlify, etc.)
# Example for Vercel:
vercel --prod
```

### Step 5: Verify in Production

1. [ ] Open your production app
2. [ ] Navigate to Participants page
3. [ ] Click "⋮" on any participant
4. [ ] Click "Send SMS / WhatsApp"
5. [ ] Fill in phone number and message
6. [ ] Click "Send SMS"
7. [ ] Verify success toast appears
8. [ ] Check Twilio Console for message delivery

---

## Post-Deployment Verification

### Functional Tests

#### Test 1: SMS Sending
- [ ] Open Participants page
- [ ] Select a participant
- [ ] Choose "Send SMS / WhatsApp"
- [ ] Select "SMS" channel
- [ ] Enter valid phone number
- [ ] Type test message
- [ ] Click "Send SMS"
- [ ] Verify success toast
- [ ] Confirm SMS received on phone

#### Test 2: WhatsApp Sending
- [ ] Open Participants page
- [ ] Select a participant
- [ ] Choose "Send SMS / WhatsApp"
- [ ] Select "WhatsApp" channel
- [ ] Enter valid WhatsApp number
- [ ] Type test message
- [ ] Click "Send WhatsApp"
- [ ] Verify success toast
- [ ] Confirm WhatsApp message received

#### Test 3: Error Handling
- [ ] Try sending with empty phone number
- [ ] Verify error toast appears
- [ ] Try sending with invalid phone format
- [ ] Verify Twilio error message in toast
- [ ] Try sending with empty message
- [ ] Verify validation error

#### Test 4: UI/UX
- [ ] Modal opens smoothly
- [ ] Channel selector works
- [ ] Character counter updates
- [ ] Buttons disable during send
- [ ] Modal closes on success
- [ ] Cancel button works

### Security Verification

- [ ] Open browser DevTools → Network tab
- [ ] Send a test message
- [ ] Verify NO Twilio credentials in request headers
- [ ] Verify NO Twilio credentials in request body
- [ ] Verify request goes to Supabase Edge Function URL
- [ ] Check Application → Local Storage
- [ ] Verify NO Twilio credentials stored

### Twilio Console Verification

1. [ ] Log into Twilio Console
2. [ ] Go to Monitor → Logs → Messaging
3. [ ] Verify test messages appear
4. [ ] Check message status (delivered/failed)
5. [ ] Review any error messages
6. [ ] Check account balance

---

## Rollback Plan

If issues occur, follow these steps:

### Option 1: Disable Edge Function
```bash
# Delete the function
supabase functions delete twilio-notify
```

### Option 2: Revert Frontend Changes
```bash
# Revert git commits
git revert HEAD~3  # Adjust number based on commits

# Redeploy
npm run build && vercel --prod
```

### Option 3: Hide UI Feature
```typescript
// In ParticipantsPage.tsx, comment out the menu item:
/*
<DropdownMenuItem
  onClick={() => openSmsModal(p)}
  className="cursor-pointer font-medium text-xs py-2"
>
  <MessageSquare className="w-3.5 h-3.5 mr-2" />
  Send SMS / WhatsApp
</DropdownMenuItem>
*/
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Monitor Twilio usage in console
- [ ] Check for failed messages
- [ ] Review error logs in Supabase

### Weekly Checks
- [ ] Review Twilio costs
- [ ] Check message delivery rates
- [ ] Analyze usage patterns

### Monthly Checks
- [ ] Review and optimize message templates
- [ ] Update phone number database
- [ ] Audit security settings

---

## Troubleshooting Guide

### Issue: "Twilio credentials not configured"

**Cause:** Environment variables not set or function not redeployed

**Solution:**
```bash
# Verify secrets are set
supabase secrets list

# Redeploy function
supabase functions deploy twilio-notify
```

### Issue: "Failed to send message"

**Cause:** Invalid phone number format or Twilio account issue

**Solution:**
1. Verify phone number includes country code (+)
2. Check Twilio account balance
3. Verify phone number is verified (trial accounts)
4. Check Twilio Console for specific error

### Issue: CORS errors in browser

**Cause:** CORS headers not properly configured

**Solution:**
1. Verify CORS headers in Edge Function
2. Check Supabase project URL matches frontend
3. Redeploy Edge Function

### Issue: Modal not opening

**Cause:** React component error or missing imports

**Solution:**
1. Check browser console for errors
2. Verify all UI component imports
3. Check Dialog component is properly installed

### Issue: Messages not delivered

**Cause:** Twilio account or phone number issue

**Solution:**
1. Check Twilio Console → Monitor → Logs
2. Verify recipient phone number is valid
3. Check message content for prohibited content
4. Verify sender phone number is active

---

## Success Criteria

✅ **Deployment is successful when:**

1. Edge Function is deployed and active
2. Environment variables are set correctly
3. Frontend builds without errors
4. SMS messages are delivered successfully
5. WhatsApp messages are delivered successfully
6. Error handling works as expected
7. No credentials exposed in frontend
8. Toast notifications appear correctly
9. Modal UI works smoothly
10. Twilio Console shows message logs

---

## Support Contacts

**Twilio Support:**
- Console: https://console.twilio.com
- Support: https://support.twilio.com
- Docs: https://www.twilio.com/docs

**Supabase Support:**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

## Estimated Timeline

- **Environment Setup:** 10 minutes
- **Edge Function Deployment:** 5 minutes
- **Frontend Deployment:** 10 minutes
- **Testing:** 15 minutes
- **Total:** ~40 minutes

---

**Deployment Status:** Ready to Deploy ✅

**Last Updated:** 2024
