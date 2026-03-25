import { useState } from "react";
import { Download, CreditCard, Filter, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemStats } from "@/hooks/useQueries";

export default function PaymentsPage() {
  const [filter, setFilter] = useState("All");
  const { data: stats, isLoading } = useSystemStats();
  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Revenue & Transactions</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing revenue…" : "Revenue overview from your Supabase payments data."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
             <Download className="w-3.5 h-3.5 mr-2" /> Export Ledgers
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
                    ₦{isLoading ? "—" : totalRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Settled Txs
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-light text-foreground">0</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Net MRR
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-[#0056D2]">₦{isLoading ? "—" : totalRevenue.toLocaleString()}</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ———— RIGHT COLUMN (Top Transactions Table) ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
            {["All", "Paid", "Pending", "Refunded"].map(f => (
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center bg-card/20 text-muted-foreground">
                        Loading transactions…
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center bg-card/20">
                        <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-foreground font-medium mb-1">No transactions generated</p>
                        <p className="text-sm text-muted-foreground">Ledgers will populate when Stripe/Paystack Webhooks fire.</p>
                      </td>
                    </tr>
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
