import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Download, UserPlus, Edit, Trash2, Shield, Filter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type Role = "student" | "instructor" | "program_manager" | "admin";

const allUsers = [
  { id: 1, name: "She Leads Africa", email: "info@sheleadsafrica.org", role: "admin" as Role, joined: "Jan 1, 2026", status: "active", courses: 0, lastActive: "Today" },
  { id: 2, name: "SLA Content", email: "content@sheleadsafrica.org", role: "admin" as Role, joined: "Jan 1, 2026", status: "active", courses: 0, lastActive: "Yesterday" },
  { id: 3, name: "SLA Programs", email: "programs@sheleadsafrica.org", role: "admin" as Role, joined: "Jan 1, 2026", status: "active", courses: 0, lastActive: "Today" },
  { id: 4, name: "Amara Osei", email: "amara@gmail.com", role: "student" as Role, joined: "Mar 1, 2026", status: "inactive", courses: 2, lastActive: "5 days ago" },
  { id: 5, name: "Zara Mensah", email: "zara@sla.org", role: "program_manager" as Role, joined: "Nov 1, 2025", status: "active", courses: 1, lastActive: "Today" },
  { id: 6, name: "Grace Mensah", email: "grace@corp.com", role: "student" as Role, joined: "Feb 5, 2026", status: "active", courses: 5, lastActive: "Today" },
  { id: 7, name: "Nkechi Adeyemi", email: "nkechi@biz.com", role: "student" as Role, joined: "Jan 20, 2026", status: "active", courses: 1, lastActive: "2 weeks ago" },
  { id: 8, name: "Aisha Kamara", email: "aisha@instructor.com", role: "instructor" as Role, joined: "Oct 20, 2025", status: "active", courses: 2, lastActive: "3 days ago" },
];

const roleColors: Record<Role, string> = {
  student:         "bg-accent text-accent-foreground",
  instructor:      "bg-primary text-primary-foreground",
  program_manager: "bg-accent text-primary",
  admin:           "bg-destructive/10 text-destructive",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = allUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter.toLowerCase().replace(" ", "_");
    return matchSearch && matchRole;
  });

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(u => u.id));
  const toggleOne = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{allUsers.length} total users</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <Button variant="outline" size="sm" className="rounded-xl text-xs flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email {selected.length}</Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs border-destructive text-destructive hover:bg-destructive/10 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</Button>
            </>
          )}
          <Button className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add User</Button>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-4 gap-3">
        {(["student", "instructor", "program_manager", "admin"] as Role[]).map(role => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role.replace("_", " ") ? "All" : role.replace("_", " "))}
            className="bg-card rounded-2xl border border-border p-3 text-center hover:shadow-brand-sm transition-shadow">
            <div className="text-xl font-bold text-foreground">{allUsers.filter(u => u.role === role).length}</div>
            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mx-auto mt-1 w-fit capitalize ${roleColors[role]}`}>{role.replace("_", " ")}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {["All", "Student", "Instructor", "Program Manager", "Admin"].map(f => (
            <button key={f} onClick={() => setRoleFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter === f ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
        <Button variant="outline" className="rounded-xl flex items-center gap-2 text-sm shrink-0"><Download className="w-4 h-4" /> Export</Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" /></th>
                {["User", "Role", "Status", "Courses", "Joined", "Last Active", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className={`transition-colors ${selected.includes(u.id) ? "bg-accent/50" : "hover:bg-muted/30"}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleOne(u.id)} className="rounded" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{u.name.charAt(0)}</div>
                      <div><p className="text-sm font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${roleColors[u.role]}`}>{u.role.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.status === "active" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.courses}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <button className="text-primary hover:underline flex items-center gap-0.5"><Edit className="w-3 h-3" /> Edit</button>
                      <button className="text-destructive hover:underline flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
