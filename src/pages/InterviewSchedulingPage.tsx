import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, MapPin, Plus, Check, X, User, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const statusColors: Record<string, string> = {
  confirmed: "bg-accent text-accent-foreground",
  pending:   "bg-accent text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function InterviewSchedulingPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ candidate: "", role: "", date: "", time: "09:00", type: "video", interviewer: "", notes: "" });
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const addInterview = () => {
    if (!form.candidate || !form.date) return;
    setInterviews(prev => [...prev, { id: Date.now(), ...form, status: "pending" }]);
    setForm({ candidate: "", role: "", date: "", time: "09:00", type: "video", interviewer: "", notes: "" });
    setShowForm(false);
  };

  const updateStatus = (id: number, status: string) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  // Calendar helpers
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const interviewsOnDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return interviews.filter(i => i.date === dateStr);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Interview Scheduling</h1>
          <p className="text-muted-foreground text-sm">Organize and manage candidate interviews across the pipeline.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex bg-muted/50 p-1 rounded-full gap-1">
            <button onClick={() => setView("list")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted"}`}>List View</button>
            <button onClick={() => setView("calendar")} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${view === "calendar" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted"}`}>Calendar View</button>
          </div>
          <Button onClick={() => setShowForm(true)} className="rounded-full px-6 h-9 text-xs font-semibold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5 mr-2" /> Schedule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {[
          ["Total", interviews.length, "text-foreground"],
          ["Confirmed", interviews.filter(i => i.status === "confirmed").length, "text-primary"],
          ["Pending", interviews.filter(i => i.status === "pending").length, "text-primary"],
          [
            "This Week",
            interviews.filter((i) => {
              if (!i.date) return false;
              const d = new Date(i.date);
              if (isNaN(d.getTime())) return false;
              const start = new Date();
              const end = new Date(new Date().setDate(new Date().getDate() + 7));
              return d >= start && d <= end;
            }).length,
            "text-primary",
          ],
        ].map(([label, val, cls]) => (
          <div key={label as string} className="bg-card rounded-2xl shadow-sm border-0 p-4 text-center">
            <div className={`font-display text-2xl font-bold ${cls}`}>{val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* New Interview Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm mb-6">
          <h3 className="font-display font-semibold text-lg text-foreground mb-4">Schedule New Interview</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.candidate} onChange={e => setForm(p => ({ ...p, candidate: e.target.value }))} placeholder="Candidate name"
              className="px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#0056D2]" />
            <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Role / Position"
              className="px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#0056D2]" />
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#0056D2]" />
            <select value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
              className="px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#0056D2]">
              {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#0056D2]">
              <option value="video">Video Call</option>
              <option value="in-person">In Person</option>
              <option value="phone">Phone</option>
            </select>
            <input value={form.interviewer} onChange={e => setForm(p => ({ ...p, interviewer: e.target.value }))} placeholder="Interviewer name"
              className="px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#0056D2]" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" rows={2}
            className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm mt-4 focus:outline-none focus:ring-1 focus:ring-[#0056D2] resize-none" />
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
            <Button onClick={addInterview} className="rounded-full px-6 bg-[#0056D2] hover:bg-[#00419e] text-white text-xs font-semibold">Schedule Interview</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full px-5 text-xs font-semibold">Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="bg-card rounded-2xl shadow-sm border-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-muted">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-foreground">{monthName}</h3>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-muted">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDay(currentMonth) }).map((_, i) => <div key={i} />)}
          {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
              const day = i + 1;
              const dayInterviews = interviewsOnDay(day);
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                currentMonth.getMonth() === today.getMonth() &&
                currentMonth.getFullYear() === today.getFullYear();
              return (
                <div key={day} className={`min-h-[60px] p-1 rounded-xl border text-xs ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
                  <span className={`font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{day}</span>
                  {dayInterviews.map(iv => (
                    <div key={iv.id} className="mt-1 px-1 py-0.5 rounded bg-secondary/20 text-primary text-[9px] truncate">{iv.candidate}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="space-y-4">
          {interviews.length === 0 && (
            <div className="text-center py-20 bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-display font-semibold text-lg text-foreground">No pending intervals</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Click "Schedule" above to add your first candidate interview queue.</p>
            </div>
          )}
          {interviews.map((iv, i) => (
            <motion.div key={iv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex flex-col md:flex-row md:items-start gap-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-[#f5f9ff] border border-blue-100 flex items-center justify-center text-sm font-bold text-[#0056D2] shrink-0">
                  {(iv.candidate ?? "").charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="font-semibold text-foreground text-base">{iv.candidate}</h3>
                    <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md font-bold ${statusColors[iv.status]}`}>{iv.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{iv.role}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{iv.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{iv.time}</span>
                    <span className="flex items-center gap-1">
                      {iv.type === "video" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {iv.type === "video" ? "Video Call" : iv.type === "in-person" ? "In Person" : "Phone"}
                    </span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{iv.interviewer}</span>
                  </div>
                  {iv.notes && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5 mt-2 italic">{iv.notes}</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {iv.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(iv.id, "confirmed")} className="rounded-xl gradient-card text-primary-foreground text-xs flex items-center gap-1">
                        <Check className="w-3 h-3" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(iv.id, "cancelled")} className="rounded-xl text-xs flex items-center gap-1 text-destructive border-destructive/30">
                        <X className="w-3 h-3" /> Cancel
                      </Button>
                    </>
                  )}
                  {iv.status === "confirmed" && (
                    <>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Send Reminder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(iv.id, "completed")} className="rounded-xl text-xs">
                        Mark Done
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
