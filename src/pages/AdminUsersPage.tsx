import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, UserPlus, Trash2,
  Shield, Loader2, X, Check, RefreshCw, ChevronRight, MoreHorizontal, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfiles, useUpdateProfileMutation, useDeleteProfileMutation, usePrograms } from "@/hooks/useQueries";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { PageContainer, PageHeader } from "@/components/common/PageContainer";
import { DESIGN_TOKENS, ROLE_COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Role = "student" | "instructor" | "program_manager" | "admin";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  joined: string;
  created_at: string;
}

const ROLES: Role[] = ["student", "instructor", "program_manager", "admin"];
/** Shown in User Management directory (learners belong under Participants). */
const STAFF_ROLES: Role[] = ["instructor", "program_manager", "admin"];
const INVITE_ROLES: Role[] = ["instructor", "program_manager", "admin"];

export default function AdminUsersPage() {
  const { data: usersData, isLoading: loading, refetch } = useProfiles();
  const users = (usersData as Profile[]) || [];
  const { data: programs = [] } = usePrograms({ activeCatalog: false });
  const staffDirectory = users.filter((u) => STAFF_ROLES.includes(u.role));
  
  const updateProfile = useUpdateProfileMutation();
  const deleteProfile = useDeleteProfileMutation();

  const [search, setSearch] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "instructor" as Role,
    managedProgramId: "" as number | "",
  });

  const normalizeRoleLabel = (role: Role) =>
    role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const STAFF_FILTER_OPTIONS = STAFF_ROLES.map((role) => ({
    label: normalizeRoleLabel(role),
    value: role,
  }));

  const filtered = staffDirectory.filter((u: Profile) => {
    const q = search.toLowerCase();
    const matchSearch = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    const matchRole = selectedRoles.length === 0 || selectedRoles.includes(u.role);
    return matchSearch && matchRole;
  });

  const handleToggleRole = (value: string) => {
    setSelectedRoles((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleClearRoles = () => setSelectedRoles([]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    deleteProfile.mutate(userId, {
      onSuccess: () => {
        toast.success("User deleted");
        setEditUser(null);
      },
      onError: () => toast.error("Failed to delete user")
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    const original = users.find((u) => u.id === editUser.id);
    const nextName = editUser.name.trim();
    if (!nextName) {
      toast.error("Name is required.");
      return;
    }
    if (original && original.name === nextName && original.role === editUser.role) {
      toast.info("No changes to save.");
      return;
    }
    setSavingEdit(true);
    updateProfile.mutate(
      { userId: editUser.id, updates: { name: nextName, role: editUser.role } },
      {
      onSuccess: () => {
        toast.success("Member updated. Access rules refreshed.");
        setEditUser(null);
        void refetch();
      },
      onError: (err: any) => {
        // Surface the actual Postgres/RLS error when possible.
        const msg =
          err?.message ||
          err?.error_description ||
          err?.details ||
          "Failed to save changes";
        console.error("updateProfile failed:", err);
        toast.error(msg);
      },
      onSettled: () => setSavingEdit(false),
      }
    );
  };

  const handleAddUser = async () => {
    if (!newUser.email?.trim() || !newUser.password || !newUser.name?.trim()) {
      toast.error("Add name, email, and a temporary password (8+ characters).");
      return;
    }
    if (newUser.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newUser.role === "program_manager" && newUser.managedProgramId === "") {
      toast.error("Select a cohort/program for this program manager, or choose another role.");
      return;
    }
    setSavingAdd(true);
    const body: Record<string, unknown> = {
      email: newUser.email.trim(),
      password: newUser.password,
      name: newUser.name.trim(),
      role: newUser.role,
    };
    if (newUser.role === "program_manager" && newUser.managedProgramId !== "") {
      body.managed_program_id = Number(newUser.managedProgramId);
    }
    const { data, error } = await supabase.functions.invoke("invite-staff", { body });
    if (error) {
      toast.error(error.message || "Invite failed. Deploy the invite-staff Edge Function and set secrets.");
      setSavingAdd(false);
      return;
    }
    const payload = data as { error?: string } | null;
    if (payload?.error) {
      toast.error(payload.error);
      setSavingAdd(false);
      return;
    }
    toast.success("Account created. They can sign in with the temporary password and should change it.");
    setSavingAdd(false);
    setShowAddModal(false);
    setNewUser({ name: "", email: "", password: "", role: "instructor", managedProgramId: "" });
    void refetch();
  };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await refetch();
      toast.success("User directory synced.");
    } finally {
      setSyncing(false);
    }
  }, [refetch]);

  const handleExport = () => {
    const csvRows = [
      ["Name", "Email", "Role", "Joined"],
      ...filtered.map(u => [u.name, u.email, u.role, new Date(u.created_at).toLocaleDateString()]),
    ];
    const csv = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported");
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            Users & Roles
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Manage staff accounts and permissions. Students are managed under <strong>Participants</strong>.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
        subtitle={loading
          ? "Syncing directory..."
          : `${staffDirectory.length} staff members with role-based access. Learners are managed under Participants.`}
        actions={
          <>
            <Button variant="outline" onClick={handleSync} disabled={syncing} className={DESIGN_TOKENS.buttonOutline}>
              <RefreshCw className={cn(DESIGN_TOKENS.iconSmall, "mr-2", (loading || syncing) && "animate-spin")} /> {syncing ? "Syncing..." : "Sync"}
            </Button>
            <Button variant="outline" onClick={handleExport} className={DESIGN_TOKENS.buttonOutline}>
              <Download className={cn(DESIGN_TOKENS.iconSmall, "mr-2")} /> Export
            </Button>
            <Button onClick={() => setShowAddModal(true)} className={cn(DESIGN_TOKENS.buttonPrimary, "h-9 px-6 text-xs font-bold")}>
              Invite User
            </Button>
          </>
        }
      />

      {/* Toolbar: Horizontal Pill Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="pb-2 md:pb-0 w-full">
          <FilterChips
            options={STAFF_FILTER_OPTIONS}
            selectedValues={selectedRoles}
            onToggle={handleToggleRole}
            onClear={handleClearRoles}
            allLabel="All staff roles"
            resetAriaLabel="Clear role filters"
          />
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className={cn(DESIGN_TOKENS.iconButton, "absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60")} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search directory..."
            className={cn(DESIGN_TOKENS.inputSearch, "pl-10")} 
          />
        </div>
      </div>

      {/* Table — Clean Coursera Rows instead of harsh grid boxes */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className={cn(DESIGN_TOKENS.iconEmpty, "w-8 h-8 animate-spin mb-4 text-primary/40")} />
            <p className={DESIGN_TOKENS.pageSubtitle}>Loading directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn(DESIGN_TOKENS.cardSubtle, "text-center py-20")}>
            <p className="text-foreground font-medium mb-1">No users found</p>
            <p className={DESIGN_TOKENS.pageSubtitle}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className={DESIGN_TOKENS.card}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={DESIGN_TOKENS.tableHeaderRow}>
                  <tr>
                    <th className={DESIGN_TOKENS.tableHeader}>Member</th>
                    <th className={DESIGN_TOKENS.tableHeader}>Role Level</th>
                    <th className={DESIGN_TOKENS.tableHeader}>Status</th>
                    <th className={DESIGN_TOKENS.tableHeader}>Joined</th>
                    <th className={cn(DESIGN_TOKENS.tableHeader, "text-right")}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((u) => (
                    <tr key={u.id} className={DESIGN_TOKENS.tableRow}>
                      <td className={DESIGN_TOKENS.tableCell}>
                        <div className="flex items-center gap-4">
                          <div className={DESIGN_TOKENS.avatar}>
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{u.name || "—"}</p>
                            <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-xs")}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={DESIGN_TOKENS.tableCell}>
                        <span className={cn(DESIGN_TOKENS.badge, "capitalize", ROLE_COLORS[u.role])}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className={DESIGN_TOKENS.tableCell}>
                         <div className={cn("flex items-center gap-1.5 text-xs", DESIGN_TOKENS.textMuted)}>
                            <span className={cn(DESIGN_TOKENS.statusDot, "bg-emerald-500")} /> Active
                         </div>
                      </td>
                      <td className={cn(DESIGN_TOKENS.tableCell, "text-xs", DESIGN_TOKENS.textMuted)}>
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className={cn(DESIGN_TOKENS.tableCell, "text-right")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={DESIGN_TOKENS.dropdownTrigger}>
                              <MoreHorizontal className={DESIGN_TOKENS.iconButton} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => setEditUser(u)} className="cursor-pointer font-medium text-xs py-2">
                              Manage Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="cursor-pointer text-destructive focus:text-destructive font-medium text-xs py-2">
                              Remove Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal (Handles Role Change & Deletion cleanly) */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} transition={{ duration: 0.2 }}
              className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-8 w-full max-w-md shadow-xl flex flex-col relative">
              
              <button onClick={() => setEditUser(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="font-display font-semibold text-2xl text-foreground mb-6">Manage user</h2>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className={DESIGN_TOKENS.formLabel}>Full Name</label>
                  <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} className={DESIGN_TOKENS.inputForm} />
                </div>
                <div>
                  <label className={DESIGN_TOKENS.formLabel}>Email Address</label>
                  <input value={editUser.email} disabled className={cn(DESIGN_TOKENS.inputForm, DESIGN_TOKENS.inputDisabled)} />
                  <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-[10px] mt-1.5")}>Email is controlled by the identity provider.</p>
                </div>
                <div>
                  <label className={cn(DESIGN_TOKENS.formLabel, "flex items-center gap-2")}>
                    System Role
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs"><strong>Instructor:</strong> Create courses, grade students<br/><strong>Program Manager:</strong> Manage cohorts & programs<br/><strong>Admin:</strong> Full platform access</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <div className="relative">
                    <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value as Role })} className={cn(DESIGN_TOKENS.inputForm, "appearance-none cursor-pointer")}>
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className={cn(DESIGN_TOKENS.iconButton, "text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90")} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/40">
                <button 
                  onClick={() => handleDeleteUser(editUser.id)}
                  className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1.5"
                >
                  <Trash2 className={DESIGN_TOKENS.iconSmall} /> Remove User
                </button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setEditUser(null)} className="rounded-full h-10 px-6 font-semibold">Cancel</Button>
                  <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full h-10 px-8 font-semibold">
                    {savingEdit ? <Loader2 className={cn(DESIGN_TOKENS.iconButton, "animate-spin")} /> : "Save"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} transition={{ duration: 0.2 }}
              className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-8 w-full max-w-md shadow-xl relative">
              
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-display font-semibold text-2xl text-foreground mb-6">Invite member</h2>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className={DESIGN_TOKENS.formLabel}>Full Name</label>
                  <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Jane Doe" className={DESIGN_TOKENS.inputForm} />
                </div>
                <div>
                  <label className={DESIGN_TOKENS.formLabel}>Email Address</label>
                  <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="jane@example.com" className={DESIGN_TOKENS.inputForm} />
                </div>
                <div>
                  <label className={DESIGN_TOKENS.formLabel}>Temporary password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 8 characters — user can reset after first login"
                    autoComplete="new-password"
                    className={DESIGN_TOKENS.inputForm}
                  />
                  <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-[10px] mt-1.5")}>
                    Required by Supabase to create the account. They should change it after signing in.
                  </p>
                </div>
                <div>
                  <label className={cn(DESIGN_TOKENS.formLabel, "flex items-center gap-2")}>
                    Assign Role
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Choose the appropriate role based on responsibilities. Roles can be changed later.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <div className="relative">
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as Role,
                          managedProgramId: e.target.value === "program_manager" ? newUser.managedProgramId : "",
                        })
                      }
                      className={cn(DESIGN_TOKENS.inputForm, "appearance-none cursor-pointer")}
                    >
                      {INVITE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className={cn(DESIGN_TOKENS.iconButton, "text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90")} />
                  </div>
                </div>
                {newUser.role === "program_manager" && (
                  <div>
                    <label className={DESIGN_TOKENS.formLabel}>Cohort / program scope</label>
                    <div className="relative">
                      <select
                        value={newUser.managedProgramId === "" ? "" : String(newUser.managedProgramId)}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            managedProgramId: e.target.value ? Number(e.target.value) : "",
                          })
                        }
                        className={cn(DESIGN_TOKENS.inputForm, "appearance-none cursor-pointer")}
                      >
                        <option value="">Select program…</option>
                        {programs.map((p: { id: number; title: string }) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className={cn(DESIGN_TOKENS.iconButton, "text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90")} />
                    </div>
                    <p className={cn(DESIGN_TOKENS.pageSubtitle, "text-[10px] mt-1.5")}>
                      Stored on the auth profile for reference; full scoped access rules can be extended in the database.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-border/40">
                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="rounded-full h-10 px-6 font-semibold">Cancel</Button>
                <Button onClick={handleAddUser} disabled={savingAdd} className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 px-8 font-semibold">
                  {savingAdd ? <Loader2 className={cn(DESIGN_TOKENS.iconButton, "animate-spin")} /> : "Send Invite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Permissions Reference */}
      <div className={cn(DESIGN_TOKENS.card, "mt-8")}>
        <div className="p-6 border-b border-border/40">
          <h2 className="font-display font-semibold text-lg text-foreground">Role Permissions Reference</h2>
          <p className={cn(DESIGN_TOKENS.pageSubtitle, "mt-1")}>
            Understanding access levels for each system role
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              role: "instructor",
              label: "Instructor",
              description: "Create and manage course content",
              permissions: ["Create & publish courses", "View enrolled students", "Grade submissions", "Access earnings dashboard"],
              color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
            },
            {
              role: "program_manager",
              label: "Program Manager",
              description: "Manage cohort-based programs",
              permissions: ["Create & manage programs", "Enroll participants", "Track progress & reports", "Send bulk notifications"],
              color: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
            },
            {
              role: "admin",
              label: "Administrator",
              description: "Full platform access",
              permissions: ["All platform access", "User management & roles", "Course & program approval", "Payment dashboard", "System configuration"],
              color: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
            },
          ].map((roleInfo) => (
            <div key={roleInfo.role} className="bg-muted/20 rounded-xl p-4 ring-1 ring-black/5 dark:ring-white/10 border-0">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className={cn(DESIGN_TOKENS.badge, "capitalize", roleInfo.color)}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{roleInfo.description}</p>
              <div className="space-y-1.5">
                {roleInfo.permissions.map((perm) => (
                  <div key={perm} className="flex items-start gap-2 text-xs">
                    <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
