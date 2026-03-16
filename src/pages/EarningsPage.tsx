import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Download, Users, BookOpen, Calendar, ArrowUpRight, CheckCircle2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const payouts = [
  { id: 1, period: "March 2026", courses: 2, totalEnrollments: 340, grossRevenue: 9400, rate: "Fixed + Per-Student", payout: 3200, status: "pending", date: "Mar 25, 2026" },
  { id: 2, period: "February 2026", courses: 2, totalEnrollments: 290, grossRevenue: 7800, rate: "Fixed + Per-Student", payout: 2800, status: "paid", date: "Feb 25, 2026" },
  { id: 3, period: "January 2026", courses: 2, totalEnrollments: 310, grossRevenue: 8200, rate: "Fixed + Per-Student", payout: 2900, status: "paid", date: "Jan 25, 2026" },
  { id: 4, period: "December 2025", courses: 2, totalEnrollments: 250, grossRevenue: 6500, rate: "Fixed + Per-Student", payout: 2400, status: "paid", date: "Dec 27, 2025" },
  { id: 5, period: "November 2025", courses: 2, totalEnrollments: 215, grossRevenue: 5600, rate: "Fixed + Per-Student", payout: 2100, status: "paid", date: "Nov 25, 2025" },
];

const monthlyPayouts = [1200, 1500, 1400, 1800, 1700, 2100, 1900, 2300, 2100, 2400, 2800, 3200];
const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const chartData = months.map((m, i) => ({ name: m, payout: monthlyPayouts[i] }));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs text-secondary font-semibold">SLA Payout: ${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function EarningsPage() {
  const [tab, setTab] = useState<"overview" | "details">("overview");

  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((a, p) => a + p.payout, 0);
  const totalPending = payouts.filter((p) => p.status === "pending").reduce((a, p) => a + p.payout, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Earnings & Payouts</h1>
          <p className="text-muted-foreground text-sm mt-1">Your compensation from She Leads Africa</p>
        </div>
        <Button variant="outline" className="rounded-xl flex items-center gap-2 text-sm" onClick={() => toast.success("Payout statement downloaded!")}>
          <Download className="w-4 h-4" /> Download Statement
        </Button>
      </div>

      {/* How it works banner */}
      <div className="bg-accent rounded-2xl border border-border p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-1">How instructor payments work</p>
          <p className="text-muted-foreground">
            Students pay She Leads Africa directly for courses. SLA compensates instructors through
            monthly payouts based on your <strong className="text-foreground">fixed rate + per-student bonus</strong>.
            Payouts are processed on the 25th of each month via bank transfer.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned (Paid)", value: `$${totalPaid.toLocaleString()}`, change: "+18%", icon: DollarSign, color: "text-secondary bg-accent" },
          { label: "Pending Payout", value: `$${totalPending.toLocaleString()}`, change: "Mar 25", icon: Clock, color: "text-primary bg-accent" },
          { label: "Total Students", value: "11,630", change: "+240", icon: Users, color: "text-primary bg-accent" },
          { label: "Active Courses", value: "2", change: "", icon: BookOpen, color: "text-muted-foreground bg-muted" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div>
              <div className="font-display font-bold text-xl text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              {s.change && <div className="text-xs text-secondary font-semibold">{s.change}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payout chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-foreground">Monthly Payouts from SLA</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Apr 2025 – Mar 2026</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(204, 100%, 43%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(204, 100%, 43%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="payout" stroke="hsl(204, 100%, 43%)" strokeWidth={2.5} fill="url(#payoutGradient)" dot={{ r: 3, fill: "hsl(204, 100%, 43%)" }} activeDot={{ r: 5, fill: "hsl(12, 91%, 64%)" }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">This month (pending): </span>
            <span className="font-bold text-foreground">₦3,200,000</span>
          </div>
          <div className="flex items-center gap-1 text-secondary text-sm font-semibold"><ArrowUpRight className="w-4 h-4" />+14% vs last month</div>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Payout History</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Paid by She Leads Africa
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>{["Period", "Courses", "Enrollments", "Platform Revenue", "Your Payout", "Payment Date", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{p.period}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.courses}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.totalEnrollments}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">₦{p.grossRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-secondary">₦{p.payout.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.status === "paid" ? "bg-accent text-primary" : "bg-primary/10 text-primary"}`}>
                      {p.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout details card */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Your Compensation Structure</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Base Monthly Fee</p>
            <p className="text-lg font-bold text-foreground">₦200,000</p>
            <p className="text-xs text-muted-foreground mt-1">Per active course</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/5 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Per-Student Bonus</p>
            <p className="text-lg font-bold text-secondary">₦5,000</p>
            <p className="text-xs text-muted-foreground mt-1">Per new enrollment</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Payout Schedule</p>
            <p className="text-lg font-bold text-foreground">25th</p>
            <p className="text-xs text-muted-foreground mt-1">Monthly via bank transfer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
