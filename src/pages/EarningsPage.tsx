import { useMemo } from "react";
import { Download, DollarSign, ArrowUpRight, CheckCircle2, Info, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function EarningsPage() {
  const { appUser } = useAuth();

  const { data: paymentsResult, isLoading } = useQuery({
    queryKey: ["instructor-payments", appUser?.id ?? ""],
    queryFn: () => api.getInstructorPayments(appUser!.id),
    enabled: !!appUser?.id,
  });

  const payments = useMemo(() => (paymentsResult?.data ?? []) as any[], [paymentsResult]);

  const totalRevenue = useMemo(
    () => payments.filter(p => p.status === "successful").reduce((acc, p) => acc + Number(p.amount ?? 0), 0),
    [payments]
  );

  const pendingRevenue = useMemo(
    () => payments.filter(p => p.status === "pending").reduce((acc, p) => acc + Number(p.amount ?? 0), 0),
    [payments]
  );

  const settledCount = payments.filter(p => p.status === "successful").length;

  const handleExport = () => {
    if (payments.length === 0) { toast.info("No payout data to export."); return; }
    const headers = ["Date", "Student", "Course", "Amount", "Currency", "Status", "Reference"];
    const rows = payments.map(p => [
      p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
      p.profiles?.name ?? p.profiles?.email ?? "—",
      p.courses?.title ?? "—",
      Number(p.amount ?? 0).toLocaleString(),
      p.currency ?? "NGN",
      p.status ?? "—",
      p.reference ?? "—",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statement exported.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Earnings & Payouts</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing earnings…" : `${settledCount} settled transaction${settledCount !== 1 ? "s" : ""} across your courses.`}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
          <Download className="w-3.5 h-3.5 mr-2" /> Download Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column — KPIs */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Compensation KPIs</h2>
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total Earned
                </p>
                {isLoading ? (
                  <div className="h-9 w-32 bg-muted/40 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-light text-foreground">₦{totalRevenue.toLocaleString()}</p>
                )}
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </p>
                {isLoading ? (
                  <div className="h-9 w-24 bg-muted/40 rounded animate-pulse" />
                ) : (
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-light text-foreground">₦{pendingRevenue.toLocaleString()}</p>
                    <span className="text-[10px] font-bold text-muted-foreground mb-1">Due 25th</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Settled Transactions
                </p>
                {isLoading ? (
                  <div className="h-9 w-16 bg-muted/40 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold text-primary">{settledCount.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-6">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1.5">Payment Cycles</h3>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                  Students pay CONNECT HER directly. You are compensated via periodic payouts clearing on the 25th of each month.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Ledger */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            <div className="p-6 border-b border-border/40">
              <h2 className="font-display font-semibold text-lg text-foreground">Transaction Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/20 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Course</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary/40" />
                        Loading transactions…
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center bg-card/20">
                        <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-foreground font-medium mb-1">No transactions yet</p>
                        <p className="text-sm text-muted-foreground">Payout history will appear here once students enroll in your courses.</p>
                      </td>
                    </tr>
                  ) : (
                    payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {p.profiles?.name ?? p.profiles?.email ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {p.courses?.title ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                          ₦{Number(p.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                            p.status === "successful" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                            p.status === "pending"    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {p.status === "successful" ? "Paid" : p.status === "pending" ? "Pending" : "Failed"}
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
