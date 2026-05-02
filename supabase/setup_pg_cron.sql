-- ============================================================
-- CONNECT HER LMS — pg_cron Campaign Automation Setup
-- Run in Supabase: Dashboard → SQL Editor → New query
--
-- Prerequisites:
-- 1. Enable pg_cron extension in Supabase Dashboard → Database → Extensions
-- 2. Enable pg_net extension (for HTTP calls from cron)
-- 3. Deploy process-campaigns Edge Function:
--    supabase functions deploy process-campaigns
-- 4. Set secrets:
--    supabase secrets set SENDGRID_API_KEY=SG.your_key_here
--    supabase secrets set SENDGRID_FROM_EMAIL=noreply@sheleadsafrica.org
--    supabase secrets set SENDGRID_FROM_NAME="She Leads Africa"
-- ============================================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Schedule: process-campaigns every 15 minutes
-- Replace <project-ref> with your Supabase project reference
-- Replace <service-role-key> with your service role key
-- ============================================================
SELECT cron.schedule(
  'process-campaigns',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<project-ref>.supabase.co/functions/v1/process-campaigns',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <service-role-key>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- ============================================================
-- Verify the cron job was created
-- ============================================================
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'process-campaigns';

-- ============================================================
-- To remove the cron job (if needed):
-- SELECT cron.unschedule('process-campaigns');
-- ============================================================
