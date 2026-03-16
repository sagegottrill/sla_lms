import { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Target, Mail, DollarSign, ArrowUpRight, ArrowDownRight, Eye, MousePointer, UserPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";

const funnelData = [
  { stage: "Page Views", count: 12400, color: "#0C3B2E" },
  { stage: "Email Captured", count: 3200, color: "#6D9773" },
  { stage: "Registered", count: 1800, color: "#D4A843" },
  { stage: "Enrolled", count: 960, color: "#B68D40" },
  { stage: "Completed", count: 680, color: "#0C3B2E" },
];

const monthlyLeads = [
  { month: "Sep", leads: 180, converted: 45 },
  { month: "Oct", leads: 220, converted: 62 },
  { month: "Nov", leads: 310, converted: 88 },
  { month: "Dec", leads: 280, converted: 95 },
  { month: "Jan", leads: 390, converted: 130 },
  { month: "Feb", leads: 450, converted: 168 },
  { month: "Mar", leads: 520, converted: 195 },
];

const sourcesData = [
  { source: "Organic Search", leads: 1240, pct: 38 },
  { source: "Social Media", leads: 860, pct: 26 },
  { source: "Email Campaigns", leads: 520, pct: 16 },
  { source: "Referrals", leads: 380, pct: 12 },
  { source: "Paid Ads", leads: 200, pct: 6 },
  { source: "Direct", leads: 80, pct: 2 },
];

const recentLeads: any[] = [];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  enrolled: "bg-accent text-secondary",
};

export default function LeadDashboardPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lead Capture & Conversion</h1>
          <p className="text-muted-foreground text-sm mt-1">Track visitor-to-student conversion funnel</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {[{ k: "7d", l: "7 Days" }, { k: "30d", l: "30 Days" }, { k: "90d", l: "90 Days" }].map(({ k, l }) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === k ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: "3,280", change: "+18%", up: true, icon: Users },
          { label: "Conversion Rate", value: "30.2%", change: "+3.5%", up: true, icon: Target },
          { label: "Emails Captured", value: "1,840", change: "+24%", up: true, icon: Mail },
          { label: "Revenue from Leads", value: '₦48.2M', change: "+12%", up: true, icon: DollarSign },
        ].map(({ label, value, change, up, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-5 h-5 text-primary" />
              <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? "text-secondary" : "text-destructive"}`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{change}
              </span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads over time */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Leads & Conversions Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyLeads}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0C3B2E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0C3B2E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" stroke="#0C3B2E" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
              <Area type="monotone" dataKey="converted" stroke="#D4A843" fill="url(#convGrad)" strokeWidth={2} name="Converted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion funnel */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxCount = funnelData[0].count;
              const pct = (stage.count / maxCount) * 100;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground font-medium">{stage.stage}</span>
                    <span className="text-sm font-bold text-foreground">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-6 bg-muted rounded-lg overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-lg" style={{ backgroundColor: stage.color }} />
                  </div>
                  {i > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{((stage.count / funnelData[i - 1].count) * 100).toFixed(1)}% from previous</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead sources */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Lead Sources</h3>
          <div className="space-y-3">
            {sourcesData.map(s => (
              <div key={s.source} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{s.source}</span>
                    <span className="text-xs text-muted-foreground">{s.leads.toLocaleString()} ({s.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full gradient-card" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Leads</h3>
          <div className="flex flex-col items-center justify-center py-10 bg-muted/20 rounded-xl border border-dashed border-border h-[260px]">
            <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No recent leads</p>
            <p className="text-[10px] text-muted-foreground mt-1">New leads will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
