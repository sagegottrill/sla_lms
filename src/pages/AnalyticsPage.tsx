import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, Award, DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

const kpis = [
  { label: "Monthly Active Users", value: "28,420", change: "+14%", icon: Users, color: "text-primary bg-accent" },
  { label: "Course Enrollments", value: "4,850", change: "+22%", icon: BookOpen, color: "text-secondary bg-accent" },
  { label: "Completion Rate", value: "78%", change: "+3%", icon: Award, color: "text-secondary bg-accent" },
  { label: "Revenue", value: "₦84,320", change: "+18%", icon: DollarSign, color: "text-primary bg-accent" },
];

const funnelData = [
  { stage: "Visitors", count: 92400, pct: 100, color: "bg-primary" },
  { stage: "Sign Ups", count: 18480, pct: 20, color: "bg-primary/80" },
  { stage: "Course Views", count: 11088, pct: 12, color: "bg-primary/60" },
  { stage: "Enrolled", count: 4850, pct: 5.2, color: "bg-secondary" },
  { stage: "Completed", count: 3783, pct: 4.1, color: "bg-secondary/80" },
];

const topCourses = [
  { title: "Data Analytics with Python", enrollments: 8420, revenue: 74898, rate: 85 },
  { title: "Women in Leadership", enrollments: 12800, revenue: 0, rate: 92 },
  { title: "Full-Stack Web Development", enrollments: 6105, revenue: 72650, rate: 72 },
  { title: "Entrepreneurship & Business", enrollments: 11200, revenue: 110880, rate: 78 },
  { title: "Financial Modelling", enrollments: 4320, revenue: 34128, rate: 69 },
];

const monthlyEnrollments = [280, 410, 380, 520, 480, 620, 560, 710, 650, 820, 780, 940];
const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const chartData = months.map((m, i) => ({ name: m, enrollments: monthlyEnrollments[i] }));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{payload[0].value.toLocaleString()} enrollments</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 12 months");

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Live insights · March 2026</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); toast.info(`Showing data for: ${e.target.value}`); }}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-card focus:outline-none text-foreground"
          >
            <option>Last 12 months</option><option>Last 30 days</option><option>This year</option>
          </select>
          <Button variant="outline" className="rounded-xl text-sm flex items-center gap-2" onClick={() => toast.success("Analytics report exported!")}>
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-xl text-foreground">{k.value}</div>
              <div className="text-xs text-muted-foreground truncate">{k.label}</div>
              <div className="text-xs text-secondary font-semibold">{k.change} vs last month</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment trend — Recharts */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Monthly Enrollments</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220, 14%, 96%)" }} />
              <Bar dataKey="enrollments" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? "hsl(12, 91%, 64%)" : "hsl(204, 100%, 43%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnelData.map((item, i) => (
              <div key={item.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{item.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                    <span className="text-xs text-secondary font-semibold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top courses */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Top Performing Courses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead className="bg-muted/50">
              <tr>{["Course", "Enrollments", "Revenue", "Completion Rate", "Performance"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topCourses.map((c, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground max-w-xs"><div className="truncate">{c.title}</div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.enrollments.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-secondary">{c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : "Free"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${c.rate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{c.rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      c.rate >= 80 ? "bg-accent text-primary" :
                      c.rate >= 70 ? "bg-accent text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {c.rate >= 80 ? "Excellent" : c.rate >= 70 ? "Good" : "Average"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
