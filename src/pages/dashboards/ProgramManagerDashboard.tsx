import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Layout, DollarSign, Target, TrendingUp, Search, Bell, 
  Settings, LogOut, Menu, X, Plus, Filter, Download, Zap, Award, 
  ExternalLink, Mail, Shield, CheckCircle2, AlertCircle, AlertTriangle,
  FolderOpen, Clock, BarChart2, Edit, Trash2, CalendarDays, UserPlus, RefreshCw, Check, ChevronRight, MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgramParticipants, useSystemStats } from "@/hooks/useQueries";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserProfileSlideout, { SlideoutUser } from "../../components/dashboard/UserProfileSlideout";
import BulkActionBar from "../../components/dashboard/BulkActionBar";
import TranscriptSlip from "../../components/dashboard/TranscriptSlip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function ProgramManagerDashboard() {
  const { appUser } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSystemStats();
  const { data: participants = [], isLoading: participantsLoading, refetch: refetchParticipants } = useProgramParticipants();
  const [activeTab, setActiveTab] = useState<"participants" | "programs" | "applications">("participants");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [transcriptUser, setTranscriptUser] = useState<any>(null);

  const selectedParticipants = participants.filter((p: any) => selectedParticipantIds.has(p.id));
  const selectedEmails = selectedParticipants
    .map((p: any) => p.email)
    .filter((email: string | undefined) => !!email) as string[];

  const handleSlideoutAction = (action: string, user: SlideoutUser) => {
    switch (action) {
      case "email":
        if (!user.email) {
          toast.info("No email available for this learner.");
          break;
        }
        window.location.href = `mailto:${encodeURIComponent(user.email)}`;
        break;
      case "edit":
        toast.info("Direct profile edit coming next update.");
        break;
      case "transcript": setTranscriptUser(user); break;
      case "suspend": 
        toast.error(`Removed from program: ${user.name}`);
        setSelectedParticipant(null); 
        break;
    }
  };

  const filteredParticipants = participants.filter(p =>
    (p.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.program ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    const next = new Set(selectedParticipantIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedParticipantIds(next);
  };

  const toggleAll = () => {
    if (selectedParticipantIds.size === filteredParticipants.length) setSelectedParticipantIds(new Set());
    else setSelectedParticipantIds(new Set(filteredParticipants.map((p: any) => p.id)));
  };

  const bulkActions = [
    {
      icon: Mail,
      label: "Remind All",
      onClick: async () => {
        if (selectedParticipantIds.size === 0) {
          toast.info("Select participants first.");
          return;
        }
        if (selectedEmails.length === 0) {
          toast.info("No email addresses found for selected participants.");
          return;
        }
        const recipientList = selectedEmails.join("; ");
        try {
          await navigator.clipboard.writeText(recipientList);
          toast.success("Recipient emails copied. Paste into your mail app.");
        } catch {
          toast.info("Clipboard blocked. Copy emails manually from selected rows.");
        }
      },
    },
    {
      icon: Award,
      label: "Issue Certificates",
      onClick: async () => {
        if (selectedParticipantIds.size === 0) {
          toast.info("Select participants first.");
          return;
        }
        toast.info("Bulk certificate issue queued. Final certificate pipeline integration pending.");
      },
    },
  ];

  const handleSync = async () => {
    await Promise.all([refetchStats(), refetchParticipants()]);
    toast.success("Program data synced.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 pb-16 sm:pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-4 sm:pb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Program Management</h1>
          <p className="text-muted-foreground text-sm">
            {statsLoading ? "Syncing data..." : `${stats?.activePrograms || 0} active programs managing ${stats?.totalUsers || 0} learners.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSync} variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Sync
          </Button>
          <Button asChild className="rounded-full px-6 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white border-0">
            <Link to="/dashboard/programs/new">Create Cohort</Link>
          </Button>
        </div>
      </div>

      {/* Main Grid: 1/3 Left (Stats/Filters), 2/3 Right (Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* ———— LEFT COLUMN WIDGETS ———— */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-8">
          {/* Core Analytics Widget (Minimalist) */}
          <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Cohort Health</h2>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Avg. Completion</p>
                {statsLoading ? <Skeleton className="h-6 w-20" /> : (
                  <p className="text-2xl font-light text-foreground">{stats?.completionRate || 0}%</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Satisfaction Score</p>
                {statsLoading ? <Skeleton className="h-6 w-16" /> : (
                  <p className="text-2xl font-light text-foreground flex items-center gap-2">
                    {stats?.satisfactionScore || "0.0"} <Target className="w-4 h-4 text-emerald-500" />
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Active Programs</p>
                {statsLoading ? <Skeleton className="h-6 w-24" /> : (
                  <p className="text-2xl font-bold text-primary">{stats?.activePrograms || 0}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ———— RIGHT COLUMN CONTENT ———— */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* Pill Tabs & Search Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar border-b border-border/40">
              {["participants", "programs", "applications"].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveTab(f as any)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === f 
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                      : "text-foreground bg-transparent hover:bg-muted/80"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search record..."
                className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" 
              />
            </div>
          </div>

          {/* Table — Clean Coursera Rows */}
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === "participants" && (
                <table className="w-full">
                  <thead className="bg-muted/20 border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedParticipantIds.size === filteredParticipants.length && filteredParticipants.length > 0}
                          onChange={toggleAll}
                          className="rounded border-border/50 text-primary focus:ring-primary/30"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Learner</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Program</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Progress</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {participantsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-muted-foreground">
                          Syncing participants…
                        </td>
                      </tr>
                    ) : filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-muted-foreground">
                          <p className="text-sm">No participants found matching criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => (
                        <tr key={p.id} className={`transition-colors group ${selectedParticipantIds.has(p.id) ? "bg-primary/5" : "hover:bg-muted/10"}`}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedParticipantIds.has(p.id)}
                              onChange={() => toggleSelection(p.id)}
                              className="rounded border-border/50 text-primary focus:ring-primary/30"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedParticipant({ id: p.id, name: p.name, email: p.email, role: "student", status: p.status, joined: "", classes: [] })}>
                              <div className="w-9 h-9 rounded-full bg-muted/40 ring-1 ring-border/60 dark:bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                                {(p.name ?? "").charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                               {p.program}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[100px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${p.progress > 50 ? "bg-emerald-500/70" : "bg-amber-500/70"}`} style={{ width: `${p.progress}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-muted-foreground w-8">{p.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                                  aria-label={`Open actions for ${p.name}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setSelectedParticipant({
                                      id: p.id,
                                      name: p.name,
                                      email: p.email,
                                      role: "student",
                                      status: p.status,
                                      joined: "",
                                      classes: [],
                                    })
                                  }
                                  className="cursor-pointer font-medium text-xs py-2"
                                >
                                  Manage
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab !== "participants" && (
                <div className="py-20 text-center">
                   <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                   <p className="text-foreground font-medium mb-1">
                     {activeTab === "programs" ? "View all programs" : "Pending applications"}
                   </p>
                   <p className="text-sm text-muted-foreground mb-4">
                     {activeTab === "programs"
                       ? "Manage your cohort programs from the Programs page."
                       : "Review and approve program applications from the Admin Dashboard."}
                   </p>
                   <Link
                     to={activeTab === "programs" ? "/dashboard/programs" : "/dashboard"}
                     className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-colors"
                   >
                     <ChevronRight className="w-3.5 h-3.5" />
                     {activeTab === "programs" ? "Go to Programs" : "Go to Dashboard"}
                   </Link>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Slideouts & Bulk Actions */}
      <AnimatePresence>
        {selectedParticipantIds.size > 0 && (
          <BulkActionBar
            selectedCount={selectedParticipantIds.size}
            actions={bulkActions}
            onClear={() => setSelectedParticipantIds(new Set())}
          />
        )}
      </AnimatePresence>
      <UserProfileSlideout user={selectedParticipant} onClose={() => setSelectedParticipant(null)} onAction={handleSlideoutAction} />
      <TranscriptSlip user={transcriptUser} onClose={() => setTranscriptUser(null)} />

    </div>
  );
}
