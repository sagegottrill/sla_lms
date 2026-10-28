import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff, Check, Mail, MessageCircle, Percent, Shield } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader, Card, Empty, Tag } from "@kit";
import { errorText, fmtDate, friendlyError } from "@kit";

const PREF_ROWS = [
  { key: "email", label: "Email alerts", icon: Mail, hint: "Course updates, certificates, team news" },
  { key: "forum_replies", label: "Forum activity", icon: MessageCircle, hint: "Replies and new community topics" },
  { key: "promotions", label: "Offers & events", icon: Percent, hint: "Discounts, webinars, SLA programs" },
] as const;

/**
 * ALERTS TAB — notification preferences (caps value to free plan perk) and
 * digest of recent activity the user can mark as seen.
 */
export default function Alerts() {
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notificationPreferences", "mobile", appUser?.id],
    queryFn: () => api.getNotificationPreferences(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data : null),
  });

  const toggle = async (rowKey: string, current: boolean) => {
    if (!appUser) return;
    setSaving(rowKey);
    try {
      const existingPrefs = ((p as any)?.prefs ?? {}) as Record<string, unknown>;
      const res = await api.upsertNotificationPreferences({
        userId: appUser.id,
        prefs: { ...existingPrefs, [rowKey]: !current },
      });
      if (!res.success) {
        toast.error(friendlyError(errorText(res.error)));
        return;
      }
      toast.success(`${rowKey === "email" ? "Email alerts" : rowKey === "forum_replies" ? "Forum activity" : "Offers"} ${!current ? "enabled" : "disabled"}`);
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences", "mobile", appUser.id] });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setSaving(null);
    }
  };

  if (!appUser) return <PageLoader />;
  if (isLoading) return <PageLoader label="Loading your alerts…" />;

  const p = (prefs ?? {}) as Record<string, unknown>;
  const storedPrefs = ((p.prefs ?? {}) as Record<string, unknown>);

  return (
    <div className="min-h-full pb-8">
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h1 className="font-display text-2xl font-bold">Alerts</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Choose how the community reaches you.</p>
      </div>

      <div className="px-4 pt-4">
        {PREF_ROWS.map(({ key, label, icon: Icon, hint }) => {
          const on = storedPrefs[key] !== false; // default on
          return (
            <Row key={key} icon={Icon} title={label} sub={hint} on={on} busy={saving === key} onClick={() => toggle(key, on)} />
          );
        })}

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
    <Card className="mb-2.5 flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
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
