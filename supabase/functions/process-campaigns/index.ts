import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * process-campaigns — Campaign automation processor
 *
 * Called by pg_cron every 15 minutes to:
 * 1. Find campaigns with status = 'scheduled' and scheduled_at <= now()
 * 2. Resolve the audience (all learners, or program-specific)
 * 3. Send emails via SendGrid (calls send-email Edge Function internally)
 * 4. Mark campaign as 'sent'
 *
 * Also handles:
 * - Inactivity reminders (learners inactive > system_settings.inactivity_reminder_days)
 * - Deadline alerts (enrollments with estimated deadline within system_settings.assessment_deadline_alert_hours)
 *
 * Triggered by pg_cron SQL (run in Supabase SQL Editor):
 *   SELECT cron.schedule(
 *     'process-campaigns',
 *     '*/15 * * * *',
 *     $$SELECT net.http_post(
 *       url := 'https://<project-ref>.supabase.co/functions/v1/process-campaigns',
 *       headers := '{"Authorization": "Bearer <service-role-key>", "Content-Type": "application/json"}'::jsonb,
 *       body := '{}'::jsonb
 *     )$$
 *   );
 */

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "";
const SENDGRID_FROM_NAME  = Deno.env.get("SENDGRID_FROM_NAME") ?? "She Leads Africa";
const SENDGRID_API_KEY    = Deno.env.get("SENDGRID_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Helpers ────────────────────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

async function sendViaSendGrid(
  recipients: string[],
  subject: string,
  html: string,
  text?: string,
): Promise<boolean> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.error("SendGrid not configured — skipping email send");
    return false;
  }
  if (recipients.length === 0) return true;

  // Batch into chunks of 1000 (SendGrid limit per request)
  const CHUNK = 1000;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const body = {
      personalizations: chunk.map(email => ({ to: [{ email }] })),
      from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
      subject,
      content: [
        ...(text ? [{ type: "text/plain", value: text }] : []),
        { type: "text/html", value: html },
      ],
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status !== 202) {
      const err = await res.text().catch(() => "unknown");
      console.error(`SendGrid chunk ${i}–${i + CHUNK} failed (${res.status}):`, err);
      return false;
    }
  }
  return true;
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Only accept calls from service role (pg_cron or internal)
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const results: string[] = [];

  // ── 1. Process scheduled campaigns ──────────────────────────────────────
  const { data: campaigns, error: campErr } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());

  if (campErr) {
    console.error("Fetch campaigns error:", campErr.message);
  } else {
    for (const campaign of campaigns ?? []) {
      try {
        // Resolve audience
        let recipientEmails: string[] = [];

        if (campaign.audience === "all" || !campaign.audience) {
          // All learners
          const { data: profiles } = await supabase
            .from("profiles")
            .select("email")
            .eq("role", "student");
          recipientEmails = (profiles ?? []).map((p: any) => p.email).filter(Boolean);
        } else {
          // Program-specific audience (audience stores program title or id)
          const { data: participants } = await supabase
            .from("enrollments")
            .select("profiles(email)")
            .not("program_id", "is", null);
          recipientEmails = (participants ?? [])
            .map((e: any) => e.profiles?.email)
            .filter(Boolean);
        }

        if (recipientEmails.length === 0) {
          await supabase
            .from("marketing_campaigns")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", campaign.id);
          results.push(`Campaign ${campaign.id}: no recipients, marked sent`);
          continue;
        }

        // Build email content
        const subject = campaign.subject || campaign.name;
        const html    = campaign.body || `<p>${campaign.name}</p>`;

        const sent = await sendViaSendGrid(recipientEmails, subject, html);

        if (sent) {
          await supabase
            .from("marketing_campaigns")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", campaign.id);
          results.push(`Campaign ${campaign.id}: sent to ${recipientEmails.length} recipients`);
        } else {
          results.push(`Campaign ${campaign.id}: SendGrid failed`);
        }
      } catch (err: any) {
        console.error(`Campaign ${campaign.id} error:`, err.message);
        results.push(`Campaign ${campaign.id}: error — ${err.message}`);
      }
    }
  }

  // ── 2. Inactivity reminders ──────────────────────────────────────────────
  const { data: settings } = await supabase
    .from("system_settings")
    .select("inactivity_reminder_days, assessment_deadline_alert_hours")
    .eq("id", "main")
    .single();

  const inactivityDays = Number(settings?.inactivity_reminder_days ?? 3);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - inactivityDays);

  const { data: inactiveEnrollments } = await supabase
    .from("enrollments")
    .select("user_id, profiles(email, name), courses(title)")
    .lt("last_accessed", cutoff.toISOString())
    .eq("status", "active")
    .lt("progress", 100);

  if (inactiveEnrollments && inactiveEnrollments.length > 0) {
    // Group by user to send one email per user (not per enrollment)
    const byUser = new Map<string, { email: string; name: string; courses: string[] }>();
    for (const e of inactiveEnrollments as any[]) {
      const email = e.profiles?.email;
      const name  = e.profiles?.name ?? "Learner";
      const title = e.courses?.title ?? "your course";
      if (!email) continue;
      const existing = byUser.get(email) ?? { email, name, courses: [] };
      existing.courses.push(title);
      byUser.set(email, existing);
    }

    for (const { email, name, courses } of byUser.values()) {
      const courseList = courses.map(c => `<li>${c}</li>`).join("");
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0056D2;">Hi ${name}, we miss you! 👋</h2>
          <p>It's been ${inactivityDays}+ days since you last logged in. Your learning journey is waiting:</p>
          <ul>${courseList}</ul>
          <a href="https://connecther.sheleadsafrica.org/dashboard/courses"
             style="display:inline-block;background:#0056D2;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Resume Learning →
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px;">
            She Leads Africa · <a href="https://connecther.sheleadsafrica.org/dashboard/notification-preferences">Manage notifications</a>
          </p>
        </div>
      `;
      await sendViaSendGrid([email], `${name}, your courses are waiting for you`, html);
    }
    results.push(`Inactivity reminders: sent to ${byUser.size} learners`);
  }

  // ── 3. Deadline alerts ───────────────────────────────────────────────────
  const deadlineHours = Number(settings?.assessment_deadline_alert_hours ?? 48);
  const deadlineWindow = new Date();
  deadlineWindow.setHours(deadlineWindow.getHours() + deadlineHours);

  // Enrollments enrolled > 80 days ago but not completed (estimated 90-day deadline)
  const enrolledBefore = new Date();
  enrolledBefore.setDate(enrolledBefore.getDate() - (90 - Math.ceil(deadlineHours / 24)));

  const { data: nearDeadline } = await supabase
    .from("enrollments")
    .select("user_id, profiles(email, name), courses(title)")
    .lte("enrolled_at", enrolledBefore.toISOString())
    .eq("status", "active")
    .lt("progress", 100);

  if (nearDeadline && nearDeadline.length > 0) {
    const byUser = new Map<string, { email: string; name: string; courses: string[] }>();
    for (const e of nearDeadline as any[]) {
      const email = e.profiles?.email;
      const name  = e.profiles?.name ?? "Learner";
      const title = e.courses?.title ?? "your course";
      if (!email) continue;
      const existing = byUser.get(email) ?? { email, name, courses: [] };
      existing.courses.push(title);
      byUser.set(email, existing);
    }

    for (const { email, name, courses } of byUser.values()) {
      const courseList = courses.map(c => `<li>${c}</li>`).join("");
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E53935;">⏰ Deadline approaching, ${name}!</h2>
          <p>Your enrollment deadline is coming up in the next ${deadlineHours} hours for:</p>
          <ul>${courseList}</ul>
          <a href="https://connecther.sheleadsafrica.org/dashboard/courses"
             style="display:inline-block;background:#E53935;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Complete Now →
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px;">
            She Leads Africa · <a href="https://connecther.sheleadsafrica.org/dashboard/notification-preferences">Manage notifications</a>
          </p>
        </div>
      `;
      await sendViaSendGrid([email], `⏰ Deadline reminder: ${courses[0]}`, html);
    }
    results.push(`Deadline alerts: sent to ${byUser.size} learners`);
  }

  return new Response(
    JSON.stringify({ success: true, processed: results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
