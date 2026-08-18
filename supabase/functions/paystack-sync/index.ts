import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PaystackTxn = {
  id?: number;
  amount?: number;
  currency?: string;
  status?: string;
  reference?: string;
  channel?: string;
  paid_at?: string | null;
  created_at?: string | null;
  customer?: { email?: string };
  metadata?: Record<string, unknown> | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveMeta(metadata: Record<string, unknown> | null | undefined) {
  const meta = metadata || {};
  let user_id: string | null = typeof meta.user_id === "string" ? meta.user_id : null;
  let course_id: number | null = null;
  let program_id: number | null = null;
  if (meta.course_id != null && meta.course_id !== "") {
    const n = Number(meta.course_id);
    if (!Number.isNaN(n)) course_id = n;
  }
  if (meta.program_id != null && meta.program_id !== "") {
    const n = Number(meta.program_id);
    if (!Number.isNaN(n)) program_id = n;
  }
  const fields = Array.isArray(meta.custom_fields) ? meta.custom_fields : [];
  for (const field of fields) {
    if (!field || typeof field !== "object") continue;
    const f = field as Record<string, unknown>;
    const key = String(f.variable_name || "").toLowerCase();
    const value = f.value;
    if (!user_id && key.includes("user") && value != null) user_id = String(value);
    if (course_id == null && key.includes("course") && value != null) {
      const n = Number(value);
      if (!Number.isNaN(n)) course_id = n;
    }
    if (program_id == null && key.includes("program") && value != null) {
      const n = Number(value);
      if (!Number.isNaN(n)) program_id = n;
    }
  }
  return { user_id, course_id, program_id };
}

async function fetchPaystackPage(secret: string, page: number): Promise<PaystackTxn[]> {
  const url = `https://api.paystack.co/transaction?perPage=100&page=${page}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack list failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const body = await res.json() as { status?: boolean; data?: PaystackTxn[] };
  return Array.isArray(body.data) ? body.data : [];
}

async function fetchPaystackTotals(secret: string): Promise<{ volumeNgn: number; totalTransactions: number } | null> {
  const res = await fetch("https://api.paystack.co/transaction/totals", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) return null;
  const body = await res.json() as {
    data?: {
      total_transactions?: number;
      total_volume?: number;
      total_volume_by_currency?: Array<{ currency?: string; amount?: number }>;
    };
  };
  const ngn = body.data?.total_volume_by_currency?.find((row) => row.currency === "NGN");
  const kobo = ngn?.amount ?? body.data?.total_volume ?? 0;
  return {
    volumeNgn: Number(kobo) / 100,
    totalTransactions: Number(body.data?.total_transactions) || 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Server misconfigured" }, 500);
  if (!secretKey) return json({ error: "PAYSTACK_SECRET_KEY is not set on Edge Functions." }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const role = String(profile?.role || "");
  if (role !== "admin" && role !== "program_manager") {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const [totals, firstPage] = await Promise.all([
      fetchPaystackTotals(secretKey),
      fetchPaystackPage(secretKey, 1),
    ]);

    const all: PaystackTxn[] = [...firstPage];
    if (firstPage.length === 100) {
      for (let page = 2; page <= 10; page++) {
        const batch = await fetchPaystackPage(secretKey, page);
        all.push(...batch);
        if (batch.length < 100) break;
      }
    }

    const transactions: Array<{
      reference: string;
      amount: number;
      currency: string;
      status: string;
      method: string;
      customer_email: string;
      paid_at: string | null;
      course_id: number | null;
      program_id: number | null;
      synced: boolean;
    }> = [];

    let synced = 0;
    let totalRevenue = 0;
    let successfulCount = 0;

    for (const txn of all) {
      const reference = String(txn.reference || "").trim();
      if (!reference) continue;
      const amountNgn = Number(txn.amount || 0) / 100;
      const paystackStatus = String(txn.status || "").toLowerCase();
      const isSuccess = paystackStatus === "success";
      const mappedStatus = isSuccess ? "successful" : paystackStatus === "failed" ? "failed" : "pending";
      const email = String(txn.customer?.email || "").trim().toLowerCase();
      const { user_id: metaUser, course_id, program_id } = resolveMeta(
        txn.metadata && typeof txn.metadata === "object" ? txn.metadata : null,
      );

      if (isSuccess) {
        totalRevenue += amountNgn;
        successfulCount += 1;
      }

      let userId = metaUser;
      if (!userId && email) {
        const { data: byEmail } = await adminClient
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .limit(1)
          .maybeSingle();
        if (byEmail?.id) userId = byEmail.id;
      }

      let didSync = false;
      if (userId && (course_id != null || program_id != null)) {
        const row = {
          user_id: userId,
          course_id,
          program_id,
          amount: amountNgn,
          currency: txn.currency || "NGN",
          status: mappedStatus,
          reference,
          method: txn.channel || "paystack",
          receipt_id: String(txn.id ?? reference),
        };
        const { data: existing } = await adminClient
          .from("payments")
          .select("id, status")
          .eq("reference", reference)
          .maybeSingle();
        if (existing) {
          if (existing.status !== "successful" && mappedStatus === "successful") {
            await adminClient.from("payments").update({
              status: "successful",
              amount: amountNgn,
              method: row.method,
            }).eq("id", existing.id);
          }
          didSync = true;
        } else {
          const { error: insErr } = await adminClient.from("payments").insert(row);
          didSync = !insErr || insErr.code === "23505";
        }
        if (didSync) synced += 1;
      }

      transactions.push({
        reference,
        amount: amountNgn,
        currency: txn.currency || "NGN",
        status: mappedStatus,
        method: txn.channel || "paystack",
        customer_email: email,
        paid_at: txn.paid_at || txn.created_at || null,
        course_id,
        program_id,
        synced: didSync,
      });
    }

    return json({
      totalRevenue: Math.max(totals?.volumeNgn ?? 0, totalRevenue),
      successfulCount,
      synced,
      source: "paystack",
      transactions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Paystack sync failed";
    console.error(message);
    return json({ error: message }, 500);
  }
});
