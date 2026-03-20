import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, Save, Bell, Mail, Clock, TrendingDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NudgeRule {
  id?: string;
  condition_type: string;
  condition_value: number;
  action_type: string;
  enabled: boolean;
}

const conditionOptions = [
  { value: "inactive_days", label: "Student inactive for", unit: "days", icon: Clock },
  { value: "progress_below", label: "Progress stalled below", unit: "%", icon: TrendingDown },
];

const actionOptions = [
  { value: "email_nudge", label: "Send email nudge", icon: Mail },
  { value: "in_app_notification", label: "Send in-app notification", icon: Bell },
];

const defaultRule: Omit<NudgeRule, "id"> = {
  condition_type: "inactive_days",
  condition_value: 3,
  action_type: "email_nudge",
  enabled: true,
};

const presetMessages: Record<string, string> = {
  inactive_days: "Hey {name}, we miss you! 🌟 Your learning journey is waiting. Jump back in and keep that momentum going.",
  progress_below: "You're so close to something great, {name}! 🚀 Just a little push and you'll be past the tough part. SLA is cheering you on.",
};

export default function NudgeEnginePanel() {
  const [rules, setRules] = useState<NudgeRule[]>([]);
  const [draft, setDraft] = useState<Omit<NudgeRule, "id">>(defaultRule);
  const [saving, setSaving] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const saveRule = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("nudge_rules")
      .insert([draft])
      .select()
      .single();

    if (error) {
      // Graceful degradation — table may not exist yet
      if (error.code === "42P01") {
        toast.warning("Nudge rules saved locally. Create the `nudge_rules` table in Supabase to persist rules.");
        setRules(prev => [...prev, { ...draft, id: `local-${Date.now()}` }]);
      } else {
        toast.error("Failed to save rule: " + error.message);
      }
      setSaving(false);
      return;
    }

    if (data) {
      setRules(prev => [...prev, data as NudgeRule]);
      toast.success("Nudge rule saved and active!");
    }
    setDraft(defaultRule);
    setShowBuilder(false);
    setSaving(false);
  };

  const toggleRule = (id: string | undefined) => {
    if (!id) return;
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string | undefined) => {
    if (!id) return;
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Rule deleted");
  };

  const conditionDef = conditionOptions.find(c => c.value === draft.condition_type)!;
  const actionDef = actionOptions.find(a => a.value === draft.action_type)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Nudge Engine
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automate student engagement with If → Then rules
          </p>
        </div>
        <Button size="sm" onClick={() => setShowBuilder(!showBuilder)}
          className="rounded-xl bg-primary text-white gap-1.5 text-xs font-bold shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Rule
        </Button>
      </div>

      {/* Rule Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/40 ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl p-6 space-y-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Build a Rule</p>

              {/* IF block */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">IF</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={draft.condition_type}
                    onChange={e => setDraft(d => ({ ...d, condition_type: e.target.value }))}
                    className="text-sm bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {conditionOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={draft.condition_value}
                    onChange={e => setDraft(d => ({ ...d, condition_value: Number(e.target.value) }))}
                    className="w-16 text-sm bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-lg px-3 py-1.5 text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-muted-foreground">{conditionDef.unit}</span>
                </div>
              </div>

              {/* THEN block */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">THEN</span>
                </label>
                <select
                  value={draft.action_type}
                  onChange={e => setDraft(d => ({ ...d, action_type: e.target.value }))}
                  className="text-sm bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                >
                  {actionOptions.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* Preview message */}
              <div className="bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-xl p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Message Preview</p>
                <p className="text-xs text-foreground leading-relaxed">
                  {presetMessages[draft.condition_type]}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button size="sm" className="rounded-lg bg-primary text-white gap-1.5" onClick={saveRule} disabled={saving}>
                  <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Rule"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Rules */}
      {rules.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No automation rules yet.</p>
          <p className="text-xs">Create a rule above to automate student engagement.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Rules ({rules.length})</p>
          {rules.map(rule => {
            const cond = conditionOptions.find(c => c.value === rule.condition_type);
            const act = actionOptions.find(a => a.value === rule.action_type);
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-xl p-4 flex items-center gap-3",
                  !rule.enabled && "opacity-50"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", rule.enabled ? "bg-emerald-500" : "bg-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                    <span className="text-primary">{cond?.label} {rule.condition_value} {cond?.unit}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground/70">{act?.label}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleRule(rule.id)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-muted">
                    {rule.enabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-muted">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
