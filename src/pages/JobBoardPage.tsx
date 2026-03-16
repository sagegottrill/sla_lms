import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, Search, Filter, BookmarkPlus, ExternalLink, Star, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const jobs = [
  { id: 1, title: "Data Analyst", company: "Flutterwave", location: "Lagos, Nigeria (Hybrid)", salary: '₦15M–25M/yr', type: "Full-time", posted: "2 days ago", match: 92, logo: "F", skills: ["SQL", "Power BI", "Python"], saved: false },
  { id: 2, title: "Marketing Manager", company: "Jumia Africa", location: "Nairobi, Kenya (Remote)", salary: '₦12M–20M/yr', type: "Full-time", posted: "3 days ago", match: 85, logo: "J", skills: ["Digital Marketing", "Brand Strategy", "SEO"], saved: true },
  { id: 3, title: "Business Development Associate", company: "Andela", location: "Remote (Africa)", salary: '₦10M–15M/yr', type: "Full-time", posted: "1 week ago", match: 78, logo: "A", skills: ["Business Development", "Communication", "CRM"], saved: false },
  { id: 4, title: "Financial Analyst", company: "Stanbic Bank", location: "Accra, Ghana (On-site)", salary: '₦12M–18M/yr', type: "Full-time", posted: "1 week ago", match: 75, logo: "S", skills: ["Financial Modelling", "Excel", "CFA"], saved: false },
  { id: 5, title: "Product Manager", company: "Paystack", location: "Lagos, Nigeria (Hybrid)", salary: '₦20M–30M/yr', type: "Full-time", posted: "2 weeks ago", match: 70, logo: "P", skills: ["Product Strategy", "Agile", "Data Analysis"], saved: false },
  { id: 6, title: "Data Science Intern", company: "MTN Group", location: "Johannesburg, SA (On-site)", salary: '₦3M–5M/yr', type: "Internship", posted: "3 days ago", match: 88, logo: "M", skills: ["Python", "Machine Learning", "Statistics"], saved: true },
];

const filters = ["All", "Full-time", "Part-time", "Remote", "Internship"];

export default function JobBoardPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedIds, setSavedIds] = useState(new Set(jobs.filter(j => j.saved).map(j => j.id)));

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
    const matchFilter = activeFilter === "All" || j.type === activeFilter || (activeFilter === "Remote" && j.location.includes("Remote"));
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted transition-colors shrink-0">
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
        {filtered.map((job, i) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl border border-border p-5 hover:shadow-brand-sm transition-all">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl gradient-card flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                {job.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 shrink-0" />{job.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      job.match >= 85 ? "bg-accent text-primary" :
                      job.match >= 75 ? "bg-accent text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {job.match}% match
                    </div>
                    <button onClick={() => toggleSave(job.id)} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${savedIds.has(job.id) ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted">{job.type}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.skills.map(s => <span key={s} className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground">{s}</span>)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <Button onClick={() => toast.success(`Application submitted to ${job.company}! They'll review your profile.`)} className="flex-1 rounded-xl gradient-card text-primary-foreground text-xs hover:opacity-90">Apply Now</Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs flex items-center gap-1" onClick={() => toast.info(`${job.title} at ${job.company}: ${job.location}. Salary: ${job.salary}`)}>
                <ExternalLink className="w-3 h-3" /> Details
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground max-w-sm mx-auto">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary" />
          <p className="font-semibold text-foreground mb-2">The perfect role is still warming up for you, Sis!</p>
          <p className="text-sm">While we hunt for your next big break, why not polish your CV or take a quick masterclass to stay top-of-mind for recruiters?</p>
        </div>
      )}
    </div>
  );
}
