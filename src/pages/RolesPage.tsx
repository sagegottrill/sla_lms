import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, UserCheck, Plus, Edit, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Role = "student" | "instructor" | "program_manager" | "admin";

const roleDefinitions: { role: Role; label: string; description: string; permissions: string[]; count: number; color: string }[] = [
  {
    role: "student", label: "Student", description: "Learners who enroll in courses and programs",
    permissions: ["Browse course catalog", "Enroll in courses & programs", "Download certificates", "Access job board", "Submit assignments & quizzes"],
    count: 48920, color: "bg-accent text-accent-foreground",
  },
  {
    role: "instructor", label: "Instructor", description: "Educators who create and manage course content",
    permissions: ["Create & publish courses", "View enrolled students", "Grade submissions", "Access earnings dashboard", "Manage course content"],
    count: 284, color: "bg-accent text-primary",
  },
  {
    role: "program_manager", label: "Program Manager", description: "Manages cohort-based structured programs",
    permissions: ["Create & manage programs", "Enroll participants", "Track progress & reports", "Send bulk notifications", "Export participant data"],
    count: 32, color: "bg-accent text-primary",
  },
  {
    role: "admin", label: "Administrator", description: "Full platform access and management",
    permissions: ["All platform access", "User management & roles", "Course & program approval", "Payment dashboard", "System configuration"],
    count: 8, color: "bg-destructive/10 text-destructive",
  },
];

const recentRoleChanges = [
  { user: "Dr. Fatima Hassan", from: "student", to: "instructor", date: "Mar 4, 2026", changedBy: "Zara Mensah" },
  { user: "Ngozi Williams", from: "instructor", to: "program_manager", date: "Feb 28, 2026", changedBy: "Zara Mensah" },
  { user: "Aisha Kamara", from: "student", to: "instructor", date: "Feb 15, 2026", changedBy: "Zara Mensah" },
];

const roleColors: Record<string, string> = {
  student: "bg-accent text-accent-foreground",
  instructor: "bg-accent text-primary",
  program_manager: "bg-accent text-primary",
  admin: "bg-destructive/10 text-destructive",
};

export default function RolesPage() {
  const [expandedRole, setExpandedRole] = useState<Role | null>("student");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">User Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage role definitions and access controls</p>
        </div>
      </div>

      {/* Role cards */}
      <div className="space-y-3">
        {roleDefinitions.map((rd, i) => (
          <motion.div key={rd.role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border overflow-hidden">
            <button onClick={() => setExpandedRole(expandedRole === rd.role ? null : rd.role)}
              className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rd.color}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{rd.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rd.color}`}>{rd.count.toLocaleString()} users</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{rd.description}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedRole === rd.role ? "rotate-180" : ""}`} />
            </button>
            {expandedRole === rd.role && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-5 border-t border-border">
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Permissions</p>
                    <div className="space-y-1.5">
                      {rd.permissions.map(p => (
                        <div key={p} className="flex items-center gap-2 text-sm">
                          <UserCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span className="text-foreground">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
                    <Button variant="outline" size="sm" className="w-full rounded-xl text-xs flex items-center gap-2"><Edit className="w-3 h-3" /> Edit Permissions</Button>
                    {rd.role !== "admin" && (
                      <Button size="sm" className="w-full rounded-xl text-xs gradient-card text-primary-foreground hover:opacity-90 flex items-center gap-2"><Plus className="w-3 h-3" /> Assign Users to Role</Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent changes */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Recent Role Changes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentRoleChanges.map((change, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-8 h-8 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                {change.user.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{change.user}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[change.from]}`}>{change.from.replace("_", " ")}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[change.to]}`}>{change.to.replace("_", " ")}</span>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{change.date}</p>
                <p>by {change.changedBy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
