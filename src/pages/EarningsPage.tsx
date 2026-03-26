import { Download, DollarSign, ArrowUpRight, CheckCircle2, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useSystemStats } from "@/hooks/useQueries";

export default function EarningsPage() {
  const { data: stats, isLoading } = useSystemStats();
  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Earnings & Payouts</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing earnings…" : "Your compensation tracking across settlement cycles."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
             <Download className="w-3.5 h-3.5 mr-2" /> Download Statement
          </Button>
        </div>
      </div>

      {/* Grid Layout (Async Coursera Style: 1/3 to 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ———— LEFT COLUMN (Global Metrics Widget) ———— */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Compensation KPIs</h2>
            
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total Paid
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
                  <Clock className="w-3.5 h-3.5" /> Pending
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-light text-foreground">₦{isLoading ? "—" : "0"}</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">Due 25th</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Monthly Velocity
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-[#0056D2]">₦{isLoading ? "—" : totalRevenue.toLocaleString()}</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-6">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1.5">Payment Cycles</h3>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                  Students pay CONNECT HER directly. You are compensated via periodic payouts clearing on the 25th.
                </p>
              </div>
            </div>
          </div>

        </div>


        {/* ———— RIGHT COLUMN (Top Payouts Table) ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            <div className="p-6 border-b border-border/40">
               <h2 className="font-display font-semibold text-lg text-foreground">Periodic Ledger</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/20 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Cycle</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Platform Volume</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Cleared Payout</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center bg-card/20 text-muted-foreground">
                        Loading payouts…
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center bg-card/20">
                        <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-foreground font-medium mb-1">No compensation cycles</p>
                        <p className="text-sm text-muted-foreground">Payout histories will render here following your first settlement.</p>
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

