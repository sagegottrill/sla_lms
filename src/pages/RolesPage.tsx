import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, UserCheck, Plus, Edit, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Role = "student" | "instructor" | "program_manager" | "admin";

const roleDefinitions: { role: Role; label: string; description: string; permissions: string[]; color: string }[] = [
  {
    role: "student", label: "Student", description: "Learners who enroll in courses and programs",
    permissions: ["Browse course catalog", "Enroll in courses & programs", "Download certificates", "Join forums & discussions", "Submit assignments & quizzes"],
    color: "bg-accent text-accent-foreground",
  },
  {
    role: "instructor", label: "Instructor", description: "Educators who create and manage course content",
    permissions: ["Create & publish courses", "View enrolled students", "Grade submissions", "Access earnings dashboard", "Manage course content"],
    color: "bg-accent text-primary",
  },
  {
    role: "program_manager", label: "Program Manager", description: "Manages cohort-based structured programs",
    permissions: ["Create & manage programs", "Enroll participants", "Track progress & reports", "Send bulk notifications", "Export participant data"],
    color: "bg-accent text-primary",
  },
  {
    role: "admin", label: "Administrator", description: "Full platform access and management",
    permissions: ["All platform access", "User management & roles", "Course & program approval", "Payment dashboard", "System configuration"],
    color: "bg-destructive/10 text-destructive",
  },
];

const roleColors: Record<string, string> = {
  student: "bg-accent text-accent-foreground",
  instructor: "bg-accent text-primary",
  program_manager: "bg-accent text-primary",
  admin: "bg-destructive/10 text-destructive",
};

import { useProfiles } from "@/hooks/useQueries";

export default function RolesPage() {
  const [expandedRole, setExpandedRole] = useState<Role | null>("student");
  const { data: profiles = [] } = useProfiles();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<{ id: string; role: Role } | null>(null);
  const [newRole, setNewRole] = useState<Role>("student");

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a: any, b: any) => {
      const ae = String(a?.email ?? "").toLowerCase();
      const be = String(b?.email ?? "").toLowerCase();
      return ae.localeCompare(be);
    });
  }, [profiles]);
  
  const roleCounts: Record<Role, number> = {
    student: profiles.filter((p: any) => p.role === "student").length,
    instructor: profiles.filter((p: any) => p.role === "instructor").length,
    program_manager: profiles.filter((p: any) => p.role === "program_manager").length,
    admin: profiles.filter((p: any) => p.role === "admin").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">User Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Manage system access across {profiles.length} total registered users.
          </p>
        </div>
        <div className="flex gap-2">
            <Button
              onClick={() => {
                const first = sortedProfiles[0] as any;
                if (!first?.id) {
                  toast.info("No users found.");
                  return;
                }
                const role = (first?.role as Role) ?? "student";
                setSelectedUser({ id: String(first.id), role });
                setNewRole(role);
              }}
              className="rounded-full px-6 h-9 text-xs font-semibold bg-[#0056D2] hover:bg-[#00419e] text-white border-0 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> Assign Role
            </Button>
        </div>
      </div>

      {/* Role cards Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roleDefinitions.map((rd, i) => (
          <motion.div key={rd.role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden">
            <button onClick={() => setExpandedRole(expandedRole === rd.role ? null : rd.role)}
              className="w-full flex items-center gap-4 p-6 hover:bg-muted/30 transition-colors text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rd.color}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{rd.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rd.color}`}>{roleCounts[rd.role].toLocaleString()} users</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{rd.description}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedRole === rd.role ? "rotate-180" : ""}`} />
            </button>
            {expandedRole === rd.role && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="px-6 pb-6 pt-2 border-t border-border/40">
                <div className="mt-4 grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Permissions</p>
                    <div className="space-y-2.5">
                      {rd.permissions.map(p => (
                        <div key={p} className="flex items-start gap-2.5 text-sm">
                          <UserCheck className="w-4 h-4 text-[#0056D2] shrink-0 mt-0.5" />
                          <span className="text-foreground leading-snug">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Actions</p>
                    <Button variant="outline" className="w-full rounded-xl text-xs font-semibold h-10 border-border hover:bg-muted flex items-center justify-center gap-2">
                      <Edit className="w-3.5 h-3.5" /> Edit Permissions
                    </Button>
                    {rd.role !== "admin" && (
                      <Button className="w-full rounded-xl text-xs font-semibold h-10 bg-slate-900 hover:bg-slate-800 text-white border-0 flex items-center justify-center gap-2 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Assign Users
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Assign Role Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">User</label>
            <select
              value={selectedUser?.id ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const p = sortedProfiles.find((x: any) => String(x?.id) === id) as any;
                const role = (p?.role as Role) ?? "student";
                setSelectedUser({ id, role });
                setNewRole(role);
              }}
              className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm"
            >
              {sortedProfiles.map((p: any) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {String(p.email ?? p.name ?? p.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="program_manager">Program Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={async () => {
                if (!selectedUser) return;
                await api.updateUserRole(selectedUser.id, newRole);
                toast.success("Role updated");
                setSelectedUser(null);
                queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removed Fake Recent Changes Log completely */}
    </div>
  );
}
