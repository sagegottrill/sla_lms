import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Building2, Plus, Search, Users, Star, ChevronRight, ExternalLink, MapPin, DollarSign, Filter, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Future Supabase Integration
const employers: any[] = [];
const jobs: any[] = [];

// The pipeline stages should always exist, even if candidate lists are empty
const pipelineStages = [
  { stage: "Available", color: "bg-muted text-muted-foreground", icon: Users, candidates: [] },
  { stage: "Shortlisted", color: "bg-accent/50 text-accent-foreground", icon: Star, candidates: [] },
  { stage: "Interviewing", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: Clock, candidates: [] },
  { stage: "Placed", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle, candidates: [] },
];

const tabs = ["Job Postings", "Employers", "Candidate Pipeline"];

export default function EmployerPortalPage() {
  const [activeTab, setActiveTab] = useState("Job Postings");
  const [search, setSearch] = useState("");

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(search.toLowerCase()) || 
    j.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Employer Portal</h1>
          <p className="text-muted-foreground text-sm">
            Connect SLA graduates with top African employers.
          </p>
        </div>
        <Button className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
          <Plus className="w-3.5 h-3.5 mr-2" /> Add Employer
        </Button>
      </div>

      {/* KPI Summary — Dynamic */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Partner Employers", value: employers.length, icon: Building2 },
          { label: "Open Positions", value: jobs.length, icon: Briefcase },
          { label: "Candidates Available", value: pipelineStages.reduce((acc, s) => acc + s.candidates.length, 0), icon: Users },
          { label: "Total Placements", value: pipelineStages.find(s => s.stage === "Placed")?.candidates.length || 0, icon: CheckCircle },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <stat.icon className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div className="text-2xl font-light text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 hide-scrollbar w-max">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === t 
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                : "text-foreground bg-transparent hover:bg-muted/80"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Tab: Job Postings */}
        {activeTab === "Job Postings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." 
                  className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" />
              </div>
              <button className="flex items-center gap-2 px-5 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-muted-foreground hover:bg-muted transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card p-12 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">No job postings found</p>
                <p className="text-sm text-muted-foreground">Create employer partnerships and publish open positions.</p>
                <Button variant="outline" className="mt-6 rounded-full text-xs font-semibold">Post a Job</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job, i) => (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 hover:border-border transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm shrink-0">
                          {job.company.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {job.skills?.map((s: string) => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-bold tracking-wider uppercase">{job.type}</span>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{job.applications || 0} applicants</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{job.posted}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="rounded-full text-xs flex items-center gap-1 h-8">View Applications <ChevronRight className="w-3 h-3 ml-1" /></Button>
                      <Button size="sm" variant="ghost" className="rounded-full text-xs flex items-center gap-1 h-8">Edit <ExternalLink className="w-3 h-3 ml-1" /></Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: Employers */}
        {activeTab === "Employers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employers.map((emp, i) => (
              <motion.div key={emp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 hover:border-border transition-colors flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-lg">
                    {emp.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground">{emp.name}</h3>
                      {emp.verified && <CheckCircle className="w-3.5 h-3.5 text-[#0056D2]" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{emp.industry}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center mt-auto">
                  <div className="p-3 rounded-xl bg-muted/30 ring-1 ring-black/5 dark:ring-white/10 border-0">
                    <div className="font-light text-xl text-foreground mb-1">{emp.jobs}</div>
                    <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Open Jobs</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <div className="font-light text-xl text-[#0056D2] mb-1">{emp.placements}</div>
                    <div className="text-[10px] font-semibold tracking-wider uppercase text-blue-700/70 dark:text-blue-400">Placements</div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Always visible Add Employer CTA Card */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: employers.length * 0.08 }}
              className="bg-card rounded-2xl border border-dashed border-border p-6 flex flex-col items-center justify-center gap-3 min-h-[220px] cursor-pointer hover:bg-muted/20 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 group-hover:bg-[#0056D2] group-hover:text-white transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Add New Employer</p>
                <p className="text-xs text-muted-foreground mt-1 px-4">Onboard a new employer partner to the SLA network</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tab: Pipeline (Kanban) */}
        {activeTab === "Candidate Pipeline" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {pipelineStages.map((stage) => (
              <div key={stage.stage} className="min-w-[280px] w-[280px] shrink-0 snap-start">
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold mb-3 ${stage.color}`}>
                  <stage.icon className="w-4 h-4" />
                  {stage.stage} <span className="opacity-60 ml-auto font-bold">{stage.candidates.length}</span>
                </div>
                
                <div className="space-y-3 min-h-[150px] rounded-xl bg-muted/20 p-2 ring-1 ring-black/5 dark:ring-white/10 border-0">
                  {stage.candidates.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-center px-4">
                      <p className="text-xs text-muted-foreground font-medium">No candidates</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Empty stage</p>
                    </div>
                  ) : (
                    stage.candidates.map((c: any) => (
                      <div key={c.name} className="bg-card rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-3 cursor-pointer hover:border-border transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{c.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {c.skills?.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium whitespace-nowrap">{s}</span>
                          ))}
                          {c.skills?.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">+{c.skills.length - 3}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{c.courses} courses</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.match >= 90 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : 
                            c.match >= 75 ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : 
                            "bg-muted text-muted-foreground"
                          }`}>
                            {c.match}% match
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
