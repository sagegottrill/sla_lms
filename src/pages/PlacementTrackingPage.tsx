import { useState } from "react";
import { Briefcase, CheckCircle2, Clock, TrendingUp, Users, Building, MapPin, Calendar, Star, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePlacementOutcomes,
  useCreatePlacementMutation,
  useUpdatePlacementMutation,
  useDeletePlacementMutation,
} from "@/hooks/useQueries";

const statusConfig = {
  placed:       { label: "Placed",            bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  interviewing: { label: "Interviewing",       bg: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  searching:    { label: "Seeking placement",  bg: "bg-muted text-muted-foreground" },
};

const emptyForm = {
  studentName: "",
  program: "",
  company: "",
  role: "",
  location: "",
  startDate: "",
  status: "interviewing" as "placed" | "interviewing" | "searching",
  salary: "",
  feedback: 0,
};

export default function PlacementTrackingPage() {
  const { appUser } = useAuth();
  const { data: placements = [], isLoading } = usePlacementOutcomes();
  const createMutation  = useCreatePlacementMutation();
  const updateMutation  = useUpdatePlacementMutation();
  const deleteMutation  = useDeletePlacementMutation();

  const [filter, setFilter]               = useState<"all" | "placed" | "interviewing" | "searching">("all");
  const [programFilter, setProgramFilter] = useState("All");
  const [showAdd, setShowAdd]             = useState(false);
  const [form, setForm]                   = useState(emptyForm);

  const placedCount       = placements.filter((p: any) => p.status === "placed").length;
  const interviewingCount = placements.filter((p: any) => p.status === "interviewing").length;
  const programs          = ["All", ...Array.from(new Set(placements.map((p: any) => p.program).filter(Boolean)))];

  const filtered = placements.filter((p: any) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (programFilter !== "All" && p.program !== programFilter) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.studentName.trim() || !form.program.trim()) {
      toast.error("Student name and program are required.");
      return;
    }
    if (!appUser?.id) { toast.error("Please log in."); return; }

    createMutation.mutate({
      userId:      appUser.id,
      studentName: form.studentName.trim(),
      program:     form.program.trim(),
      company:     form.company.trim(),
      role:        form.role.trim(),
      location:    form.location.trim(),
      startDate:   form.startDate,
      status:      form.status,
      salary:      form.salary.trim(),
      feedback:    form.feedback,
    }, {
      onSuccess: () => {
        setShowAdd(false);
        setForm(emptyForm);
      },
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remove this placement record?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Placement Outcomes</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing placements…" : `Tracking ${placements.length} graduate employment outcomes.`}
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0 transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5 mr-2" /> Log Outcome
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Placed",           value: placedCount,                                                                                icon: CheckCircle2 },
          { label: "Currently Interviewing", value: interviewingCount,                                                                         icon: Clock },
          { label: "Active Candidates",      value: placements.length,                                                                         icon: Users },
          { label: "Placement Rate",         value: placements.length > 0 ? `${Math.round((placedCount / placements.length) * 100)}%` : "0%", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 text-center">
            <Icon className="w-4 h-4 text-muted-foreground/60 mx-auto mb-2" />
            <div className="text-2xl font-light text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
          {(["all", "placed", "interviewing", "searching"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all capitalize ${
                filter === f
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "text-foreground bg-card ring-1 ring-black/5 dark:ring-white/10 hover:bg-muted/80"
              }`}>
              {f === "all" ? "All" : statusConfig[f].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
          {programs.map(p => (
            <button key={p} onClick={() => setProgramFilter(p)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                programFilter === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground bg-card ring-1 ring-black/5 dark:ring-white/10 hover:bg-muted/80"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Add Form */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        {showAdd && (
          <div className="p-6 border-b border-border/40 bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Log Placement Outcome</h3>
                <p className="text-sm text-muted-foreground mt-1">Saved directly to Supabase.</p>
              </div>
              <Button variant="outline" className="rounded-full h-9 px-5 text-xs font-semibold" onClick={() => { setShowAdd(false); setForm(emptyForm); }}>
                Cancel
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Student Name *", key: "studentName", placeholder: "e.g. Jane Doe" },
                { label: "Program *",      key: "program",     placeholder: "e.g. Data Leadership Accelerator" },
                { label: "Company",        key: "company",     placeholder: "e.g. Orange Careers" },
                { label: "Role",           key: "role",        placeholder: "e.g. Data Analyst" },
                { label: "Location",       key: "location",    placeholder: "e.g. Lagos, Nigeria" },
                { label: "Salary",         key: "salary",      placeholder: "e.g. ₦300,000 / month" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status *</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="placed">Placed</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="searching">Seeking placement</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Feedback (0–5)</label>
                <input type="number" min={0} max={5} value={form.feedback}
                  onChange={e => setForm(p => ({ ...p, feedback: Math.max(0, Math.min(5, Number(e.target.value) || 0)) }))}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending}
                className="rounded-full h-9 px-6 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0"
              >
                {createMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Saving…</> : "Save Outcome"}
              </Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="rounded-full h-9 px-5 text-xs font-semibold">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Syncing placements…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card/20">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No placements found</p>
            <p className="text-sm text-muted-foreground">Graduate placement records will appear here as they are tracked.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((p: any) => {
              const sc = statusConfig[p.status as keyof typeof statusConfig] ?? statusConfig.searching;
              return (
                <div key={p.id} className="px-6 py-4 hover:bg-muted/10 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {(p.student_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{p.student_name}</h3>
                          <p className="text-xs text-muted-foreground">{p.program}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.bg}`}>{sc.label}</span>
                          {/* Quick status change */}
                          <select
                            value={p.status}
                            onChange={e => handleStatusChange(p.id, e.target.value)}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <option value="placed">Placed</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="searching">Searching</option>
                          </select>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {p.status === "placed" && (
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {p.company  && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{p.company}</span>}
                          {p.role     && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{p.role}</span>}
                          {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                          {p.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.start_date}</span>}
                          {p.salary   && <span className="font-semibold text-foreground">{p.salary}</span>}
                        </div>
                      )}
                      {p.status === "placed" && p.feedback > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < p.feedback ? "text-yellow-500 fill-yellow-500" : "text-border"}`} />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">Placement satisfaction</span>
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
