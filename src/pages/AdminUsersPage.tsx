import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, UserPlus, Trash2,
  Shield, Loader2, X, Check, RefreshCw, ChevronRight, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfiles, useUpdateProfileMutation, useDeleteProfileMutation, usePrograms } from "@/hooks/useQueries";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

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

// Minimalist understated colors for role badges
const roleColors: Record<Role, string> = {
  student:         "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  instructor:      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  program_manager: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  admin:           "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const inputCls = "w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/60 transition-all";
const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2";

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
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6">
      
      {/* Header — Spacious and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">User Management</h1>
          <p className="text-muted-foreground text-sm">
            {loading
              ? "Syncing directory..."
              : `${staffDirectory.length} staff (instructors, program managers, admins). Learners are listed under Participants.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSync} disabled={syncing} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading || syncing ? 'animate-spin' : ''}`} /> {syncing ? "Syncing..." : "Sync"}
          </Button>
          <Button variant="outline" onClick={handleExport} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <Download className="w-3.5 h-3.5 mr-2" /> Export
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="rounded-full px-6 h-9 text-xs font-bold bg-[#0056D2] hover:bg-[#00419e] text-white border-0">
            Invite User
          </Button>
        </div>
      </div>

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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search directory..."
            className="w-full pl-10 pr-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow" 
          />
        </div>
      </div>

      {/* Table — Clean Coursera Rows instead of harsh grid boxes */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" />
            <p className="text-sm">Loading directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-3xl bg-card/20">
            <p className="text-foreground font-medium mb-1">No users found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Member</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Role Level</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase">Joined</th>
                    <th className="px-6 py-6 text-right text-xs font-semibold text-muted-foreground tracking-widest uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{u.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize ${roleColors[u.role]}`}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
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
                  <label className={labelCls}>Full Name</label>
                  <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input value={editUser.email} disabled className={inputCls + " opacity-50 cursor-not-allowed bg-muted/30"} />
                  <p className="text-[10px] text-muted-foreground mt-1.5">Email is controlled by the identity provider.</p>
                </div>
                <div>
                  <label className={labelCls}>System Role</label>
                  <div className="relative">
                    <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value as Role })} className={inputCls + " appearance-none cursor-pointer"}>
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/40">
                <button 
                  onClick={() => handleDeleteUser(editUser.id)}
                  className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove User
                </button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setEditUser(null)} className="rounded-full h-10 px-6 font-semibold">Cancel</Button>
                  <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full h-10 px-8 font-semibold">
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
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
                  <label className={labelCls}>Full Name</label>
                  <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Jane Doe" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="jane@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Temporary password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 8 characters — user can reset after first login"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Required by Supabase to create the account. They should change it after signing in.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Assign Role</label>
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
                      className={inputCls + " appearance-none cursor-pointer"}
                    >
                      {INVITE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                  </div>
                </div>
                {newUser.role === "program_manager" && (
                  <div>
                    <label className={labelCls}>Cohort / program scope</label>
                    <div className="relative">
                      <select
                        value={newUser.managedProgramId === "" ? "" : String(newUser.managedProgramId)}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            managedProgramId: e.target.value ? Number(e.target.value) : "",
                          })
                        }
                        className={inputCls + " appearance-none cursor-pointer"}
                      >
                        <option value="">Select program…</option>
                        {programs.map((p: { id: number; title: string }) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Stored on the auth profile for reference; full scoped access rules can be extended in the database.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-border/40">
                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="rounded-full h-10 px-6 font-semibold">Cancel</Button>
                <Button onClick={handleAddUser} disabled={savingAdd} className="bg-[#0056D2] hover:bg-[#00419e] text-white rounded-full h-10 px-8 font-semibold">
                  {savingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
