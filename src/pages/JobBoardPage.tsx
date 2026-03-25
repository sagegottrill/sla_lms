import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, Search, Filter, BookmarkPlus, ExternalLink, Star, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useJobs } from "@/hooks/useQueries";

const filters = ["All", "Full-time", "Part-time", "Remote", "Internship"];

export default function JobBoardPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const { data: jobs = [], isLoading } = useJobs();

  const toggleSave = (id: number) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      const wasSaved = next.has(id);
      if (wasSaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      toast(wasSaved ? "Removed from saved jobs" : "Job saved! View in your saved list.");
      return next;
    });
  };

  const filtered = jobs.filter(j => {
    const matchFilter =
      activeFilter === "All" ||
      j.type === activeFilter ||
      (activeFilter === "Remote" && (j.location ?? "").includes("Remote"));
    const matchSearch =
      (j.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (j.company ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} opportunities matched to your skills</p>
        </div>
        <Button onClick={() => toast.success("Job alerts enabled! We'll notify you of new matches.")} className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2 w-fit">
          <Star className="w-4 h-4" /> Set Job Alerts
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, companies, skills..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm text-muted-foreground hover:bg-muted transition-colors shrink-0">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeFilter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Job listings */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Briefcase className="w-10 h-10 opacity-30 mb-4" />
            <p className="text-sm">Loading jobs…</p>
          </div>
        ) : (
          filtered.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-2xl shadow-sm border-0 p-6 hover:shadow-brand-sm transition-all"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl gradient-card flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 shrink-0" />
                        {job.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          (job.match ?? 0) >= 85
                            ? "bg-accent text-primary"
                            : (job.match ?? 0) >= 75
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {(job.match ?? 0)}% match
                      </div>
                      <button
                        onClick={() => toggleSave(job.id)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                          savedIds.has(job.id)
                            ? "border-primary bg-accent text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {job.posted}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted">{job.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(job.skills ?? []).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2.5 py-1 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                <Button
                  onClick={() => toast.success(`Application submitted to ${job.company}! They'll review your profile.`)}
                  className="flex-1 rounded-xl gradient-card text-primary-foreground text-xs hover:opacity-90"
                >
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs flex items-center gap-1"
                  onClick={() => toast.info(`${job.title} at ${job.company}: ${job.location}. Salary: ${job.salary}`)}
                >
                  <ExternalLink className="w-3 h-3" /> Details
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground max-w-sm mx-auto">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary" />
          <p className="font-semibold text-foreground mb-2">The perfect role is still warming up for you, Sis!</p>
          <p className="text-sm">While we hunt for your next big break, why not polish your CV or take a quick masterclass to stay top-of-mind for recruiters?</p>
        </div>
      )}
    </div>
  );
}
