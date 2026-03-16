import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, Clock, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotifPref {
  key: string; label: string; description: string; email: boolean; sms: boolean; push: boolean;
}

const defaultPrefs: NotifPref[] = [
  { key: "course_updates", label: "Course Updates", description: "New lessons, content changes, instructor announcements", email: true, sms: false, push: true },
  { key: "deadlines", label: "Deadline Reminders", description: "Quiz and assignment deadlines, cohort milestones", email: true, sms: true, push: true },
  { key: "certificates", label: "Certificate Notifications", description: "When a new certificate is ready for download", email: true, sms: false, push: true },
  { key: "job_matches", label: "Job Matches", description: "New jobs matching your skills and preferences", email: true, sms: false, push: false },
  { key: "program_updates", label: "Program Announcements", description: "Cohort schedules, new programs, registration dates", email: true, sms: false, push: true },
  { key: "community", label: "Community Activity", description: "Forum replies, mentions, group discussions", email: false, sms: false, push: true },
  { key: "promotions", label: "Promotions & Offers", description: "Discounts, free courses, special events", email: true, sms: false, push: false },
  { key: "system", label: "System Alerts", description: "Account security, policy changes, platform updates", email: true, sms: true, push: true },
];

export default function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [frequency, setFrequency] = useState<"instant" | "hourly" | "daily">("instant");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [saved, setSaved] = useState(false);

  const toggle = (key: string, channel: "email" | "sms" | "push") => {
    setPrefs(prev => prev.map(p => p.key === key ? { ...p, [channel]: !p[channel] } : p));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Notification preferences saved!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notification Preferences</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose how and when you receive notifications</p>
        </div>
        <Button onClick={handleSave} className="gradient-card text-primary-foreground rounded-xl gap-2 text-sm hover:opacity-90">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      {/* Scheduling */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Delivery Schedule</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="instant">Instant</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Quiet Hours Start</label>
            <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Quiet Hours End</label>
            <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">During quiet hours, notifications will be batched and delivered afterwards.</p>
      </div>

      {/* Per-category preferences */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-6 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Category</span>
          <span className="w-12 text-center"><Mail className="w-3.5 h-3.5 mx-auto" /></span>
          <span className="w-12 text-center"><Smartphone className="w-3.5 h-3.5 mx-auto" /></span>
          <span className="w-12 text-center"><Bell className="w-3.5 h-3.5 mx-auto" /></span>
        </div>
        {prefs.map((pref, i) => (
          <motion.div key={pref.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
            <div>
              <p className="text-sm font-semibold text-foreground">{pref.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
            </div>
            {(["email", "sms", "push"] as const).map(channel => (
              <button key={channel} onClick={() => toggle(pref.key, channel)}
                className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-colors ${pref[channel] ? "bg-primary" : "bg-border"}`}>
                <motion.div animate={{ x: pref[channel] ? 20 : 0 }}
                  className={`w-6 h-6 rounded-full shadow-sm ${pref[channel] ? "bg-primary-foreground" : "bg-card"}`} />
              </button>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="bg-accent rounded-2xl border border-border p-5 flex items-center gap-4">
        <Smartphone className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">SMS Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">SMS notifications are sent via WhatsApp Business or standard SMS to your registered phone number. Standard messaging rates may apply.</p>
        </div>
      </div>
    </div>
  );
}
