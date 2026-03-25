import { useState } from "react";
import { Briefcase, CheckCircle2, Clock, TrendingUp, Users, Building, MapPin, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Placement {
  id: number; studentName: string; avatar: string; program: string; company: string; role: string; location: string; startDate: string; status: "placed" | "interviewing" | "searching"; salary: string; feedback: number;
}

const statusConfig = {
  placed: { label: "Placed", bg: "bg-accent text-secondary" },
  interviewing: { label: "Interviewing", bg: "bg-amber-100 text-amber-700" },
  searching: { label: "Job Searching", bg: "bg-muted text-muted-foreground" },
};

export default function PlacementTrackingPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [filter, setFilter] = useState<"all" | "placed" | "interviewing" | "searching">("all");
  const [programFilter, setProgramFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    studentName: "",
    program: "",
    company: "",
    role: "",
    location: "",
    startDate: "",
    status: "interviewing" as "placed" | "interviewing" | "searching",
    salary: "",
    feedback: 0,
  });

  const placedCount = placements.filter(p => p.status === "placed").length;
  const interviewingCount = placements.filter(p => p.status === "interviewing").length;

  const programs = ["All", ...new Set(placements.map(p => p.program))];

  const filtered = placements.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (programFilter !== "All" && p.program !== programFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Placement Outcomes</h1>
          <p className="text-muted-foreground text-sm">
            Track graduate employment and career outcomes.
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5 mr-2" /> Log Outcome
        </Button>
      </div>

      {/* KPI Summary — Dynamic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Placed", value: placedCount, icon: CheckCircle2 },
          { label: "Currently Interviewing", value: interviewingCount, icon: Clock },
          { label: "Active Candidates", value: placements.length, icon: Users },
          { label: "Placement Rate", value: placements.length > 0 ? `${Math.round((placedCount / placements.length) * 100)}%` : "0%", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div className="text-2xl font-light text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Pills & Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 w-full">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
            {(["all", "placed", "interviewing", "searching"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all capitalize border-0 ring-1 ring-black/5 dark:ring-white/10 ${
                  filter === f
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                    : "text-foreground bg-card hover:bg-muted/80"
                }`}>
                {f === "all" ? "All" : statusConfig[f].label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
            {programs.map(p => (
              <button key={p} onClick={() => setProgramFilter(p)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border-0 ring-1 ring-black/5 dark:ring-white/10 ${
                  programFilter === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground bg-card hover:bg-muted/80"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

      {/* Placement List */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        {showAdd && (
          <div className="p-6 border-b border-border/40 bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Log Placement Outcome</h3>
                <p className="text-sm text-muted-foreground mt-1">This is local until your placements API is wired.</p>
              </div>
              <Button variant="outline" className="rounded-full h-9 px-5 text-xs font-semibold" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Student Name *</label>
                <input
                  value={form.studentName}
                  onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Program *</label>
                <input
                  value={form.program}
                  onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))}
                  placeholder="e.g. Data Leadership Accelerator"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="placed">Placed</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="searching">Job Searching</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="e.g. Orange Careers"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Role</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  placeholder="e.g. Data Analyst"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Salary</label>
                <input
                  value={form.salary}
                  onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
                  placeholder="e.g. ₦300,000 / month"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Feedback (0-5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={form.feedback}
                  onChange={(e) => setForm((p) => ({ ...p, feedback: Math.max(0, Math.min(5, Number(e.target.value) || 0)) }))}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                onClick={() => {
                  if (!form.studentName.trim() || !form.program.trim()) return;

                  const avatar =
                    (form.studentName ?? "").trim().charAt(0).toUpperCase() || "?";

                  setPlacements((prev) => [
                    {
                      id: Date.now(),
                      avatar,
                      studentName: form.studentName.trim(),
                      program: form.program.trim(),
                      company: form.company.trim(),
                      role: form.role.trim(),
                      location: form.location.trim(),
                      startDate: form.startDate || "",
                      status: form.status,
                      salary: form.salary.trim(),
                      feedback: form.feedback,
                    },
                    ...prev,
                  ]);

                  setShowAdd(false);
                  setForm({
                    studentName: "",
                    program: "",
                    company: "",
                    role: "",
                    location: "",
                    startDate: "",
                    status: "interviewing",
                    salary: "",
                    feedback: 0,
                  });
                }}
                className="rounded-full h-9 px-6 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors"
              >
                Save Outcome
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-full h-9 px-5 text-xs font-semibold">
                Done
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-card/20">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No placements found</p>
            <p className="text-sm text-muted-foreground">Graduate placement records will appear here as they are tracked.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((p) => {
              const sc = statusConfig[p.status];
              return (
                <div key={p.id} className="px-6 py-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{p.studentName}</h3>
                          <p className="text-xs text-muted-foreground">{p.program}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.bg}`}>{sc.label}</span>
                      </div>
                      {p.status === "placed" && (
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{p.company}</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{p.role}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.startDate}</span>
                        </div>
                      )}
                      {p.status === "placed" && p.feedback > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < p.feedback ? "text-yellow-500 fill-yellow-500" : "text-border"}`} />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">Employer satisfaction</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
