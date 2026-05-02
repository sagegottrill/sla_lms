import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * send-email — SendGrid transactional email Edge Function
 *
 * Accepts POST with JSON body:
 * {
 *   to: string | string[]          — recipient(s)
 *   subject: string                — email subject
 *   html: string                   — HTML body
 *   text?: string                  — plain-text fallback
 *   templateId?: string            — optional SendGrid dynamic template ID
 *   templateData?: Record<string, unknown>  — template variables
 *   from?: string                  — override sender (defaults to SENDGRID_FROM_EMAIL)
 *   replyTo?: string               — reply-to address
 * }
 *
 * Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   SENDGRID_API_KEY   — your SendGrid API key (starts with SG.)
 *   SENDGRID_FROM_EMAIL — verified sender email (e.g. noreply@sheleadsafrica.org)
 *   SENDGRID_FROM_NAME  — sender display name (e.g. She Leads Africa)
 */

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SENDGRID_API_KEY   = Deno.env.get("SENDGRID_API_KEY") ?? "";
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "";
const SENDGRID_FROM_NAME  = Deno.env.get("SENDGRID_FROM_NAME") ?? "She Leads Africa";

interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate secrets
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    return new Response(
      JSON.stringify({ error: "SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Authenticate caller — must be a valid Supabase session (staff only)
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const authHeader = req.headers.get("Authorization");

  // Allow service-role calls (from process-campaigns) without user JWT
  const isServiceCall = authHeader === `Bearer ${serviceKey}`;

  if (!isServiceCall) {
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only staff can send emails
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!["admin", "program_manager", "instructor"].includes(profile?.role ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden — staff only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Parse body
  let payload: SendEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { to, subject, html, text, templateId, templateData, from, replyTo } = payload;

  if (!to || (!subject && !templateId)) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: to, and either subject or templateId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Build SendGrid personalizations
  const recipients = Array.isArray(to) ? to : [to];
  const personalizations = recipients.map(email => ({
    to: [{ email }],
    ...(templateData ? { dynamic_template_data: templateData } : {}),
  }));

  // Build SendGrid request body
  const sgBody: Record<string, unknown> = {
    personalizations,
    from: {
      email: from ?? SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME,
    },
    ...(replyTo ? { reply_to: { email: replyTo } } : {}),
  };

  if (templateId) {
    sgBody.template_id = templateId;
  } else {
    sgBody.subject = subject;
    sgBody.content = [
      ...(text ? [{ type: "text/plain", value: text }] : []),
      ...(html ? [{ type: "text/html",  value: html  }] : []),
    ];
    if (!sgBody.content || (sgBody.content as any[]).length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide html or text content when not using a templateId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Send via SendGrid v3 API
  let sgResponse: Response;
  try {
    sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sgBody),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "SendGrid request failed";
    return new Response(JSON.stringify({ error: msg, code: "network_error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // SendGrid returns 202 Accepted on success (no body)
  if (sgResponse.status === 202) {
    return new Response(
      JSON.stringify({ success: true, recipients: recipients.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse error response
  let errorBody: unknown;
  try {
    errorBody = await sgResponse.json();
  } catch {
    errorBody = { message: `SendGrid HTTP ${sgResponse.status}` };
  }

  console.error("SendGrid error:", JSON.stringify(errorBody));
  return new Response(
    JSON.stringify({ error: "SendGrid delivery failed", details: errorBody }),
    { status: sgResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
