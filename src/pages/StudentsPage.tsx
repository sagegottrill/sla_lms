import { useState } from "react";
import { Users, Search, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInstructorStudents } from "@/hooks/useQueries";

export default function StudentsPage() {
  const { appUser } = useAuth();
  const { data: students = [], isLoading } = useInstructorStudents(appUser?.id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      (s.name ?? "").toLowerCase().includes(q) || (s.course ?? "").toLowerCase().includes(q);

    const matchStatus =
      filter === "All"
        ? true
        : filter === "Active"
          ? s.status === "active"
          : filter === "At Risk"
            ? s.status === "at-risk"
            : filter === "Completed"
              ? s.status === "completed"
              : true;

    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">My Students</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing students…" : `Tracking ${students.length} enrolled learners across your courses.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <Download className="w-3.5 h-3.5 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
          {["All", "Active", "At Risk", "Completed"].map(f => (
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
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="bg-muted/20 border-b border-border/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Course</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Last Active</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center bg-card/20 text-muted-foreground">
                    Loading students…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center bg-card/20">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">No students enrolled</p>
                    <p className="text-sm text-muted-foreground">Student records will appear here as learners enroll in your courses.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{s.course}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.progress >= 80 ? "bg-secondary" : s.progress >= 30 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-8">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground/70">{s.lastActive}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" className="h-8 px-4 text-[11px] font-semibold rounded-md border-border bg-transparent hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </Button>
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
