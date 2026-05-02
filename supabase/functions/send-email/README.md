# send-email — SendGrid Transactional Email Edge Function

## Setup (5 minutes)

### 1. Get a SendGrid API Key
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to Settings → API Keys → Create API Key
3. Select "Restricted Access" → Mail Send → Full Access
4. Copy the key (starts with `SG.`)

### 2. Verify a Sender Email
1. In SendGrid: Settings → Sender Authentication
2. Verify a single sender OR set up domain authentication
3. Use that email as `SENDGRID_FROM_EMAIL`

### 3. Set Secrets
```bash
supabase secrets set SENDGRID_API_KEY=SG.your_key_here
supabase secrets set SENDGRID_FROM_EMAIL=noreply@sheleadsafrica.org
supabase secrets set SENDGRID_FROM_NAME="She Leads Africa"
```

### 4. Deploy
```bash
supabase functions deploy send-email
supabase functions deploy process-campaigns
```

### 5. Set up pg_cron (campaign automation)
Run `supabase/setup_pg_cron.sql` in Supabase SQL Editor after replacing:
- `<project-ref>` with your project reference (found in Settings → General)
- `<service-role-key>` with your service role key (Settings → API)

---

## API Reference

### Send a transactional email
```typescript
const result = await api.sendEmail({
  to: "user@example.com",           // or array of emails
  subject: "Welcome to ConnectHer",
  html: "<h1>Hello!</h1>",
  text: "Hello!",                    // plain-text fallback
  replyTo: "support@sheleadsafrica.org",
});
```

### Send with a SendGrid Dynamic Template
```typescript
const result = await api.sendEmail({
  to: ["user1@example.com", "user2@example.com"],
  subject: "",                       // ignored when using templateId
  html: "",                          // ignored when using templateId
  templateId: "d-your-template-id",
  templateData: {
    first_name: "Jane",
    course_name: "Data Leadership",
    cta_url: "https://connecther.sheleadsafrica.org/dashboard",
  },
});
```

---

## What Gets Sent Automatically (via pg_cron every 15 min)

| Trigger | Condition | Email |
|---|---|---|
| Inactivity reminder | No login for N days (admin-configurable) | "We miss you" with course list |
| Deadline alert | Enrollment > 80 days old, not complete | "Deadline approaching" warning |
| Scheduled campaigns | `status = 'scheduled'` and `scheduled_at <= now()` | Campaign body to all learners |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SENDGRID_API_KEY` | ✅ | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | ✅ | Verified sender email |
| `SENDGRID_FROM_NAME` | Optional | Sender display name (default: "She Leads Africa") |
| `SUPABASE_URL` | Auto | Set automatically by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Set automatically by Supabase |
| `SUPABASE_ANON_KEY` | Auto | Set automatically by Supabase |
