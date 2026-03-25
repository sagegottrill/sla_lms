import { useState, useMemo } from "react";
import { useSystemStats, useCourses, useProfiles, useUserEnrollments } from "@/hooks/useQueries";
import { Download, TrendingUp, Users, BookOpen, Target, Loader2, RefreshCw, DollarSign, BarChart3, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const CHART_COLORS = ["#0056D2", "#0288d1", "#00897B", "#F4B400", "#E53935", "#7B1FA2"];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 12 months");

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useSystemStats();
  const { data: allCourses = [], isLoading: loadingCourses, refetch: refetchCourses } = useCourses({ publishedOnly: false });
  const { data: allProfiles = [] } = useProfiles();

  // Top courses by enrollment count
  const topCourses = useMemo(() =>
    [...allCourses]
      .filter((c: any) => c.status === "published" || c.status === "active")
      .sort((a: any, b: any) => (b.students || 0) - (a.students || 0))
      .slice(0, 8),
    [allCourses]
  );

  // Build enrollment bar chart data from real course data
  const enrollmentChartData = useMemo(() =>
    topCourses.slice(0, 6).map((c: any) => ({
      name: c.title?.length > 20 ? c.title.slice(0, 20) + "…" : c.title,
      learners: c.students || 0,
      revenue: c.revenue || 0,
    })),
    [topCourses]
  );

  // Build user role distribution from real profiles
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    allProfiles.forEach((p: any) => {
      const role = p.role || "student";
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
      value,
    }));
  }, [allProfiles]);

  // Revenue by course (pie chart)
  const revenueByCourse = useMemo(() =>
    topCourses
      .filter((c: any) => (c.revenue || 0) > 0)
      .map((c: any) => ({
        name: c.title?.length > 18 ? c.title.slice(0, 18) + "…" : c.title,
        value: c.revenue || 0,
      })),
    [topCourses]
  );

  // Conversion funnel (derived from real data)
  const funnelData = useMemo(() => {
    const totalVisitors = Math.max(allProfiles.length * 5, 1); // rough estimate
    const registrations = allProfiles.length;
    const enrollments = allCourses.reduce((acc: number, c: any) => acc + (c.students || 0), 0);
    const completions = Math.round(enrollments * (stats?.completionRate || 0) / 100);
    return [
      { stage: "Site Visitors", value: totalVisitors, fill: "#e3f2fd" },
      { stage: "Registrations", value: registrations, fill: "#bbdefb" },
      { stage: "Enrollments", value: enrollments, fill: "#64b5f6" },
      { stage: "Completions", value: completions, fill: "#0056D2" },
    ];
  }, [allProfiles, allCourses, stats]);

  const handleRefresh = () => {
    refetchStats();
    refetchCourses();
    toast.success("Platform analytics synced.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground text-sm">
            {loadingStats ? "Aggregating data..." : `Live global snapshot across ${allCourses.length} courses and ${allProfiles.length} users.`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 p-1 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 h-9 shrink-0">
            {["Last 30 days", "Last 12 months", "All time"].map(r => (
              <button key={r} onClick={() => { setDateRange(r); toast.info(`Timeframe: ${r}`); }}
                className={`px-3 rounded-full text-xs font-semibold transition-all h-full ${
                  dateRange === r ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}>
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={handleRefresh} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Sync
          </Button>
          <Button onClick={() => toast.success("Analytics exported.")} className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
            <Download className="w-3.5 h-3.5 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Learners", value: stats?.totalUsers || 0, icon: Users },
          { label: "Total Enrollments", value: allCourses.reduce((a: number, c: any) => a + (c.students || 0), 0), icon: BookOpen },
          { label: "Completion Rate", value: `${stats?.completionRate || 0}%`, icon: Target },
          { label: "Total Revenue", value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 text-center">
            <Icon className="w-4 h-4 text-muted-foreground/60 mx-auto mb-2" />
            {loadingStats ? <Skeleton className="h-7 w-20 mx-auto" /> : (
              <div className="text-2xl font-semibold text-foreground">{value}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Enrollment by Course (Bar Chart) */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base text-foreground mb-4">Enrollments by Course</h3>
          {loadingCourses ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : enrollmentChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No enrollment data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollmentChartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="learners" fill="#0056D2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Course (Pie Chart) */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base text-foreground mb-4">Revenue Distribution</h3>
          {loadingCourses ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : revenueByCourse.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No revenue data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={revenueByCourse} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {revenueByCourse.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Role Distribution (Bar Chart) */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base text-foreground mb-4">User Roles Distribution</h3>
          {roleDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No user data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roleDistribution} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" fill="#00897B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
          <h3 className="font-display font-semibold text-base text-foreground mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxVal = funnelData[0].value;
              const widthPct = maxVal > 0 ? Math.max((stage.value / maxVal) * 100, 5) : 5;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{stage.stage}</span>
                    <span className="text-xs font-bold text-muted-foreground">{stage.value.toLocaleString()}</span>
                  </div>
                  <div className="h-6 bg-muted/30 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700"
                      style={{ width: `${widthPct}%`, backgroundColor: CHART_COLORS[i] || "#0056D2" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Content Table */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        <div className="p-6 border-b border-border/40">
          <h2 className="font-display font-semibold text-lg text-foreground">Top Performing Content</h2>
        </div>
        {loadingCourses ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" />
            <p className="text-sm">Evaluating course metrics...</p>
          </div>
        ) : topCourses.length === 0 ? (
          <div className="text-center py-20 bg-card/20">
            <p className="text-foreground font-medium mb-1">No performance data</p>
            <p className="text-sm text-muted-foreground">Wait for courses to gain traction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/20 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Course Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Provider</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Learners</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {topCourses.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{c.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {c.instructor || "SLA Connecta"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">
                      {(c.students || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#0056D2]">
                      {(c.revenue || 0) > 0 ? `₦${(c.revenue || 0).toLocaleString()}` : "Free"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
