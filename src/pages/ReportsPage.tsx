import { useMemo } from "react";
import { Download, FileText, CheckCircle2, TrendingUp, Users, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemStats, useProgramParticipants, usePrograms } from "@/hooks/useQueries";
import { toast } from "sonner";
import type { ProgramRow, Participant, Program } from "@/types";

export default function ReportsPage() {
  const { data: stats, isLoading: loadingStats } = useSystemStats();
  const { data: participants = [], isLoading: loadingParticipants } = useProgramParticipants();
  const { data: programs = [], isLoading: loadingPrograms } = usePrograms({ activeCatalog: false });

  const isLoading = loadingStats || loadingParticipants || loadingPrograms;

  // Build per-program breakdown from real participant data
  const programRows = useMemo((): ProgramRow[] => {
    if (!programs.length || !participants.length) return [];

    return programs.map((prog: Program): ProgramRow => {
      const cohort = (participants as Participant[]).filter(
        (p: Participant) => p.program === prog.title || p.program_id === prog.id
      );
      const total      = cohort.length;
      const finished   = cohort.filter((p: Participant) => Number(p.progress ?? 0) >= 100).length;
      const atRisk     = cohort.filter((p: Participant) => {
        const pct = Number(p.progress ?? 0);
        return pct > 0 && pct < 30;
      }).length;
      const notStarted = cohort.filter((p: Participant) => Number(p.progress ?? 0) === 0).length;
      const avgProgress = total > 0
        ? Math.round(cohort.reduce((acc: number, p: Participant) => acc + Number(p.progress ?? 0), 0) / total)
        : 0;

      return { id: prog.id, name: prog.title, total, finished, atRisk, notStarted, avgProgress };
    }).filter((r: ProgramRow) => r.total > 0);
  }, [programs, participants]);

  const totalUsers        = stats?.totalUsers ?? 0;
  const totalCertificates = stats?.totalCertificates ?? 0;
  const completionRate    = stats?.completionRate ?? 0;
  const activeHours       = stats?.totalHours ?? 0;
  const atRiskTotal       = (participants as Participant[]).filter((p: Participant) => {
    const pct = Number(p.progress ?? 0);
    return pct > 0 && pct < 30;
  }).length;

const totalAvgProgress = programRows.length > 0
    ? Math.round(programRows.reduce((a: number, r: ProgramRow) => a + r.avgProgress, 0) / programRows.length)
    : 0;

  const exportCSV = () => {
    if (programRows.length === 0) { toast.info("No data to export."); return; }
    const headers = ["Program", "Learners", "Finished", "At Risk", "Not Started", "Avg Progress"];
    const rows = programRows.map((r: ProgramRow) => [r.name, r.total, r.finished, r.atRisk, r.notStarted, `${r.avgProgress}%`]);
    const csv = [headers, ...rows].map((r: (string | number)[]) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `performance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Performance Reports</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing analytics…" : `${programRows.length} active programs · ${(participants as any[]).length} total participants.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportCSV} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
          </Button>
          <Button
            onClick={() => toast.info("Full PDF report generation coming soon.")}
            className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 mr-2" /> Full Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column — KPIs */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Cohort Averages</h2>
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completion Rate
                </p>
                {loadingStats ? <div className="h-9 w-20 bg-muted/40 rounded animate-pulse" /> : (
                  <p className="text-3xl font-light text-foreground">{completionRate}%</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" /> Active Hours
                </p>
                {loadingStats ? <div className="h-9 w-16 bg-muted/40 rounded animate-pulse" /> : (
                  <p className="text-3xl font-light text-foreground">{activeHours}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Total Learners
                </p>
                {loadingStats ? <div className="h-9 w-16 bg-muted/40 rounded animate-pulse" /> : (
                  <p className="text-3xl font-light text-foreground">{totalUsers.toLocaleString()}</p>
                )}
              </div>
              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> At Risk Learners
                </p>
                {loadingParticipants ? <div className="h-9 w-16 bg-muted/40 rounded animate-pulse" /> : (
                  <p className="text-3xl font-bold text-amber-600">{atRiskTotal}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Per-program table */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary/40" /> Loading performance reports…
              </div>
            ) : programRows.length === 0 ? (
              <div className="text-center py-20 bg-card/20">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">No program data yet</p>
                <p className="text-sm text-muted-foreground">Create programs and enroll participants to see live analytics.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-muted/20 border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Learners</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Finished</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">At Risk</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Avg Progress</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {programRows.map((row: ProgramRow) => {
                      const completionPct = row.total > 0 ? Math.round((row.finished / row.total) * 100) : 0;
                      return (
                        <tr key={row.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-foreground">{row.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{row.notStarted} not started</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{row.total}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{row.finished}</td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-semibold ${row.atRisk > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {row.atRisk}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[80px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${row.avgProgress >= 70 ? "bg-emerald-500" : row.avgProgress >= 30 ? "bg-primary" : "bg-amber-500"}`}
                                  style={{ width: `${row.avgProgress}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-muted-foreground">{row.avgProgress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              completionPct >= 70 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                              completionPct >= 30 ? "bg-primary/10 text-primary" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {completionPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="bg-muted/10 font-semibold">
                      <td className="px-6 py-4 text-sm font-bold text-foreground">All Programs</td>
                      <td className="px-6 py-4 text-sm text-foreground">{programRows.reduce((a: number, r: ProgramRow) => a + r.total, 0)}</td>
                      <td className="px-6 py-4 text-sm text-emerald-600">{programRows.reduce((a: number, r: ProgramRow) => a + r.finished, 0)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`text-sm font-semibold ${programRows.reduce((a: number, r: ProgramRow) => a + r.atRisk, 0) > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {programRows.reduce((a: number, r: ProgramRow) => a + r.atRisk, 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${totalAvgProgress >= 70 ? "bg-emerald-500" : totalAvgProgress >= 30 ? "bg-primary" : "bg-amber-500"}`}
                              style={{ width: `${totalAvgProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">{totalAvgProgress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-foreground">{totalCertificates} certificates</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
