import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BookOpen, Award, Users, AlertTriangle, CheckCircle2, MessageSquare, Trash2, CheckCheck, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserEnrollments } from "@/hooks/useQueries";
import { api } from "@/services/api";

type NotifType = "course" | "certificate" | "program" | "reminder" | "system" | "message";

interface Notif {
  id: string; type: NotifType; title: string; body: string; time: string; read: boolean;
  sortTs: number;
}

const iconMap: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  course:      { icon: BookOpen,      bg: "bg-accent",          color: "text-primary" },
  certificate: { icon: Award,         bg: "bg-accent",    color: "text-secondary" },
  program:     { icon: Users,         bg: "bg-accent",    color: "text-secondary" },
  reminder:    { icon: AlertTriangle, bg: "bg-destructive/10",  color: "text-destructive" },
  system:      { icon: CheckCircle2,  bg: "bg-muted",           color: "text-muted-foreground" },
  message:     { icon: MessageSquare, bg: "bg-accent",          color: "text-accent-foreground" },
};

export default function NotificationsPage() {
  const { appUser } = useAuth();
  const { data: enrollments = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);

  const [systemSettings, setSystemSettings] = useState<any | null>(null);

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const inactivityDays = Number(systemSettings?.inactivity_reminder_days ?? 3);
  const deadlineHours = Number(systemSettings?.assessment_deadline_alert_hours ?? 48);

  const [reminders, setReminders] = useState([
    { id: "inactivity", label: "Inactivity Reminders", desc: "After 3 days of no activity", active: true },
    { id: "deadline", label: "Deadline Alerts", desc: "48h before quiz/assignment due", active: true },
    { id: "digest", label: "Weekly Progress Digest", desc: "Summary every Monday", active: false },
  ]);

  const [notificationPrefsRow, setNotificationPrefsRow] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!appUser?.id) return;

      const [prefsRow, notifRows, settingsRow] = await Promise.all([
        api.getNotificationPreferences(appUser.id),
        api.getUserNotificationState(appUser.id),
        api.getSystemSettings(),
      ]);

      setNotificationPrefsRow(prefsRow);
      setSystemSettings(settingsRow);

      const smart = (prefsRow?.prefs?.smart_reminders ?? {}) as Record<string, unknown>;
      setReminders((prev) =>
        prev.map((r) => ({
          ...r,
          active: typeof smart[r.id] === "boolean" ? Boolean(smart[r.id]) : r.active,
          desc:
            r.id === "inactivity"
              ? `After ${Number.isFinite(inactivityDays) ? inactivityDays : 3} days of no activity`
              : r.id === "deadline"
                ? `${Number.isFinite(deadlineHours) ? deadlineHours : 48}h before quiz/assignment due`
                : r.desc,
        }))
      );

      setReadIds(new Set((notifRows ?? []).filter((r: any) => Boolean(r.read)).map((r: any) => String(r.notification_key))));
      setDismissedIds(new Set((notifRows ?? []).filter((r: any) => Boolean(r.dismissed)).map((r: any) => String(r.notification_key))));
    };

    load();
  }, [appUser?.id]);

  const toggleReminder = async (id: string) => {
    const current = reminders.find((r) => r.id === id);
    const nextActive = !current?.active;

    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, active: nextActive } : r)));

    if (!appUser?.id) return;

    const prefsRow = notificationPrefsRow;
    const existingPrefs = (prefsRow?.prefs ?? {}) as Record<string, any>;
    const existingSmart = (existingPrefs.smart_reminders ?? {}) as Record<string, any>;
    const nextSmart = { ...existingSmart, [id]: nextActive };

    const upserted = await api.upsertNotificationPreferences({
      userId: appUser.id,
      frequency: prefsRow?.frequency ?? "instant",
      quietStart: prefsRow?.quiet_start ?? "22:00",
      quietEnd: prefsRow?.quiet_end ?? "07:00",
      prefs: { ...existingPrefs, smart_reminders: nextSmart },
    });

    if (upserted) setNotificationPrefsRow(upserted);

    toast.success(`${current?.label ?? "Reminder"} has been ${nextActive ? "enabled" : "disabled"}`);
  };

  const derivedNotifs = useMemo<Notif[]>(() => {
    if (loadingEnrollments) return [];

    const now = Date.now();
    const daysMs = 24 * 60 * 60 * 1000;
    const inactivityActive = reminders.find((r) => r.id === "inactivity")?.active ?? true;
    const inactivityMs = (Number.isFinite(inactivityDays) ? inactivityDays : 3) * daysMs;

    const items: Array<Notif | null> = (enrollments ?? []).map((e: any) => {
      const courseTitle = e?.courses?.title ?? e?.courses?.name ?? e?.courses?.course_title ?? "Course";
      const progress = typeof e?.progress === "number" ? e.progress : 0;

      const rawLast =
        e?.last_accessed ?? e?.enrolled_at ?? e?.updated_at ?? e?.created_at ?? null;
      const lastDate = rawLast ? new Date(rawLast) : null;
      const lastMs = lastDate && !isNaN(lastDate.getTime()) ? lastDate.getTime() : null;

      const recentlyActive = lastMs !== null && now - lastMs <= inactivityMs;

      const type: NotifType =
        progress >= 100 ? "certificate" : recentlyActive ? "message" : "reminder";

      if (type === "reminder" && !inactivityActive) return null;

      const title =
        progress >= 100
          ? `Certificate ready: ${courseTitle}`
          : recentlyActive
            ? `Keep going: ${courseTitle} in progress`
            : `Reminder: ${courseTitle} needs attention`;

      const body =
        progress >= 100
          ? "Nice work! Your completion is recorded. Check your certificates."
          : recentlyActive
            ? "We noticed recent activity. Continue from where you left off."
            : "Come back to your learning journey and resume your course progress.";

      const time = lastDate && !isNaN(lastDate.getTime())
        ? lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Recently";

      // Use a stable enrollment identifier and namespace it by notif type.
      // This prevents collisions and lets us persist read/dismiss state in DB.
      const enrollmentKey =
        e?.id !== undefined && e?.id !== null ? String(e.id) : `${e?.course_id ?? "0"}:${Math.round(progress)}`;
      const notificationKey = `${enrollmentKey}-${type}`;

      return {
        id: notificationKey,
        type,
        title,
        body,
        time,
        read: readIds.has(notificationKey),
        sortTs: lastMs ?? now,
      };
    });

    // Dedupe by `id` (helps avoid collisions)
    const byId = new Map<string, Notif>();
    for (const n of items) {
      if (!n?.id) continue;
      byId.set(n.id, n);
    }
    return Array.from(byId.values()).sort((a, b) => b.sortTs - a.sortTs);
  }, [enrollments, loadingEnrollments, readIds, reminders]);

  const filteredNotifs = useMemo(() => {
    return derivedNotifs.filter((n) => !dismissedIds.has(n.id));
  }, [derivedNotifs, dismissedIds]);

  const unreadCount = filteredNotifs.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? filteredNotifs.filter((n) => !n.read) : filteredNotifs;

  const markAllRead = async () => {
    if (!appUser?.id) return;

    const keysToMark = filteredNotifs.map((n) => n.id);
    const prev = new Set(readIds);
    const next = new Set(readIds);
    for (const key of keysToMark) next.add(key);
    setReadIds(next);

    try {
      await Promise.all(
        keysToMark.map((notificationKey) =>
          api.upsertUserNotificationState({
            userId: appUser.id,
            notificationKey,
            read: true,
            dismissed: false,
          })
        )
      );
    } catch (e: any) {
      setReadIds(prev);
      toast.error(e?.message ?? "Failed to update notification state.");
    }
  };

  const markRead = async (id: string) => {
    if (!appUser?.id) return;
    const prev = new Set(readIds);
    setReadIds((p) => {
      const next = new Set(p);
      next.add(id);
      return next;
    });

    try {
      await api.upsertUserNotificationState({
        userId: appUser.id,
        notificationKey: id,
        read: true,
        dismissed: false,
      });
    } catch (e: any) {
      setReadIds(prev);
      toast.error(e?.message ?? "Failed to mark as read.");
    }
  };

  const deleteNotif = async (id: string) => {
    if (!appUser?.id) return;
    const prev = new Set(dismissedIds);
    setDismissedIds((p) => {
      const next = new Set(p);
      next.add(id);
      return next;
    });

    try {
      await api.upsertUserNotificationState({
        userId: appUser.id,
        notificationKey: id,
        dismissed: true,
      });
    } catch (e: any) {
      setDismissedIds(prev);
      toast.error(e?.message ?? "Failed to dismiss notification.");
    }
  };

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
          <Button onClick={markAllRead} className="rounded-full px-5 h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-white border-0 transition-colors">
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
                  className={`flex gap-6 p-6 rounded-2xl border transition-colors ${notif.read ? "bg-card border-border/60" : "bg-primary/5 dark:bg-primary/10 border-primary/20"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${notif.read ? "text-foreground" : "text-primary"}`}>
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
              <Clock className="w-4 h-4 text-primary" /> Smart Reminders
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              These settings apply to targeted automated alerts and direct administrator communications sent to your student profile. Manage your preferences below.
            </p>
            
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <button onClick={() => toggleReminder(r.id)}
                      className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${r.active ? "bg-primary" : "bg-border"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${r.active ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-border/40">
              <Link to="/dashboard/notification-preferences" className="text-sm font-semibold text-primary hover:text-primary/90 transition-colors flex items-center justify-between group">
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
