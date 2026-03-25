import { useState } from "react";
import { Search, Download, Users, Bell, Trash2, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/components/dashboard/FilterChips";

import { toast } from "sonner";
import { useProgramParticipants } from "@/hooks/useQueries";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function ParticipantsPage() {
  const { data: participants = [], isLoading } = useProgramParticipants();
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);
  const queryClient = useQueryClient();

  const STATUS_OPTIONS = [
    { label: "On Track", value: "on-track" },
    { label: "At Risk", value: "at-risk" },
    { label: "Completed", value: "completed" },
  ];

  const normalizeStatus = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.toLowerCase().trim().replace(/\s+/g, "-");
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.program ?? "").toLowerCase().includes(q);
    const participantStatus = normalizeStatus(p.status);
    const matchFilter = selectedStatuses.length === 0 || selectedStatuses.includes(participantStatus);
    return matchSearch && matchFilter;
  });

  const handleToggleStatus = (value: string) => {
    setSelectedStatuses((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleClearStatuses = () => setSelectedStatuses([]);

  const toggleSelect = (id: string) => {
    const newDocs = new Set(selected);
    if (newDocs.has(id)) newDocs.delete(id);
    else newDocs.add(id);
    setSelected(newDocs);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const handleRemove = async () => {
    const userIds = Array.from(selected);
    if (userIds.length === 0) return;
    setRemoving(true);
    try {
      await Promise.all(userIds.map((userId) => api.dropAllEnrollmentsForUser(userId)));
      toast.success("Selected participants removed from active enrollments.");
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove participants.");
    } finally {
      setRemoving(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.all() });
    }
  };

  const exportRoster = () => {
    const roster = selected.size > 0 ? filtered.filter((p) => selected.has(p.id)) : filtered;
    const headers = ["name", "email", "program", "status", "progress", "last_active"];
    const rows = roster.map((p) => [
      p.name ?? "",
      p.email ?? "",
      p.program ?? "",
      p.status ?? "",
      Number(p.progress ?? 0),
      p.lastActive ?? "",
    ]);

    const escapeCsv = (value: unknown) => {
      const s = String(value ?? "");
      // Quote if it includes CSV-breaking characters.
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-roster-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Roster exported as CSV.");
  };

  const messageCohort = async () => {
    const roster = selected.size > 0 ? filtered.filter((p) => selected.has(p.id)) : filtered;
    const emails = roster.map((p) => p.email).filter((e): e is string => typeof e === "string" && e.trim().length > 0);
    if (emails.length === 0) {
      toast.info("No email addresses found to message.");
      return;
    }

    const payload = emails.join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Recipient emails copied. Paste into your message composer.");
    } catch {
      toast.info("Clipboard blocked. Select and copy emails manually in the roster export.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Participants</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Syncing participants…" : `Tracking ${participants.length} learners across active cohorts.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button
              onClick={handleRemove}
              disabled={removing}
              variant="outline"
              className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove selected ({selected.size})
            </Button>
          )}
          <Button onClick={exportRoster} variant="outline" className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted transition-colors">
             <Download className="w-3.5 h-3.5 mr-2" /> Export Roster
          </Button>
          <Button onClick={messageCohort} className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors">
            <Mail className="w-3.5 h-3.5 mr-2" /> Message Cohort
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="pb-2 md:pb-0 w-full">
          <FilterChips
            options={STATUS_OPTIONS}
            selectedValues={selectedStatuses}
            onToggle={handleToggleStatus}
            onClear={handleClearStatuses}
          />
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search learner directory..."
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" 
          />
        </div>
      </div>

      {/* Roster / Table */}
      <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-muted/20 border-b border-border/40">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-border/50 text-primary focus:ring-primary/30" />
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Learner</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Program</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Progress</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Last Active</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center bg-card/20 text-muted-foreground">
                    Syncing participants…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center bg-card/20">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">No participants found</p>
                    <p className="text-sm text-muted-foreground">Adjust your filters or wait for enrollments to sync.</p>
                  </td>
                </tr>
                  ) : (
                filtered.map((p) => {
                  const progressPct = Math.max(0, Math.min(100, Number(p.progress ?? 0)));
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors group ${selected.has(p.id) ? "bg-primary/5" : "hover:bg-muted/10"}`}
                    >
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-border/50 text-primary focus:ring-primary/30" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted/40 ring-1 ring-border/60 dark:bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {(p.name ?? p.email ?? "?").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{p.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{p.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                      {p.program ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progressPct >= 80 ? "bg-secondary" : progressPct >= 30 ? "bg-primary" : "bg-destructive"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-8">{progressPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-foreground/70">
                      {p.lastActive ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
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
                            onClick={async () => {
                              const email = p.email;
                              if (!email) {
                                toast.info("No email available for this learner.");
                                return;
                              }
                              try {
                                await navigator.clipboard.writeText(email);
                                toast.success("Email copied.");
                              } catch {
                                toast.info("Clipboard blocked. Copy manually from the roster.");
                              }
                            }}
                            className="cursor-pointer font-medium text-xs py-2"
                          >
                            Copy email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
