import { useEffect, useState } from "react";
import { Mail, Plus, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

type Template = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  updatedAt?: string;
};

const variables = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{course_name}}", "{{program_name}}", "{{start_date}}", "{{company_name}}", "{{job_title}}", "{{certificate_id}}"];

export default function EmailTemplatesPage() {
  const { appUser } = useAuth();
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editContent, setEditContent] = useState("");

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return (t.name ?? "").toLowerCase().includes(q) || (t.category ?? "").toLowerCase().includes(q);
  });

  useEffect(() => {
    setEditContent(selectedTemplate?.body ?? "");
  }, [selectedTemplate]);

  useEffect(() => {
    const load = async () => {
      if (!appUser?.id) return;
      const rows = await api.getEmailTemplates();
      const mapped = (rows as any[]).map((t) => ({
        id: String(t.id),
        name: t.name ?? "Untitled",
        category: t.category ?? "General",
        subject: t.subject ?? "",
        body: t.body ?? "",
        updatedAt: t.updated_at ?? undefined,
      }));
      setTemplates(mapped);
    };
    load();
  }, [appUser?.id]);

  const handleNewTemplate = () => {
    if (!appUser?.id) {
      toast.error("Please log in.");
      return;
    }

    const body =
      "Hello {{first_name}},\n\nWe’re reaching out with an update for {{program_name}}.\n\nThanks,\n{{company_name}}";

    api
      .createEmailTemplate({
        userId: appUser.id,
        name: "New Template",
        category: "General",
        subject: "",
        body,
      })
      .then((created) => {
        if (!created) {
          toast.error("Failed to create template. Check Supabase connection/RLS.");
          return;
        }

        const next: Template = {
          id: String(created.id),
          name: created.name ?? "Untitled",
          category: created.category ?? "General",
          subject: created.subject ?? "",
          body: created.body ?? "",
          updatedAt: created.updated_at ?? undefined,
        };

        setTemplates((prev) => [next, ...prev]);
        setSelectedTemplate(next);
        toast.success("Template created");
      });
  };

  const handleSave = () => {
    if (!selectedTemplate) return;

    api
      .updateEmailTemplate({ templateId: selectedTemplate.id, body: editContent })
      .then((updatedRow) => {
        if (!updatedRow) {
          toast.error("Failed to save template. Check Supabase connection/RLS.");
          return;
        }

        const updated: Template = {
          ...selectedTemplate,
          body: updatedRow.body ?? editContent,
          updatedAt: updatedRow.updated_at ?? new Date().toISOString(),
        };

        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTemplate(updated);
        toast.success("Template saved");
      });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Email Templates</h1>
          <p className="text-muted-foreground text-sm">
            Drafts for learner and program messages. Wire delivery through Supabase Auth email or your provider (e.g. SendGrid) in the project dashboard — not from this screen.
          </p>
        </div>
        <Button onClick={handleNewTemplate} className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
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

          {filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((t) => {
                const active = selectedTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left px-4 py-3 rounded-2xl ring-1 transition-colors ${
                      active
                        ? "bg-muted/40 ring-primary/30"
                        : "bg-card ring-black/5 dark:ring-white/10 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.category}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-US") : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-8 xl:col-span-9">
          {!selectedTemplate ? (
            <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card p-8 flex items-center justify-center min-h-[300px] text-muted-foreground">
              <div className="text-center">
                <Mail className="w-10 h-10 opacity-20 mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">Select a template to edit</p>
                <p className="text-sm">Click any template on the left to open the editor.</p>
              </div>
            </div>
          ) : (
            <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card p-8 space-y-4 min-h-[300px]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedTemplate.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Category: {selectedTemplate.category}
                  </p>
                </div>
                <Button onClick={handleSave} size="sm" className="rounded-full">
                  Save Changes
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Email Body
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none font-mono"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Tip: you can use variables like{" "}
                <code className="font-mono bg-muted/60 px-1.5 py-0.5 rounded-md text-foreground">
                  {"{{first_name}}"}
                </code>{" "}
                inside the message.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
