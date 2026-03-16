import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, MapPin, Briefcase, Clock, Trash2, Plus, Star, Mail, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface JobAlert {
  id: string; title: string; keywords: string[]; location: string; type: string; frequency: "instant" | "daily" | "weekly"; channel: "email" | "sms" | "both"; active: boolean; matchCount: number; created: string;
}

const initialAlerts: JobAlert[] = [
  { id: "1", title: "Data Analyst Roles", keywords: ["Data Analyst", "BI Analyst", "Analytics"], location: "Lagos, Nigeria", type: "Full-time", frequency: "daily", channel: "email", active: true, matchCount: 12, created: "Feb 15, 2026" },
  { id: "2", title: "Remote Marketing Jobs", keywords: ["Marketing Manager", "Digital Marketing", "Growth"], location: "Remote (Africa)", type: "Full-time", frequency: "weekly", channel: "both", active: true, matchCount: 8, created: "Jan 20, 2026" },
  { id: "3", title: "Finance Internships", keywords: ["Financial Analyst", "Accounting", "Investment"], location: "Accra, Ghana", type: "Internship", frequency: "instant", channel: "email", active: false, matchCount: 3, created: "Mar 1, 2026" },
];

export default function JobAlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", keywords: "", location: "", type: "Full-time", frequency: "daily" as const, channel: "email" as const });

  const toggleActive = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    const alert = alerts.find(a => a.id === id);
    toast(alert?.active ? "Alert paused" : "Alert activated");
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success("Alert deleted");
  };

  const createAlert = () => {
    if (!form.title.trim()) { toast.error("Give your alert a name"); return; }
    setAlerts(prev => [...prev, {
      id: crypto.randomUUID(), title: form.title, keywords: form.keywords.split(",").map(k => k.trim()).filter(Boolean),
      location: form.location || "Any", type: form.type, frequency: form.frequency, channel: form.channel,
      active: true, matchCount: 0, created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }]);
    setForm({ title: "", keywords: "", location: "", type: "Full-time", frequency: "daily", channel: "email" });
    setShowCreate(false);
    toast.success("Job alert created! You'll receive matches soon.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Job Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">{alerts.filter(a => a.active).length} active alerts</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gradient-card text-primary-foreground rounded-xl gap-2 text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Create Alert
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">New Job Alert</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Alert Name *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Data Science Remote"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Keywords (comma-separated)</label>
              <input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="Data Analyst, Python, BI"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lagos, Nigeria or Remote"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Job Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option><option>Remote</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Frequency</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="instant">Instant</option><option value="daily">Daily Digest</option><option value="weekly">Weekly Summary</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Delivery Channel</label>
              <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="email">Email</option><option value="sms">SMS</option><option value="both">Email + SMS</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={createAlert} className="gradient-card text-primary-foreground rounded-xl text-sm hover:opacity-90">Create Alert</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl text-sm">Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-card rounded-2xl border p-5 transition-all ${alert.active ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{alert.title}</h3>
                  {alert.active ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-secondary font-bold">Active</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">Paused</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {alert.keywords.map(k => <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{k}</span>)}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{alert.type}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.frequency}</span>
                  <span className="flex items-center gap-1">{alert.channel === "email" ? <Mail className="w-3 h-3" /> : alert.channel === "sms" ? <Smartphone className="w-3 h-3" /> : <><Mail className="w-3 h-3" /><Smartphone className="w-3 h-3" /></>}{alert.channel}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{alert.matchCount} matches · Created {alert.created}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleActive(alert.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${alert.active ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "hover:bg-accent text-muted-foreground hover:text-primary"}`}>
                  {alert.active ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteAlert(alert.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No job alerts yet</p>
          <p className="text-sm">Create an alert to get notified about new opportunities</p>
        </div>
      )}
    </div>
  );
}
