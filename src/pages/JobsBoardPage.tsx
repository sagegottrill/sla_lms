import { useMemo, useState } from "react";
import { Briefcase, MapPin, Plus, Search, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const emptyJob = {
  title: "",
  company: "",
  location: "",
  type: "Full-time",
  salary: "",
  description: "",
};

export default function JobsBoardPage() {
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = appUser?.role === "admin" || appUser?.role === "program_manager";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await api.getJobs();
      return res.success ? res.data ?? [] : [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j: any) =>
      (j.title ?? "").toLowerCase().includes(q) ||
      (j.company ?? "").toLowerCase().includes(q) ||
      (j.location ?? "").toLowerCase().includes(q),
    );
  }, [jobs, search]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error("Title and company are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.createJob({
        ...form,
        skills: [],
        posted: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      });
      if (!res.success) throw new Error(res.error || "Could not post job");
      toast.success("Job posted.");
      setForm(emptyJob);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not post job");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this job posting?")) return;
    const res = await api.deleteJob(id);
    if (!res.success) {
      toast.error(res.error || "Could not delete job");
      return;
    }
    toast.success("Job removed.");
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Job Board</h1>
          <p className="text-muted-foreground text-sm">
            {isStaff ? "Post openings for learners and manage listings." : "Browse opportunities curated for SLA learners."}
          </p>
        </div>
        {isStaff && (
          <Button onClick={() => setShowForm((v) => !v)} className="rounded-full px-6 h-9 text-xs font-bold">
            <Plus className="w-3.5 h-3.5 mr-2" /> Post Job
          </Button>
        )}
      </div>

      {showForm && isStaff && (
        <div className="bg-card rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
          <h3 className="font-semibold text-foreground">New job posting</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {(["title", "company", "location", "type", "salary"] as const).map((key) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{key}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none"
              />
            </div>
          </div>
          <Button onClick={() => void handleCreate()} disabled={saving} className="rounded-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish job"}
          </Button>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs..."
          className="w-full pl-9 pr-4 py-2 rounded-full border bg-background text-sm"
        />
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-2xl ring-1 ring-black/5">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-foreground">No jobs posted yet</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for new openings.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((job: any) => (
            <div key={job.id} className="bg-card rounded-2xl ring-1 ring-black/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
                {isStaff && (
                  <button type="button" onClick={() => void handleDelete(job.id)} className="text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || "Remote"}</span>
                <span>{job.type}</span>
                {job.salary ? <span>{job.salary}</span> : null}
              </div>
              {job.description ? <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{job.description}</p> : null}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Posted {job.posted ?? "recently"}</span>
                <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => toast.info("Apply via the contact details in the job description or email info@sheleadsafrica.org")}>
                  <ExternalLink className="w-3 h-3 mr-1" /> View details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
