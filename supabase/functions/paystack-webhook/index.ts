import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Initialize Supabase with service role for admin bypass
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function verifyPaystackSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["verify"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hexSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison mitigates timing attacks
  if (hexSignature.length !== signature.length) return false;
  let matches = 0;
  for (let i = 0; i < hexSignature.length; i++) {
    matches |= hexSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return matches === 0;
}

/** Resolve user/course/program IDs from Paystack metadata (flat or custom_fields). */
function resolvePaymentMeta(metadata: Record<string, unknown> | null | undefined): {
  user_id: string | null;
  course_id: number | null;
  program_id: number | null;
} {
  const meta = metadata || {};
  let user_id: string | null = null;
  let course_id: number | null = null;
  let program_id: number | null = null;

  // Prefer flat top-level keys (checkout sends these)
  if (typeof meta.user_id === "string" && meta.user_id) user_id = meta.user_id;
  if (meta.course_id != null && meta.course_id !== "") {
    const n = Number(meta.course_id);
    if (!Number.isNaN(n)) course_id = n;
  }
  if (meta.program_id != null && meta.program_id !== "") {
    const n = Number(meta.program_id);
    if (!Number.isNaN(n)) program_id = n;
  }

  // Legacy / display custom_fields fallback
  const fields = Array.isArray(meta.custom_fields) ? meta.custom_fields : [];
  for (const field of fields) {
    if (!field || typeof field !== "object") continue;
    const f = field as Record<string, unknown>;
    const key = String(f.variable_name || f.display_name || "").toLowerCase();
    const value = f.value ?? f.user_id ?? f.course_id ?? f.program_id;
    if (!user_id && (key.includes("user") || f.user_id != null) && value != null) {
      user_id = String(f.user_id ?? value);
    }
    if (course_id == null && (key.includes("course") || f.course_id != null) && value != null) {
      const n = Number(f.course_id ?? value);
      if (!Number.isNaN(n)) course_id = n;
    }
    if (program_id == null && (key.includes("program") || f.program_id != null) && value != null) {
      const n = Number(f.program_id ?? value);
      if (!Number.isNaN(n)) program_id = n;
    }
  }

  // Oldest shape: custom_fields[0] was a single object with user_id/course_id
  if ((!user_id || course_id == null) && fields[0] && typeof fields[0] === "object") {
    const first = fields[0] as Record<string, unknown>;
    if (!user_id && first.user_id != null) user_id = String(first.user_id);
    if (course_id == null && first.course_id != null) {
      const n = Number(first.course_id);
      if (!Number.isNaN(n)) course_id = n;
    }
    if (program_id == null && first.program_id != null) {
      const n = Number(first.program_id);
      if (!Number.isNaN(n)) program_id = n;
    }
  }

  return { user_id, course_id, program_id };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return new Response("Missing signature", { status: 401 });

  const payloadStr = await req.text();
  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

  if (!secretKey) {
    console.error("Missing PAYSTACK_SECRET_KEY env");
    return new Response("Server configuration error", { status: 500 });
  }

  const isValid = await verifyPaystackSignature(payloadStr, signature, secretKey);
  if (!isValid) {
    console.error("Invalid Webhook Signature");
    return new Response("Unauthorized signature", { status: 401 });
  }

  const processWebhook = async () => {
    try {
      const event = JSON.parse(payloadStr);
      if (event.event !== "charge.success") return;

      const { data } = event;
      const reference = data.reference;
      if (!reference) {
        console.error("Webhook missing payment reference");
        return;
      }

      const { data: existingEvent } = await supabase
        .from("audit_logs")
        .select("id")
        .eq("target_id", reference)
        .eq("action_type", "PAYMENT_SUCCESS")
        .maybeSingle();

      if (existingEvent) {
        console.log(`Webhook ${reference} already processed.`);
        return;
      }

      const { user_id, course_id, program_id } = resolvePaymentMeta(data.metadata);
      if (!user_id || (course_id == null && program_id == null)) {
        console.error("Webhook missing user_id or course/program id in metadata", data.metadata);
        return;
      }

      await supabase.from("audit_logs").insert({
        user_id,
        action_type: "PAYMENT_RECEIVED",
        target_resource: "payments",
        target_id: reference,
        new_data: event,
      });

      const decimalAmount = (data.amount || 0) / 100;
      const paymentRow = {
        user_id,
        course_id,
        program_id,
        amount: decimalAmount,
        currency: data.currency || "NGN",
        status: "successful",
        reference,
        method: data.channel || "card",
        receipt_id: data.receipt_number || String(data.id ?? reference),
      };

      // Idempotent upsert by reference
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, status")
        .eq("reference", reference)
        .maybeSingle();

      if (existingPayment) {
        if (existingPayment.status !== "successful") {
          await supabase
            .from("payments")
            .update({
              status: "successful",
              amount: paymentRow.amount,
              method: paymentRow.method,
            })
            .eq("id", existingPayment.id);
        }
      } else {
        const { error: payErr } = await supabase.from("payments").insert(paymentRow);
        if (payErr && payErr.code !== "23505") {
          console.error("Payment insert failed:", payErr.message);
        }
      }

      if (course_id != null) {
        await supabase.from("enrollments").upsert(
          {
            user_id,
            course_id,
            program_id,
            status: "active",
            progress: 0,
          },
          { onConflict: "user_id,course_id" },
        );
      } else if (program_id != null) {
        await supabase.from("enrollments").upsert(
          {
            user_id,
            course_id: null,
            program_id,
            status: "active",
            progress: 0,
          },
          { onConflict: "user_id,program_id" },
        );
      }

      await supabase.from("audit_logs").insert({
        user_id,
        action_type: "PAYMENT_SUCCESS",
        target_resource: "enrollments",
        target_id: reference,
      });

      console.log(`Successfully processed enrollment for ${user_id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Background processing failed:", message);
    }
  };

  // @ts-expect-error EdgeRuntime is available in Supabase Edge Functions
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-expect-error EdgeRuntime.waitUntil
    EdgeRuntime.waitUntil(processWebhook());
  } else {
    processWebhook();
  }

  return new Response(JSON.stringify({ status: "accepted" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
