import { useState } from "react";
import { Users, Target, Mail, TrendingUp, Plus, Trash2, Loader2, CheckCircle2, Clock, XCircle, ArrowUpRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadCaptures, useUpdateLeadMutation, useDeleteLeadMutation } from "@/hooks/useQueries";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusConfig: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  new:       { label: "New",       bg: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",       icon: Mail },
  contacted: { label: "Contacted", bg: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",   icon: Clock },
  qualified: { label: "Qualified", bg: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400", icon: Target },
  converted: { label: "Converted", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle2 },
  lost:      { label: "Lost",      bg: "bg-muted text-muted-foreground",                                         icon: XCircle },
};

const emptyForm = { email: "", name: "", source: "website" as const, programInterest: "", notes: "" };

export default function LeadDashboardPage() {
  const { data: leads = [], isLoading } = useLeadCaptures();
  const updateMutation = useUpdateLeadMutation();
  const deleteMutation = useDeleteLeadMutation();
  const queryClient    = useQueryClient();

  const [period, setPeriod]   = useState("7d");
  const [filter, setFilter]   = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);

  const allLeads = leads as any[];

  // Filter by period
  const now = Date.now();
  const periodMs: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const periodFiltered = allLeads.filter(l => {
    if (!l.created_at) return true;
    const d = new Date(l.created_at);
    if (isNaN(d.getTime())) return true;
    const days = periodMs[period] ?? 7;
    return (now - d.getTime()) <= days * 24 * 60 * 60 * 1000;
  });

  const displayed = filter === "all"
    ? periodFiltered
    : periodFiltered.filter(l => l.status === filter);

  // KPIs
  const totalLeads    = periodFiltered.length;
  const converted     = periodFiltered.filter(l => l.status === "converted").length;
  const conversionPct = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;
  const newLeads      = periodFiltered.filter(l => l.status === "new").length;

  const handleSave = async () => {
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("A valid email is required.");
      return;
    }
     setSaving(true);
     try {
       const response = await api.createLeadCapture({
         email:          form.email.trim(),
         name:           form.name.trim(),
         source:         form.source,
         programInterest: form.programInterest.trim(),
         notes:          form.notes.trim(),
       });
       if (!response.success) {
         throw new Error(response.error || "Failed to save lead");
       }
       toast.success("Lead captured!");
       setForm(emptyForm);
       setShowAdd(false);
       queryClient.invalidateQueries({ queryKey: ['lead-captures'] });
     } catch (e: any) {
       toast.error(e?.message ?? "Failed to save lead.");
     } finally {
       setSaving(false);
     }
  };

  const handleStatusChange = (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === "converted") updates.converted_at = new Date().toISOString();
    updateMutation.mutate({ id, updates });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remove this lead?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2 flex items-center gap-2">
            Leads & Campaigns
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Track lead acquisition, conversion funnel, and campaign performance. Manage leads through their journey from capture to enrollment.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing leads…" : `Tracking ${allLeads.length} total leads across all sources.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
            {[{ k: "7d", l: "7 Days" }, { k: "30d", l: "30 Days" }, { k: "90d", l: "90 Days" }].map(({ k, l }) => (
              <button key={k} onClick={() => setPeriod(k)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  period === k ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" : "text-foreground bg-transparent hover:bg-muted/80"
                }`}>
                {l}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAdd(true)} className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0">
            <Plus className="w-3.5 h-3.5 mr-2" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Add Lead Form */}
      {showAdd && (
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 space-y-4">
          <h3 className="font-display font-semibold text-lg text-foreground">Capture New Lead</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Email *</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" type="email"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Source</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value as any }))}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {["website", "campaign", "referral", "social", "organic", "paid", "other"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Program Interest</label>
              <input value={form.programInterest} onChange={e => setForm(p => ({ ...p, programInterest: e.target.value }))} placeholder="e.g. Data Leadership"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Any additional context…"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Saving…</> : "Save Lead"}
            </Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="rounded-full px-5 h-9 text-xs font-semibold">Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column — KPIs */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Acquisition KPIs</h2>
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Total Leads
                </p>
                <p className="text-3xl font-light text-foreground">{isLoading ? "—" : totalLeads}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Target className="w-3.5 h-3.5" /> Conversion Rate
                </p>
                <p className="text-3xl font-light text-foreground">{isLoading ? "—" : `${conversionPct}%`}</p>
              </div>
              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> New This Period
                </p>
                <p className="text-3xl font-bold text-primary">{isLoading ? "—" : newLeads}</p>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-base text-foreground mb-4">Lead Funnel</h2>
            <div className="space-y-3">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const count = periodFiltered.filter(l => l.status === key).length;
                const pct   = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                      <span className="text-xs font-bold text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column — Lead Directory */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
            {["all", ...Object.keys(statusConfig)].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap capitalize ${
                  filter === f ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" : "text-foreground bg-transparent hover:bg-muted/80"
                }`}>
                {f === "all" ? "All Leads" : statusConfig[f].label}
              </button>
            ))}
          </div>

          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-3" /> Syncing leads…
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card/20 text-muted-foreground">
                <Users className="w-8 h-8 opacity-20 mb-3" />
                <p className="text-sm font-medium text-foreground">No leads found</p>
                <p className="text-xs mt-1 text-center max-w-sm">
                  {filter === "all" ? "Add your first lead using the button above." : `No leads with status "${filter}" in this period.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/20 border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Lead</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Source</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Interest</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {displayed.map((lead: any) => {
                      const sc = statusConfig[lead.status] ?? statusConfig.new;
                      return (
                        <tr key={lead.id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {(lead.name || lead.email || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{lead.name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{lead.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground capitalize">{lead.source ?? "—"}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{lead.program_interest || "—"}</td>
                          <td className="px-6 py-4">
                            <select
                              value={lead.status}
                              onChange={e => handleStatusChange(lead.id, e.target.value)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${sc.bg}`}
                            >
                              {Object.entries(statusConfig).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDelete(lead.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
