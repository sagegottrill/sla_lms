import { useState } from "react";
import { Mail, Plus, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

// Awaiting Supabase hook for real email template management
const templates: any[] = [];

const variables = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{course_name}}", "{{program_name}}", "{{start_date}}", "{{company_name}}", "{{job_title}}", "{{certificate_id}}"];

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editContent, setEditContent] = useState("");

  const filtered = templates.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Email Templates</h1>
          <p className="text-muted-foreground text-sm">
            Manage automated email templates with dynamic variables.
          </p>
        </div>
        <Button className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
          <Plus className="w-3.5 h-3.5 mr-2" /> New Template
        </Button>
      </div>

      {/* Variables reference */}
      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6">
        <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5" /> Available Variables
        </p>
        <div className="flex flex-wrap gap-2">
          {variables.map(v => (
            <code key={v} className="text-xs bg-muted/60 px-2.5 py-1 rounded-md text-foreground font-mono">{v}</code>
          ))}
        </div>
      </div>

      {/* Grid Layout (Coursera Style: 1/3 to 2/3) */}
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Template list */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" />
          </div>
          {filtered.length === 0 && (
            <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-8 text-center">
              <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No templates</p>
              <p className="text-xs text-muted-foreground">Create your first email template to get started.</p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card p-8 flex items-center justify-center min-h-[300px] text-muted-foreground">
            <div className="text-center">
              <Mail className="w-10 h-10 opacity-20 mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">Select a template to edit</p>
              <p className="text-sm">Click any template on the left to open the editor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
