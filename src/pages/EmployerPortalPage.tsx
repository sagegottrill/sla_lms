import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building2, Plus, Search, Users, Star, ChevronRight, ExternalLink, MapPin, DollarSign, Filter, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const employers = [
  { id: 1, name: "TechCorp Lagos", industry: "Technology", jobs: 4, placements: 12, logo: "TC", verified: true },
  { id: 2, name: "GTBank", industry: "Finance", jobs: 2, placements: 8, logo: "GT", verified: true },
  { id: 3, name: "Andela", industry: "Technology", jobs: 6, placements: 24, logo: "AN", verified: true },
  { id: 4, name: "Flutterwave", industry: "Fintech", jobs: 3, placements: 5, logo: "FL", verified: true },
  { id: 5, name: "WHO Africa", industry: "Health", jobs: 1, placements: 3, logo: "WH", verified: false },
];

const jobs = [
  { id: 1, title: "Data Analyst", company: "TechCorp Lagos", location: "Lagos, Nigeria", type: "Full-time", salary: '₦600k–₦1.2M/mo', skills: ["Python", "SQL", "Power BI"], applications: 14, posted: "2 days ago", status: "open" },
  { id: 2, title: "Product Manager", company: "Flutterwave", location: "Remote", type: "Full-time", salary: '₦1.5M–₦2.5M/mo', skills: ["Product Strategy", "Data Analysis", "Leadership"], applications: 28, posted: "4 days ago", status: "open" },
  { id: 3, title: "Business Development Lead", company: "Andela", location: "Nairobi, Kenya", type: "Full-time", salary: '₦800k–₦1.5M/mo', skills: ["Sales", "Communication", "Marketing"], applications: 9, posted: "1 week ago", status: "open" },
  { id: 4, title: "Financial Analyst", company: "GTBank", location: "Abuja, Nigeria", type: "Full-time", salary: '₦500k–₦900k/mo', skills: ["Financial Modelling", "Excel", "SQL"], applications: 22, posted: "3 days ago", status: "open" },
  { id: 5, title: "UX Designer", company: "TechCorp Lagos", location: "Lagos, Nigeria", type: "Contract", salary: '₦400k–₦800k/mo', skills: ["UX/UI Design", "Figma", "Research"], applications: 7, posted: "5 days ago", status: "open" },
];

const pipeline = [
  { stage: "Available", color: "bg-muted text-muted-foreground", icon: Users, candidates: [
    { name: "Chioma Eze", skills: ["Python", "SQL", "Power BI"], courses: 3, match: 92 },
    { name: "Grace Mensah", skills: ["Data Analysis", "Excel", "SQL"], courses: 2, match: 78 },
  ]},
  { stage: "Shortlisted", color: "bg-accent text-accent-foreground", icon: Star, candidates: [
    { name: "Nkechi Adeyemi", skills: ["UX/UI Design", "Figma"], courses: 2, match: 88 },
  ]},
  { stage: "Interviewing", color: "bg-accent text-primary", icon: Clock, candidates: [
    { name: "Fatima Hassan", skills: ["Python", "Machine Learning"], courses: 4, match: 95 },
  ]},
  { stage: "Placed", color: "bg-accent text-primary", icon: CheckCircle, candidates: [
    { name: "Amara Osei", skills: ["Data Analysis", "Leadership"], courses: 5, match: 97 },
    { name: "Keturah Lekwauwa", skills: ["Marketing", "Brand Strategy"], courses: 3, match: 84 },
  ]},
];

const tabs = ["Job Postings", "Employers", "Candidate Pipeline"];

export default function EmployerPortalPage() {
  const [activeTab, setActiveTab] = useState("Job Postings");
  const [search, setSearch] = useState("");

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Employer Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect SLA graduates with top African employers</p>
        </div>
        <Button className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Employer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["5", "Partner Employers", "text-primary"],
          ["16", "Open Positions", "text-secondary"],
          ["52", "Candidates Available", "text-primary"],
          ["52", "Total Placements", "text-secondary"],
        ].map(([v, l, c]) => (
          <div key={l} className="bg-card rounded-2xl border border-border p-5 text-center">
            <div className={`text-2xl font-bold font-display ${c}`}>{v}</div>
            <div className="text-xs text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Job Postings */}
      {activeTab === "Job Postings" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          <div className="space-y-3">
            {filteredJobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-brand-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-card flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {job.company.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {job.skills.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-primary font-bold">{job.type}</span>
                    <p className="text-xs text-muted-foreground mt-2">{job.applications} applicants</p>
                    <p className="text-xs text-muted-foreground">{job.posted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Button size="sm" variant="outline" className="rounded-lg text-xs flex items-center gap-1">View Applications <ChevronRight className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs flex items-center gap-1">Edit <ExternalLink className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs text-destructive border-destructive/20 hover:bg-destructive/10">Close Job</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Employers */}
      {activeTab === "Employers" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map((emp, i) => (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-brand-sm transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl gradient-card flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {emp.logo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{emp.name}</h3>
                    {emp.verified && <CheckCircle className="w-4 h-4 text-secondary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{emp.industry}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-accent">
                  <div className="font-bold text-primary">{emp.jobs}</div>
                  <div className="text-xs text-muted-foreground">Open Jobs</div>
                </div>
                <div className="p-3 rounded-xl bg-accent">
                  <div className="font-bold text-secondary">{emp.placements}</div>
                  <div className="text-xs text-muted-foreground">SLA Placements</div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 rounded-xl text-xs">View Profile</Button>
            </motion.div>
          ))}
          {/* Add employer CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="bg-card rounded-2xl border border-dashed border-primary/30 p-5 flex flex-col items-center justify-center gap-3 min-h-[200px] cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="w-12 h-12 rounded-xl gradient-card flex items-center justify-center text-primary-foreground">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Add New Employer</p>
            <p className="text-xs text-muted-foreground text-center">Onboard a new employer partner to the SLA network</p>
          </motion.div>
        </div>
      )}

      {/* Tab: Pipeline */}
      {activeTab === "Candidate Pipeline" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pipeline.map((stage) => (
            <div key={stage.stage} className="space-y-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${stage.color}`}>
                <stage.icon className="w-4 h-4" />
                {stage.stage} ({stage.candidates.length})
              </div>
              <div className="space-y-2">
                {stage.candidates.map((c) => (
                  <div key={c.name} className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:shadow-brand-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{c.name.charAt(0)}</div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{c.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {c.skills.slice(0, 2).map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{c.courses} courses</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.match >= 90 ? "bg-accent text-primary" : c.match >= 75 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                        {c.match}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
