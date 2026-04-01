import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Asha, a helpful assistant for the She Leads Africa (SLA) Connecta learning platform.
Stay focused on: courses, programs, certificates, enrollment, dashboard features, and general learning guidance.
The platform is learning-first (not a job board). For account-specific or billing issues, direct users to email info@sheleadsafrica.org.
Keep answers concise, friendly, and practical. Use **bold** sparingly for UI labels (e.g. **Dashboard → My Courses**).
If you do not know something specific to their account, say so and suggest contacting info@sheleadsafrica.org.`;

const MAX_USER_MESSAGE_LEN = 6000;
const MAX_MESSAGES = 24;

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

  const baseUrl = (Deno.env.get("AIMIX_BASE_URL") ?? "").replace(/\/$/, "");
  const apiKey = Deno.env.get("AIMIX_API_KEY") ?? "";
  const defaultModel = Deno.env.get("AIMIX_MODEL") ?? "gpt-4o-mini";

  if (!baseUrl || !apiKey) {
    return new Response(JSON.stringify({ error: "AI not configured", code: "not_configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
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

  let body: { messages?: { role: string; content: string }[]; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const trimmed = raw.slice(-MAX_MESSAGES).map((m) => {
    const role = m.role === "assistant" ? "assistant" : "user";
    let content = typeof m.content === "string" ? m.content : "";
    if (content.length > MAX_USER_MESSAGE_LEN) {
      content = content.slice(0, MAX_USER_MESSAGE_LEN);
    }
    return { role, content };
  }).filter((m) => m.content.trim().length > 0);

  if (trimmed.length === 0) {
    return new Response(JSON.stringify({ error: "No messages" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const model = typeof body.model === "string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(body.model)
    ? body.model
    : defaultModel;

  const url = `${baseUrl}/chat/completions`;
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
        max_tokens: 1024,
        temperature: 0.45,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upstream request failed";
    return new Response(JSON.stringify({ error: msg, code: "upstream_network" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawText = await upstream.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid response from AI provider", code: "upstream_parse" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!upstream.ok) {
    const errMsg =
      (json.error as { message?: string } | undefined)?.message ??
      (typeof json.error === "string" ? json.error : null) ??
      `Upstream HTTP ${upstream.status}`;
    return new Response(JSON.stringify({ error: errMsg, code: "upstream_error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const choices = json.choices as { message?: { content?: string } }[] | undefined;
  const reply = choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return new Response(JSON.stringify({ error: "Empty AI response", code: "empty" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ reply, model }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
