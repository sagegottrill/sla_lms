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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/notification-preferences">
            <Button variant="outline" size="sm" className="rounded-xl text-xs flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Preferences
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-xl text-xs flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {f} {f === "unread" && unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px]">{unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayed.map((notif, i) => {
          const { icon: Icon, bg, color } = iconMap[notif.type];
          return (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex gap-4 p-4 rounded-2xl border transition-all ${notif.read ? "bg-card border-border" : "bg-accent border-primary/20"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${notif.read ? "text-foreground" : "text-primary"}`}>{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!notif.read && (
                      <button onClick={() => markRead(notif.id)} title="Mark as read" className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(notif.id)} title="Delete" className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Automated Reminders Banner */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Smart Reminders</h3>
        <p className="text-sm text-muted-foreground">We automatically send you reminders for incomplete courses, upcoming deadlines, and new content. Manage your preferences below.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Inactivity Reminders", desc: "After 3 days of no activity", active: true },
            { label: "Deadline Alerts", desc: "48h before quiz/assignment due", active: true },
            { label: "Weekly Progress Digest", desc: "Summary every Monday", active: false },
          ].map(r => (
            <div key={r.label} className="p-3 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-foreground">{r.label}</p>
                <button onClick={() => toast.success(`${r.label} ${r.active ? "disabled" : "enabled"}`)}
                  className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${r.active ? "bg-primary" : "bg-border"}`}>
                  <div className={`w-3 h-3 rounded-full bg-card shadow-sm transition-transform ${r.active ? "translate-x-4" : ""}`} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
        <Link to="/dashboard/notification-preferences" className="text-xs text-primary font-medium hover:underline">
          Manage all notification preferences →
        </Link>
      </div>
    </div>
  );
}
