import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, Clock, Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { NotificationPreferences } from "@/types";

interface NotifPref {
  key: string; label: string; description: string; email: boolean; sms: boolean; push: boolean;
}

const defaultPrefs: NotifPref[] = [
  { key: "course_updates", label: "Course updates", description: "New lessons, instructor announcements, content changes", email: true, sms: false, push: true },
  { key: "deadlines", label: "Deadlines & milestones", description: "Assignments, quizzes, cohort milestones", email: true, sms: false, push: true },
  { key: "certificates", label: "Certificates", description: "When a certificate is ready to download", email: true, sms: false, push: true },
  { key: "program_updates", label: "Program announcements", description: "Cohort schedules, registration dates, program news", email: true, sms: false, push: true },
  { key: "community", label: "Community", description: "Forums, replies, mentions", email: false, sms: false, push: true },
  { key: "promotions", label: "Promotions & offers", description: "Occasional discounts and SLA events (optional)", email: false, sms: false, push: true },
  { key: "system", label: "System & security", description: "Account security and important platform notices", email: true, sms: false, push: true },
];

export default function NotificationPrefsPage() {
  const { appUser } = useAuth();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [frequency, setFrequency] = useState<"instant" | "hourly" | "daily">("instant");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [saved, setSaved] = useState(false);
  const [extraPrefs, setExtraPrefs] = useState<Record<string, any>>({});
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   // React Query — modern pattern with useEffect for side effects
   const { data: notificationData, isLoading } = useQuery({
     queryKey: ["notification-prefs", appUser?.id ?? ""],
     queryFn: () => api.getNotificationPreferences(appUser!.id),
     enabled: !!appUser?.id,
     select: (response) => response.success ? response.data : null,
   });

   // Handle data loading with useEffect (React Query v5 pattern)
   useEffect(() => {
     if (!notificationData) return;
     
     const row = notificationData;
     const loadedPrefs = (row.prefs ?? {}) as Record<string, any>;
     setExtraPrefs(loadedPrefs);
     setFrequency((row.frequency as "instant" | "hourly" | "daily") || "instant");
     setQuietStart(row.quiet_start ?? "22:00");
     setQuietEnd(row.quiet_end ?? "07:00");
     setPrefs(prev =>
       prev.map((p: NotifPref) => {
         const cfg = loadedPrefs[p.key];
         if (!cfg) return p;
         return { ...p, email: Boolean(cfg.email), sms: Boolean(cfg.sms), push: Boolean(cfg.push) };
       })
     );
   }, [notificationData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const prefsPayload = useMemo(() => {
    const out: Record<string, { email: boolean; sms: boolean; push: boolean }> = {};
    for (const p of prefs) {
      out[p.key] = { email: p.email, sms: p.sms, push: p.push };
    }
    return out;
  }, [prefs]);

  const toggle = (key: string, channel: "email" | "sms" | "push") => {
    setPrefs(prev => prev.map((p: NotifPref) => p.key === key ? { ...p, [channel]: !p[channel] } : p));
  };

  // Validate quiet hours: start should be before end (handles overnight periods)
  const validateQuietHours = (start: string, end: string): string | null => {
    const startParts = start.split(":").map(Number);
    const endParts = end.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    
    // Allow overnight periods (e.g., 22:00 to 07:00 next day)
    // Only validate if start > end AND the period is not overnight (> 12 hours)
    if (startMinutes > endMinutes && (startMinutes - endMinutes) < 720) {
      return "Quiet hours should span overnight (e.g., 22:00 to 07:00)";
    }
    return null;
  };

  const quietHoursError = validateQuietHours(quietStart, quietEnd);

  const handleSave = async () => {
    if (!appUser?.id) {
      toast.error("Please log in.");
      return;
    }

     setSaved(true);
     const response = await api.upsertNotificationPreferences({
       userId: appUser.id,
       frequency,
       quietStart,
       quietEnd,
       prefs: { ...extraPrefs, ...prefsPayload },
     });

     if (!response.success) {
       toast.error("Failed to save notification preferences.");
       setSaved(false);
       return;
     }

    toast.success("Notification preferences saved!");
    savedTimeoutRef.current = setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <p className="text-xs text-muted-foreground mb-4">
        These are your personal account defaults. Program-specific broadcasts can be sent from each cohort’s dashboard (Manage program).
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notification Preferences</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose how and when you receive notifications</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="gradient-card text-primary-foreground rounded-xl gap-2 text-sm hover:opacity-90">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
</div>

      {/* Scheduling */}
      <div className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Delivery Schedule</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="instant">Instant</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Quiet Hours Start</label>
            <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Quiet Hours End</label>
            <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        {quietHoursError && (
          <p className="text-xs text-amber-600 mt-1">{quietHoursError}</p>
        )}
        <p className="text-xs text-muted-foreground">During quiet hours, notifications will be batched and delivered afterwards.</p>
</div>

      {/* Per-category preferences */}
      <div className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-6 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Category</span>
          <span className="w-14 text-center"><span className="sr-only">Email</span><Mail className="w-3.5 h-3.5 mx-auto" title="Email" /></span>
          <span className="w-14 text-center"><span className="sr-only">SMS</span><Smartphone className="w-3.5 h-3.5 mx-auto" title="SMS" /></span>
          <span className="w-14 text-center"><span className="sr-only">Push</span><Bell className="w-3.5 h-3.5 mx-auto" title="Push" /></span>
        </div>
        {prefs.map((pref: NotifPref, i: number) => (
          <motion.div key={pref.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
            <div>
              <p className="text-sm font-semibold text-foreground">{pref.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
            </div>
            {(["email", "sms", "push"] as const).map((channel: "email" | "sms" | "push") => (
              <button key={channel} onClick={() => toggle(pref.key, channel)}
                className={`w-14 h-7 rounded-full flex items-center px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${pref[channel] ? "bg-primary" : "bg-border"}`}>
                <motion.div animate={{ x: pref[channel] ? 24 : 0 }}
                  className={`w-6 h-6 rounded-full shadow-sm ${pref[channel] ? "bg-primary-foreground" : "bg-card"}`} />
              </button>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="bg-accent rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex items-center gap-4">
        <Smartphone className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">SMS Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">SMS notifications are sent to your registered phone number. Standard messaging rates may apply.</p>
        </div>
      </div>
    </div>
  );
}
