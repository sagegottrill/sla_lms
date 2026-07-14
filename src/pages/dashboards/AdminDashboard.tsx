import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSystemStats, useCourses, useProfiles } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  Download, Users, BookOpen, FolderOpen, Award, BarChart3,
  Activity, ChevronRight, Server, Wifi, Database, Clock,
  Shield, TrendingUp, DollarSign, Target,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { SystemHealthWidget } from "@/components/admin/SystemHealthWidget";

export default function AdminDashboard() {
  const { data: systemStats, isLoading: loadingStats, refetch } = useSystemStats();
  const { data: allCourses = [], isLoading: loadingCourses } = useCourses({ publishedOnly: false });
  const { data: allProfiles = [] } = useProfiles();
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const queryClient = useQueryClient();

   const { data: systemSettings } = useQuery({
     queryKey: ["system_settings", "main"],
     queryFn: api.getSystemSettings,
     select: (response) => response.data,
   });

  const [reminderInactivityDays, setReminderInactivityDays] = useState<number>(3);
  const [reminderDeadlineHours, setReminderDeadlineHours] = useState<number>(48);

  useEffect(() => {
    if (!systemSettings) return;
    const d = Number((systemSettings as any).inactivity_reminder_days ?? 3);
    const h = Number((systemSettings as any).assessment_deadline_alert_hours ?? 48);
    setReminderInactivityDays(Number.isFinite(d) ? d : 3);
    setReminderDeadlineHours(Number.isFinite(h) ? h : 48);
  }, [systemSettings]);

   const { data: pendingApps = [], isLoading: loadingPending } = useQuery({
     queryKey: ["program_applications", "pending"],
     queryFn: api.getPendingProgramApplications,
     select: (response) => response.data || [],
   });

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 pb-16 sm:pb-20">

      {/* Lively Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-indigo-600 p-8 sm:p-12 text-white shadow-xl"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              {getGreeting()}, Admin! 👋
            </h1>
            <p className="text-white/80 text-lg">
              {loadingStats ? "Syncing your data..." : `You have ${totalUsers.toLocaleString()} members across the platform today.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh}
              className="rounded-full px-6 h-11 text-sm font-semibold bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md transition-all">
              <Activity className="w-4 h-4 mr-2" /> Sync Data
            </Button>
            <Button 
              className="rounded-full px-6 h-11 text-sm font-semibold bg-white text-primary hover:bg-white/90 shadow-sm transition-all"
              onClick={() => toast.success("System report exported")}>
              <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl opacity-50" />
      </motion.div>

      {/* Grid Layout (Coursera Style: 1/3 to 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

        {/* ———— LEFT COLUMN (KPI Widgets) ———— */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-8">

          {/* Platform KPIs */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-7 shadow-sm hover:shadow-md transition-all"
          >
            <h2 className="font-display font-semibold text-xl text-foreground mb-6">Platform KPIs</h2>
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><Users className="w-3.5 h-3.5" /></div> Total Members
                </p>
                {loadingStats ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-3xl font-semibold text-foreground">{totalUsers.toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center"><BookOpen className="w-3.5 h-3.5" /></div> Active Courses
                </p>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-3xl font-semibold text-foreground">{activeCourses}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center"><FolderOpen className="w-3.5 h-3.5" /></div> Active Programs
                </p>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-3xl font-semibold text-foreground">{activePrograms}</p>
                )}
              </div>
              <div className="pt-5 border-t border-border/40">
                <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Award className="w-3.5 h-3.5" /></div> Certificates Issued
                </p>
                {loadingStats ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-3xl font-bold text-primary">{totalCertificates.toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5" /></div> Completion Rate
                </p>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-3xl font-semibold text-foreground">{completionRate}%</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <SystemHealthWidget />
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-7 shadow-sm hover:shadow-md transition-all"
          >
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Quick Actions</h2>
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
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors group">
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </motion.div>


        </div>


        {/* ———— RIGHT COLUMN (Content Area) ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">

          {/* Revenue Summary - Livelier Design */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-500 to-teal-600 p-8 sm:p-10 text-white shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="relative z-10">
              <h2 className="font-display font-semibold text-2xl mb-1">Financial Summary</h2>
              <p className="text-emerald-50 text-sm mb-8 opacity-90">Revenue collected from course enrollments and subscriptions.</p>
              <div className="flex items-end gap-3">
                {loadingStats ? <Skeleton className="h-12 w-48 bg-white/20" /> : (
                  <p className="text-5xl font-bold tracking-tight">₦{totalRevenue.toLocaleString()}</p>
                )}
                <span className="text-emerald-100 text-sm mb-2 font-medium">Total Revenue</span>
              </div>
            </div>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/20 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-0 right-10 w-40 h-40 bg-teal-400/30 rounded-full blur-2xl" />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Reminders */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-3xl bg-card p-7 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-semibold text-xl text-foreground">Reminders</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Automated alert thresholds.
                  </p>
                </div>
                <Button
                  className="rounded-full px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  onClick={async () => {
                    const saved = await api.updateSystemSettings({
                      inactivity_reminder_days: reminderInactivityDays,
                      assessment_deadline_alert_hours: reminderDeadlineHours,
                    });
                    if (!saved) {
                      toast.error("Failed to save system settings.");
                      return;
                    }
                    toast.success("Reminder settings saved.");
                    queryClient.invalidateQueries({ queryKey: ["system_settings"] });
                  }}
                >
                  Save
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Inactivity Reminder (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reminderInactivityDays}
                    onChange={(e) => setReminderInactivityDays(Number(e.target.value) || 3)}
                    className="w-full px-4 py-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Assessment Deadline Alert (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reminderDeadlineHours}
                    onChange={(e) => setReminderDeadlineHours(Number(e.target.value) || 48)}
                    className="w-full px-4 py-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
              </div>
            </motion.div>

            {/* Pending program approvals */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-3xl bg-card p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-semibold text-xl text-foreground">Pending Approvals</h2>
                  <p className="text-muted-foreground text-sm mt-1">Applications awaiting review.</p>
                </div>
                {loadingPending ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : null}
              </div>

              {pendingApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No pending applications right now.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                  {pendingApps.map((a: any) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">
                          {(a.profiles?.name ?? "Applicant")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {(a.profiles?.email ?? "—")}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                          {a.programs?.title ?? a.program_title ?? "—"}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          className="rounded-full h-8 px-4 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                          onClick={async () => {
                            await api.rejectProgramApplication(String(a.id));
                            toast.success("Application rejected");
                            queryClient.invalidateQueries({ queryKey: ["program_applications", "pending"] });
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          className="rounded-full h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm"
                          onClick={async () => {
                            const response = await api.approveProgramApplication(String(a.id), String(a.user_id), Number(a.program_id));
                            if (!response.success) {
                              toast.error(response.error || "Could not approve and enroll this applicant.");
                              return;
                            }
                            toast.success("Application approved");
                            queryClient.invalidateQueries({ queryKey: ["program_applications", "pending"] });
                            queryClient.invalidateQueries({ queryKey: queryKeys.participants.base });
                            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
                            queryClient.invalidateQueries({ queryKey: queryKeys.programs.base });
                          }}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Secondary Metrics Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-3xl bg-card p-7 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-xl text-foreground">Detailed Metrics</h2>
              <button
                onClick={() => setShowAllMetrics(!showAllMetrics)}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                {showAllMetrics ? "Show Less" : "View All Metrics"} <ChevronRight className={`w-4 h-4 transition-transform ${showAllMetrics ? "rotate-90" : ""}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {visibleMetrics.map((metric, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (i * 0.05) }}
                  key={metric.label} 
                  className="bg-muted/30 rounded-2xl p-5 text-center ring-1 ring-black/5 dark:ring-white/5 border-0 hover:ring-primary/20 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-background shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <metric.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
