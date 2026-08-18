import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYSTACK_HISTORY_FROM = "2010-01-01";
const PAYSTACK_PER_PAGE = 100;
const LIST_PAGE_CAP = 8;

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

type PaystackListResponse = {
  data?: PaystackTxn[];
  meta?: { total?: number; pageCount?: number };
};

type MappedTxn = {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  customer_email: string;
  paid_at: string | null;
  course_id: number | null;
  program_id: number | null;
  user_id: string | null;
  synced: boolean;
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

function mapStatus(paystackStatus: string): string {
  const s = paystackStatus.toLowerCase();
  if (s === "success") return "successful";
  if (s === "failed" || s === "reversed") return "failed";
  return "pending";
}

function mapTxn(txn: PaystackTxn): MappedTxn | null {
  const reference = String(txn.reference || "").trim();
  if (!reference) return null;
  const { user_id, course_id, program_id } = resolveMeta(
    txn.metadata && typeof txn.metadata === "object" ? txn.metadata : null,
  );
  return {
    reference,
    amount: Number(txn.amount || 0) / 100,
    currency: txn.currency || "NGN",
    status: mapStatus(String(txn.status || "")),
    method: txn.channel || "card",
    customer_email: String(txn.customer?.email || "").trim().toLowerCase(),
    paid_at: txn.paid_at || txn.created_at || null,
    course_id,
    program_id,
    user_id,
    synced: false,
  };
}

function isLmsTxn(txn: PaystackTxn): boolean {
  const reference = String(txn.reference || "");
  if (reference.startsWith("ref_")) return true;
  const meta = resolveMeta(
    txn.metadata && typeof txn.metadata === "object" ? txn.metadata : null,
  );
  return meta.course_id != null || meta.program_id != null;
}

async function fetchPaystackPage(
  secret: string,
  page: number,
  extra: Record<string, string> = {},
): Promise<PaystackListResponse> {
  const params = new URLSearchParams({
    perPage: String(PAYSTACK_PER_PAGE),
    page: String(page),
    from: PAYSTACK_HISTORY_FROM,
    ...extra,
  });
  const res = await fetch(`https://api.paystack.co/transaction?${params}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack list failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return await res.json() as PaystackListResponse;
}

async function fetchLmsTransactions(
  secret: string,
  extra: Record<string, string> = {},
): Promise<PaystackTxn[]> {
  const first = await fetchPaystackPage(secret, 1, extra);
  const txns: PaystackTxn[] = Array.isArray(first.data) ? [...first.data] : [];
  const pageCount = Math.min(LIST_PAGE_CAP, Math.max(1, Number(first.meta?.pageCount) || 1));
  if (pageCount > 1 && txns.length >= PAYSTACK_PER_PAGE) {
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) => fetchPaystackPage(secret, i + 2, extra)),
    );
    for (const body of rest) {
      if (Array.isArray(body.data)) txns.push(...body.data);
    }
  }
  return txns.filter(isLmsTxn);
}

async function syncLedger(adminClient: SupabaseClient, transactions: MappedTxn[]) {
  for (const txn of transactions) {
    const userId = txn.user_id;
    if (!userId || (txn.course_id == null && txn.program_id == null)) continue;
    const { data: existing } = await adminClient
      .from("payments")
      .select("id, status")
      .eq("reference", txn.reference)
      .maybeSingle();
    if (existing) {
      if (existing.status !== "successful" && txn.status === "successful") {
        await adminClient.from("payments").update({
          status: "successful",
          amount: txn.amount,
          method: txn.method,
        }).eq("id", existing.id);
      }
      continue;
    }
    await adminClient.from("payments").insert({
      user_id: userId,
      course_id: txn.course_id,
      program_id: txn.program_id,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      reference: txn.reference,
      method: txn.method,
      receipt_id: txn.reference,
    });
  }
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

  let includeTransactions = false;
  try {
    const body = await req.json() as { includeTransactions?: unknown };
    includeTransactions = body?.includeTransactions === true;
  } catch {
    includeTransactions = false;
  }

  try {
    const isTest = secretKey.startsWith("sk_test_");
    const raw = await fetchLmsTransactions(
      secretKey,
      includeTransactions ? {} : { status: "success" },
    );
    const transactions = raw
      .map(mapTxn)
      .filter((row): row is MappedTxn => row != null);
    const successful = transactions.filter((row) => row.status === "successful");
    const totalRevenue = successful.reduce((sum, row) => sum + row.amount, 0);

    if (includeTransactions) {
      const syncTask = syncLedger(adminClient, transactions).catch((err) => {
        console.error("Ledger sync failed:", err instanceof Error ? err.message : err);
      });
      // @ts-expect-error EdgeRuntime is available in Supabase Edge Functions
      if (typeof EdgeRuntime !== "undefined") {
        // @ts-expect-error EdgeRuntime.waitUntil
        EdgeRuntime.waitUntil(syncTask);
      }
    }

    return json({
      totalRevenue,
      successfulCount: successful.length,
      listedCount: transactions.length,
      paystackTotal: transactions.length,
      isTest,
      synced: 0,
      source: "paystack",
      transactions: includeTransactions ? transactions : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load payments";
    console.error(message);
    return json({ error: message }, 500);
  }
});
