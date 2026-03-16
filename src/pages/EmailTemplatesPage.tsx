import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Plus, Edit2, Trash2, Copy, Eye, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const templates = [
  {
    id: 1, name: "Welcome Email", subject: "Welcome to She Leads Africa, {{first_name}}! 🎉",
    category: "Onboarding", lastEdited: "Feb 28, 2026", sent: 1240,
    preview: "Hi {{first_name}}, we're thrilled to have you join the Connecta platform...",
  },
  {
    id: 2, name: "Course Enrollment Confirmation", subject: "You're enrolled in {{course_name}}!",
    category: "Transactional", lastEdited: "Mar 1, 2026", sent: 8420,
    preview: "Congratulations {{first_name}}! Your enrollment in {{course_name}} is confirmed...",
  },
  {
    id: 3, name: "Inactivity Reminder (7 days)", subject: "We miss you, {{first_name}} — pick up where you left off",
    category: "Engagement", lastEdited: "Feb 20, 2026", sent: 3100,
    preview: "Hi {{first_name}}, it's been 7 days since you last logged in. Your progress on {{course_name}} is waiting...",
  },
  {
    id: 4, name: "Certificate Ready", subject: "Your certificate is ready! Download it now 🏆",
    category: "Achievement", lastEdited: "Feb 15, 2026", sent: 2800,
    preview: "Congratulations {{first_name}}! You've completed {{course_name}} and earned your certificate...",
  },
  {
    id: 5, name: "Program Cohort Starts Soon", subject: "{{program_name}} starts in 3 days — are you ready?",
    category: "Programs", lastEdited: "Mar 2, 2026", sent: 580,
    preview: "Hi {{first_name}}, your cohort for {{program_name}} kicks off on {{start_date}}. Here's what to expect...",
  },
  {
    id: 6, name: "Job Match Alert", subject: "New job match: {{job_title}} at {{company_name}}",
    category: "Jobs", lastEdited: "Mar 3, 2026", sent: 1890,
    preview: "Hi {{first_name}}, based on your skills and completed courses, we found a great match for you...",
  },
];

const categoryColors: Record<string, string> = {
  Onboarding: "bg-accent text-primary",
  Transactional: "bg-accent text-accent-foreground",
  Engagement: "bg-accent text-primary",
  Achievement: "bg-accent text-primary",
  Programs: "bg-accent text-accent-foreground",
  Jobs: "bg-accent text-primary",
};

const variables = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{course_name}}", "{{program_name}}", "{{start_date}}", "{{company_name}}", "{{job_title}}", "{{certificate_id}}"];

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
  const [editContent, setEditContent] = useState("");

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const openEditor = (t: typeof templates[0]) => {
    setSelectedTemplate(t);
    setEditContent(`Subject: ${t.subject}\n\n${t.preview}\n\nYour learning journey continues...\n\nBest,\nThe She Leads Africa Team`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Email Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage automated email templates with dynamic variables</p>
        </div>
        <Button className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {/* Variables reference */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Available Variables</p>
        <div className="flex flex-wrap gap-2">
          {variables.map(v => (
            <code key={v} className="text-xs bg-muted px-2 py-1 rounded-lg text-primary font-mono cursor-pointer hover:bg-accent transition-colors">{v}</code>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Template list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            {filtered.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => openEditor(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-brand-sm ${selectedTemplate?.id === t.id ? "border-primary bg-accent/50" : "border-border bg-card hover:border-primary/30"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{t.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${categoryColors[t.category] ?? "bg-muted text-muted-foreground"}`}>{t.category}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{t.subject}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{t.sent.toLocaleString()} sent</span>
                  <span>Edited {t.lastEdited}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {selectedTemplate ? (
            <motion.div key={selectedTemplate.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{selectedTemplate.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[selectedTemplate.category]}`}>{selectedTemplate.category}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"><Eye className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"><Copy className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Template Name</label>
                  <input defaultValue={selectedTemplate.name} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content (supports variables)</label>
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-xl gradient-card text-primary-foreground text-sm flex items-center gap-2 hover:opacity-90">
                    <Edit2 className="w-4 h-4" /> Save Template
                  </Button>
                  <Button variant="outline" className="rounded-xl text-sm">Preview</Button>
                  <Button variant="outline" className="rounded-xl text-sm">Send Test</Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-card rounded-2xl border border-border h-80 flex items-center justify-center flex-col gap-3 text-muted-foreground">
              <Mail className="w-12 h-12 opacity-20" />
              <p className="font-semibold">Select a template to edit</p>
              <p className="text-sm">Click any template on the left to open the editor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
