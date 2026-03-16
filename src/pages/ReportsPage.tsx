import { useState } from "react";
import { motion } from "framer-motion";
import { Download, TrendingUp, Users, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const programStats = [
  { program: "Women in Data Science 2026", enrolled: 145, completed: 104, atRisk: 14, completionRate: 72, avgProgress: 68, quizAvg: 78 },
  { program: "Startup Founders Accelerator", enrolled: 80, completed: 36, atRisk: 8, completionRate: 45, avgProgress: 45, quizAvg: 65 },
  { program: "Leadership Excellence Program", enrolled: 60, completed: 60, atRisk: 0, completionRate: 100, avgProgress: 100, quizAvg: 91 },
];

const completionByWeek = [15, 28, 42, 38, 55, 62, 58, 70, 75, 80, 72, 85];
const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

const chartData = weeks.map((w, i) => ({ name: w, completion: completionByWeek[i] }));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs text-secondary font-semibold">{payload[0].value}% completion</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [program, setProgram] = useState("All Programs");

  const filteredStats = program === "All Programs"
    ? programStats
    : programStats.filter((p) => p.program === program);

  const totals = {
    enrolled: filteredStats.reduce((a, p) => a + p.enrolled, 0),
    completed: filteredStats.reduce((a, p) => a + p.completed, 0),
    atRisk: filteredStats.reduce((a, p) => a + p.atRisk, 0),
    avgRate: Math.round(filteredStats.reduce((a, p) => a + p.completionRate, 0) / (filteredStats.length || 1)),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Program performance insights</p>
        </div>
        <div className="flex gap-2">
          <select value={program} onChange={e => setProgram(e.target.value)} className="text-sm border border-border rounded-xl px-3 py-2 bg-card focus:outline-none">
            <option>All Programs</option>
            {programStats.map(p => <option key={p.program}>{p.program}</option>)}
          </select>
          <Button variant="outline" className="rounded-xl text-sm flex items-center gap-2" onClick={() => toast.success("CSV exported!")}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Enrolled", value: totals.enrolled, icon: Users, color: "text-primary bg-accent" },
          { label: "Completed", value: totals.completed, icon: CheckCircle2, color: "text-secondary bg-accent" },
          { label: "Avg Completion", value: `${totals.avgRate}%`, icon: TrendingUp, color: "text-secondary bg-accent" },
          { label: "At Risk", value: totals.atRisk, icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div><div className="font-bold text-xl text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </motion.div>
        ))}
      </div>

      {/* Completion trend — Recharts */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-5">
          Completion Rate Over Time {program !== "All Programs" && <span className="text-sm font-normal text-muted-foreground">— {program}</span>}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="completion" stroke="hsl(204, 100%, 43%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(204, 100%, 43%)" }} activeDot={{ r: 5, fill: "hsl(12, 91%, 64%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-program table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Program Comparison</h2>
          <Button size="sm" variant="outline" className="rounded-xl text-xs flex items-center gap-1.5" onClick={() => toast.info("Full report generation coming soon!")}>
            <FileText className="w-3.5 h-3.5" /> Full Report
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>{["Program", "Enrolled", "Completed", "At Risk", "Completion %", "Avg Progress", "Quiz Avg"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStats.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground max-w-xs"><div className="truncate">{p.program}</div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.enrolled}</td>
                  <td className="px-4 py-3 text-sm text-secondary font-semibold">{p.completed}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold ${p.atRisk > 0 ? "text-destructive" : "text-secondary"}`}>{p.atRisk}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.completionRate === 100 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${p.completionRate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{p.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.avgProgress}%</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold ${p.quizAvg >= 80 ? "text-secondary" : "text-gold"}`}>{p.quizAvg}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
