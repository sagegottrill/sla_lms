# Twilio SMS Edge Function

This Supabase Edge Function provides a secure backend for sending SMS messages via Twilio without exposing credentials in the frontend.

## Setup Instructions

### 1. Configure Twilio Credentials

Add the following environment variables to your Supabase project:

```bash
# In Supabase Dashboard: Settings > Edge Functions > Environment Variables
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Or using Supabase CLI:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid_here
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Deploy the Edge Function

```bash
# Deploy to Supabase
supabase functions deploy twilio-notify

# Or deploy with environment variables
supabase functions deploy twilio-notify --no-verify-jwt
```

### 3. Test the Function

```bash
# Test locally
supabase functions serve twilio-notify

# Test with curl
curl -X POST http://localhost:54321/functions/v1/twilio-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from She Leads Africa!"
  }'
```

## API Reference

### Request

**Endpoint:** `POST /twilio-notify`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_anon_key>`

**Body:**
```json
{
  "to": "+1234567890",
  "message": "Your message here"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "messageSid": "SM...",
  "status": "queued",
  "channel": "sms"
}
```

**Error (400/500):**
```json
{
  "error": "Error message",
  "details": {}
}
```

## Security Notes

- ✅ Twilio credentials are stored securely in Supabase environment variables
- ✅ Never exposed to the frontend
- ✅ CORS headers configured for frontend access
- ✅ Request validation on all inputs
- ⚠️ Consider adding Row Level Security (RLS) policies to restrict who can call this function
- ⚠️ Consider rate limiting to prevent abuse

## Twilio Setup

1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number with SMS capabilities

## Troubleshooting

**"Twilio credentials not configured"**
- Ensure environment variables are set in Supabase
- Redeploy the function after setting secrets

**"Failed to send message"**
- Verify phone number format includes country code (+1234567890)
- Check Twilio account balance
- Verify phone number is verified in Twilio (for trial accounts)

**CORS errors**
- Ensure your frontend URL is allowed
- Check that CORS headers are properly set in the function
