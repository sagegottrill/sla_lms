import { Download, FileText, CheckCircle2, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemStats } from "@/hooks/useQueries";

export default function ReportsPage() {
  const { data: stats, isLoading } = useSystemStats();

  const totalUsers = stats?.totalUsers ?? 0;
  const totalCertificates = stats?.totalCertificates ?? 0;
  const atRiskLearners = Math.max(totalUsers - totalCertificates, 0);

  const completionRate = stats?.completionRate ?? 0;
  const activeHours = stats?.totalHours ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Performance Reports</h1>
          <p className="text-muted-foreground text-sm">
            Program analytics and completion records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
             <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
          </Button>
          <Button className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
            <FileText className="w-3.5 h-3.5 mr-2" /> Full Report
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <p className="text-sm text-muted-foreground">
          System-wide analytics pulled from your Supabase data.
        </p>
      </div>

      {/* Grid Layout (Async Coursera Style: 1/3 to 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ———— LEFT COLUMN (Global Metrics Widget) ———— */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Cohort Averages</h2>
            
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completion Rate
                </p>
                <p className="text-3xl font-light text-foreground">{isLoading ? "—" : `${completionRate}%`}</p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" /> Active Hours
                </p>
                <p className="text-3xl font-light text-foreground">{isLoading ? "—" : activeHours}</p>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> At Risk Learners
                </p>
                <p className="text-3xl font-bold text-amber-600">{isLoading ? "—" : atRiskLearners}</p>
              </div>
            </div>
          </div>
        </div>


        {/* ———— RIGHT COLUMN (Top Courses Table) ———— */}
        <div className="lg:col-span-8 xl:col-span-9">

          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            {isLoading ? (
              <div className="text-center py-20 bg-card/20 text-muted-foreground">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm">Loading performance reports…</p>
              </div>
            ) : totalUsers === 0 ? (
              <div className="text-center py-20 bg-card/20">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">No reports generated</p>
                <p className="text-sm text-muted-foreground">Create enrollments and course completions to see live analytics.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/20 border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Program Segment</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Learners</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Finished</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">At Risk</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">All Programs</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{totalUsers}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{totalCertificates}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{atRiskLearners}</td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">—</td>
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
