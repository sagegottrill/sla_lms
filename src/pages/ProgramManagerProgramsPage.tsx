import { useState } from "react";
import { FolderOpen, Plus, Users, Calendar, BarChart2, Bell, Download, Edit, Trash2, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePrograms } from "@/hooks/useQueries";

export default function ProgramManagerProgramsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { data: programs = [], isLoading } = usePrograms({ activeCatalog: false });

  const cohortLabel = (p: { tag?: string; cohort?: string }) => p.tag ?? p.cohort ?? "";

  const filtered = programs.filter((p) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Draft" && p.status === "upcoming") ||
      (filter === "Active" && p.status === "active") ||
      (filter === "Completed" && p.status === "completed");
    const q = search.toLowerCase().trim();
    const matchSearch =
      q.length === 0 ||
      (p.title ?? "").toLowerCase().includes(q) ||
      cohortLabel(p).toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Manage Programs</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing programs…" : `You currently oversee ${programs.length} active cohort environments.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
             <Download className="w-3.5 h-3.5 mr-2" /> Export
          </Button>
          <Link to="/dashboard/programs/new">
            <Button className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
              <Plus className="w-3.5 h-3.5 mr-2" /> New Cohort
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar border-b border-border/40 w-max">
          {["All", "Active", "Draft", "Completed"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                filter === f 
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                  : "text-foreground bg-transparent hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search active programs..."
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" 
          />
        </div>
      </div>

      {/* Main List */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-muted/20 border-b border-border/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Cohort Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Enrollments</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Completion</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                    Loading programs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center bg-card/20">
                    <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">No programs found</p>
                    <p className="text-sm text-muted-foreground">You don't have any cohorts matching this status yet.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((prog) => (
                  <tr key={prog.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{prog.cohort}</span>
                         <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                           {prog.title}
                         </h3>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize ${
                        prog.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                        prog.status === "completed" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : 
                        "bg-muted text-muted-foreground"
                      }`}>
                        {prog.status === "active" ? "Active" : prog.status === "completed" ? "Done" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Users className="w-3.5 h-3.5" />
                          {prog.participants}/{prog.capacity}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="flex-1 max-w-[80px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${prog.completionRate === 100 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${prog.completionRate}%` }} />
                         </div>
                         <span className="text-xs font-semibold text-muted-foreground w-8">{prog.completionRate}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Link to={`/dashboard/programs/new?edit=${prog.id}`} className="inline-flex">
                          <Button
                            variant="outline"
                            className="h-8 px-4 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted"
                          >
                            Edit
                          </Button>
                        </Link>
                        <Link to={`/dashboard/programs/${prog.id}`} className="inline-flex">
                          <Button
                            variant="outline"
                            className="h-8 px-4 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted"
                          >
                            Manage
                          </Button>
                        </Link>
                        <Link
                          to={`/dashboard/assessments/setup?programId=${prog.id}`}
                          className="inline-flex"
                        >
                          <Button
                            variant="outline"
                            className="h-8 px-4 text-xs font-semibold rounded-md border-border bg-transparent hover:bg-muted"
                          >
                            Assessments
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
