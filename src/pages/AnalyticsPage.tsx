import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common/PageContainer";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  BarChart3, TrendingUp, Users, BookOpen, DollarSign,
  Download, Calendar, Filter, ChevronDown, FileText,
  Target, Activity, Award, Clock, HelpCircle
} from "lucide-react";
import { useSystemStats, usePaystackFinance } from "@/hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ReportTab = "overview" | "users" | "courses" | "revenue" | "custom";

const PRE_BUILT_REPORTS = [
  {
    id: "user-activity",
    name: "User Activity Report",
    description: "Login frequency, course engagement, and active users",
    icon: Activity,
    category: "users"
  },
  {
    id: "course-completion",
    name: "Course Completion Report",
    description: "Completion rates, average time, and dropout analysis",
    icon: Award,
    category: "courses"
  },
  {
    id: "revenue-summary",
    name: "Revenue Summary",
    description: "Total revenue, payment methods, and refunds",
    icon: DollarSign,
    category: "revenue"
  },
  {
    id: "enrollment-trends",
    name: "Enrollment Trends",
    description: "New enrollments over time, popular courses",
    icon: TrendingUp,
    category: "courses"
  },
  {
    id: "certificate-issuance",
    name: "Certificate Issuance",
    description: "Certificates issued, by course and time period",
    icon: Award,
    category: "courses"
  },
  {
    id: "instructor-performance",
    name: "Instructor Performance",
    description: "Course ratings, student feedback, earnings",
    icon: Users,
    category: "users"
  },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [dateRange, setDateRange] = useState("30d");
  const { data: systemStats, isLoading } = useSystemStats();
  const { data: paystackFinance, isLoading: loadingPaystack } = usePaystackFinance();

  const totalUsers = systemStats?.totalUsers ?? 0;
  const activeCourses = systemStats?.activeCourses ?? 0;
  const totalRevenue = paystackFinance?.totalRevenue ?? systemStats?.totalRevenue ?? 0;
  const completionRate = systemStats?.completionRate ?? 0;

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "custom", label: "Custom Reports", icon: FileText },
  ];

  const filteredReports = PRE_BUILT_REPORTS.filter(
    (report) => activeTab === "overview" || report.category === activeTab
  );

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
                  <p className="text-xs">Consolidated view of platform metrics, user activity, revenue, and custom reports. Export data for deeper analysis.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
        subtitle="Comprehensive insights into platform performance and user engagement"
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
            <Button variant="outline" className={DESIGN_TOKENS.buttonOutline}>
              <Download className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Export
            </Button>
          </>
        }
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users, change: "+12%" },
          { label: "Active Courses", value: activeCourses, icon: BookOpen, change: "+8%" },
          { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+24%" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: Target, change: "+5%" },
        ].map((metric) => (
          <div key={metric.label} className={cn(DESIGN_TOKENS.card, "p-5")}>
            <div className="flex items-center justify-between mb-3">
              <metric.icon className="w-5 h-5 text-muted-foreground/60" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {metric.change}
              </span>
            </div>
            {isLoading || (metric.label === "Total Revenue" && loadingPaystack) ? (
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Reports Grid */}
      {activeTab !== "custom" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={cn(
                DESIGN_TOKENS.card,
                "p-5 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <report.icon className="w-5 h-5 text-primary" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 text-xs"
                >
                  View Report
                </Button>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{report.name}</h3>
              <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-xs")}>
                {report.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Custom Report Builder */
        <div className={cn(DESIGN_TOKENS.card, "p-8 text-center")}>
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              Custom Report Builder
            </h3>
            <p className={cn(DESIGN_TOKENS.pageSubtitle, "mb-6")}>
              Create custom reports by selecting data sources, filters, and visualization options.
            </p>
            <Button className={cn(DESIGN_TOKENS.buttonPrimary, "h-10 px-8")}>
              Build Custom Report
            </Button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={cn(DESIGN_TOKENS.card, "p-6")}>
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Schedule Report", icon: Clock },
            { label: "Export All Data", icon: Download },
            { label: "Configure Alerts", icon: Activity },
            { label: "View Archived Reports", icon: FileText },
          ].map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors text-left ring-1 ring-black/5 dark:ring-white/10 border-0"
            >
              <action.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
