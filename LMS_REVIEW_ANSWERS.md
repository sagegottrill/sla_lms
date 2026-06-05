# LMS Client Review — Implementation Answers

## Deborah (Admin) — Export shows only 2 of 19 enrollees
**Fixed.** The roster counted every registered learner while export/status views counted only enrolled cohort rows. Participants now has **Enrolled / Registered only / All** filters, a **Status** column, phone in CSV, and subtitle counts (`X enrolled · Y registered only`).

## Deborah / Shayo — Interface not lively
**Improved.** Clearer participant filters, status chips, mobile lesson completion, job board, webinars with countdowns, and forum thread replies. Full visual rebrand is out of scope for this pass.

## Deborah — 19 enrollees, only 2 in status
**Fixed.** Same root cause as export mismatch; use **Enrolled** filter for cohort reporting.

## Deborah — Admin vs Manager privileges differ
**Improved.** Admin sidebar now includes **Reports**. Both roles share Participants with aligned export data. Granular permission keys exist but route access remains role-based (Managers cannot access Users/Payments/Campaigns).

## Shayo — Demo session with developer
**Process / not code.** Recommend a 30–45 min walkthrough: Participants export, course player, certificates, job board, webinars, resume import.

## Shayo — Can we hold webinars on the platform?
**Implemented (MVP).** `/dashboard/webinars` — staff schedule sessions with **external meeting links** (Zoom/Meet/Teams). Learners see countdowns and **Join session**. Also on Calendar.

## Samson — Cannot browse jobs / post openings
**Implemented.** `/dashboard/jobs` — learners browse; admin/program managers **Post Job** using existing `jobs` table.

## Samson — Upload resume → populate builder
**Implemented.** Resume Builder **Import resume (AI)** uploads PDF/DOCX/TXT; `parse-resume` Edge Function prefills fields for review. Requires `AIMIX_*` secrets in Supabase.

## Kike — Progress meter stays 0% after watching lessons
**Fixed.** Opening a lesson marks progress; mobile curriculum has completion checkmarks; progress saves with error handling; queries invalidate after save.

## Kike — Certificate blocked by 0% progress
**Fixed.** At 100% completion, `issueCertificate` runs automatically with `credential_id`.

## Lois — Reminder feature
**Implemented (MVP).** Notifications page: inactivity reminders (toggleable), deadline settings, calendar deadline events, webinar reminders. Automated email still needs SendGrid + `process-campaigns` cron configured.

## Elizabeth — Interaction / notifications / popups
**Improved.** Notifications copy aligned with real completion; forums support **replies**; participant SMS prefills phone from applications.

## Data collection — phone, filtering, documents
**Implemented.** Phone joined from applications into participant roster/export; enrollment/status filters; portfolio **document upload** to Supabase `documents` bucket.

## Community / chat with participants
**Improved.** Forums: thread body + replies. Direct 1:1 learner chat not built; staff can email/SMS/WhatsApp from Participants.

## Email automation
**Partially implemented.** Templates + Campaigns exist; Participants uses mailto; SendGrid edge function ready — configure `SENDGRID_*` secrets and cron for full automation.

## Countdown
**Implemented.** Webinar cards show live countdown; landing CTA countdown unchanged.

## Delete defunct members
**Existing + clarified.** Remove selected = drop enrollments; row menu **Delete participant** = profile delete. Ensure RLS delete policy applied in production.

## Can we send message / email
**Yes (MVP).** Message Cohort (mailto), per-row email, SMS/WhatsApp via Twilio when secrets configured.

## Can student upload
**Yes.** Portfolio document upload; resume AI import.

## Can we post jobs
**Yes.** Admin/PM via Job Board.

## Production deploy checklist
1. Run `supabase/migrations/20260605_live_sessions_documents.sql` in Supabase SQL Editor.
2. Deploy Edge Functions: `parse-resume` (and ensure `send-email`, `twilio-notify`, `process-campaigns` if using automation).
3. Set secrets: `AIMIX_BASE_URL`, `AIMIX_API_KEY`, `AIMIX_MODEL`, `SENDGRID_*`, Twilio vars as needed.
4. Redeploy frontend (Vercel).
