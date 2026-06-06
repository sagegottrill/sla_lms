import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function getTwilioConfigFromDb(): Promise<{
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
} | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/platform_config?id=eq.twilio&select=data`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ data?: any }>;
    const data = rows?.[0]?.data ?? null;
    if (!data || typeof data !== "object") return null;
    return {
      accountSid: typeof data.accountSid === "string" ? data.accountSid : undefined,
      authToken: typeof data.authToken === "string" ? data.authToken : undefined,
      phoneNumber: typeof data.phoneNumber === "string" ? data.phoneNumber : undefined,
    };
  } catch {
    return null;
  }
}

interface TwilioNotifyPayload {
  to: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Resolve Twilio credentials:
    // - Prefer environment variables (Supabase Secrets)
    // - Fallback to DB-managed config (admin dashboard) via service role
    const dbCfg = (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER)
      ? await getTwilioConfigFromDb()
      : null;

    const accountSid = TWILIO_ACCOUNT_SID || dbCfg?.accountSid;
    const authToken = TWILIO_AUTH_TOKEN || dbCfg?.authToken;
    const phoneNumber = TWILIO_PHONE_NUMBER || dbCfg?.phoneNumber;

    // Validate configuration
    if (!accountSid || !authToken || !phoneNumber) {
      return new Response(
        JSON.stringify({
          error:
            "Twilio credentials not configured. Set TWILIO_* secrets in Supabase, or configure Twilio in the app (Admin → Settings → Platform).",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Parse request body
    const payload: TwilioNotifyPayload = await req.json();
    const { to, message } = payload;

    // Validate payload
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: 'to' and 'message'" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Construct Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", phoneNumber);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", twilioData);
      return new Response(
        JSON.stringify({
          error: "Failed to send message via Twilio",
          details: twilioData,
        }),
        {
          status: twilioResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        messageSid: twilioData.sid,
        status: twilioData.status,
        channel: "sms",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
