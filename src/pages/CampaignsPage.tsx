import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Smartphone, Send, Plus, Calendar, Users, BarChart3, Edit, Trash2, Play, Pause, Eye, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Campaign {
  id: string; name: string; channel: "email" | "sms" | "both"; status: "draft" | "scheduled" | "active" | "completed"; subject: string;
  audience: string; sent: number; opened: number; clicked: number; scheduledDate: string;
}

const templates = [
  { id: "welcome", name: "Welcome Email", channel: "email" as const, subject: "Welcome to She Leads Africa Connecta! 🎉", body: "Hi {name},\n\nWelcome aboard! Your learning journey starts here..." },
  { id: "reminder", name: "Course Reminder", channel: "email" as const, subject: "Don't lose your streak! Continue {course}", body: "Hi {name},\n\nYou're making great progress! Continue where you left off..." },
  { id: "deadline", name: "Deadline Alert", channel: "both" as const, subject: "⏰ Quiz deadline in 48 hours", body: "Hi {name},\n\nJust a reminder that your {quiz} deadline is approaching..." },
  { id: "certificate", name: "Certificate Ready", channel: "email" as const, subject: "Your certificate is ready! 🏆", body: "Congratulations {name}!\n\nYou've completed {course}. Download your certificate now." },
  { id: "sms_promo", name: "SMS Promo Blast", channel: "sms" as const, subject: "New course alert!", body: "SLA: New course just launched! {course} — Enrol now at connecta.sla.africa. Reply STOP to unsubscribe." },
  { id: "sms_reminder", name: "SMS Deadline Reminder", channel: "sms" as const, subject: "Quiz due soon", body: "SLA: Your {quiz} is due in 24hrs! Log in now to complete it. — connecta.sla.africa" },
];

const initialCampaigns: Campaign[] = [
  { id: "1", name: "March Welcome Series", channel: "email", status: "active", subject: "Welcome to Connecta!", audience: "New Signups (Last 7 days)", sent: 245, opened: 189, clicked: 67, scheduledDate: "Mar 1, 2026" },
  { id: "2", name: "Data Science Cohort 3 Reminder", channel: "both", status: "scheduled", subject: "Your cohort starts Monday!", audience: "DS Cohort 3 Enrollees", sent: 0, opened: 0, clicked: 0, scheduledDate: "Mar 10, 2026" },
  { id: "3", name: "February Completion Push", channel: "sms", status: "completed", subject: "Finish your course this week!", audience: "Inactive (>7 days)", sent: 890, opened: 0, clicked: 0, scheduledDate: "Feb 25, 2026" },
];

const statusConfig: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", bg: "bg-muted text-muted-foreground", icon: Edit },
  scheduled: { label: "Scheduled", bg: "bg-blue-100 text-blue-700", icon: Clock },
  active: { label: "Active", bg: "bg-accent text-secondary", icon: Play },
  completed: { label: "Completed", bg: "bg-accent text-accent-foreground", icon: CheckCircle2 },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [channelFilter, setChannelFilter] = useState<"all" | "email" | "sms" | "both">("all");

  const [form, setForm] = useState({ name: "", subject: "", audience: "", channel: "email" as "email" | "sms" | "both", scheduledDate: "", body: "" });

  const applyTemplate = (t: typeof templates[0]) => {
    setSelectedTemplate(t);
    setForm({ ...form, subject: t.subject, channel: t.channel, body: t.body });
  };

  const createCampaign = () => {
    if (!form.name.trim()) { toast.error("Give your campaign a name"); return; }
    setCampaigns(prev => [...prev, {
      id: crypto.randomUUID(), name: form.name, channel: form.channel, status: form.scheduledDate ? "scheduled" : "draft",
      subject: form.subject, audience: form.audience || "All Users", sent: 0, opened: 0, clicked: 0, scheduledDate: form.scheduledDate || "—",
    }]);
    setShowCreate(false);
    setForm({ name: "", subject: "", audience: "", channel: "email", scheduledDate: "", body: "" });
    toast.success("Campaign created!");
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success("Campaign deleted");
  };

  const filtered = campaigns.filter(c => channelFilter === "all" || c.channel === channelFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Campaigns & Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Email & SMS marketing campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gradient-card text-primary-foreground rounded-xl gap-2 text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Create Campaign
        </Button>
      </div>

      {/* Channel filter */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {(["all", "email", "sms", "both"] as const).map(f => (
          <button key={f} onClick={() => setChannelFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${channelFilter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {f === "email" && <Mail className="w-3 h-3" />}
            {f === "sms" && <Smartphone className="w-3 h-3" />}
            {f === "both" && <><Mail className="w-3 h-3" /><Smartphone className="w-3 h-3" /></>}
            {f === "all" ? "All Channels" : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <h3 className="font-semibold text-foreground">New Campaign</h3>

            {/* Template picker */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Start from Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)}
                    className={`p-3 rounded-xl border text-left transition-all ${selectedTemplate.id === t.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {t.channel === "sms" ? <Smartphone className="w-3 h-3 text-muted-foreground" /> : t.channel === "both" ? <><Mail className="w-3 h-3 text-muted-foreground" /><Smartphone className="w-3 h-3 text-muted-foreground" /></> : <Mail className="w-3 h-3 text-muted-foreground" />}
                      <span className="text-[10px] uppercase text-muted-foreground">{t.channel}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Campaign Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. March Welcome Series"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Channel</label>
                <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="email">Email</option><option value="sms">SMS</option><option value="both">Email + SMS</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Your engaging subject line"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Audience</label>
                <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">All Users</option>
                  <option>New Signups (Last 7 days)</option>
                  <option>Inactive (7+ days)</option>
                  <option>Course Completers</option>
                  <option>Enrolled Students</option>
                  <option>Program Applicants</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message Body</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4}
                placeholder="Write your message here. Use {name}, {course}, {quiz} as variables..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono" />
              <p className="text-xs text-muted-foreground mt-1">Variables: {"{name}"}, {"{course}"}, {"{quiz}"}, {"{date}"}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={createCampaign} className="gradient-card text-primary-foreground rounded-xl gap-1.5 text-sm hover:opacity-90"><Send className="w-4 h-4" /> Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl text-sm">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaigns list */}
      <div className="space-y-3">
        {filtered.map((c, i) => {
          const sc = statusConfig[c.status];
          const StatusIcon = sc.icon;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-brand-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.bg}`}>
                      <StatusIcon className="w-2.5 h-2.5" />{sc.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      {c.channel === "email" ? <Mail className="w-2.5 h-2.5" /> : c.channel === "sms" ? <Smartphone className="w-2.5 h-2.5" /> : <><Mail className="w-2.5 h-2.5" /><Smartphone className="w-2.5 h-2.5" /></>}
                      {c.channel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.subject}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.audience}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.scheduledDate}</span>
                  </div>
                  {c.sent > 0 && (
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-foreground font-semibold">{c.sent} <span className="text-muted-foreground font-normal">sent</span></span>
                      {c.channel !== "sms" && <>
                        <span className="text-foreground font-semibold">{c.opened} <span className="text-muted-foreground font-normal">opened ({Math.round((c.opened / c.sent) * 100)}%)</span></span>
                        <span className="text-foreground font-semibold">{c.clicked} <span className="text-muted-foreground font-normal">clicked ({Math.round((c.clicked / c.sent) * 100)}%)</span></span>
                      </>}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteCampaign(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No campaigns found</p>
          <p className="text-sm">Create a campaign to engage your learners</p>
        </div>
      )}
    </div>
  );
}
