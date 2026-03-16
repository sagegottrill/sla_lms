import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, Clock, TrendingUp, Users, Building, MapPin, Calendar, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Placement {
  id: number; studentName: string; avatar: string; program: string; company: string; role: string; location: string; startDate: string; status: "placed" | "interviewing" | "searching"; salary: string; feedback: number;
}

const placements: Placement[] = [
  { id: 1, studentName: "Amara Osei", avatar: "AO", program: "Women in Data Science", company: "Flutterwave", role: "Data Analyst", location: "Lagos, Nigeria", startDate: "Mar 2026", status: "placed", salary: '₦18M/yr', feedback: 5 },
  { id: 2, studentName: "Fatima Hassan", avatar: "FH", program: "Women in Data Science", company: "Andela", role: "Business Intelligence Analyst", location: "Remote", startDate: "Feb 2026", status: "placed", salary: '₦15M/yr', feedback: 4 },
  { id: 3, studentName: "Ngozi Williams", avatar: "NW", program: "Digital Marketing Accelerator", company: "Jumia", role: "Marketing Manager", location: "Nairobi, Kenya", startDate: "Jan 2026", status: "placed", salary: '₦12M/yr', feedback: 5 },
  { id: 4, studentName: "Zara Mensah", avatar: "ZM", program: "Leadership Pipeline", company: "MTN Group", role: "Product Lead", location: "Johannesburg, SA", startDate: "—", status: "interviewing", salary: "—", feedback: 0 },
  { id: 5, studentName: "Kemi Adebayo", avatar: "KA", program: "Women in Data Science", company: "—", role: "—", location: "Accra, Ghana", startDate: "—", status: "searching", salary: "—", feedback: 0 },
  { id: 6, studentName: "Aisha Kamara", avatar: "AK", program: "Entrepreneurship Bootcamp", company: "Paystack", role: "Growth Associate", location: "Lagos, Nigeria", startDate: "Mar 2026", status: "placed", salary: '₦10M/yr', feedback: 4 },
];

const stats = [
  { label: "Total Placed", value: "156", icon: CheckCircle2, color: "text-secondary" },
  { label: "Currently Interviewing", value: "23", icon: Clock, color: "text-amber-500" },
  { label: "Placement Rate", value: "87%", icon: TrendingUp, color: "text-primary" },
  { label: "Avg. Salary Increase", value: "42%", icon: Star, color: "text-secondary" },
];

const statusConfig = {
  placed: { label: "Placed", bg: "bg-accent text-secondary" },
  interviewing: { label: "Interviewing", bg: "bg-amber-100 text-amber-700" },
  searching: { label: "Job Searching", bg: "bg-muted text-muted-foreground" },
};

export default function PlacementTrackingPage() {
  const [filter, setFilter] = useState<"all" | "placed" | "interviewing" | "searching">("all");
  const [programFilter, setProgramFilter] = useState("All");

  const programs = ["All", ...new Set(placements.map(p => p.program))];
  const filtered = placements.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (programFilter !== "All" && p.program !== programFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Placement Outcomes</h1>
        <p className="text-muted-foreground text-sm mt-1">Track graduate employment and career outcomes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className="font-display text-2xl font-bold text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {(["all", "placed", "interviewing", "searching"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "All" : statusConfig[f].label}
            </button>
          ))}
        </div>
        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          {programs.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => {
          const sc = statusConfig[p.status];
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-brand-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl gradient-card flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">{p.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-foreground">{p.studentName}</h3>
                      <p className="text-xs text-muted-foreground">{p.program}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.bg}`}>{sc.label}</span>
                  </div>
                  {p.status === "placed" && (
                    <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Building className="w-3 h-3" />{p.company}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" />{p.role}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{p.location}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{p.startDate}</span>
                    </div>
                  )}
                  {p.status === "placed" && p.feedback > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-3 h-3 ${j < p.feedback ? "text-secondary fill-secondary" : "text-border"}`} />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">Employer satisfaction</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No placements match your filters</p>
        </div>
      )}
    </div>
  );
}
