import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BookOpen, Award, Users, AlertTriangle, CheckCircle2, MessageSquare, Trash2, CheckCheck, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type NotifType = "course" | "certificate" | "program" | "reminder" | "system" | "message";

interface Notif {
  id: number; type: NotifType; title: string; body: string; time: string; read: boolean;
}

const initialNotifs: Notif[] = [];

const iconMap: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  course:      { icon: BookOpen,      bg: "bg-accent",          color: "text-primary" },
  certificate: { icon: Award,         bg: "bg-accent",    color: "text-secondary" },
  program:     { icon: Users,         bg: "bg-accent",    color: "text-secondary" },
  reminder:    { icon: AlertTriangle, bg: "bg-destructive/10",  color: "text-destructive" },
  system:      { icon: CheckCircle2,  bg: "bg-muted",           color: "text-muted-foreground" },
  message:     { icon: MessageSquare, bg: "bg-accent",          color: "text-accent-foreground" },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifs.filter(n => !n.read).length;
  const displayed = filter === "unread" ? notifs.filter(n => !n.read) : notifs;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const deleteNotif = (id: number) => setNotifs(n => n.filter(x => x.id !== id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            You have {unreadCount} unread messages.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/notification-preferences">
            <Button variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
              <Settings className="w-3.5 h-3.5 mr-2" /> Preferences
            </Button>
          </Link>
          <Button onClick={markAllRead} className="rounded-full px-5 h-9 text-xs font-semibold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
            <CheckCheck className="w-3.5 h-3.5 mr-2" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Notifications Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
            {(["all", "unread"] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                  filter === f 
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                    : "text-foreground bg-transparent hover:bg-muted/80"
                }`}
              >
                {f} 
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-2 font-bold opacity-80">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayed.map((notif, i) => {
              const { icon: Icon, bg, color } = iconMap[notif.type];
              return (
                <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex gap-6 p-6 rounded-2xl border transition-all ${notif.read ? "bg-card border-border/60" : "bg-[#f5f9ff] dark:bg-[#0056D2]/10 border-[#0056D2]/30"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${notif.read ? "text-foreground" : "text-[#0056D2] dark:text-[#64b5f6]"}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{notif.body}</p>
                        <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{notif.time}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!notif.read && (
                          <button onClick={() => markRead(notif.id)} title="Mark as read" className="w-8 h-8 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteNotif(notif.id)} title="Delete" className="w-8 h-8 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {displayed.length === 0 && (
              <div className="text-center py-20 bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0">
                <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">You're all caught up!</p>
                <p className="text-sm text-muted-foreground">No new alerts to review in this view.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Smart Reminders Config */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#0056D2]" /> Smart Reminders
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              We automatically send you reminders for incomplete courses, upcoming deadlines, and new content. Manage your preferences below.
            </p>
            
            <div className="space-y-3">
              {[
                { label: "Inactivity Reminders", desc: "After 3 days of no activity", active: true },
                { label: "Deadline Alerts", desc: "48h before quiz/assignment due", active: true },
                { label: "Weekly Progress Digest", desc: "Summary every Monday", active: false },
              ].map(r => (
                <div key={r.label} className="p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <button onClick={() => toast.success(`${r.label} ${r.active ? "disabled" : "enabled"}`)}
                      className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${r.active ? "bg-[#0056D2]" : "bg-border"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${r.active ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-border/40">
              <Link to="/dashboard/notification-preferences" className="text-sm font-semibold text-[#0056D2] hover:underline flex items-center justify-between group">
                Advanced notification settings
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
