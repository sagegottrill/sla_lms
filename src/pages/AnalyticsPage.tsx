import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/common/PageContainer";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  BarChart3, TrendingUp, Users, BookOpen, DollarSign,
  Download, Calendar, FileText, Target, Activity, Award, ArrowLeft, HelpCircle
} from "lucide-react";
import {
  useSystemStats,
  usePaystackFinance,
  useCourses,
  useProfiles,
  useAnalyticsEnrollments,
  useAllCertificates,
} from "@/hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Course } from "@/types";

type ReportTab = "overview" | "users" | "courses" | "revenue" | "custom";
type ReportId =
  | "user-activity"
  | "course-completion"
  | "revenue-summary"
  | "enrollment-trends"
  | "certificate-issuance"
  | "instructor-performance";

const PRE_BUILT_REPORTS: Array<{
  id: ReportId;
  name: string;
  description: string;
  icon: React.ElementType;
  category: Exclude<ReportTab, "overview" | "custom">;
}> = [
  { id: "user-activity", name: "User Activity Report", description: "New users, enrollments, and last activity", icon: Activity, category: "users" },
  { id: "course-completion", name: "Course Completion Report", description: "Completion rates and progress by course", icon: Award, category: "courses" },
  { id: "revenue-summary", name: "Revenue Summary", description: "Total revenue and payment methods", icon: DollarSign, category: "revenue" },
  { id: "enrollment-trends", name: "Enrollment Trends", description: "New enrollments over time and popular courses", icon: TrendingUp, category: "courses" },
  { id: "certificate-issuance", name: "Certificate Issuance", description: "Certificates issued, by course and date", icon: Award, category: "courses" },
  { id: "instructor-performance", name: "Instructor Performance", description: "Course ratings, learners, and earnings", icon: Users, category: "users" },
];

function rangeStart(dateRange: string): Date | null {
  if (dateRange === "all") return null;
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : dateRange === "1y" ? 365 : null;
  if (days == null) return null;
  return new Date(Date.now() - days * 86400000);
}

function inRange(iso: string | null | undefined, start: Date | null): boolean {
  if (!start) return true;
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= start.getTime();
}

function monthKey(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Report exported.");
}

function ReportTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No data for this period.</p>;
  }
  return (
    <div className="overflow-x-auto ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
      <table className="w-full min-w-[640px]">
        <thead className="bg-muted/20 border-b border-border/40">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row, i) => (
            <tr key={`${i}-${row[0]}`} className="hover:bg-muted/10">
              {row.map((cell, j) => (
                <td key={`${i}-${j}`} className="px-4 py-3 text-sm text-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [dateRange, setDateRange] = useState("30d");
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);

  const { data: systemStats, isLoading: loadingStats } = useSystemStats();
  const { data: paystackFinance, isLoading: loadingPaystack } = usePaystackFinance({ includeTransactions: true });
  const { data: courses = [], isLoading: loadingCourses } = useCourses({ publishedOnly: false });
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: enrollments = [], isLoading: loadingEnrollments } = useAnalyticsEnrollments();
  const { data: certificates = [], isLoading: loadingCerts } = useAllCertificates();

  const loading = loadingStats || loadingPaystack || loadingCourses || loadingProfiles || loadingEnrollments || loadingCerts;
  const start = rangeStart(dateRange);
  const courseById = useMemo(() => {
    const map = new Map<number, Course>();
    for (const c of courses as Course[]) map.set(c.id, c);
    return map;
  }, [courses]);

  const filteredProfiles = useMemo(
    () => (profiles as Array<{ created_at?: string; joined?: string }>).filter((p) => inRange(p.created_at || p.joined, start)),
    [profiles, start],
  );
  const filteredEnrollments = useMemo(
    () => enrollments.filter((e) => inRange(e.enrolled_at, start)),
    [enrollments, start],
  );
  const filteredCerts = useMemo(
    () => (certificates as Array<{ completed_at?: string }>).filter((c) => inRange(c.completed_at, start)),
    [certificates, start],
  );
  const filteredPayments = useMemo(
    () => (paystackFinance?.transactions ?? []).filter((t) => t.status === "successful" && inRange(t.paid_at, start)),
    [paystackFinance, start],
  );

  const totalUsers = filteredProfiles.length;
  const activeCourses = (courses as Course[]).filter((c) => {
    const status = String((c as Course & { status?: string }).status || "published");
    return status === "published" || status === "active";
  }).length;
  const totalRevenue = filteredPayments.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const completedEnrollments = filteredEnrollments.filter((e) => e.progress >= 100).length;
  const completionRate = filteredEnrollments.length > 0
    ? Math.round((completedEnrollments / filteredEnrollments.length) * 100)
    : (systemStats?.completionRate ?? 0);

  const reports: Record<ReportId, {
    title: string;
    headers: string[];
    rows: Array<Array<string | number>>;
    extra?: { title: string; headers: string[]; rows: Array<Array<string | number>> };
  }> = useMemo(() => {
    const enrollmentCountByUser = new Map<string, number>();
    const lastActiveByUser = new Map<string, string>();
    for (const e of filteredEnrollments) {
      enrollmentCountByUser.set(e.user_id, (enrollmentCountByUser.get(e.user_id) || 0) + 1);
      const stamp = e.last_accessed || e.enrolled_at;
      if (stamp) {
        const prev = lastActiveByUser.get(e.user_id);
        if (!prev || Date.parse(stamp) > Date.parse(prev)) lastActiveByUser.set(e.user_id, stamp);
      }
    }

    const userActivityRows = (profiles as Array<{
      id: string; name?: string; email?: string; role?: string; created_at?: string; joined?: string;
    }>).filter((p) => inRange(p.created_at || p.joined, start)).map((p) => [
      p.name || "—",
      p.email || "—",
      p.role || "—",
      p.created_at || p.joined ? new Date(String(p.created_at || p.joined)).toLocaleDateString() : "—",
      enrollmentCountByUser.get(p.id) || 0,
      lastActiveByUser.get(p.id) ? new Date(lastActiveByUser.get(p.id) as string).toLocaleDateString() : "—",
    ]);

    const byCourse = new Map<number, { enrolled: number; completed: number; inProgress: number; notStarted: number }>();
    for (const e of filteredEnrollments) {
      if (e.course_id == null) continue;
      const cur = byCourse.get(e.course_id) || { enrolled: 0, completed: 0, inProgress: 0, notStarted: 0 };
      cur.enrolled += 1;
      if (e.progress >= 100) cur.completed += 1;
      else if (e.progress <= 0) cur.notStarted += 1;
      else cur.inProgress += 1;
      byCourse.set(e.course_id, cur);
    }
    const completionRows = [...byCourse.entries()].map(([id, s]) => {
      const title = courseById.get(id)?.title || `Course #${id}`;
      const rate = s.enrolled ? Math.round((s.completed / s.enrolled) * 100) : 0;
      return [title, s.enrolled, s.completed, s.inProgress, s.notStarted, `${rate}%`];
    });

    const methodMap = new Map<string, { count: number; amount: number }>();
    for (const t of filteredPayments) {
      const method = t.method ? t.method.replace(/_/g, " ") : "Other";
      const cur = methodMap.get(method) || { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += Number(t.amount || 0);
      methodMap.set(method, cur);
    }
    const revenueRows = [...methodMap.entries()].map(([method, s]) => [
      method,
      s.count,
      `₦${s.amount.toLocaleString()}`,
    ]);
    if (revenueRows.length === 0 && totalRevenue === 0) {
      /* empty */
    } else if (revenueRows.length === 0) {
      revenueRows.push(["All methods", filteredPayments.length, `₦${totalRevenue.toLocaleString()}`]);
    }

    const monthMap = new Map<string, number>();
    for (const e of filteredEnrollments) {
      const key = monthKey(e.enrolled_at);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
    const trendRows = [...monthMap.entries()].map(([month, count]) => [month, count]);
    const popularRows = [...byCourse.entries()]
      .sort((a, b) => b[1].enrolled - a[1].enrolled)
      .slice(0, 12)
      .map(([id, s]) => [courseById.get(id)?.title || `Course #${id}`, s.enrolled]);

    const certByCourse = new Map<string, { count: number; latest: string }>();
    for (const cert of filteredCerts as Array<{ course_title?: string; completed_at?: string }>) {
      const title = cert.course_title || "Certificate";
      const cur = certByCourse.get(title) || { count: 0, latest: "" };
      cur.count += 1;
      if (cert.completed_at && (!cur.latest || Date.parse(cert.completed_at) > Date.parse(cur.latest))) {
        cur.latest = cert.completed_at;
      }
      certByCourse.set(title, cur);
    }
    const certRows = [...certByCourse.entries()].map(([title, s]) => [
      title,
      s.count,
      s.latest ? new Date(s.latest).toLocaleDateString() : "—",
    ]);

    const earningsByCourse = new Map<number, number>();
    for (const t of filteredPayments) {
      if (t.course_id == null) continue;
      earningsByCourse.set(t.course_id, (earningsByCourse.get(t.course_id) || 0) + Number(t.amount || 0));
    }
    const instructorMap = new Map<string, { courses: number; students: number; ratingSum: number; ratingN: number; reviews: number; earnings: number }>();
    for (const c of courses as Course[]) {
      const name = c.instructor || "Instructor";
      const cur = instructorMap.get(name) || { courses: 0, students: 0, ratingSum: 0, ratingN: 0, reviews: 0, earnings: 0 };
      cur.courses += 1;
      cur.students += Number(c.students || 0);
      if (Number(c.rating) > 0) {
        cur.ratingSum += Number(c.rating);
        cur.ratingN += 1;
      }
      cur.reviews += Number(c.reviewCount || 0);
      cur.earnings += earningsByCourse.get(c.id) || 0;
      instructorMap.set(name, cur);
    }
    const instructorRows = [...instructorMap.entries()].map(([name, s]) => [
      name,
      s.courses,
      s.students,
      s.ratingN ? (s.ratingSum / s.ratingN).toFixed(1) : "—",
      s.reviews,
      `₦${s.earnings.toLocaleString()}`,
    ]);

    return {
      "user-activity": {
        title: "User Activity Report",
        headers: ["Name", "Email", "Role", "Joined", "Enrollments", "Last active"],
        rows: userActivityRows,
      },
      "course-completion": {
        title: "Course Completion Report",
        headers: ["Course", "Enrolled", "Completed", "In progress", "Not started", "Completion"],
        rows: completionRows,
      },
      "revenue-summary": {
        title: "Revenue Summary",
        headers: ["Method", "Payments", "Amount"],
        rows: revenueRows,
      },
      "enrollment-trends": {
        title: "Enrollment Trends",
        headers: ["Month", "New enrollments"],
        rows: trendRows,
        extra: { title: "Popular courses", headers: ["Course", "Enrollments"], rows: popularRows },
      },
      "certificate-issuance": {
        title: "Certificate Issuance",
        headers: ["Course", "Issued", "Latest"],
        rows: certRows,
      },
      "instructor-performance": {
        title: "Instructor Performance",
        headers: ["Instructor", "Courses", "Learners", "Avg rating", "Reviews", "Earnings"],
        rows: instructorRows,
      },
    };
  }, [
    certificates,
    courseById,
    courses,
    filteredCerts,
    filteredEnrollments,
    filteredPayments,
    filteredProfiles.length,
    profiles,
    start,
    totalRevenue,
  ]);

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "custom", label: "Custom Reports", icon: FileText },
  ];

  const filteredReportCards = PRE_BUILT_REPORTS.filter(
    (report) => activeTab === "overview" || report.category === activeTab,
  );

  const current = activeReport ? reports[activeReport] : null;

  const exportCurrent = () => {
    if (current) {
      const rows = [...current.rows];
      if (current.extra?.rows.length) {
        rows.push([], current.extra.headers, ...current.extra.rows);
      }
      downloadCsv(`${current.title.replace(/\s+/g, "-").toLowerCase()}.csv`, current.headers, rows);
      return;
    }
    downloadCsv("analytics-overview.csv", ["Metric", "Value"], [
      ["Users", totalUsers],
      ["Active courses", activeCourses],
      ["Revenue", totalRevenue],
      ["Completion rate", `${completionRate}%`],
    ]);
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            Analytics & Reports
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Live users, courses, revenue, and certificates for the selected period.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
        subtitle="Live numbers from the platform for the period you pick"
        actions={
          <>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={cn(
                  DESIGN_TOKENS.inputForm,
                  "appearance-none cursor-pointer pr-10 h-9 text-xs"
                )}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
              <Calendar className={cn(DESIGN_TOKENS.iconButton, "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground")} />
            </div>
            <Button variant="outline" className={DESIGN_TOKENS.buttonOutline} onClick={exportCurrent}>
              <Download className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Users", value: totalUsers.toLocaleString(), icon: Users },
          { label: "Active Courses", value: activeCourses, icon: BookOpen },
          { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: "Completion Rate", value: `${completionRate}%`, icon: Target },
        ].map((metric) => (
          <div key={metric.label} className={cn(DESIGN_TOKENS.card, "p-5")}>
            <div className="flex items-center justify-between mb-3">
              <metric.icon className="w-5 h-5 text-muted-foreground/60" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-semibold text-foreground mb-1">
                {metric.value}
              </div>
            )}
            <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-xs")}>{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-border/40 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setActiveReport(null);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeReport && current && activeTab !== "custom" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" className="h-9 px-3" onClick={() => setActiveReport(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> All reports
            </Button>
            <Button variant="outline" className={DESIGN_TOKENS.buttonOutline} onClick={exportCurrent}>
              <Download className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Export
            </Button>
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">{current.title}</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              <ReportTable headers={current.headers} rows={current.rows} />
              {current.extra ? (
                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-foreground">{current.extra.title}</h3>
                  <ReportTable headers={current.extra.headers} rows={current.extra.rows} />
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : activeTab !== "custom" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReportCards.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setActiveReport(report.id)}
              className={cn(
                DESIGN_TOKENS.card,
                "p-5 text-left hover:ring-2 hover:ring-primary/20 transition-all group"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <report.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary">View Report</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{report.name}</h3>
              <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-xs")}>
                {report.description}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className={cn(DESIGN_TOKENS.card, "p-8 text-center")}>
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              Custom Report Builder
            </h3>
            <p className={cn(DESIGN_TOKENS.pageSubtitle, "mb-6")}>
              Build your own report from live enrollments, revenue, users, and certificates.
            </p>
            <Link to="/dashboard/report-builder">
              <Button className={cn(DESIGN_TOKENS.buttonPrimary, "h-10 px-8")}>
                Build Custom Report
              </Button>
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
