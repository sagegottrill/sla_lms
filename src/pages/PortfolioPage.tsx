import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Link, Upload, Plus, Trash2, ExternalLink, FileText, Image, Code, BarChart2, Edit2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const typeIcons: Record<string, React.ElementType> = {
  document: FileText,
  image: Image,
  code: Code,
  dashboard: BarChart2,
  website: Globe,
  link: Link,
};

const typeColors: Record<string, string> = {
  document:  "bg-accent text-accent-foreground",
  image:     "bg-accent text-primary",
  code:      "bg-muted text-muted-foreground",
  dashboard: "bg-accent text-primary",
  website:   "bg-accent text-primary",
  link:      "bg-muted text-muted-foreground",
};

const initialItems = [
  { id: 1, title: "Sales Dashboard – Power BI", type: "dashboard", desc: "Interactive sales analytics dashboard built for TechCorp Lagos Q4 2025 review.", url: "https://app.powerbi.com", tags: ["Power BI", "Data Viz", "Sales"], uploadDate: "Feb 20, 2026", file: false },
  { id: 2, title: "Python Churn Prediction Model", type: "code", desc: "Machine learning model to predict customer churn using logistic regression and random forests. 87% accuracy.", url: "https://github.com", tags: ["Python", "ML", "scikit-learn"], uploadDate: "Jan 15, 2026", file: true },
  { id: 3, title: "Business Plan – Agritech Startup", type: "document", desc: "Complete business plan developed during the Startup Founders program. Includes financial projections.", url: "", tags: ["Business Plan", "Entrepreneurship"], uploadDate: "Nov 5, 2025", file: true },
  { id: 4, title: "SLA Capstone Project Report", type: "document", desc: "Final capstone report for Women in Data Science program. Analyzed Lagos traffic data.", url: "", tags: ["Data Analysis", "Report"], uploadDate: "Dec 12, 2025", file: true },
];

export default function PortfolioPage() {
  const { user } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ title: "", type: "document", desc: "", url: "", tags: "" });

  const types = ["All", "document", "dashboard", "code", "image", "website", "link"];

  const filtered = filter === "All" ? items : items.filter(i => i.type === filter);

  const addItem = () => {
    if (!newItem.title) return;
    setItems(prev => [...prev, {
      id: Date.now(), ...newItem,
      tags: newItem.tags.split(",").map(t => t.trim()).filter(Boolean),
      uploadDate: "Today", file: !newItem.url,
    }]);
    setNewItem({ title: "", type: "document", desc: "", url: "", tags: "" });
    setShowAdd(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-1">Showcase your projects, work samples, and achievements</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl gradient-card text-primary-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Work
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Items", val: items.length },
          { label: "Documents", val: items.filter(i => i.type === "document").length },
          { label: "Projects", val: items.filter(i => i.type === "code" || i.type === "dashboard").length },
          { label: "Links", val: items.filter(i => i.url).length },
        ].map(({ label, val }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-3 text-center">
            <div className="font-display text-xl font-bold text-primary">{val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Add Portfolio Item</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="Project/file title"
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
                <option value="document">Document / PDF</option>
                <option value="dashboard">Dashboard</option>
                <option value="code">Code / GitHub</option>
                <option value="image">Image / Design</option>
                <option value="website">Website</option>
                <option value="link">Link</option>
              </select>
            </div>
            <textarea value={newItem.desc} onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))} placeholder="Brief description..." rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            <input value={newItem.url} onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))} placeholder="URL or link (optional)"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))} placeholder="Tags (comma-separated, e.g. Python, Data)"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />

            {/* File upload drop area */}
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer">
              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Click to upload a file (PDF, PNG, ZIP, etc.)</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={addItem} className="rounded-xl gradient-card text-primary-foreground text-sm">Add to Portfolio</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl text-sm">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <div className="flex gap-1 flex-wrap bg-muted p-1 rounded-xl w-fit">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === t ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Portfolio grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((item, i) => {
          const Icon = typeIcons[item.type] || Folder;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-5 group hover:shadow-brand-sm transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[item.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm leading-snug">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{item.type} · {item.uploadDate}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(item.id)} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {item.desc && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.desc}</p>}

              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>

              <div className="flex gap-2">
                {item.file && (
                  <Button size="sm" variant="outline" className="rounded-lg text-xs flex items-center gap-1">
                    <FileText className="w-3 h-3" /> View File
                  </Button>
                )}
                {item.url && (
                  <Button size="sm" variant="outline" className="rounded-lg text-xs flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Open Link
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <Folder className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No portfolio items yet. Click "Add Work" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
