import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlarmClock, Award, Bell, BellOff, BookOpen, CalendarClock, CheckCheck,
  CheckCircle2, MessageCircle, Shield, Trash2, Users,
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { Card, Empty, PageLoader, Skeleton } from "@kit";
import { cn, devPreviewUser, errorText, fmtDate, friendlyError } from "@kit";

/**
 * ALERTS TAB — full parity with the web Notifications page:
 *  1. Feed derived from the user's enrollments (course completed / in progress
 *     / needs attention), with read + dismissed state persisted in the
 *     `user_notification_state` table via the shared api layer.
 *  2. Smart reminders (inactivity / deadline / digest) stored in
 *     `notification_preferences.prefs.smart_reminders`.
 *  3. Push categories using the SAME keys the web writes (course_updates,
 *     deadlines, certificates, program_updates, community, promotions,
 *     system), each toggling the `push` channel while preserving the web's
 *     email/sms flags, frequency and quiet hours.
 */

type NotifType = "course" | "certificate" | "program" | "reminder" | "system" | "message";

interface Notif {
  id: string; type: NotifType; title: string; body: string; time: string; read: boolean; sortTs: number;
}

const ICONS: Record<NotifType, { icon: React.ElementType; tint: string }> = {
  course: { icon: BookOpen, tint: "bg-primary/10 text-primary" },
  certificate: { icon: Award, tint: "bg-amber-100 text-amber-600" },
  program: { icon: Users, tint: "bg-secondary/10 text-secondary" },
  reminder: { icon: Bell, tint: "bg-destructive/10 text-destructive" },
  system: { icon: CheckCircle2, tint: "bg-muted text-muted-foreground" },
  message: { icon: MessageCircle, tint: "bg-accent text-accent-foreground" },
};

const PUSH_CATEGORIES = [
  { key: "course_updates", label: "Course updates", hint: "New lessons, announcements, content changes" },
  { key: "deadlines", label: "Deadlines & milestones", hint: "Assignments, quizzes, cohort milestones" },
  { key: "certificates", label: "Certificates", hint: "When a certificate is ready" },
  { key: "program_updates", label: "Program announcements", hint: "Cohort schedules and program news" },
  { key: "community", label: "Community", hint: "Forum replies and new topics" },
  { key: "promotions", label: "Offers & events", hint: "Discounts, webinars, SLA programs" },
  { key: "system", label: "System & security", hint: "Account security and platform notices" },
] as const;

const SMART_REMINDERS = [
  { id: "inactivity", label: "Inactivity reminders", fallback: "After 3 days of no activity" },
  { id: "deadline", label: "Deadline alerts", fallback: "48h before quiz/assignment due" },
  { id: "digest", label: "Weekly progress digest", fallback: "Summary every Monday" },
] as const;

export default function Alerts() {
  const { appUser: authUser } = useAuth();
  // Preview scaffold: ?role= mock feeds Alerts too, matching the Gate's fallback.
  const appUser = authUser ?? devPreviewUser();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [smart, setSmart] = useState<Record<string, boolean>>({});
  const [prefsRow, setPrefsRow] = useState<any | null>(null);

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile", appUser?.id],
    queryFn: () => api.getUserEnrollments(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { data: prefsData, isLoading: loadingPrefs } = useQuery({
    queryKey: ["notificationPreferences", "mobile", appUser?.id],
    queryFn: () => api.getNotificationPreferences(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data : null),
  });

  const { data: notifState } = useQuery({
    queryKey: ["userNotificationState", "mobile", appUser?.id],
    queryFn: () => api.getUserNotificationState(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { data: systemSettings } = useQuery({
    queryKey: ["systemSettings", "mobile"],
    queryFn: () => api.getSystemSettings(),
    select: (r) => (r.success ? r.data : null),
  });

  useEffect(() => {
    setPrefsRow(prefsData);
    const stored = ((prefsData?.prefs ?? {}).smart_reminders ?? {}) as Record<string, unknown>;
    setSmart({
      inactivity: typeof stored.inactivity === "boolean" ? stored.inactivity : true,
      deadline: typeof stored.deadline === "boolean" ? stored.deadline : true,
      digest: typeof stored.digest === "boolean" ? stored.digest : false,
    });
  }, [prefsData]);

  useEffect(() => {
    setReadIds(new Set((notifState ?? []).filter((r: any) => Boolean(r.read)).map((r: any) => String(r.notification_key))));
    setDismissedIds(new Set((notifState ?? []).filter((r: any) => Boolean(r.dismissed)).map((r: any) => String(r.notification_key))));
  }, [notifState]);

  /* Derived feed — identical titles/bodies/keys to the web NotificationsPage. */
  const notifications = useMemo<Notif[]>(() => {
    const now = Date.now();
    const daysMs = 24 * 60 * 60 * 1000;
    const inactivityDays = Number(systemSettings?.inactivity_reminder_days ?? 3) || 3;
    const inactivityMs = inactivityDays * daysMs;
    const inactivityActive = smart.inactivity !== false;

    const items = (enrollments ?? []).map((e: any) => {
      const courseTitle = e?.courses?.title ?? e?.courses?.name ?? e?.courses?.course_title ?? "Course";
      const progressN = Number(e?.progress ?? 0);
      const isCompleted = progressN >= 100 || e?.status === "completed";

      const rawLast = e?.last_accessed ?? e?.enrolled_at ?? e?.updated_at ?? e?.created_at ?? null;
      const lastDate = rawLast ? new Date(rawLast) : null;
      const lastMs = lastDate && !isNaN(lastDate.getTime()) ? lastDate.getTime() : null;
      const recentlyActive = lastMs !== null && now - lastMs <= inactivityMs;

      const type: NotifType = isCompleted ? "certificate" : recentlyActive ? "message" : "reminder";
      if (type === "reminder" && !inactivityActive) return null;

      const title = isCompleted
        ? `Course completed: ${courseTitle}`
        : recentlyActive
          ? `Keep going: ${courseTitle} in progress`
          : `Reminder: ${courseTitle} needs attention`;
      const body = isCompleted
        ? "Nice work! Open Certificates to download your credential."
        : recentlyActive
          ? "We noticed recent activity. Continue from where you left off."
          : "Come back to your learning journey and resume your course progress.";
      const time = lastDate && !isNaN(lastDate.getTime())
        ? lastDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        : "Recently";

      const enrollmentKey = e?.id !== undefined && e?.id !== null ? String(e.id) : `${e?.course_id ?? "0"}:${Math.round(progressN)}`;
      const notificationKey = `${enrollmentKey}-${type}`;
      return { id: notificationKey, type, title, body, time, read: readIds.has(notificationKey), sortTs: lastMs ?? now };
    });

    const byId = new Map<string, Notif>();
    for (const n of items) if (n?.id) byId.set(n.id, n);
    return Array.from(byId.values()).sort((a, b) => b.sortTs - a.sortTs);
  }, [enrollments, readIds, smart.inactivity, systemSettings]);

  const visible = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = visible.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? visible.filter((n) => !n.read) : visible;

  const persistState = async (notificationKey: string, patch: { read?: boolean; dismissed?: boolean }) => {
    if (!appUser) return false;
    const res = await api.upsertUserNotificationState({
      userId: appUser.id,
      notificationKey,
      read: patch.read ?? false,
      dismissed: patch.dismissed ?? false,
    });
    if (!res.success) {
      toast.error(friendlyError(errorText(res.error ?? "Could not save")));
      return false;
    }
    queryClient.invalidateQueries({ queryKey: ["userNotificationState", "mobile", appUser.id] });
    return true;
  };

  const markRead = async (n: Notif) => {
    const prev = readIds;
    setReadIds((p) => new Set(p).add(n.id));
    if (!(await persistState(n.id, { read: true }))) setReadIds(prev);
  };

  const markAllRead = async () => {
    if (!appUser) return;
    const keys = visible.filter((n) => !n.read).map((n) => n.id);
    if (keys.length === 0) return;
    const prev = readIds;
    setReadIds((p) => {
      const next = new Set(p);
      for (const k of keys) next.add(k);
      return next;
    });
    const results = await Promise.all(keys.map((k) => persistState(k, { read: true })));
    if (results.some((ok) => !ok)) setReadIds(prev);
  };

  const dismiss = async (n: Notif) => {
    const prev = dismissedIds;
    setDismissedIds((p) => new Set(p).add(n.id));
    if (!(await persistState(n.id, { dismissed: true }))) setDismissedIds(prev);
  };

  /** Write smart_reminders + push categories WITHOUT clobbering the web's
      email/sms flags, frequency or quiet hours. */
  const savePrefs = async (patchPrefs: Record<string, unknown>, label: string, next: boolean) => {
    if (!appUser) return;
    setSaving(label);
    try {
      const res = await api.upsertNotificationPreferences({
        userId: appUser.id,
        frequency: prefsRow?.frequency ?? "instant",
        quietStart: prefsRow?.quiet_start ?? "22:00",
        quietEnd: prefsRow?.quiet_end ?? "07:00",
        prefs: { ...((prefsRow?.prefs ?? {}) as Record<string, unknown>), ...patchPrefs },
      });
      if (!res.success) {
        toast.error(friendlyError(errorText(res.error)));
        return;
      }
      if (res.data) setPrefsRow(res.data);
      toast.success(`${label} ${next ? "enabled" : "disabled"}`);
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences", "mobile", appUser.id] });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setSaving(null);
    }
  };

  const toggleSmart = (id: string) => {
    const next = !(smart[id] ?? false);
    setSmart((p) => ({ ...p, [id]: next }));
    void savePrefs({ smart_reminders: { ...smart, [id]: next } }, SMART_REMINDERS.find((r) => r.id === id)?.label ?? id, next);
  };

  const togglePush = (key: string, label: string) => {
    const existing = ((prefsRow?.prefs ?? {})[key] ?? {}) as Record<string, unknown>;
    const next = existing.push !== false ? false : true; // default on, like the web
    void savePrefs({ [key]: { ...existing, push: next } }, label, next);
  };

  if (!appUser) return <PageLoader />;
  if (loadingEnrollments || loadingPrefs) return <PageLoader label="Loading your alerts…" />;

  const storedPrefs = (prefsRow?.prefs ?? {}) as Record<string, unknown>;

  return (
    <div className="min-h-full pb-8">
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h1 className="font-display text-2xl font-bold">Alerts</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">You have {unreadCount} unread.</p>
      </div>

      {/* ── Feed ─────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                  filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {f}
                {f === "unread" && unreadCount > 0 && <span className="ml-1.5 opacity-80">({unreadCount})</span>}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => void markAllRead()} className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          {displayed.map((n) => {
            const { icon: Icon, tint } = ICONS[n.type];
            return (
              <Card key={n.id} className={cn("flex items-start gap-3 p-4", !n.read && "border-primary/30 bg-primary/5")}>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tint)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold leading-snug", !n.read && "text-primary")}>{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                  <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/80">{n.time}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {!n.read && (
                    <button onClick={() => void markRead(n)} aria-label="Mark as read" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => void dismiss(n)} aria-label="Dismiss" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}

          {displayed.length === 0 && (
            <Card className="p-5">
              <Empty
                icon={BellOff}
                title="You're all caught up"
                sub="Course progress and completions show up here as alerts."
              />
            </Card>
          )}
        </div>
      </div>

      {/* ── Smart reminders ──────────────────────────────── */}
      <div className="px-4 pt-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <AlarmClock className="h-3.5 w-3.5" /> Smart reminders
        </p>
        <div className="mt-2.5 space-y-2.5">
          {SMART_REMINDERS.map((r) => (
            <Row
              key={r.id}
              icon={CalendarClock}
              title={r.label}
              sub={r.fallback}
              on={smart[r.id] ?? false}
              busy={saving === r.label}
              onClick={() => toggleSmart(r.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Push categories (same keys the web writes) ───── */}
      <div className="px-4 pt-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> Notifications
        </p>
        <div className="mt-2.5 space-y-2.5">
          {PUSH_CATEGORIES.map(({ key, label, hint }) => {
            const cfg = (storedPrefs[key] ?? {}) as Record<string, unknown>;
            const on = cfg.push !== false; // default on, matching the web
            return (
              <Row
                key={key}
                icon={MessageCircle}
                title={label}
                sub={hint}
                on={on}
                busy={saving === label}
                onClick={() => togglePush(key, label)}
              />
            );
          })}
        </div>

        <Card className="mt-4 flex items-start gap-3 p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">In-app popups</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              New forum topics and replies arrive as popups automatically, even on other tabs. System notifications
              (outside the app) follow your device settings for She Leads Africa.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, sub, on, busy, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; on: boolean; busy?: boolean; onClick: () => void }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        aria-label={on ? `Disable ${title}` : `Enable ${title}`}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"} disabled:opacity-60`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </Card>
  );
}
