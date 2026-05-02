import { useState, useRef, useEffect } from "react";
import { Search, Download, Users, Bell, Trash2, Mail, MoreHorizontal, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { PageContainer, PageHeader } from "@/components/common/PageContainer";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

import { toast } from "sonner";
import { useProgramParticipants } from "@/hooks/useQueries";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ParticipantsPage() {
  const { data: participants = [], isLoading } = useProgramParticipants();
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);
  const queryClient = useQueryClient();
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // SMS/WhatsApp modal state
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsChannel, setSmsChannel] = useState<"sms" | "whatsapp">("sms");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sending, setSending] = useState(false);

  // Store the last focused element to return focus on close
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Focus phone input when modal opens
  useEffect(() => {
    if (smsModalOpen) {
      // Save currently focused element to return focus later
      lastFocusedElement.current = document.activeElement as HTMLElement;
      phoneInputRef.current?.focus();
    }
  }, [smsModalOpen]);

  // Return focus to trigger button when modal closes
  useEffect(() => {
    if (!smsModalOpen && lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, [smsModalOpen]);

  // Focus trap for modal
  useEffect(() => {
    if (!smsModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(
        smsModalOpen ? 
          document.querySelectorAll<HTMLElement>('[tabindex]:not([tabindex="-1"]):not([disabled])') : 
          []
      );
      
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else { // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [smsModalOpen]);

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
    const selectedRows = filtered.filter((p) => selected.has(p.id));
    const userIds = Array.from(
      new Set(
        selectedRows.map((p: any) => String(p.user_id ?? p.id)).filter((id) => id.length > 0),
      ),
    );
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
    const validEmails = Array.from(
      new Set(
        roster
          .map((p) => (typeof p.email === "string" ? p.email.trim() : ""))
          .filter((e) => e.length > 0 && e.includes("@")),
      ),
    ).join(",");

    if (!validEmails) {
      toast.info("No email addresses found to message.");
      return;
    }
    try {
      window.open(
        `mailto:${validEmails}?subject=${encodeURIComponent("Update from She Leads Africa")}`,
        "_blank",
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open email composer.");
    }
  };

  const handleDeleteParticipant = async (userId: string) => {
    if (!userId) return;
    setRemoving(true);
    try {
      await api.dropAllEnrollmentsForUser(userId);
      await api.deleteProfile(userId);
      toast.success("Participant deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.base });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete participant.");
    } finally {
      setRemoving(false);
    }
  };

  const openSmsModal = (participant: any) => {
    setSelectedParticipant(participant);
    setPhoneNumber(""); // Will need to be entered by admin
    setSmsMessage("");
    setSmsChannel("sms");
    setSmsModalOpen(true);
  };

  const handleSendSms = async () => {
    if (!phoneNumber || !smsMessage) {
      toast.error("Please provide both phone number and message.");
      return;
    }

    setSending(true);
    try {
      await api.sendTwilioMessage({
        to: phoneNumber,
        message: smsMessage,
        channel: smsChannel,
      });

      toast.success(`${smsChannel === "whatsapp" ? "WhatsApp" : "SMS"} sent successfully!`);
      setSmsModalOpen(false);
      setSmsMessage("");
      setPhoneNumber("");
    } catch (e: any) {
      toast.error(e?.message || `Failed to send ${smsChannel === "whatsapp" ? "WhatsApp" : "SMS"} message.`);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Participants"
        subtitle={isLoading ? "Syncing participants…" : `Tracking ${participants.length} learners across active cohorts.`}
        actions={
          <>
            {selected.size > 0 && (
              <Button
                onClick={handleRemove}
                disabled={removing}
                variant="outline"
                className={cn(DESIGN_TOKENS.buttonDestructive, "disabled:opacity-50")}
              >
                <Trash2 className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Remove selected ({selected.size})
              </Button>
            )}
            <Button onClick={exportRoster} variant="outline" className={DESIGN_TOKENS.buttonOutline}>
              <Download className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Export Roster
            </Button>
            <Button onClick={messageCohort} className={cn(DESIGN_TOKENS.buttonPrimary, "h-9 px-6 text-xs font-bold")}>
              <Mail className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Message Cohort
            </Button>
          </>
        }
      />

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
          <Search className={cn(DESIGN_TOKENS.iconButton, "absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60")} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search learner directory..."
            className={cn(DESIGN_TOKENS.inputSearch, "pl-10")} 
          />
        </div>
      </div>

      {/* Roster / Table */}
      <div className={DESIGN_TOKENS.card}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className={DESIGN_TOKENS.tableHeaderRow}>
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-border/50 text-primary focus:ring-primary/30" />
                </th>
                <th className={DESIGN_TOKENS.tableHeader}>Learner</th>
                <th className={DESIGN_TOKENS.tableHeader}>Program</th>
                <th className={DESIGN_TOKENS.tableHeader}>Progress</th>
                <th className={DESIGN_TOKENS.tableHeader}>Last Active</th>
                <th className={cn(DESIGN_TOKENS.tableHeader, "text-right")}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                <tr>
                  <td colSpan={6} className={cn(DESIGN_TOKENS.tableCell, "py-20 text-center bg-card/20 text-muted-foreground")}>
                    Syncing participants…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={cn(DESIGN_TOKENS.tableCell, "py-20 text-center bg-card/20")}>
                    <Users className={cn(DESIGN_TOKENS.iconEmpty, "text-muted-foreground/30 mx-auto mb-3")} />
                    <p className="text-foreground font-medium mb-1">No participants found</p>
                    <p className={DESIGN_TOKENS.pageSubtitle}>Adjust your filters or wait for enrollments to sync.</p>
                  </td>
                </tr>
                  ) : (
                filtered.map((p) => {
                  const progressPct = Math.max(0, Math.min(100, Number(p.progress ?? 0)));
                  return (
                    <tr
                      key={p.id}
                      className={cn(DESIGN_TOKENS.tableRow, selected.has(p.id) && "bg-primary/5")}
                    >
                    <td className={DESIGN_TOKENS.tableCell}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-border/50 text-primary focus:ring-primary/30" />
                    </td>
                    <td className={DESIGN_TOKENS.tableCell}>
                      <div className="flex items-center gap-4">
                        <div className={cn(DESIGN_TOKENS.avatar, "w-8 h-8 text-xs")}>
                          {(p.name ?? p.email ?? "?").charAt(0)}
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold text-foreground group-hover:text-primary", DESIGN_TOKENS.transitionColors)}>{p.name ?? "—"}</p>
                          <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-xs")}>{p.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn(DESIGN_TOKENS.tableCell, "text-xs font-semibold text-muted-foreground")}>
                      {p.program ?? "—"}
                    </td>
                    <td className={DESIGN_TOKENS.tableCell}>
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
                    <td className={cn(DESIGN_TOKENS.tableCell, "text-xs font-medium text-foreground/70")}>
                      {p.lastActive ?? "—"}
                    </td>
                    <td className={cn(DESIGN_TOKENS.tableCell, "text-right")}>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <button
                             ref={triggerButtonRef}
                             className={DESIGN_TOKENS.dropdownTrigger}
                             aria-label={`Open actions for ${p.name}`}
                           >
                             <MoreHorizontal className={DESIGN_TOKENS.iconButton} />
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
                          <DropdownMenuItem
                            onClick={() => {
                              const email = typeof p.email === "string" ? p.email.trim() : "";
                              if (!email || !email.includes("@")) {
                                toast.info("No valid email available for this learner.");
                                return;
                              }
                              window.open(`mailto:${email}`, "_blank");
                            }}
                            className="cursor-pointer font-medium text-xs py-2"
                          >
                            Email participant
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openSmsModal(p)}
                            className="cursor-pointer font-medium text-xs py-2"
                          >
                            <MessageSquare className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} />
                            Send SMS / WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleDeleteParticipant(String((p as any).user_id ?? ""))}
                            className="cursor-pointer font-medium text-xs py-2 text-destructive focus:text-destructive"
                          >
                            Delete participant
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

      {/* SMS/WhatsApp Modal */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send {smsChannel === "whatsapp" ? "WhatsApp" : "SMS"} Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedParticipant?.name || "participant"} via {smsChannel === "whatsapp" ? "WhatsApp" : "SMS"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={smsChannel} onValueChange={(val: "sms" | "whatsapp") => setSmsChannel(val)}>
                <SelectTrigger id="channel">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                ref={phoneInputRef}
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +234 for Nigeria)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                ref={messageTextareaRef}
                id="message"
                placeholder="Type your message here..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendSms();
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-xs text-muted-foreground">
                {smsMessage.length} characters
              </p>
            </div>
          </div>

           <DialogFooter>
             <Button
               ref={cancelButtonRef}
               variant="outline"
               onClick={() => setSmsModalOpen(false)}
               disabled={sending}
             >
               Cancel
             </Button>
             <Button
               ref={sendButtonRef}
               onClick={handleSendSms}
               disabled={sending || !phoneNumber || !smsMessage}
               className="bg-primary hover:bg-primary/90"
             >
               {sending ? "Sending..." : `Send ${smsChannel === "whatsapp" ? "WhatsApp" : "SMS"}`}
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageContainer>
  );
}
