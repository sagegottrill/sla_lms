import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Smartphone, Send, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaigns, useCreateCampaignMutation } from "@/hooks/useQueries";
import { api } from "@/services/api";

export default function CampaignsPage() {
  const { appUser } = useAuth();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const createMutation = useCreateCampaignMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"all" | "email" | "sms" | "both">("all");
  const [form, setForm] = useState({ name: "", subject: "", audience: "", channel: "email" as "email" | "sms" | "both", scheduledDate: "", body: "" });

  const filtered = useMemo(
    () => campaigns.filter((c) => channelFilter === "all" || c.channel === channelFilter),
    [campaigns, channelFilter]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Email & SMS marketing campaigns for learner engagement.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0 transition-colors">
          <Plus className="w-3.5 h-3.5 mr-2" /> Create Campaign
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
          {(["all", "email", "sms", "both"] as const).map(f => (
            <button key={f} onClick={() => setChannelFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                channelFilter === f
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "text-foreground bg-transparent hover:bg-muted/80"
              }`}>
              {f === "email" && <Mail className="w-3.5 h-3.5" />}
              {f === "sms" && <Smartphone className="w-3.5 h-3.5" />}
              {f === "both" && <><Mail className="w-3.5 h-3.5" /><Smartphone className="w-3.5 h-3.5" /></>}
              {f === "all" ? "All Channels" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 space-y-5">
            <h3 className="font-display font-semibold text-lg text-foreground">New Campaign</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Campaign Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. March Welcome Series"
                  className="w-full px-4 py-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Channel</label>
                <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none">
                  <option value="email">Email</option><option value="sms">SMS</option><option value="both">Email + SMS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Subject Line</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Your engaging subject line"
                  className="w-full px-4 py-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!form.name.trim()) { toast.error("Name your campaign"); return; }
                  if (!appUser?.id) { toast.error("Please log in."); return; }
                  createMutation.mutate({
                    userId:      appUser.id,
                    name:        form.name.trim(),
                    subject:     form.subject.trim(),
                    audience:    form.audience.trim(),
                    channel:     form.channel,
                    scheduledAt: form.scheduledDate || null,
                    body:        form.body,
                  }, {
                    onSuccess: () => {
                      setShowCreate(false);
                      setForm({ name: "", subject: "", audience: "", channel: "email", scheduledDate: "", body: "" });
                    },
                  });
                }}
                disabled={createMutation.isPending}
                className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0">
                {createMutation.isPending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Creating…</>
                  : <><Send className="w-3.5 h-3.5 mr-2" />Create</>}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaigns list */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 bg-card/20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary/40" />
            <p className="text-sm">Loading campaigns…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card/20">
            <Send className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No campaigns found</p>
            <p className="text-sm text-muted-foreground">Create a campaign to engage your learners.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/20 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Campaign</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Channel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Sent</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-foreground">{c.name ?? "Untitled"}</div>
                      {c.subject ? <div className="text-xs text-muted-foreground mt-1">{c.subject}</div> : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{String(c.channel ?? "").toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                        c.status === "sent"      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                        c.status === "scheduled" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {c.status ?? "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) :
                       c.scheduled_at ? `Scheduled ${new Date(c.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status !== "sent" && (c.channel === "email" || c.channel === "both") && (
                        <button
                          onClick={async () => {
                            if (!appUser?.id) return;
                            toast.info(`Sending "${c.name}" to all learners…`);
                            const res = await api.sendEmail({
                              to: [], // process-campaigns handles audience resolution
                              subject: c.subject || c.name,
                              html: c.body || `<p>${c.name}</p>`,
                            });
                            if ((res as any)?.success) {
                              toast.success("Campaign queued for delivery via SendGrid.");
                            } else {
                              toast.error("Delivery failed — check SendGrid secrets.");
                            }
                          }}
                          className="text-xs font-semibold text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Send now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
