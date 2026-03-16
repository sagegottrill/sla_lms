import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Download, UserPlus, Edit, Trash2,
  Shield, Mail, Loader2, X, Check, ChevronDown, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

const roleColors: Record<Role, string> = {
  student:         "bg-accent text-accent-foreground",
  instructor:      "bg-primary text-primary-foreground",
  program_manager: "bg-accent text-primary",
  admin:           "bg-destructive/10 text-destructive",
};

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" as Role });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load users"); setLoading(false); return; }
    setUsers((data ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(u => u.id));
  const toggleOne = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) { toast.error("Failed to update role"); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success("Role updated successfully");
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) { toast.error("Failed to delete user"); return; }
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success("User deleted");
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: editUser.name,
      role: editUser.role,
    }).eq("id", editUser.id);
    setSaving(false);
    if (error) { toast.error("Failed to save changes"); return; }
    setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
    setEditUser(null);
    toast.success("User updated");
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      user_metadata: { full_name: newUser.name, role: newUser.role },
    });
    if (error) {
      // Fallback: create via sign up (if not using service role)
      toast.error("To create users, the Supabase Service Role key is needed in a backend function. For now, ask users to sign up and then update their role here.");
      setSaving(false);
      return;
    }
    toast.success("User created successfully!");
    setSaving(false);
    setShowAddModal(false);
    setNewUser({ name: "", email: "", password: "", role: "student" });
    loadUsers();
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading..." : `${users.length} total users registered`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} className="rounded-xl gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="rounded-xl gap-2 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 gap-2">
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map(role => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role ? "All" : role)}
            className={`bg-card rounded-2xl border p-3 text-center hover:shadow-brand-sm transition-all ${roleFilter === role ? "border-primary" : "border-border"}`}>
            <div className="text-2xl font-bold font-display text-foreground">{users.filter(u => u.role === role).length}</div>
            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mx-auto mt-1 w-fit capitalize ${roleColors[role]}`}>{role.replace("_", " ")}</div>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {["All", ...ROLES].map(f => (
            <button key={f} onClick={() => setRoleFilter(f === "All" ? "All" : f as Role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${roleFilter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" />
                  </th>
                  {["User", "Role", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`transition-colors ${selected.includes(u.id) ? "bg-accent/50" : "hover:bg-muted/30"}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleOne(u.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                          {(u.name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize border-0 focus:outline-none cursor-pointer ${roleColors[u.role]}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-accent text-primary">active</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => setEditUser(u)} className="text-primary hover:underline flex items-center gap-0.5">
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-destructive hover:underline flex items-center gap-0.5">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-brand-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-foreground">Edit User</h2>
                <button onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className={labelCls}>Full Name</label>
                <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={editUser.email} disabled className={inputCls + " opacity-50 cursor-not-allowed"} />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value as Role })} className={inputCls}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={saving} className="gradient-card text-primary-foreground rounded-xl gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-brand-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-foreground">Invite New User</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground bg-accent p-3 rounded-xl">
                <strong>Tip:</strong> Ask the user to sign up at <strong>/signup</strong> then change their role here. Or use Supabase Dashboard → Auth → Users to create accounts directly.
              </p>
              <div>
                <label className={labelCls}>Full Name</label>
                <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Dr. Amara Osei" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })} className={inputCls}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">Cancel</Button>
                <a href="https://supabase.com/dashboard/project/jdkfpzfmfbllxhaujzoe/auth/users" target="_blank" rel="noopener noreferrer">
                  <Button className="gradient-card text-primary-foreground rounded-xl gap-2">
                    <Shield className="w-4 h-4" /> Open Supabase Auth
                  </Button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
