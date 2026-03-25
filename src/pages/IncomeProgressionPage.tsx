import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Briefcase, Award, Plus, Edit2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  education: "bg-accent text-accent-foreground",
  skill:     "bg-accent text-primary",
  career:    "bg-accent text-primary",
  goal:      "bg-muted text-muted-foreground border border-dashed border-border",
};

export default function IncomeProgressionPage() {
  const { appUser } = useAuth();
  const [tab, setTab] = useState<"my" | "cohort">("my");
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ date: "", title: "", type: "career" });
  const [milestoneList, setMilestoneList] = useState<Array<any>>([]);

  useEffect(() => {
    const load = async () => {
      if (!appUser?.id) return;
      const rows = await api.getCareerMilestones(appUser.id);
      setMilestoneList(
        (rows as any[]).map((r) => ({
          id: String(r.id),
          date: r.milestone_date ?? "",
          title: r.title ?? "",
          type: r.type ?? "career",
          achieved: Boolean(r.achieved),
        }))
      );
    };
    load();
  }, [appUser?.id]);

  const addMilestone = async () => {
    if (!appUser?.id) {
      toast.error("Please log in to add milestones.");
      return;
    }
    if (!newMilestone.title.trim()) return;

    const created = await api.addCareerMilestone({
      userId: appUser.id,
      milestoneDate: newMilestone.date,
      title: newMilestone.title.trim(),
      type: newMilestone.type as any,
      achieved: true,
    });

    if (!created) {
      toast.error("Failed to add milestone. Check Supabase connection/RLS.");
      return;
    }

    setMilestoneList((prev) => [
      ...prev,
      {
        id: String(created.id),
        date: created.milestone_date ?? "",
        title: created.title ?? newMilestone.title.trim(),
        type: created.type ?? newMilestone.type,
        achieved: Boolean(created.achieved),
      },
    ]);

    setNewMilestone({ date: "", title: "", type: "career" });
    setShowAddMilestone(false);
    toast.success("Milestone added.");
  };

  const { incomeHistory, cohortData, placements, currentIncome, growth } = useMemo(() => {
    const weightByType: Record<string, number> = {
      education: 100000,
      skill: 150000,
      career: 200000,
      goal: 50000,
    };

    const parsed = (milestoneList ?? [])
      .map((m) => {
        const d = new Date(m.date);
        if (isNaN(d.getTime())) return null;

        const monthLabel = d.toLocaleString("en-US", { month: "short", year: "numeric" });
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return {
          ...m,
          parsedDate: d,
          monthLabel,
          monthKey,
          weight: weightByType[m.type] ?? 0,
        };
      })
      .filter(Boolean) as Array<any>;

    parsed.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const baseIncome = 0;
    let cumulativeIncome = baseIncome;

    // Build chart points + placement rows from milestones (not static arrays)
    const incomePoints: Array<{ month: string; income: number }> = [];
    const placementRows: Array<any> = [];

    for (const m of parsed) {
      const preIncome = cumulativeIncome;
      cumulativeIncome = cumulativeIncome + (m.weight ?? 0);

      incomePoints.push({ month: m.monthLabel, income: cumulativeIncome });

      const status = m.type === "career" ? "placed" : "in_progress";
      placementRows.push({
        id: m.id,
        name: appUser?.name ?? "Participant",
        program: m.type === "goal" ? "Goal Tracking" : (m.title ?? "Program"),
        preIncome,
        postIncome: cumulativeIncome,
        increase: cumulativeIncome - preIncome,
        employer: "",
        status,
      });
    }

    // For chart: compress to last income per month.
    const byMonth = new Map<string, { month: string; income: number }>();
    for (const p of incomePoints) {
      // Keep the latest point for that month.
      const monthKey = p.month; // month label is unique enough for UI use
      byMonth.set(monthKey, p);
    }
    const incomeHistory = Array.from(byMonth.values());

    // Growth KPI based on first/last chart points
    const startIncome = incomeHistory.length > 0 ? incomeHistory[0].income : 0;
    const endIncome = incomeHistory.length > 0 ? incomeHistory[incomeHistory.length - 1].income : 0;
    const growth = startIncome > 0 ? Math.round(((endIncome - startIncome) / startIncome) * 100) : 0;

    // Cohort bars: average income grouped by milestone type
    const byType = new Map<string, { sum: number; count: number }>();
    for (const row of placementRows) {
      const t = parsed.find((p) => p.id === row.id)?.type ?? "career";
      const entry = byType.get(t) ?? { sum: 0, count: 0 };
      entry.sum += row.postIncome ?? 0;
      entry.count += 1;
      byType.set(t, entry);
    }

    const cohortData = Array.from(byType.entries()).map(([t, v]) => ({
      name: t === "goal" ? "Goals" : t[0].toUpperCase() + t.slice(1),
      avg: Math.round(v.count > 0 ? v.sum / v.count : 0),
    }));

    return {
      incomeHistory,
      cohortData,
      placements: placementRows,
      currentIncome: endIncome,
      growth,
    };
  }, [appUser?.name, milestoneList]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Income & Career Progression</h1>
          <p className="text-muted-foreground text-sm">Track your financial and career growth journey from pre-enrollment to placement.</p>
        </div>
        <div className="flex bg-muted/50 p-1.5 rounded-full gap-1 items-center overflow-x-auto">
          <button onClick={() => setTab("my")} className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${tab === "my" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>My Progress</button>
          <button onClick={() => setTab("cohort")} className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${tab === "cohort" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>Cohort Analytics</button>
        </div>
      </div>

      {tab === "my" && (
        <div className="space-y-8">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: DollarSign, label: "Current Income",  value: currentIncome > 0 ? `₦${currentIncome.toLocaleString()}` : '—',    sub: "per month",          color: "text-[#0056D2]" },
              { icon: TrendingUp, label: "Income Growth",   value: growth > 0 ? `+${growth}%` : '—', sub: "since SLA enrollment",color: "text-emerald-600" },
              { icon: Briefcase,  label: "Current Role",    value: "Pending", sub: "Awaiting Data",     color: "text-foreground" },
              { icon: Award,      label: "Certificates",    value: "0",            sub: "completed",          color: "text-[#0056D2]" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
                </div>
                <div className={`font-display text-3xl font-light ${color} mb-1.5`}>{value}</div>
                <div className="text-xs text-muted-foreground font-medium">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income chart */}
            <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
              <h3 className="font-display font-semibold text-lg text-foreground mb-6">Income Over Time (₦/month)</h3>
              {incomeHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0">
                  <TrendingUp className="w-8 h-8 opacity-20 mb-3" />
                  <p className="text-sm font-medium text-foreground">Waiting for income data</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">Chart will track your progression as career milestones are reported.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={incomeHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0056D2" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0056D2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 12% 88%)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${v/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "Monthly Income"]} />
                    <Area type="monotone" dataKey="income" stroke="#0056D2" fill="url(#incomeGrad)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Career timeline */}
            <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-lg text-foreground">Career Milestones</h3>
                <Button variant="outline" onClick={() => setShowAddMilestone(true)} className="rounded-full h-9 px-5 text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-2" /> Add Milestone
                </Button>
              </div>

            {showAddMilestone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-muted/40 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={newMilestone.date} onChange={e => setNewMilestone(p => ({ ...p, date: e.target.value }))} placeholder="Date (e.g. Jun 2026)"
                    className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <select value={newMilestone.type} onChange={e => setNewMilestone(p => ({ ...p, type: e.target.value }))}
                    className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none">
                    <option value="career">Career</option>
                    <option value="education">Education</option>
                    <option value="skill">Skill</option>
                    <option value="goal">Goal</option>
                  </select>
                </div>
                <input value={newMilestone.title} onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))} placeholder="Milestone description"
                  className="w-full px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addMilestone} className="rounded-xl gradient-card text-primary-foreground text-xs">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddMilestone(false)} className="rounded-xl text-xs">Cancel</Button>
                </div>
              </motion.div>
            )}

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
                <div className="space-y-4">
                  {milestoneList.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground pl-10">
                       <p className="text-sm">No milestones logged yet.</p>
                       <p className="text-xs mt-1">Click "Add Milestone" to start tracking.</p>
                    </div>
                  ) : (
                    milestoneList.map((m, i) => (
                      <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="flex gap-4 pl-10 relative">
                        <div className={`absolute left-3 top-2 w-2.5 h-2.5 rounded-full border-2 ${m.achieved ? "bg-[#0056D2] border-[#0056D2]" : "bg-card border-border/80"}`} />
                        <div className={`flex-1 p-4 rounded-xl ${m.achieved ? "bg-muted/30" : "bg-card border border-dashed border-border/60"}`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className={`text-sm font-semibold ${m.achieved ? "text-foreground" : "text-muted-foreground"}`}>{m.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 font-medium">{m.date}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md ${typeColors[m.type]}`}>{m.type}</span>
                              {!m.achieved && <Target className="w-4 h-4 text-muted-foreground opacity-50" />}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "cohort" && (
        <div className="space-y-8">
          {/* Cohort income chart */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">Average Income by Program Stage</h3>
            <p className="text-sm text-muted-foreground mb-6">Across all She Leads Africa alumni (2025–2026)</p>
            {cohortData.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0">
                  <TrendingUp className="w-8 h-8 opacity-20 mb-3" />
                  <p className="text-sm font-medium text-foreground">Awaiting Aggregation</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cohortData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 12% 88%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${v/1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "Avg. Monthly Income"]} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="avg" fill="#0056D2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Placement table */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-0 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/40 bg-muted/20">
              <h3 className="font-display font-semibold text-lg text-foreground">Participant Placement Outcomes</h3>
              <Button variant="outline" className="rounded-full h-9 px-5 text-xs font-semibold bg-transparent border-border hover:bg-muted">
                <Edit2 className="w-3.5 h-3.5 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-[#f5f9ff] dark:bg-muted/10 border-b border-border/40">
                  <tr>
                    {["Participant", "Program", "Pre-SLA", "Post-SLA", "Growth", "Employer", "Status"].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold tracking-widest uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {placements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                         <Target className="w-8 h-8 opacity-20 mx-auto mb-3" />
                         <p className="text-sm font-medium">No placement data available.</p>
                      </td>
                    </tr>
                  ) : (
                    placements.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-700 shrink-0 border border-slate-200">
                              {(p.name ?? "").charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground text-sm whitespace-nowrap">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{p.program}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{p.preIncome}</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">{p.postIncome}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold ${p.increase !== "—" ? "text-emerald-600" : "text-muted-foreground"}`}>{p.increase}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{p.employer || "Not specified"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] px-3 py-1 rounded-md font-bold uppercase tracking-wider ${p.status === "placed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                            {p.status === "placed" ? "Placed" : "In Progress"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
