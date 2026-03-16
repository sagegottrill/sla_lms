import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Download, TrendingUp, BookOpen, Clock, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const students = [
  { id: 1, name: "Chioma Eze", email: "chioma@gmail.com", course: "Data Analytics", progress: 85, lastActive: "Today", enrolled: "Jan 5, 2026", rating: 5, quiz: 92 },
  { id: 2, name: "Fatima Hassan", email: "fatima@uni.ng", course: "Data Analytics", progress: 20, lastActive: "5 days ago", enrolled: "Jan 8, 2026", rating: null, quiz: 48 },
  { id: 3, name: "Amara Osei", email: "amara@gmail.com", course: "Advanced Visualization", progress: 60, lastActive: "Yesterday", enrolled: "Jan 12, 2026", rating: 4, quiz: 75 },
  { id: 4, name: "Grace Mensah", email: "grace@corp.com", course: "Data Analytics", progress: 95, lastActive: "Today", enrolled: "Dec 28, 2025", rating: 5, quiz: 98 },
  { id: 5, name: "Nkechi Adeyemi", email: "nkechi@biz.com", course: "Data Analytics", progress: 10, lastActive: "2 weeks ago", enrolled: "Jan 15, 2026", rating: null, quiz: 30 },
  { id: 6, name: "Zainab Musa", email: "zainab@gmail.com", course: "Advanced Visualization", progress: 100, lastActive: "3 days ago", enrolled: "Nov 10, 2025", rating: 5, quiz: 100 },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.course.toLowerCase().includes(search.toLowerCase()));

  const avgProgress = Math.round(students.reduce((a, s) => a + s.progress, 0) / students.length);
  const atRisk = students.filter(s => s.progress < 25).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground text-sm mt-1">{students.length} enrolled · avg {avgProgress}% progress</p>
        </div>
        <Button variant="outline" className="rounded-xl flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: students.length, icon: Users, color: "text-primary bg-accent" },
          { label: "Avg. Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "text-secondary bg-accent" },
          { label: "Avg. Quiz Score", value: `${Math.round(students.reduce((a, s) => a + s.quiz, 0) / students.length)}%`, icon: BookOpen, color: "text-secondary bg-accent" },
          { label: "At Risk", value: atRisk, icon: Clock, color: "text-destructive bg-destructive/10" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div><div className="font-bold text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>{["Student", "Course", "Progress", "Quiz Score", "Last Active", "Rating", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground">{s.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.course}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.progress >= 80 ? "bg-secondary" : s.progress >= 30 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${s.quiz >= 80 ? "text-secondary" : s.quiz >= 60 ? "text-gold" : "text-destructive"}`}>{s.quiz}%</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.lastActive}</td>
                  <td className="px-4 py-3">
                    {s.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-gold fill-gold" /><span className="text-xs">{s.rating}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-primary hover:underline flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Message</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
