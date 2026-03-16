import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Bell, AlertCircle, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialParticipants = [
  { id: 1, name: "Chioma Eze", email: "chioma@gmail.com", program: "Women in Data Science", progress: 85, quizAvg: 92, lastActive: "Today", status: "on-track" },
  { id: 2, name: "Fatima Hassan", email: "fatima@uni.ng", program: "Women in Data Science", progress: 20, quizAvg: 48, lastActive: "5 days ago", status: "at-risk" },
  { id: 3, name: "Amara Osei", email: "amara@gmail.com", program: "Startup Founders", progress: 60, quizAvg: 75, lastActive: "Yesterday", status: "on-track" },
  { id: 4, name: "Grace Mensah", email: "grace@corp.com", program: "Women in Data Science", progress: 95, quizAvg: 98, lastActive: "Today", status: "on-track" },
  { id: 5, name: "Nkechi Adeyemi", email: "nkechi@biz.com", program: "Startup Founders", progress: 10, quizAvg: 30, lastActive: "2 weeks ago", status: "at-risk" },
  { id: 6, name: "Zainab Musa", email: "zainab@gmail.com", program: "Women in Data Science", progress: 100, quizAvg: 100, lastActive: "3 days ago", status: "completed" },
  { id: 7, name: "Keturah Lekwauwa", email: "keturah@corp.com", program: "Startup Founders", progress: 45, quizAvg: 68, lastActive: "2 days ago", status: "on-track" },
  { id: 8, name: "Blessing Okafor", email: "blessing@mail.ng", program: "Women in Data Science", progress: 5, quizAvg: 22, lastActive: "3 weeks ago", status: "at-risk" },
];

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState(initialParticipants);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = participants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.program.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.status === filter.toLowerCase().replace(" ", "-");
    return matchSearch && matchFilter;
  });

  const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));
  const atRisk = participants.filter(p => p.status === "at-risk").length;

  const bulkDelete = () => {
    setParticipants(prev => prev.filter(p => !selected.includes(p.id)));
    setSelected([]);
    setConfirmDelete(false);
  };

  const statusStyle = (s: string) =>
    s === "on-track" ? "bg-accent text-accent-foreground" : s === "completed" ? "bg-accent text-primary" : "bg-destructive/10 text-destructive";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Participants</h1>
          <p className="text-muted-foreground text-sm mt-1">{participants.length} total · {atRisk} at risk</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selected.length > 0 && (
            <>
              <Button variant="outline" size="sm" className="rounded-xl text-xs flex items-center gap-1.5 text-primary border-secondary/30">
                <Bell className="w-3.5 h-3.5" /> Remind {selected.length}
              </Button>
              <Button size="sm" onClick={() => setConfirmDelete(true)} className="rounded-xl text-xs flex items-center gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="w-3.5 h-3.5" /> Delete {selected.length}
              </Button>
            </>
          )}
          <Button variant="outline" className="rounded-xl text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Bulk delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-foreground font-medium">Delete <strong>{selected.length}</strong> participant{selected.length > 1 ? "s" : ""}? This cannot be undone.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={bulkDelete} className="rounded-xl bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90">Yes, Delete</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="rounded-xl text-xs">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* At-risk banner */}
      {atRisk > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{atRisk} participants are at risk of dropping out</p>
            <p className="text-xs text-muted-foreground">Progress below 25% or inactive for 5+ days</p>
          </div>
          <Button size="sm" className="rounded-xl gradient-card text-primary-foreground text-xs hover:opacity-90 shrink-0 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Send Reminders
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participants..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {["All", "On Track", "At Risk", "Completed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded cursor-pointer" />
                </th>
                {["Participant", "Program", "Progress", "Quiz Avg", "Last Active", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className={`transition-colors ${selected.includes(p.id) ? "bg-accent/40" : "hover:bg-muted/30"}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{p.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.program}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.progress >= 80 ? "bg-secondary" : p.progress >= 30 ? "bg-primary" : "bg-destructive"}`}
                          style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${p.quizAvg >= 80 ? "text-primary" : p.quizAvg >= 60 ? "text-primary" : "text-destructive"}`}>{p.quizAvg}%</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastActive}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle(p.status)}`}>
                      {p.status === "on-track" ? "On Track" : p.status === "completed" ? "Completed" : "At Risk"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <button className="text-primary hover:underline">View</button>
                      <button className="text-primary hover:underline flex items-center gap-0.5"><Bell className="w-3 h-3" /> Remind</button>
                      <button onClick={() => { setSelected([p.id]); setConfirmDelete(true); }} className="text-destructive hover:underline"><Trash2 className="w-3 h-3" /></button>
                    </div>
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
