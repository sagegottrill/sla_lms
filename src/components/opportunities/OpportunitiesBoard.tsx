import { useMemo, useState } from "react";
import {
  Briefcase, MapPin, Plus, Search, Trash2, Loader2, ExternalLink,
  Building2, Clock, Pencil, X, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const JOB_TYPES = ["All", "Full-time", "Part-time", "Contract", "Internship", "Remote"] as const;

const emptyJob = {
  title: "",
  company: "",
  location: "",
  type: "Full-time",
  salary: "",
  description: "",
  application_url: "",
  contact_email: "",
};

type JobRecord = {
  id: number;
  title: string;
  company: string;
  location?: string;
  type?: string;
  salary?: string;
  description?: string;
  application_url?: string;
  contact_email?: string;
  posted?: string;
  posted_by?: string;
  status?: string;
  created_at?: string;
};

function formatPosted(job: JobRecord) {
  if (job.posted) return job.posted;
  if (!job.created_at) return "Recently";
  return new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function handleApply(job: JobRecord) {
  const url = (job.application_url ?? "").trim();
  const email = (job.contact_email ?? "").trim();
  if (url) {
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  if (email) {
    window.open(`mailto:${email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`, "_blank");
    return;
  }
  toast.info("No application link on this posting. Contact the company directly.");
}

export default function OpportunitiesBoard() {
  const { appUser, isAuthenticated, openAuthModal } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = appUser?.role === "admin" || appUser?.role === "program_manager";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await api.getJobs();
      return res.success ? (res.data ?? []) : [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (jobs as JobRecord[]).filter((j) => {
      if ((j.status ?? "open") === "closed") return false;
      const matchesSearch =
        (j.title ?? "").toLowerCase().includes(q) ||
        (j.company ?? "").toLowerCase().includes(q) ||
        (j.location ?? "").toLowerCase().includes(q) ||
        (j.description ?? "").toLowerCase().includes(q);
      const matchesType =
        typeFilter === "All" ||
        (j.type ?? "").toLowerCase() === typeFilter.toLowerCase() ||
        (typeFilter === "Remote" && (j.location ?? "").toLowerCase().includes("remote"));
      return matchesSearch && matchesType;
    });
  }, [jobs, search, typeFilter]);

  const selectedJob = filtered.find((j) => j.id === selectedId) ?? filtered[0] ?? null;

  const canManage = (job: JobRecord) =>
    isStaff || (isAuthenticated && job.posted_by && job.posted_by === appUser?.id);

  const resetForm = () => {
    setForm(emptyJob);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    if (!isAuthenticated) {
      openAuthModal("signup");
      return;
    }
    setEditingId(null);
    setForm({ ...emptyJob, contact_email: appUser?.email ?? "" });
    setShowForm(true);
  };

  const openEdit = (job: JobRecord) => {
    setEditingId(job.id);
    setForm({
      title: job.title ?? "",
      company: job.company ?? "",
      location: job.location ?? "",
      type: job.type ?? "Full-time",
      salary: job.salary ?? "",
      description: job.description ?? "",
      application_url: job.application_url ?? "",
      contact_email: job.contact_email ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error("Job title and company are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: [],
        status: "open",
        posted: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      const res = editingId
        ? await api.updateJob(editingId, payload)
        : await api.createJob(payload);
      if (!res.success) throw new Error(res.error || "Could not save job");
      toast.success(editingId ? "Opportunity updated." : "Opportunity posted.");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save job");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this opportunity?")) return;
    const res = await api.deleteJob(id);
    if (!res.success) {
      toast.error(res.error || "Could not delete job");
      return;
    }
    toast.success("Opportunity removed.");
    if (selectedId === id) setSelectedId(null);
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 py-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Career opportunities</p>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Opportunities</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Browse job openings like a job search platform. Recruiters and partners can post openings; learners apply on the company site or by email.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full px-6 h-10 text-xs font-bold shrink-0">
          <Plus className="w-3.5 h-3.5 mr-2" /> Post opportunity
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{editingId ? "Edit opportunity" : "Post a new opportunity"}</h3>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(["title", "company", "location", "type", "salary"] as const).map((key) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{key.replace("_", " ")}</label>
                {key === "type" ? (
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm"
                  >
                    {JOB_TYPES.filter((t) => t !== "All").map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">application url</label>
              <input
                value={form.application_url}
                onChange={(e) => setForm((f) => ({ ...f, application_url: e.target.value }))}
                placeholder="https://company.com/careers/role"
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">contact email</label>
              <input
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="recruiter@company.com"
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={5}
                placeholder="Role summary, requirements, and how to apply..."
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Add an application URL so candidates are sent to your careers page, or a contact email for direct applications.
          </p>
          <Button onClick={() => void handleSave()} disabled={saving} className="rounded-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Save changes" : "Publish opportunity"}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, or location..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full border bg-background text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                typeFilter === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-2xl ring-1 ring-black/5">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-foreground">No opportunities yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to post an opening for SLA learners.</p>
          <Button onClick={openCreate} className="mt-4 rounded-full">Post opportunity</Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 min-h-[520px]">
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedId(job.id)}
                className={cn(
                  "w-full text-left bg-card rounded-2xl ring-1 ring-black/5 p-4 transition-all hover:ring-primary/20",
                  selectedJob?.id === job.id && "ring-2 ring-primary/40 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" /> {job.company}
                    </p>
                  </div>
                  {canManage(job) && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void handleDelete(job.id); }}
                        className="p-1.5 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || "Remote"}</span>
                  <span>{job.type}</span>
                  {job.salary ? <span>{job.salary}</span> : null}
                </div>
              </button>
            ))}
          </div>

          {selectedJob && (
            <div className="bg-card rounded-2xl ring-1 ring-black/5 p-6 lg:sticky lg:top-6 h-fit">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{selectedJob.title}</h2>
                  <p className="text-muted-foreground mt-1">{selectedJob.company}</p>
                </div>
                <Button onClick={() => handleApply(selectedJob)} className="rounded-full shrink-0">
                  Apply now <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-4 pb-4 border-b border-border/40">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{selectedJob.location || "Remote"}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{selectedJob.type || "Full-time"}</span>
                {selectedJob.salary ? <span>{selectedJob.salary}</span> : null}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Posted {formatPosted(selectedJob)}</span>
              </div>

              {selectedJob.description ? (
                <div className="mt-4 prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No additional description provided.</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => handleApply(selectedJob)} className="rounded-full">
                  {selectedJob.application_url ? "Apply on company site" : selectedJob.contact_email ? "Apply by email" : "Apply"}
                </Button>
                {selectedJob.contact_email ? (
                  <Button variant="outline" className="rounded-full" onClick={() => window.open(`mailto:${selectedJob.contact_email}`, "_blank")}>
                    <Mail className="w-3.5 h-3.5 mr-1.5" /> Contact recruiter
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
