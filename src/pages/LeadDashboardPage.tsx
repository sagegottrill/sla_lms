import { useState } from "react";
import { Users, Target, Mail, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function LeadDashboardPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Lead Conversion</h1>
          <p className="text-muted-foreground text-sm">
            Tracking traffic and enrollment flow.
          </p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-max">
          {[{ k: "7d", l: "7 Days" }, { k: "30d", l: "30 Days" }, { k: "90d", l: "90 Days" }].map(({ k, l }) => (
            <button 
              key={k} 
              onClick={() => setPeriod(k)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                period === k 
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                  : "text-foreground bg-transparent hover:bg-muted/80"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout (Async Coursera Style: 1/3 to 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ———— LEFT COLUMN (Global Metrics Widget) ———— */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Acquisition KPIs</h2>
            
            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Total Leads
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-light text-foreground">0</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Target className="w-3.5 h-3.5" /> Conversion Avg
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-light text-foreground">0%</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> Capture Rate
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-[#0056D2]">0</p>
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ———— RIGHT COLUMN (Top Content) ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">

          {/* Empty Funnel Container */}
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-6">Lead Funnel</h2>
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
               <Target className="w-8 h-8 opacity-20 mb-3" />
               <p className="text-sm font-medium">Insufficient Data</p>
               <p className="text-xs mt-1">Acquisition flows will render as leads enter the pipeline.</p>
            </div>
          </div>

          {/* Lead Directory */}
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            <div className="p-6 border-b border-border/40">
               <h2 className="font-display font-semibold text-lg text-foreground">Recent Acquisitions</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-16 bg-card/20 text-muted-foreground">
               <Users className="w-8 h-8 opacity-20 mb-3" />
               <p className="text-sm font-medium">No recent leads</p>
               <p className="text-xs mt-1 text-center max-w-sm">When users submit contact forms or express interest via campaigns, they will log here.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
