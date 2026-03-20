import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Constants
const PAYSTACK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];

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

  // Note: Deno doesn't natively expose direct sign-to-hex in subtlecrypto easily without polyfills,
  // so we generate the signature and compare hex.
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return new Response("Missing signature", { status: 401 });

  // 1. Extract raw text for absolute cryptographic integrity
  const payloadStr = await req.text();
  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

  if (!secretKey) {
    console.error("Missing PAYSTACK_SECRET_KEY env");
    return new Response("Server configuration error", { status: 500 });
  }

  // 2. Cryptographic HMAC Verification
  const isValid = await verifyPaystackSignature(payloadStr, signature, secretKey);
  if (!isValid) {
    console.error("Invalid Webhook Signature");
    return new Response("Unauthorized signature", { status: 401 });
  }

  // 3. PILLAR 1 Directive: Acknowledge IMMEDIATELY
  // Return 200 OK to Paystack BEFORE executing long-running business logic
  // to prevent timeout-triggered retries and duplicate credits.
  
  const processWebhook = async () => {
    try {
      const event = JSON.parse(payloadStr);
      if (event.event !== "charge.success") return;

      const { data } = event;
      const reference = data.reference;

      // 4. Database Idempotency
      const { data: existingEvent } = await supabase
        .from('audit_logs') // Use audit logs for referential integrity
        .select('id')
        .eq('target_id', reference)
        .eq('action_type', 'PAYMENT_SUCCESS')
        .single();

      if (existingEvent) {
        console.log(`Webhook ${reference} already processed.`);
        return;
      }

      const metadata = data.metadata || {};
      const { user_id, course_id, program_id } = metadata.custom_fields?.[0] || metadata;

      // Log the intent (Pillar 4 Audit)
      await supabase.from('audit_logs').insert({
        user_id,
        action_type: 'PAYMENT_RECEIVED',
        target_resource: 'payments',
        target_id: reference,
        new_data: event
      });

      // 5. Value Delivery (Enrollment)
      const decimalAmount = data.amount / 100;

      // Transactional Record & Provision
      await Promise.all([
        supabase.from('payments').insert({
          user_id, course_id, program_id, amount: decimalAmount,
          currency: data.currency, status: 'successful', reference,
          method: data.channel, receipt_id: data.receipt_number || data.id.toString(),
        }),
        supabase.from('enrollments').upsert({
          user_id, course_id, program_id, status: 'active', progress: 0
        }, { onConflict: 'user_id,course_id' })
      ]);

      // Update Audit log to Success
      await supabase.from('audit_logs').insert({
        user_id, action_type: 'PAYMENT_SUCCESS', target_resource: 'enrollments', target_id: reference
      });

      console.log(`Successfully processed enrollment for ${user_id}`);
    } catch (err: any) {
      console.error("Background processing failed:", err.message);
    }
  };

  // PILLAR 3: Offload heavy background tasks
  // Use EdgeRuntime.waitUntil if available, or just fire-and-forget in Deno
  // @ts-ignore: EdgeRuntime is available in Supabase environment
  if (typeof EdgeRuntime !== 'undefined') {
    // @ts-ignore
    EdgeRuntime.waitUntil(processWebhook());
  } else {
    processWebhook(); 
  }

  return new Response(JSON.stringify({ status: "accepted" }), { 
    status: 200, 
    headers: { "Content-Type": "application/json" } 
  });
});
