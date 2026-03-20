import { useState } from "react";
import { Search, Download, Users, Bell, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

// Awaiting Supabase hook implementation for real participants
const participants: any[] = [];

export default function ParticipantsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = participants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.program.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.status === filter.toLowerCase().replace(" ", "-");
    return matchSearch && matchFilter;
  });

  const toggleSelect = (id: string) => {
    const newDocs = new Set(selected);
    if (newDocs.has(id)) newDocs.delete(id);
    else newDocs.add(id);
    setSelected(newDocs);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Participants</h1>
          <p className="text-muted-foreground text-sm">
            Tracking {participants.length} learners across active cohorts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove ({selected.size})
            </Button>
          )}
          <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
             <Download className="w-3.5 h-3.5 mr-2" /> Export Roster
          </Button>
          <Button className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
            <Mail className="w-3.5 h-3.5 mr-2" /> Message Cohort
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar border-b border-border/40 w-max">
          {["All", "On Track", "At Risk", "Completed"].map(f => (
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
            placeholder="Search learner directory..."
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" 
          />
        </div>
      </div>

      {/* Roster / Table */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-muted/20 border-b border-border/40">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-border/50 text-primary focus:ring-primary/30" />
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Learner</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Program</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Progress</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Last Active</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center bg-card/20">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">No participants found</p>
                    <p className="text-sm text-muted-foreground">Adjust your filters or wait for enrollments to sync.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className={`transition-colors group ${selected.has(p.id) ? "bg-primary/5" : "hover:bg-muted/10"}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-border/50 text-primary focus:ring-primary/30" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                      {p.program}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${p.progress >= 80 ? "bg-secondary" : p.progress >= 30 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-8">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-foreground/70">
                      {p.lastActive}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="outline" className="h-8 px-4 text-[11px] font-semibold rounded-md border-border bg-transparent hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage
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
