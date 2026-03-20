import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Link, Upload, Plus, Trash2, ExternalLink, FileText, Image, Code, BarChart2, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";

const typeIcons: Record<string, React.ElementType> = {
  document: FileText, image: Image, code: Code, dashboard: BarChart2, website: Globe, link: Link,
};
const typeColors: Record<string, string> = {
  document: "bg-accent text-accent-foreground", image: "bg-accent text-primary",
  code: "bg-muted text-muted-foreground", dashboard: "bg-accent text-primary",
  website: "bg-accent text-primary", link: "bg-muted text-muted-foreground",
};
const TYPES = ["All", "document", "dashboard", "code", "image", "website", "link"];

export default function PortfolioPage() {
  const { appUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", type: "document", description: "", link_url: "", tags: "" });

  const load = useCallback(async () => {
    if (!appUser?.id) return;
    setLoading(true);
    const data = await api.getPortfolioItems(appUser.id);
    setItems(data);
    setLoading(false);
  }, [appUser?.id]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!newItem.title || !appUser) return;
    setAdding(true);
    const result = await api.addPortfolioItem(appUser.id, {
      title: newItem.title,
      type: newItem.type,
      description: newItem.description,
      link_url: newItem.link_url || undefined,
      tags: newItem.tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setAdding(false);
    if (result) {
      toast.success("Portfolio item added!");
      setItems(prev => [result, ...prev]);
      setNewItem({ title: "", type: "document", description: "", link_url: "", tags: "" });
      setShowAdd(false);
    } else {
      toast.error("Failed to add item — check Supabase connection.");
    }
  };

  const deleteItem = async (id: string) => {
    await api.deletePortfolioItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Item removed.");
  };

  const filtered = filter === "All" ? items : items.filter(i => i.type === filter);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-border/60 pb-6 pt-4 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">My Portfolio</h1>
          <p className="text-muted-foreground text-base mt-2">Showcase your best projects, dashboards, and professional work</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl flex items-center gap-2 h-11 px-6 shadow-sm font-bold bg-primary hover:bg-primary/90 text-white shrink-0">
          <Plus className="w-4 h-4" /> Add New Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Items", val: items.length },
          { label: "Documents", val: items.filter(i => i.type === "document").length },
          { label: "Projects", val: items.filter(i => i.type === "code" || i.type === "dashboard").length },
          { label: "Links", val: items.filter(i => i.link_url).length },
        ].map(({ label, val }) => (
          <div key={label} className="bg-muted/20 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-4 text-center">
            <div className="font-display text-2xl font-bold text-foreground mb-1">{loading ? "…" : val}</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 space-y-3">
            <h3 className="font-semibold text-foreground">Add Portfolio Item</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                placeholder="Project/file title"
                className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
                className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none">
                <option value="document">Document / PDF</option>
                <option value="dashboard">Dashboard</option>
                <option value="code">Code / GitHub</option>
                <option value="image">Image / Design</option>
                <option value="website">Website</option>
                <option value="link">Link</option>
              </select>
            </div>
            <textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description..." rows={2}
              className="w-full px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            <input value={newItem.link_url} onChange={e => setNewItem(p => ({ ...p, link_url: e.target.value }))}
              placeholder="URL or link (optional)"
              className="w-full px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags (comma-separated, e.g. Python, Data)"
              className="w-full px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-all">
              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">File upload coming soon — paste a link above for now</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={addItem} disabled={adding} className="rounded-xl text-sm flex items-center gap-2">
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {adding ? "Saving..." : "Add to Portfolio"}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl text-sm">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all capitalize border ${filter === t ? "bg-primary border-primary text-white shadow-sm" : "bg-transparent border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-muted/10 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 mt-8">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">No portfolio items yet</h3>
          <p className="text-base text-muted-foreground">Empty canvas! Click "Add New Item" to start building your portfolio.</p>
        </div>
      )}

      {/* Portfolio grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6 mt-4">
          {filtered.map((item, i) => {
            const Icon = typeIcons[item.type] || Folder;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 group hover:shadow-md transition-all flex flex-col justify-between h-full">
                
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${typeColors[item.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <button onClick={() => deleteItem(item.id)}
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-lg text-foreground leading-snug line-clamp-1">{item.title}</h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
                    {item.type} · {item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>

                {item.description && <p className="text-sm text-foreground/80 mb-6 leading-relaxed line-clamp-3 flex-1">{item.description}</p>}

                <div>
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="text-[11px] font-medium bg-muted/50 text-foreground px-2.5 py-1 rounded-md ring-1 ring-black/5 dark:ring-white/10 border-0">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-border/40 pt-4">
                    {item.file_url && (
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex items-center gap-1.5 font-semibold h-9 px-4"
                        onClick={() => window.open(item.file_url, "_blank")}>
                        <FileText className="w-3.5 h-3.5" /> View File
                      </Button>
                    )}
                    {item.link_url && (
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex items-center gap-1.5 font-semibold h-9 px-4"
                        onClick={() => window.open(item.link_url, "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" /> Open Link
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
