import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Search, Edit, Trash2,
  Loader2, X, Check, RefreshCw, MapPin, Building2, DollarSign, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useJobs, useCreateJobMutation, useUpdateJobMutation, useDeleteJobMutation } from "@/hooks/useQueries";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  skills: string[];
  posted: string;
  logo: string;
  description: string;
}

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
const inputCls = "w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

const EMPTY_JOB: Omit<Job, "id"> = {
  title: "", company: "", location: "", type: "Full-time",
  salary: "", skills: [], posted: "Just now", logo: "", description: "",
};

export default function JobsAdminPage() {
  const { data: jobsData, isLoading: loading, refetch } = useJobs();
  const jobs = (jobsData as Job[]) || [];
  
  const createJob = useCreateJobMutation();
  const updateJob = useUpdateJobMutation();
  const deleteJob = useDeleteJobMutation();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; job: Partial<Job> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const filtered = jobs.filter(j =>
    (j.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (j.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setModal({ mode: "add", job: { ...EMPTY_JOB } }); setSkillInput(""); };
  const openEdit = (j: Job) => { setModal({ mode: "edit", job: { ...j } }); setSkillInput(""); };
  const closeModal = () => { setModal(null); setSkillInput(""); };

  const addSkill = () => {
    if (!skillInput.trim() || !modal) return;
    const skills = [...(modal.job.skills ?? []), skillInput.trim()];
    setModal({ ...modal, job: { ...modal.job, skills } });
    setSkillInput("");
  };
  const removeSkill = (idx: number) => {
    if (!modal) return;
    const skills = (modal.job.skills ?? []).filter((_, i) => i !== idx);
    setModal({ ...modal, job: { ...modal.job, skills } });
  };

  const handleSave = async () => {
    if (!modal) return;
    const j = modal.job;
    if (!j.title?.trim() || !j.company?.trim()) { toast.error("Title and company are required."); return; }
    setSaving(true);
    
    if (modal.mode === "add") {
      createJob.mutate({
        title: j.title?.trim(), company: j.company?.trim(), location: j.location?.trim() || "",
        type: j.type || "Full-time", salary: j.salary?.trim() || "", skills: j.skills ?? [],
        posted: "Just now", logo: j.logo?.trim() || "", description: j.description?.trim() || ""
      }, {
        onSuccess: () => { toast.success("Job posted successfully!"); closeModal(); },
        onError: (err: any) => toast.error(`Failed to post job: ${err.message}`),
        onSettled: () => setSaving(false)
      });
    } else {
      updateJob.mutate({
        id: j.id as number,
        updates: {
          title: j.title?.trim(), company: j.company?.trim(), location: j.location?.trim() || "",
          type: j.type || "Full-time", salary: j.salary?.trim() || "", skills: j.skills ?? [],
          logo: j.logo?.trim() || "", description: j.description?.trim() || ""
        }
      }, {
        onSuccess: () => { toast.success("Job updated!"); closeModal(); },
        onError: (err: any) => toast.error(`Failed to update job: ${err.message}`),
        onSettled: () => setSaving(false)
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    deleteJob.mutate(id, {
      onSuccess: () => toast.success("Job deleted"),
      onError: () => toast.error("Failed to delete job")
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Jobs Management</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? "Loading directory..." : `Tracking ${jobs.length} active job postings.`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
          <Button onClick={openAdd} className="rounded-full px-6 h-9 text-xs font-semibold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5 mr-2" /> Post New Job
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs by title or company..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl shadow-sm border-0">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No jobs found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Click "Post New Job" to add your first listing</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl shadow-sm border-0 p-6 flex items-start gap-4 hover:shadow-brand-sm transition-shadow">
              {/* Logo */}
              <div className="w-12 h-12 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {job.logo ? (
                  <img src={job.logo} alt={job.company} className="w-full h-full object-contain p-1" onError={e => (e.currentTarget.style.display = "none")} />
                ) : (
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(job)} className="cursor-pointer font-medium text-xs flex items-center gap-2 py-2">
                          <Edit className="w-3 h-3" /> Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(job.id)} className="cursor-pointer text-destructive focus:text-destructive font-medium text-xs flex items-center gap-2 py-2">
                          <Trash2 className="w-3 h-3" /> Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold bg-accent text-primary px-2 py-0.5 rounded-full">{job.type}</span>
                  {job.salary && <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" />{job.salary}</span>}
                  {(job.skills ?? []).slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {(job.skills ?? []).length > 3 && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">+{(job.skills ?? []).length - 3} more</span>
                  )}
                </div>
                {job.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-2xl shadow-sm border-0 p-6 w-full max-w-lg shadow-brand-lg my-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-foreground">{modal.mode === "add" ? "Post New Job" : "Edit Job"}</h2>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Job Title *</label>
                  <input value={modal.job.title ?? ""} onChange={e => setModal({ ...modal, job: { ...modal.job, title: e.target.value } })} placeholder="e.g. Data Analyst" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company *</label>
                  <input value={modal.job.company ?? ""} onChange={e => setModal({ ...modal, job: { ...modal.job, company: e.target.value } })} placeholder="Flutterwave" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={modal.job.location ?? ""} onChange={e => setModal({ ...modal, job: { ...modal.job, location: e.target.value } })} placeholder="Lagos, Nigeria (Remote)" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Job Type</label>
                  <select value={modal.job.type ?? "Full-time"} onChange={e => setModal({ ...modal, job: { ...modal.job, type: e.target.value } })} className={inputCls}>
                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Salary Range</label>
                  <input value={modal.job.salary ?? ""} onChange={e => setModal({ ...modal, job: { ...modal.job, salary: e.target.value } })} placeholder="₦12M – ₦18M/yr" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Company Logo URL</label>
                  <input value={modal.job.logo ?? ""} onChange={e => setModal({ ...modal, job: { ...modal.job, logo: e.target.value } })} placeholder="https://logo.clearbit.com/company.com" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Job Description</label>
                  <textarea value={modal.job.description ?? ""} onChange={e => setModal({ ...modal, job: { ...modal.job, description: e.target.value } })} rows={3} placeholder="Describe the role and responsibilities..." className={inputCls + " resize-none"} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Required Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} placeholder="e.g. Python (press Enter)" className={inputCls} />
                    <Button type="button" onClick={addSkill} variant="outline" size="sm" className="rounded-xl shrink-0"><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(modal.job.skills ?? []).map((s, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-accent text-primary px-2 py-1 rounded-full">
                        {s}
                        <button onClick={() => removeSkill(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={closeModal} className="rounded-xl">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gradient-card text-primary-foreground rounded-xl gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Saving..." : modal.mode === "add" ? "Post Job" : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
