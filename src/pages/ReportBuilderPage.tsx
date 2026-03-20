import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Download, BarChart3, PieChart, TrendingUp, Calendar, Filter, Play, Save, Settings, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const metricOptions = [
  "Total Enrollments", "Course Completions", "Revenue", "Active Users", "New Registrations",
  "Certificate Issued", "Job Placements", "Average Score", "Retention Rate", "Lead Conversions",
];

const dimensionOptions = ["Month", "Week", "Program", "Course Category", "Instructor", "Country", "Payment Method", "Gender"];
const chartTypes = [
  { key: "bar", label: "Bar Chart", icon: BarChart3 },
  { key: "line", label: "Line Chart", icon: TrendingUp },
  { key: "area", label: "Area Chart", icon: PieChart },
] as const;

interface ReportConfig {
  id: string; name: string; metric: string; dimension: string; chartType: "bar" | "line" | "area"; dateRange: string;
}

const sampleData: any[] = [];

const savedReports: ReportConfig[] = [];

export default function ReportBuilderPage() {
  const [reports, setReports] = useState(savedReports);
  const [editing, setEditing] = useState<ReportConfig | null>(null);
  const [preview, setPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [form, setForm] = useState<ReportConfig>({
    id: "", name: "", metric: metricOptions[0], dimension: dimensionOptions[0], chartType: "bar", dateRange: "Last 6 months",
  });

  const startNew = () => {
    setForm({ id: crypto.randomUUID(), name: "", metric: metricOptions[0], dimension: dimensionOptions[0], chartType: "bar", dateRange: "Last 6 months" });
    setEditing(null);
    setPreview(false);
  };

  const editReport = (r: ReportConfig) => {
    setForm(r);
    setEditing(r);
    setPreview(false);
  };

  const saveReport = () => {
    if (!form.name.trim()) { toast.error("Give your report a name"); return; }
    if (editing) {
      setReports(prev => prev.map(r => r.id === editing.id ? form : r));
    } else {
      setReports(prev => [...prev, form]);
    }
    toast.success("Report saved!");
    setEditing(null);
    setPreview(true);
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    toast.success("Report deleted");
  };

  const handleExport = async () => {
    const el = document.getElementById("report-preview-chart");
    if (!el) return;
    setIsExporting(true);
    toast.info("Generating report image...");
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${form.name || "Report"}.png`;
      link.href = imgData;
      link.click();
      toast.success("Report exported successfully!");
    } catch (e) {
      toast.error("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderChart = (type: "bar" | "line" | "area") => (
    <ResponsiveContainer width="100%" height={280}>
      {type === "bar" ? (
        <BarChart data={sampleData}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
          <Bar dataKey="value" fill="#0C3B2E" radius={[6, 6, 0, 0]} />
        </BarChart>
      ) : type === "line" ? (
        <LineChart data={sampleData}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#0C3B2E" strokeWidth={2} dot={{ fill: "#0C3B2E", r: 4 }} />
        </LineChart>
      ) : (
        <AreaChart data={sampleData}>
          <defs>
            <linearGradient id="rpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0C3B2E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0C3B2E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#888" }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#0C3B2E" fill="url(#rpGrad)" strokeWidth={2} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Report Builder</h1>
          <p className="text-muted-foreground text-sm">Create and export custom programmatic reports</p>
        </div>
        <Button onClick={startNew} className="rounded-full px-6 h-9 text-xs font-semibold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5 mr-2" /> New Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Config */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Configuration</h3>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Report Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Enrollment Trend"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Metric</label>
              <select value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {metricOptions.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Group By</label>
              <select value={form.dimension} onChange={e => setForm({ ...form, dimension: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {dimensionOptions.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Date Range</label>
              <select value={form.dateRange} onChange={e => setForm({ ...form, dateRange: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {["Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months", "Last 12 months", "All time"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Chart Type</label>
              <div className="grid grid-cols-3 gap-2">
                {chartTypes.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setForm({ ...form, chartType: key })}
                    className={`p-3 rounded-xl border text-center transition-all ${form.chartType === key ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setPreview(true)} variant="outline" className="flex-1 rounded-xl gap-1.5 text-sm"><Eye className="w-4 h-4" /> Preview</Button>
              <Button onClick={saveReport} className="flex-1 gradient-card text-primary-foreground rounded-xl gap-1.5 text-sm hover:opacity-90"><Save className="w-4 h-4" /> Save</Button>
            </div>
          </div>
        </div>

        {/* Right — Preview + saved */}
        <div className="lg:col-span-2 space-y-4">
          {preview && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">{form.name || "Untitled Report"}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{form.metric} by {form.dimension} · {form.dateRange}</p>
                </div>
                <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-full h-9 px-5 text-xs font-semibold border-border">
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Download className="w-3.5 h-3.5 mr-2" />} 
                  Export PNG
                </Button>
              </div>
              <div id="report-preview-chart" className="p-4 bg-white rounded-xl">
                {sampleData.length > 0 ? renderChart(form.chartType) : (
                   <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border/60 rounded-xl bg-slate-50">
                      <BarChart3 className="w-8 h-8 opacity-20 mb-3" />
                      <p className="text-sm font-medium">Insufficient Data points</p>
                      <p className="text-xs mt-1">Select real telemetry dimensions to visualize data.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          <div>
            <h3 className="font-display font-semibold text-lg text-foreground mb-4">Saved Reports</h3>
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="bg-card rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-4 flex items-center justify-between gap-3 hover:border-[#0056D2]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#f5f9ff] border border-blue-100 flex items-center justify-center shrink-0">
                      {r.chartType === "bar" ? <BarChart3 className="w-4 h-4 text-[#0056D2]" /> : r.chartType === "line" ? <TrendingUp className="w-4 h-4 text-[#0056D2]" /> : <PieChart className="w-4 h-4 text-[#0056D2]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">{r.metric} · {r.dateRange}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" onClick={() => editReport(r)} className="rounded-full px-4 h-8 text-xs font-medium">Edit</Button>
                    <button onClick={() => deleteReport(r.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card">
                  <FileText className="w-8 h-8 opacity-20 mx-auto mb-3" />
                  <p className="font-medium text-foreground">No reports saved yet</p>
                  <p className="text-xs mt-1">Configure and save a report to view here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
