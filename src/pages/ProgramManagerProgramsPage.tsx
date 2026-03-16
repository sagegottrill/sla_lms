import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Users, Clock, Calendar, BarChart2, Bell, ChevronRight, Download, Edit, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const programs = [
  { id: 1, title: "Women in Data Science 2026", cohort: "Cohort 3", participants: 145, capacity: 200, completionRate: 72, deadline: "Mar 30, 2026", status: "active", courses: 5, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=160&fit=crop" },
  { id: 2, title: "Startup Founders Accelerator", cohort: "Cohort 1", participants: 80, capacity: 100, completionRate: 45, deadline: "Apr 15, 2026", status: "active", courses: 8, image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300&h=160&fit=crop" },
  { id: 3, title: "Leadership Excellence Program", cohort: "Cohort 2", participants: 60, capacity: 60, completionRate: 100, deadline: "Feb 28, 2026", status: "completed", courses: 6, image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=160&fit=crop" },
  { id: 4, title: "Financial Empowerment for Women", cohort: "Cohort 1", participants: 0, capacity: 150, completionRate: 0, deadline: "May 1, 2026", status: "draft", courses: 4, image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&h=160&fit=crop" },
];

export default function ProgramManagerProgramsPage() {
  const [filter, setFilter] = useState("All");

  const filtered = programs.filter(p => filter === "All" || p.status === filter.toLowerCase());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Manage Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">{programs.filter(p => p.status === "active").length} active · {programs.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl text-sm flex items-center gap-2"><Download className="w-4 h-4" /> Export</Button>
          <Link to="/dashboard/programs/new">
            <Button className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Program
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {["All", "Active", "Draft", "Completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map((prog, i) => (
          <motion.div key={prog.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-sm transition-shadow">
            <div className="relative h-32 overflow-hidden">
              <img src={prog.image} alt={prog.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/50" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${prog.status === "active" ? "bg-secondary text-primary" : prog.status === "completed" ? "bg-muted/80 text-foreground" : "bg-muted text-muted-foreground"}`}>
                  {prog.status === "active" ? "● Active" : prog.status === "completed" ? "✓ Done" : "Draft"}
                </span>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="font-display font-bold text-primary-foreground text-sm">{prog.title}</h3>
                <p className="text-primary-foreground/70 text-xs">{prog.cohort}</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{prog.participants}/{prog.capacity} enrolled</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{prog.courses} courses</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {prog.deadline}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Completion rate</span>
                  <span className="font-semibold text-foreground">{prog.completionRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${prog.completionRate === 100 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${prog.completionRate}%` }} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 text-xs py-2 rounded-xl border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1.5"><Edit className="w-3 h-3" /> Edit</button>
                <button className="flex-1 text-xs py-2 rounded-xl border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1.5"><BarChart2 className="w-3 h-3" /> Analytics</button>
                <button className="flex-1 text-xs py-2 rounded-xl border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1.5"><Bell className="w-3 h-3" /> Remind</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
