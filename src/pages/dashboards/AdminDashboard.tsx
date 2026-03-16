import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, BookOpen, DollarSign, TrendingUp, FolderOpen,
  UserCheck, Plus, Download, ChevronRight, Award,
  AlertTriangle, CheckCircle, Clock, Settings, Shield,
  BarChart3, Globe, Bell, FileText, Trash2, Edit,
  ToggleLeft, ToggleRight, Search, Filter, Eye, Star,
  Mail, Database, Server, Zap, Activity, RefreshCw,
  PieChart, Package, Megaphone, Lock, UserPlus, X, Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserProfileSlideout, { SlideoutUser } from "../../components/dashboard/UserProfileSlideout";
import BulkActionBar from "../../components/dashboard/BulkActionBar";
import TranscriptSlip from "../../components/dashboard/TranscriptSlip";

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = [
  { label: "Total Users",         value: "52,840",  change: "+12%", icon: Users,     trend: "up" },
  { label: "Active Courses",      value: "247",     change: "+5",   icon: BookOpen,  trend: "up" },
  { label: "Monthly Revenue",     value: "₦84.3M",  change: "+18%", icon: DollarSign,trend: "up" },
  { label: "Completion Rate",     value: "78%",     change: "+3%",  icon: TrendingUp,trend: "up" },
  { label: "Active Programs",     value: "12",      change: "+2",   icon: FolderOpen,trend: "up" },
  { label: "Certificates Issued", value: "9,410",   change: "+240", icon: Award,     trend: "up" },
  { label: "Job Placements",      value: "1,230",   change: "+89",  icon: UserCheck, trend: "up" },
  { label: "Avg. Session Time",   value: "42 min",  change: "+5%",  icon: Clock,     trend: "up" },
];

// ── Users table ───────────────────────────────────────────────────────────────
const recentUsers = [
  { name: "Chioma Eze",        email: "chioma@gmail.com",   role: "student",         joined: "Mar 4, 2026",  status: "active" },
  { name: "Dr. Fatima Hassan", email: "fatima@uni.ng",      role: "instructor",      joined: "Mar 3, 2026",  status: "active" },
  { name: "Ngozi Williams",    email: "ngozi@sla.org",      role: "program_manager", joined: "Mar 2, 2026",  status: "active" },
  { name: "Amara Osei",        email: "amara@gmail.com",    role: "student",         joined: "Mar 1, 2026",  status: "inactive" },
  { name: "Keturah Lekwauwa",  email: "keturah@corp.com",   role: "student",         joined: "Feb 28, 2026", status: "active" },
  { name: "Aisha Musa",        email: "aisha@outlook.com",  role: "instructor",      joined: "Feb 27, 2026", status: "active" },
  { name: "Blessing Okafor",   email: "blessing@gmail.com", role: "student",         joined: "Feb 26, 2026", status: "pending" },
];

const roleColors: Record<string, string> = {
  student:         "bg-accent text-primary",
  instructor:      "bg-primary text-primary-foreground",
  program_manager: "bg-accent text-primary",
  admin:           "bg-destructive/10 text-destructive",
};

// ── Courses pending ───────────────────────────────────────────────────────────
const pendingCourses = [
  { title: "Advanced Excel for Finance",   instructor: "Dr. Fatima Hassan",  submitted: "Mar 3, 2026",  category: "Finance" },
  { title: "Python for Data Analysis",     instructor: "Aisha Musa",         submitted: "Mar 2, 2026",  category: "Technology" },
  { title: "Brand Strategy Masterclass",   instructor: "Yemi Adesanya",      submitted: "Feb 28, 2026", category: "Business" },
];

// ── Revenue chart ─────────────────────────────────────────────────────────────
const revenueMonths = [42, 68, 55, 80, 65, 90, 72, 88, 76, 95, 84, 100];
const monthLabels   = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

// ── Quick actions ─────────────────────────────────────────────────────────────
const quickActions = [
  { label: "Add Course",        icon: BookOpen,   href: "/dashboard/courses",   color: "text-primary bg-accent" },
  { label: "Add Program",       icon: FolderOpen, href: "/dashboard/programs",  color: "text-primary bg-accent" },
  { label: "Add User",          icon: UserPlus,   href: "/dashboard/users",     color: "text-primary bg-accent" },
  { label: "View Analytics",    icon: BarChart3,  href: "/dashboard/analytics", color: "text-primary bg-accent" },
  { label: "Send Announcement", icon: Megaphone,  href: "/dashboard/announcements", color: "text-primary bg-accent" },
  { label: "Manage Certs",      icon: Award,      href: "/dashboard/certificates",  color: "text-primary bg-accent" },
  { label: "System Settings",   icon: Settings,   href: "/dashboard/settings",  color: "text-primary bg-accent" },
];

// ── System health ─────────────────────────────────────────────────────────────
const systemHealth = [
  { label: "API",         status: "operational", value: "99.98% uptime" },
  { label: "Database",    status: "operational", value: "14ms avg latency" },
  { label: "Storage",     status: "operational", value: "68% used" },
  { label: "Email",       status: "degraded",    value: "slow delivery" },
];

const statusColor: Record<string, string> = {
  operational: "text-emerald-600 bg-emerald-50",
  degraded:    "text-amber-600   bg-amber-50",
  down:        "text-red-600     bg-red-50",
};

// ── Content moderation ────────────────────────────────────────────────────────
const flaggedContent = [
  { type: "Review",  text: "Inappropriate language in course review",   user: "anonymous", time: "2h ago" },
  { type: "Comment", text: "Spam link posted in community discussion",  user: "user_4521",  time: "5h ago" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "content" | "system">("overview");
  const [searchUsers, setSearchUsers] = useState("");
  const [selectedUser, setSelectedUser] = useState<SlideoutUser | null>(null);
  const [selectedUserEmails, setSelectedUserEmails] = useState<Set<string>>(new Set());
  const [transcriptUser, setTranscriptUser] = useState<SlideoutUser | null>(null);

  const handleSlideoutAction = (action: string, user: SlideoutUser) => {
    switch (action) {
      case "email":
        toast.success(`Opening email composer for ${user.email}`);
        break;
      case "edit":
        toast.info(`Opening edit modal for ${user.name}`);
        break;
      case "transcript":
        setTranscriptUser(user);
        break;
      case "suspend":
        toast.error(`Suspended account: ${user.name}`);
        setSelectedUser(null);
        break;
    }
  };

  const filteredUsers = recentUsers.filter(u =>
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const toggleUserSelection = (email: string) => {
    const newDocs = new Set(selectedUserEmails);
    if (newDocs.has(email)) newDocs.delete(email);
    else newDocs.add(email);
    setSelectedUserEmails(newDocs);
  };

  const toggleAllUsers = () => {
    if (selectedUserEmails.size === filteredUsers.length) setSelectedUserEmails(new Set());
    else setSelectedUserEmails(new Set(filteredUsers.map(u => u.email)));
  };

  const bulkActions = [
    { icon: Mail, label: "Bulk Email", onClick: () => toast.success(`Sending email to ${selectedUserEmails.size} users.`) },
    { icon: Download, label: "Export CSV", onClick: () => {
      const selected = recentUsers.filter(u => selectedUserEmails.has(u.email));
      const csvContent = [
        ["Name", "Email", "Role", "Joined Date"],
        ...selected.map(u => [`"${u.name}"`, `"${u.email}"`, `"${u.role}"`, `"${u.joined}"`])
      ].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `SLA_Users_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success(`Exported ${selected.length} users to CSV`);
      setSelectedUserEmails(new Set());
    }},
    { icon: Lock, label: "Suspend", variant: "destructive" as const, onClick: () => {
      toast.error(`Suspended ${selectedUserEmails.size} accounts.`);
      setSelectedUserEmails(new Set());
    }},
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" /> Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Full platform management &mdash; March 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-border text-sm flex items-center gap-2"
            onClick={() => toast.success("Report exported!")}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2"
            onClick={() => toast.info("Use the Users tab to add a user")}>
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </motion.div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit">
        {(["overview", "users", "content", "system"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-brand-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl p-4 border border-border shadow-brand-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-primary">
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.change}</span>
                </div>
                <div className="text-xl font-bold font-display text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue chart */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Revenue Trend</h2>
                  <p className="text-xs text-muted-foreground">Apr 2025 – Mar 2026</p>
                </div>
                <select className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none">
                  <option>Last 12 months</option>
                  <option>Last 6 months</option>
                </select>
              </div>
              <div className="flex items-end gap-1.5 h-36">
                {revenueMonths.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t-lg transition-colors cursor-pointer ${i === 11 ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"}`}
                      style={{ height: `${h * 1.3}px` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                {monthLabels.map(m => <span key={m}>{m}</span>)}
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
                {[["₦84.3M","This month"],["₦72.1M","Last month"],["₦840M","YTD"]].map(([v,l]) => (
                  <div key={l}>
                    <div className="font-bold font-display text-foreground">{v}</div>
                    <div className="text-xs text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((item) => (
                    <Link key={item.label} to={item.href}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition-all text-center group">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground leading-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Courses Pending Approval */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Courses Awaiting Approval
                <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">{pendingCourses.length}</span>
              </h2>
            </div>
            <div className="divide-y divide-border">
              {pendingCourses.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.instructor} &bull; {c.category} &bull; <span className="text-foreground/60">{c.submitted}</span></p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs flex items-center gap-1.5">
                      <Eye className="w-3 h-3" /> Preview
                    </Button>
                    <Button size="sm" className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                      onClick={() => toast.success(`"${c.title}" approved!`)}>
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs border-destructive/30 text-destructive hover:bg-destructive/5 flex items-center gap-1.5"
                      onClick={() => toast.error(`"${c.title}" rejected.`)}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════ USERS TAB ═══════════════ */}
      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                placeholder="Search users by name or email…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl border-border text-sm gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
              <Button size="sm" className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 gap-2"
                onClick={() => toast.info("User invite modal coming soon")}>
                <UserPlus className="w-4 h-4" /> Invite User
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedUserEmails.size === filteredUsers.length}
                        onChange={toggleAllUsers}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background"
                      />
                    </th>
                    {["User","Email","Role","Joined","Status","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u, i) => (
                    <tr key={i} className={`hover:bg-muted/30 transition-colors ${selectedUserEmails.has(u.email) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUserEmails.has(u.email)}
                          onChange={() => toggleUserSelection(u.email)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{u.name.charAt(0)}</div>
                          <span className="text-sm font-medium text-foreground">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${roleColors[u.role]}`}>{u.role.replace("_"," ")}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.joined}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          u.status === "active"   ? "bg-emerald-50 text-emerald-700" :
                          u.status === "pending"  ? "bg-amber-50 text-amber-700"    :
                                                    "bg-muted text-muted-foreground"
                        }`}>{u.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            className="text-primary hover:underline font-medium flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                            onClick={() => setSelectedUser({
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              joined: u.joined,
                              status: u.status,
                              progress: u.role === "student" ? Math.floor(Math.random() * 100) : undefined
                            })}
                          >
                            <Eye className="w-3 h-3" /> View Profile
                          </button>
                          <button className="text-destructive hover:underline font-medium flex items-center gap-1" onClick={() => toast.error(`Removed ${u.name}`)}>
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role stats */}
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { role: "Students",        count: "51,204", icon: Users },
              { role: "Instructors",     count: "1,382",  icon: Star },
              { role: "Program Managers",count: "48",     icon: FolderOpen },
              { role: "Admins",          count: "6",      icon: Shield },
            ].map(r => (
              <div key={r.role} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                  <r.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold font-display text-foreground">{r.count}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════ CONTENT TAB ═══════════════ */}
      {activeTab === "content" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* Courses overview */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Published",  value: "213", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
              { label: "Pending",    value: "3",   color: "text-amber-600 bg-amber-50",     icon: Clock },
              { label: "Archived",   value: "31",  color: "text-muted-foreground bg-muted", icon: Package },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label} courses</div>
                </div>
              </div>
            ))}
          </div>

          {/* Courses pending approval */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Courses Pending Approval</h2>
              <Link to="/dashboard/courses" className="text-xs font-semibold text-primary hover:underline">Manage all →</Link>
            </div>
            <div className="divide-y divide-border">
              {pendingCourses.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.instructor} &bull; {c.category}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => toast.success("Approved!")}>
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs text-destructive border-destructive/30 gap-1" onClick={() => toast.error("Rejected.")}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flagged content */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Flagged Content
              </h2>
            </div>
            <div className="divide-y divide-border">
              {flaggedContent.map((f, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-secondary uppercase">{f.type}</p>
                    <p className="text-sm text-foreground mt-0.5">{f.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {f.user} &bull; {f.time}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs gap-1" onClick={() => toast.success("Content dismissed")}>
                      <Check className="w-3 h-3" /> Dismiss
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs text-destructive border-destructive/30 gap-1" onClick={() => toast.error("Content removed")}>
                      <Trash2 className="w-3 h-3" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Send Platform Announcement
            </h2>
            <div className="space-y-3">
              <input placeholder="Announcement subject" className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
              <textarea rows={3} placeholder="Write your message to all users…" className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40 resize-none" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="rounded-xl text-sm">Preview</Button>
                <Button size="sm" className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 gap-2"
                  onClick={() => toast.success("Announcement sent to all users!")}>
                  <Bell className="w-4 h-4" /> Send to All Users
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════ SYSTEM TAB ═══════════════ */}
      {activeTab === "system" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Health */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {systemHealth.map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{s.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[s.status]}`}>{s.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Feature toggles */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" /> Platform Feature Toggles
            </h2>
            <div className="divide-y divide-border">
              {[
                { label: "Student Enrollment",       desc: "Allow new students to enroll in courses",          on: true  },
                { label: "Course Reviews",            desc: "Enable star ratings and text reviews on courses",  on: true  },
                { label: "Community Forum",           desc: "Community discussion boards",                      on: true  },
                { label: "Job Board",                 desc: "Show employer job postings to students",           on: false },
                { label: "Certificate Generation",    desc: "Automatically issue PDF certificates on completion",on: true  },
                { label: "Maintenance Mode",          desc: "Block all public access (use with caution)",       on: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button onClick={() => toast.success(`${item.label} toggled`)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${item.on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {item.on ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {item.on ? "On" : "Off"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-card rounded-2xl border border-destructive/30 p-5">
            <h2 className="font-semibold text-destructive mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Danger Zone
            </h2>
            <div className="space-y-3">
              {[
                { label: "Clear Cache",              desc: "Flush all server-side cache layers",           action: "Clear" },
                { label: "Force Re-index Search",    desc: "Rebuild the full-text search index",           action: "Re-index" },
                { label: "Reset Demo Data",          desc: "Restore factory demo data (non-destructive)",  action: "Reset" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-sm border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0 gap-2"
                    onClick={() => toast.warning(`${item.label} initiated`)}>
                    <RefreshCw className="w-3 h-3" /> {item.action}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Slide-out User Profile */}
      <UserProfileSlideout
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onAction={handleSlideoutAction}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedUserEmails.size}
        onClear={() => setSelectedUserEmails(new Set())}
        actions={bulkActions}
      />

      {/* Transcript Slip (Print View) */}
      <TranscriptSlip
        user={transcriptUser}
        onClose={() => setTranscriptUser(null)}
      />
    </div>
  );
}
