import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Briefcase, Award, Plus, Edit2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const incomeHistory = [
  { month: "Jan '25", income: 120000, role: "Finance Analyst" },
  { month: "Apr '25", income: 120000, role: "Finance Analyst" },
  { month: "Jul '25", income: 150000, role: "Finance Analyst (promoted)" },
  { month: "Oct '25", income: 150000, role: "Finance Analyst" },
  { month: "Jan '26", income: 210000, role: "Data Analyst" },
  { month: "Mar '26", income: 210000, role: "Data Analyst" },
];

const cohortData = [
  { name: "Pre-SLA", avg: 95000 },
  { name: "During",  avg: 120000 },
  { name: "6m Post", avg: 165000 },
  { name: "12m Post",avg: 210000 },
];

const milestones = [
  { id: 1, date: "Jan 2025", title: "Started Women in Data Science program",        type: "education", achieved: true },
  { id: 2, date: "Mar 2025", title: "Completed first Power BI project",              type: "skill",     achieved: true },
  { id: 3, date: "Jul 2025", title: "Promoted to Senior Finance Analyst",            type: "career",    achieved: true },
  { id: 4, date: "Jan 2026", title: "Transitioned to Data Analyst role (+40% salary)", type: "career", achieved: true },
  { id: 5, date: "Jun 2026", title: "Target: Senior Data Analyst",                   type: "goal",      achieved: false },
  { id: 6, date: "Dec 2026", title: 'Target: ₦2.5M/month income',                 type: "goal",      achieved: false },
];

const placements = [
  { id: 1, name: "Chioma Eze",    program: "Women in Data Science", preIncome: '₦250k',  postIncome: '₦1.5M', increase: "+131%", employer: "TechCorp Lagos",  status: "placed" },
  { id: 2, name: "Grace Mensah",  program: "Women in Data Science", preIncome: '₦400k', postIncome: '₦1.8M', increase: "+83%",  employer: "GTBank",          status: "placed" },
  { id: 3, name: "Amara Osei",    program: "Startup Founders",      preIncome: '₦1.2M',  postIncome: '₦1.2M', increase: "+150%", employer: "Self-employed",   status: "placed" },
  { id: 4, name: "Fatima Hassan", program: "Women in Data Science", preIncome: '₦300k',  postIncome: "—",     increase: "—",     employer: "Interviewing",    status: "in-progress" },
];

const typeColors: Record<string, string> = {
  education: "bg-accent text-accent-foreground",
  skill:     "bg-accent text-primary",
  career:    "bg-accent text-primary",
  goal:      "bg-muted text-muted-foreground border border-dashed border-border",
};

export default function IncomeProgressionPage() {
  const [tab, setTab] = useState<"my" | "cohort">("my");
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ date: "", title: "", type: "career" });
  const [milestoneList, setMilestoneList] = useState(milestones);

  const addMilestone = () => {
    if (!newMilestone.title) return;
    setMilestoneList(prev => [...prev, { id: Date.now(), ...newMilestone, achieved: false }]);
    setNewMilestone({ date: "", title: "", type: "career" });
    setShowAddMilestone(false);
  };

  const currentIncome = incomeHistory[incomeHistory.length - 1].income;
  const startIncome = incomeHistory[0].income;
  const growth = Math.round(((currentIncome - startIncome) / startIncome) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Income & Career Progression</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your financial and career growth journey</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl gap-1">
          <button onClick={() => setTab("my")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === "my" ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>My Progress</button>
          <button onClick={() => setTab("cohort")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === "cohort" ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Cohort Analytics</button>
        </div>
      </div>

      {tab === "my" && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: DollarSign, label: "Current Income",  value: '₦1,500,000',    sub: "per month",          color: "text-primary" },
              { icon: TrendingUp, label: "Income Growth",   value: `+${growth}%`, sub: "since SLA enrollment",color: "text-secondary" },
              { icon: Briefcase,  label: "Current Role",    value: "Data Analyst", sub: "TechCorp Lagos",     color: "text-foreground" },
              { icon: Award,      label: "Certificates",    value: "3",            sub: "completed",          color: "text-primary" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-card rounded-2xl border border-border p-4 shadow-brand-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className={`font-display text-xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Income chart */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Income Over Time (₦/month)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={incomeHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(204 100% 43%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(204 100% 43%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 12% 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${v/1000}k`} />
                <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "Monthly Income"]} />
                <Area type="monotone" dataKey="income" stroke="hsl(204 100% 43%)" fill="url(#incomeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Career timeline */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">Career Milestones</h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddMilestone(true)} className="rounded-xl text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Milestone
              </Button>
            </div>

            {showAddMilestone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-muted/40 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={newMilestone.date} onChange={e => setNewMilestone(p => ({ ...p, date: e.target.value }))} placeholder="Date (e.g. Jun 2026)"
                    className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <select value={newMilestone.type} onChange={e => setNewMilestone(p => ({ ...p, type: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
                    <option value="career">Career</option>
                    <option value="education">Education</option>
                    <option value="skill">Skill</option>
                    <option value="goal">Goal</option>
                  </select>
                </div>
                <input value={newMilestone.title} onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))} placeholder="Milestone description"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addMilestone} className="rounded-xl gradient-card text-primary-foreground text-xs">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddMilestone(false)} className="rounded-xl text-xs">Cancel</Button>
                </div>
              </motion.div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4">
                {milestoneList.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex gap-4 pl-10 relative">
                    <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 ${m.achieved ? "bg-primary border-primary" : "bg-background border-border"}`} />
                    <div className={`flex-1 p-3 rounded-xl ${m.achieved ? "bg-muted/40" : "bg-muted/20 border border-dashed border-border"}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className={`text-sm font-medium ${m.achieved ? "text-foreground" : "text-muted-foreground"}`}>{m.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColors[m.type]}`}>{m.type}</span>
                          {!m.achieved && <Target className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "cohort" && (
        <>
          {/* Cohort income chart */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-1">Average Income by Program Stage</h3>
            <p className="text-xs text-muted-foreground mb-4">Across all She Leads Africa alumni (2025–2026)</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 12% 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${v/1000}k`} />
                <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "Avg. Monthly Income"]} />
                <Bar dataKey="avg" fill="hsl(204 100% 43%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Placement table */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Participant Placement Outcomes</h3>
              <Button variant="outline" size="sm" className="rounded-xl text-xs flex items-center gap-1.5">
                <Edit2 className="w-3 h-3" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    {["Participant", "Program", "Pre-SLA", "Post-SLA", "Growth", "Employer", "Status"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {placements.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full gradient-card flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground text-xs whitespace-nowrap">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{p.program}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{p.preIncome}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-primary">{p.postIncome}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-bold ${p.increase !== "—" ? "text-secondary" : "text-muted-foreground"}`}>{p.increase}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{p.employer}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "placed" ? "bg-accent text-accent-foreground" : "bg-accent text-primary"}`}>
                          {p.status === "placed" ? "Placed" : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
