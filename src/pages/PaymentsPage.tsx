import { useMemo, useState } from "react";
import { CreditCard, ArrowUpRight, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemStats, usePaystackFinance } from "@/hooks/useQueries";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/lib/react-query";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PaymentsPage() {
  const [filter, setFilter] = useState("All");
  const { data: stats, isLoading } = useSystemStats();
  const {
    data: paystackFinance,
    isLoading: loadingPaystack,
    isError: paystackError,
    error: paystackErr,
    refetch,
  } = usePaystackFinance();

   const { data: payments = [], isLoading: loadingPayments } = useQuery({
     queryKey: queryKeys.payments.ledger(),
     queryFn: api.getPayments,
     select: (response) => response.data || [],
   });

  const totalRevenue = paystackFinance?.totalRevenue ?? stats?.totalRevenue ?? 0;
  const settledCount = paystackFinance?.successfulCount ??
    (payments as any[]).filter((p) => String(p.status).toLowerCase() === "successful").length;

  const normalized = useMemo(() => {
    const mapStatus = (s: string) => {
      if (s === "successful") return "Paid";
      if (s === "pending") return "Pending";
      if (s === "failed") return "Failed";
      return s || "—";
    };
    if (paystackFinance?.transactions?.length) {
      return paystackFinance.transactions.map((p) => ({
        id: p.reference,
        created_at: p.paid_at,
        amount: Number(p.amount ?? 0),
        currency: String(p.currency ?? "NGN"),
        status: mapStatus(String(p.status ?? "")),
        customer: p.customer_email || "—",
        item: p.method ? `Paystack · ${p.method}` : "Paystack",
      }));
    }
    return (payments as any[]).map((p) => {
      const courseTitle = p?.courses?.title;
      const programTitle = p?.programs?.title;
      const item = courseTitle || programTitle || (p.course_id ? `Course #${p.course_id}` : p.program_id ? `Program #${p.program_id}` : "—");
      const customer = p?.profiles?.name || p?.profiles?.email || "—";
      return {
        id: p.id,
        created_at: p.created_at,
        amount: Number(p.amount ?? 0),
        currency: String(p.currency ?? "NGN"),
        status: mapStatus(String(p.status ?? "")),
        customer,
        item,
      };
    });
  }, [payments, paystackFinance]);

  const filteredRows = useMemo(() => {
    if (filter === "All") return normalized;
    if (filter === "Paid") return normalized.filter((r) => r.status === "Paid");
    if (filter === "Pending") return normalized.filter((r) => r.status === "Pending");
    if (filter === "Failed") return normalized.filter((r) => r.status === "Failed");
    return normalized;
  }, [normalized, filter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2 flex items-center gap-2">
            Payments & Revenue
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Monitor all platform transactions, revenue trends, and payment status. Export financial data for accounting and reporting.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
          <p className="text-muted-foreground text-sm">
            {loadingPaystack
              ? "Syncing revenue from Paystack…"
              : paystackError
                ? (paystackErr instanceof Error ? paystackErr.message : "Could not load Paystack finance.")
                : "Live totals from Paystack."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted"
            onClick={async () => {
              const result = await refetch();
              if (result.error) {
                toast.error(result.error instanceof Error ? result.error.message : "Could not sync Paystack.");
                return;
              }
              toast.success("Paystack finance synced.");
            }}
          >
             Sync Paystack
          </Button>
        </div>
      </div>

      {/* Grid Layout (Async Coursera Style: 1/3 to 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ———— LEFT COLUMN (Global Metrics Widget) ———— */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Financial KPIs</h2>
            
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total Revenue
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-light text-foreground">
                    ₦{isLoading || loadingPaystack ? "—" : totalRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Settled Txs
                </p>
                <div className="flex items-end gap-2">
                  {isLoading || loadingPayments || loadingPaystack ? (
                    <p className="text-3xl font-light text-foreground">—</p>
                  ) : (
                    <p className="text-3xl font-light text-foreground">
                      {settledCount.toLocaleString()}
                    </p>
                  )}
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">paid</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Net MRR
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-primary">₦{isLoading || loadingPaystack ? "—" : totalRevenue.toLocaleString()}</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ———— RIGHT COLUMN (Top Transactions Table) ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
            {["All", "Paid", "Pending", "Failed"].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  filter === f 
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                    : "text-foreground bg-transparent hover:bg-muted/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/20 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Item</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Currency</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(isLoading || loadingPayments || loadingPaystack) ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center bg-card/20 text-muted-foreground">
                        Loading transactions…
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center bg-card/20">
                        <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-foreground font-medium mb-1">No Paystack transactions yet</p>
                        <p className="text-sm text-muted-foreground">Successful charges from Paystack will appear here after sync.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{r.customer}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{r.item}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          {Number.isFinite(r.amount) ? r.amount.toLocaleString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{r.currency}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                            r.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                            r.status === "Pending" ? "bg-amber-50 text-amber-700" :
                            r.status === "Failed" ? "bg-red-50 text-red-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
