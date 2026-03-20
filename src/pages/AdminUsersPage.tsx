import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, UserPlus, Trash2,
  Shield, Loader2, X, Check, RefreshCw, ChevronRight, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useProfiles, useUpdateProfileMutation, useDeleteProfileMutation } from "@/hooks/useQueries";
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
  
  const updateProfile = useUpdateProfileMutation();
  const deleteProfile = useDeleteProfileMutation();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" as Role });

  const filtered = users.filter((u: Profile) => {
    const q = search.toLowerCase();
    const matchSearch = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
    setSaving(true);
    updateProfile.mutate({ userId: editUser.id, updates: { name: editUser.name, role: editUser.role } }, {
      onSuccess: () => {
        toast.success("User updated");
        setEditUser(null);
      },
      onError: () => toast.error("Failed to save changes"),
      onSettled: () => setSaving(false)
    });
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      user_metadata: { full_name: newUser.name, role: newUser.role },
    });
    if (error) {
      toast.error("To create users, the Supabase Service Role key is needed. For now, have users sign up.");
      setSaving(false);
      return;
    }
    toast.success("User created!");
    setSaving(false);
    setShowAddModal(false);
    setNewUser({ name: "", email: "", password: "", role: "student" });
    refetch();
  };

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
            {loading ? "Syncing directory..." : `${users.length} registered members across all roles.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
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
        {/* Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {["All", ...ROLES].map(f => (
            <button 
              key={f} 
              onClick={() => setRoleFilter(f === "All" ? "All" : f as Role)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                roleFilter === f 
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                  : "text-foreground bg-transparent hover:bg-muted/60"
              }`}
            >
              {f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
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
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground opacity-0 group-hover:opacity-100">
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
                      {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
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
                  <Button onClick={handleSaveEdit} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full h-10 px-8 font-semibold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
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
                  <label className={labelCls}>Assign Role</label>
                  <div className="relative">
                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })} className={inputCls + " appearance-none cursor-pointer"}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-border/40">
                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="rounded-full h-10 px-6 font-semibold">Cancel</Button>
                <Button onClick={handleAddUser} disabled={saving} className="bg-[#0056D2] hover:bg-[#00419e] text-white rounded-full h-10 px-8 font-semibold">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
