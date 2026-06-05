import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You extract structured resume data from raw text.
Return ONLY valid JSON with this shape:
{
  "personal": { "fullName": "", "headline": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "", "summary": "" },
  "skills": ["..."],
  "experience": [{ "role": "", "company": "", "start": "", "end": "", "current": false, "description": "" }],
  "education": [{ "degree": "", "school": "", "year": "" }],
  "certifications": ["..."]
}
Use empty strings/arrays when unknown. Do not wrap in markdown.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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

  let body: { fileName?: string; mimeType?: string; base64?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let resumeText = typeof body.text === "string" ? body.text.trim() : "";
  if (!resumeText && body.base64) {
    try {
      const binary = atob(body.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      resumeText = new TextDecoder().decode(bytes);
    } catch {
      return new Response(JSON.stringify({ error: "Could not decode resume file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (!resumeText || resumeText.length < 20) {
    return new Response(JSON.stringify({ error: "Resume text too short to parse" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clipped = resumeText.slice(0, 12000);
  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: defaultModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Parse this resume:\n\n${clipped}` },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  const rawText = await upstream.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(rawText);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid AI response" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok) {
    const errMsg = (json.error as { message?: string } | undefined)?.message ?? "AI parse failed";
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const choices = json.choices as { message?: { content?: string } }[] | undefined;
  const content = choices?.[0]?.message?.content?.trim() ?? "";
  let parsed: Record<string, unknown>;
  try {
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return new Response(JSON.stringify({ error: "AI returned non-JSON resume data" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ draft: parsed, fileName: body.fileName ?? null }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
