import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen, Users, Clock, Plus, Download, ChevronRight,
  BarChart2, Bell, CheckCircle2, AlertCircle, Search,
  Edit, Trash2, Mail, Filter, TrendingUp, Award,
  CalendarDays, BookOpen, UserPlus, RefreshCw, Check, Zap, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserProfileSlideout, { SlideoutUser } from "../../components/dashboard/UserProfileSlideout";
import BulkActionBar from "../../components/dashboard/BulkActionBar";
import TranscriptSlip from "../../components/dashboard/TranscriptSlip";

const programs = [
  {
    id: 1, title: "Women in Data Science 2026", cohort: "Cohort 3",
    participants: 145, capacity: 200, completionRate: 72,
    deadline: "Mar 30, 2026", status: "active",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=160&fit=crop", courses: 5,
    enrollmentOpen: true,
  },
  {
    id: 2, title: "Startup Founders Accelerator", cohort: "Cohort 1",
    participants: 80, capacity: 100, completionRate: 45,
    deadline: "Apr 15, 2026", status: "active",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300&h=160&fit=crop", courses: 8,
    enrollmentOpen: true,
  },
  {
    id: 3, title: "Leadership Excellence Program", cohort: "Cohort 2",
    participants: 60, capacity: 60, completionRate: 100,
    deadline: "Feb 28, 2026", status: "completed",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=160&fit=crop", courses: 6,
    enrollmentOpen: false,
  },
];

const stats = [
  { label: "Active Programs",    value: "2",   icon: FolderOpen,   change: "+1 this month" },
  { label: "Total Participants", value: "285", icon: Users,        change: "+32 this week" },
  { label: "Avg. Completion",    value: "72%", icon: CheckCircle2, change: "+4% vs last" },
  { label: "At Risk Learners",   value: "14",  icon: AlertCircle,  change: "needs attention" },
];

const participants = [
  { name: "Chioma Eze",      email: "chioma@gmail.com",   program: "Women in Data Science", progress: 85, status: "on-track",  lastActive: "Today" },
  { name: "Fatima Hassan",   email: "fatima@uni.ng",      program: "Women in Data Science", progress: 20, status: "at-risk",   lastActive: "6 days ago" },
  { name: "Amara Osei",      email: "amara@gmail.com",    program: "Startup Founders",      progress: 60, status: "on-track",  lastActive: "Yesterday" },
  { name: "Nkechi Adeyemi",  email: "nkechi@corp.com",    program: "Startup Founders",      progress: 10, status: "at-risk",   lastActive: "12 days ago" },
  { name: "Grace Mensah",    email: "grace@outlook.com",  program: "Women in Data Science", progress: 95, status: "on-track",  lastActive: "Today" },
  { name: "Adaeze Okeke",    email: "adaeze@gmail.com",   program: "Startup Founders",      progress: 75, status: "on-track",  lastActive: "2 days ago" },
  { name: "Ibukun Taiwo",    email: "ibukun@corp.com",    program: "Women in Data Science", progress: 35, status: "at-risk",   lastActive: "9 days ago" },
];

const pendingApplications = [
  { name: "Zainab Aliyu",    email: "zainab@gmail.com",   program: "Women in Data Science", applied: "Mar 12, 2026" },
  { name: "Blessing Udoh",   email: "blessing@corp.com",  program: "Startup Founders",      applied: "Mar 11, 2026" },
  { name: "Oluchi Ibe",      email: "oluchi@gmail.com",   program: "Women in Data Science", applied: "Mar 10, 2026" },
];

export default function ProgramManagerDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "enrollment" | "reports" | "insights">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<SlideoutUser | null>(null);
  const [selectedParticipantEmails, setSelectedParticipantEmails] = useState<Set<string>>(new Set());
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
        toast.error(`Removed from program: ${user.name}`);
        setSelectedParticipant(null);
        break;
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (email: string) => {
    const newDocs = new Set(selectedParticipantEmails);
    if (newDocs.has(email)) newDocs.delete(email);
    else newDocs.add(email);
    setSelectedParticipantEmails(newDocs);
  };

  const toggleAll = () => {
    if (selectedParticipantEmails.size === filteredParticipants.length) setSelectedParticipantEmails(new Set());
    else setSelectedParticipantEmails(new Set(filteredParticipants.map(p => p.email)));
  };

  const bulkActions = [
    { icon: Mail, label: "Remind All", onClick: () => toast.success(`Sending reminder to ${selectedParticipantEmails.size} participants.`) },
    { icon: Award, label: "Issue Certificates", onClick: () => toast.success(`Issued ${selectedParticipantEmails.size} certificates.`) },
    { icon: Download, label: "Export Progress", onClick: () => {
      const selected = filteredParticipants.filter(p => selectedParticipantEmails.has(p.email));
      const csvContent = [
        ["Name", "Email", "Program", "Progress", "Status", "Last Active"],
        ...selected.map(p => [`"${p.name}"`, `"${p.email}"`, `"${p.program}"`, `"${p.progress}%"`, `"${p.status}"`, `"${p.lastActive}"`])
      ].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `SLA_Participants_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success(`Exported ${selected.length} participants to CSV`);
      setSelectedParticipantEmails(new Set());
    }},
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Program Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back, {appUser?.name?.split(" ")[0] ?? "Manager"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-border text-sm flex items-center gap-2"
            onClick={() => {
              const csvContent = [
                ["Name", "Email", "Program", "Progress", "Status", "Last Active"],
                ...filteredParticipants.map(p => [`"${p.name}"`, `"${p.email}"`, `"${p.program}"`, `"${p.progress}%"`, `"${p.status}"`, `"${p.lastActive}"`])
              ].map(e => e.join(",")).join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `SLA_All_Participants_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              toast.success("Full participant list exported!");
            }}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2"
            onClick={() => toast.info("Use the Programs tab to create a new program")}>
            <Plus className="w-4 h-4" /> New Program
          </Button>
        </div>
      </motion.div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit">
        {(["overview", "participants", "enrollment", "reports", "insights"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-brand-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl p-5 border border-border shadow-brand-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary">
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-display text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                <div className="text-[10px] text-primary mt-1 font-medium">{s.change}</div>
              </motion.div>
            ))}
          </div>

          {/* Programs grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">Your Programs</h2>
              <Link to="/dashboard/programs" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((prog, i) => (
                <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-sm transition-shadow group">
                  <div className="relative h-32 overflow-hidden">
                    <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        prog.status === "active" ? "bg-emerald-500 text-white" : "bg-muted/90 text-foreground"
                      }`}>{prog.status === "active" ? "Active" : "Completed"}</span>
                      {prog.enrollmentOpen && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary text-primary-foreground">Open</span>}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-bold text-white line-clamp-1">{prog.title}</h3>
                      <p className="text-xs text-white/70">{prog.cohort} &bull; {prog.courses} courses</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{prog.participants}/{prog.capacity} enrolled</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{prog.deadline}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-semibold text-foreground">{prog.completionRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${prog.completionRate === 100 ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${prog.completionRate}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 text-xs py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1 text-foreground"
                        onClick={() => toast.info(`Analytics for ${prog.title}`)}>
                        <BarChart2 className="w-3 h-3" /> Analytics
                      </button>
                      <button className="flex-1 text-xs py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1 text-foreground"
                        onClick={() => toast.success(`Reminder sent to ${prog.participants} participants`)}>
                        <Bell className="w-3 h-3" /> Remind All
                      </button>
                      <button className="text-xs py-2 px-3 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1 text-foreground"
                        onClick={() => toast.info(`Editing ${prog.title}`)}>
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* New program card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                onClick={() => toast.info("Program creation coming soon")}
                className="bg-muted/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary/30 hover:bg-muted/50 transition-all group min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">Create New Program</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ PARTICIPANTS ═══ */}
      {activeTab === "participants" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search participants…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-sm gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
              <Button size="sm" className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 gap-2"
                onClick={() => toast.success("Bulk reminder sent!")}>
                <Mail className="w-4 h-4" /> Email At-Risk
              </Button>
            </div>
          </div>

          {/* At-risk summary */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "On Track",    count: filteredParticipants.filter(p => p.status === "on-track").length, color: "text-emerald-600 bg-emerald-50" },
              { label: "At Risk",     count: filteredParticipants.filter(p => p.status === "at-risk").length,  color: "text-red-600 bg-red-50" },
              { label: "Total",       count: filteredParticipants.length,                                       color: "text-primary bg-accent" },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 flex items-center gap-3 ${s.color}`}>
                <div className="text-2xl font-bold font-display">{s.count}</div>
                <div className="text-sm font-semibold">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={filteredParticipants.length > 0 && selectedParticipantEmails.size === filteredParticipants.length}
                        onChange={toggleAll}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background"
                      />
                    </th>
                    {["Participant","Program","Progress","Last Active","Status","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredParticipants.map((p, i) => (
                    <tr key={i} className={`hover:bg-muted/30 transition-colors ${selectedParticipantEmails.has(p.email) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedParticipantEmails.has(p.email)}
                          onChange={() => toggleSelection(p.email)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{p.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px]"><span className="line-clamp-1">{p.program}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.status === "on-track" ? "bg-primary" : "bg-destructive"}`}
                              style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastActive}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          p.status === "on-track" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>{p.status === "on-track" ? "On Track" : "At Risk"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 text-xs">
                          <button className="text-primary hover:underline font-medium flex items-center gap-1" onClick={() => toast.success(`Reminder sent to ${p.name}`)}>
                            <Bell className="w-3 h-3" /> Remind
                          </button>
                          <button
                            className="bg-primary/10 px-2 py-1 rounded text-primary hover:underline font-medium flex items-center gap-1"
                            onClick={() => setSelectedParticipant({
                              name: p.name,
                              email: p.email,
                              role: "student",
                              joined: "Enrolled in " + p.program,
                              status: p.status,
                              progress: p.progress,
                            })}
                          >
                            <ChevronRight className="w-3 h-3" /> View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ ENROLLMENT ═══ */}
      {activeTab === "enrollment" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {programs.filter(p => p.status === "active").map(prog => (
              <div key={prog.id} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{prog.title}</h3>
                    <p className="text-xs text-muted-foreground">{prog.cohort}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${prog.enrollmentOpen ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {prog.enrollmentOpen ? "Enrollment Open" : "Closed"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enrolled</span>
                    <span className="font-semibold text-foreground">{prog.participants} / {prog.capacity}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(prog.participants / prog.capacity) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{prog.capacity - prog.participants} seats remaining</span>
                    <span className="text-primary font-semibold">{Math.round((prog.participants / prog.capacity) * 100)}% full</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs gap-1"
                    onClick={() => toast.success(`Enrollment ${prog.enrollmentOpen ? "closed" : "opened"} for ${prog.title}`)}>
                    {prog.enrollmentOpen ? "Close Enrollment" : "Open Enrollment"}
                  </Button>
                  <Button size="sm" className="flex-1 gradient-card text-primary-foreground rounded-xl text-xs hover:opacity-90 gap-1"
                    onClick={() => toast.info("Adding participants manually")}>
                    <UserPlus className="w-3 h-3" /> Enroll Manually
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pending applications */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                Pending Applications
                <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">{pendingApplications.length}</span>
              </h2>
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => toast.success("All approved!")}>
                <Check className="w-3 h-3" /> Approve All
              </Button>
            </div>
            <div className="divide-y divide-border">
              {pendingApplications.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{a.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.email} &bull; Applied {a.applied}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{a.program}</span>
                    <Button size="sm" className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => toast.success(`${a.name} approved!`)}>
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs text-destructive border-destructive/30 gap-1" onClick={() => toast.error(`${a.name} declined.`)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ REPORTS ═══ */}
      {activeTab === "reports" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Completion Rate",  value: "72%",    icon: CheckCircle2, sub: "+4% vs last cohort" },
              { label: "Avg. Progress",    value: "61%",    icon: TrendingUp,   sub: "across all programs" },
              { label: "Certificates",     value: "118",    icon: Award,        sub: "issued this quarter" },
              { label: "Drop-off Rate",    value: "8.4%",   icon: AlertCircle,  sub: "-1.2% improvement" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary mb-3">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold font-display text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                <div className="text-[10px] text-primary mt-1 font-medium">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Per-program breakdown */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4">Per-Program Completion Breakdown</h2>
            <div className="space-y-4">
              {programs.map(prog => (
                <div key={prog.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">{prog.title}</span>
                    <span className="font-bold text-foreground">{prog.completionRate}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      prog.completionRate === 100 ? "bg-emerald-500" :
                      prog.completionRate >= 70   ? "bg-primary" :
                                                    "bg-amber-400"
                    }`} style={{ width: `${prog.completionRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{prog.participants} participants</span>
                    <span>{Math.round(prog.participants * prog.completionRate / 100)} completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4">Export Reports</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Participant Progress CSV",   icon: Download },
                { label: "Completion Certificates PDF",icon: Award },
                { label: "Program Analytics Report",   icon: BarChart2 },
              ].map(r => (
                <button key={r.label} onClick={() => toast.success(`Downloading: ${r.label}`)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition-all text-left group">
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                    <r.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ SMART INSIGHTS ═══ */}
      {activeTab === "insights" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Smart Insights</h2>
              <p className="text-sm text-muted-foreground">AI-driven anomaly detection and cohort trends.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Alert Cards */}
              <div className="bg-card border border-amber-200/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-amber-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">High Drop-off Risk</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">14 students inactive in Startup Founders</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-lg">
                    Cohort 1 has seen a 20% decline in login frequency over the last 14 days. These students are at high risk of churning before Week 6.
                  </p>
                  <Button size="sm" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs">
                    Draft Engagement Email
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-emerald-200/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="w-24 h-24 text-emerald-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Positive Anomaly</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Women in Data Science completing 20% faster</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-lg">
                    Cohort 3 is moving through Module 4 significantly faster than previous cohorts. Consider unlocking Module 5 early to maintain momentum.
                  </p>
                  <Button size="sm" variant="outline" className="text-xs">
                    Review Curriculum Settings
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-primary" /> Top Performers
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground">G</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Grace Mensah</p>
                        <p className="text-xs text-muted-foreground">95% complete</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 flex items-center justify-center h-5 rounded-full">Top 1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent text-primary flex items-center justify-center text-xs font-bold">C</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Chioma Eze</p>
                        <p className="text-xs text-muted-foreground">85% complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Slide-out User Profile */}
      <UserProfileSlideout
        user={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        onAction={handleSlideoutAction}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedParticipantEmails.size}
        onClear={() => setSelectedParticipantEmails(new Set())}
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
