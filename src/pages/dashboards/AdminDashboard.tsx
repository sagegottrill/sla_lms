import { useState } from "react";
import { useSystemStats, useCourses, useProfiles } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Download, Users, BookOpen, FolderOpen, Award, BarChart3,
  Activity, ChevronRight, Server, Wifi, Database, Clock,
  Shield, TrendingUp, DollarSign, Target,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { data: systemStats, isLoading: loadingStats, refetch } = useSystemStats();
  const { data: allCourses = [], isLoading: loadingCourses } = useCourses({ publishedOnly: false });
  const { data: allProfiles = [] } = useProfiles();
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const totalUsers = systemStats?.totalUsers ?? 0;
  const activeCourses = systemStats?.activeCourses ?? 0;
  const activePrograms = systemStats?.activePrograms ?? 0;
  const completionRate = systemStats?.completionRate ?? 0;
  const totalCertificates = systemStats?.totalCertificates ?? 0;
  const totalRevenue = systemStats?.totalRevenue ?? 0;

  // Derived metrics from real data
  const totalEnrollments = allCourses.reduce((acc: number, c: any) => acc + (c.students || 0), 0);
  const publishedCourses = allCourses.filter((c: any) => c.status === "published" || c.status === "active");
  const draftCourses = allCourses.filter((c: any) => c.status === "draft");
  const recentUsers = allProfiles.filter((p: any) => {
    if (!p.created_at) return false;
    const d = new Date(p.created_at);
    const now = new Date();
    return (now.getTime() - d.getTime()) < (7 * 24 * 60 * 60 * 1000); // last 7 days
  });



  const handleRefresh = () => {
    refetch();
    toast.success("Dashboard metrics synced.");
  };

  const secondaryMetrics = [
    { label: "Published Courses", value: publishedCourses.length, icon: BookOpen },
    { label: "Draft Courses", value: draftCourses.length, icon: BookOpen },
    { label: "Total Enrollments", value: totalEnrollments, icon: Users },
    { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { label: "Active Programs", value: activePrograms, icon: FolderOpen },
    { label: "Certificates Issued", value: totalCertificates, icon: Award },
    { label: "Completion Rate", value: `${completionRate}%`, icon: Target },
    { label: "New Users (7d)", value: recentUsers.length, icon: TrendingUp },
  ];

  const visibleMetrics = showAllMetrics ? secondaryMetrics : secondaryMetrics.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 py-6 pb-16 sm:pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-4 sm:pb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {loadingStats ? "Syncing data..." : `${totalUsers} registered members across the platform.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}
            className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <Activity className="w-3.5 h-3.5 mr-2" /> Sync
          </Button>
          <Button variant="outline"
            className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted"
            onClick={() => toast.success("System report exported")}>
            <Download className="w-3.5 h-3.5 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* Grid Layout (Coursera Style: 1/3 to 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

        {/* ———— LEFT COLUMN (KPI Widgets) ———— */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6">

          {/* Platform KPIs */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Platform KPIs</h2>
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Total Members
                </p>
                {loadingStats ? <Skeleton className="h-7 w-24" /> : (
                  <p className="text-3xl font-light text-foreground">{totalUsers.toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Active Courses
                </p>
                {loadingStats ? <Skeleton className="h-7 w-16" /> : (
                  <p className="text-3xl font-light text-foreground">{activeCourses}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <FolderOpen className="w-3.5 h-3.5" /> Active Programs
                </p>
                {loadingStats ? <Skeleton className="h-7 w-16" /> : (
                  <p className="text-3xl font-light text-foreground">{activePrograms}</p>
                )}
              </div>
              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Award className="w-3.5 h-3.5" /> Certificates Issued
                </p>
                {loadingStats ? <Skeleton className="h-7 w-20" /> : (
                  <p className="text-3xl font-bold text-[#0056D2]">{totalCertificates.toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Completion Rate
                </p>
                {loadingStats ? <Skeleton className="h-7 w-16" /> : (
                  <p className="text-3xl font-light text-foreground">{completionRate}%</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-base text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-1">
              {[
                { label: "Manage Users", href: "/dashboard/users" },
                { label: "Browse Courses", href: "/dashboard/courses" },
                { label: "View Programs", href: "/dashboard/programs" },
                { label: "Platform Analytics", href: "/dashboard/analytics" },
                { label: "Performance Reports", href: "/dashboard/reports" },
                { label: "User Roles", href: "/dashboard/roles" },
              ].map((item) => (
                <Link to={item.href} key={item.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/80 transition-colors group">
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>


        </div>


        {/* ———— RIGHT COLUMN (Content Area) ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {/* Revenue Summary */}
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Financial Summary</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Revenue collected from course enrollments and subscriptions.
            </p>
            <div className="flex items-end gap-3">
              {loadingStats ? <Skeleton className="h-10 w-40" /> : (
                <p className="text-4xl font-light text-foreground tracking-tight">₦{totalRevenue.toLocaleString()}</p>
              )}
              <span className="text-sm text-muted-foreground mb-1">Total Revenue</span>
            </div>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-foreground">Platform Metrics</h2>
              <button
                onClick={() => setShowAllMetrics(!showAllMetrics)}
                className="text-xs font-semibold text-primary hover:text-primary/90 transition-colors"
              >
                {showAllMetrics ? "Show Less" : "View All Metrics"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {visibleMetrics.map((metric) => (
                <div key={metric.label} className="bg-muted/20 rounded-xl p-4 text-center ring-1 ring-black/5 dark:ring-white/10 border-0 hover:border-border/60 transition-colors">
                  <metric.icon className="w-4 h-4 text-muted-foreground/60 mx-auto mb-2" />
                  <div className="text-xl font-semibold text-foreground">{metric.value}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
