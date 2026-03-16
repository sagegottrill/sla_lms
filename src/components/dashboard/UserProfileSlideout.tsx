import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Shield, BookOpen, Award, CheckCircle2, Clock, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SlideoutUser {
  name: string;
  email: string;
  role: string;
  joined: string;
  status: string;
  avatar?: string;
  progress?: number;
}

interface UserProfileSlideoutProps {
  user: SlideoutUser | null;
  onClose: () => void;
  onAction: (action: string, user: SlideoutUser) => void;
}

export default function UserProfileSlideout({ user, onClose, onAction }: UserProfileSlideoutProps) {
  if (!user) return null;

  const roleColors: Record<string, string> = {
    student: "bg-accent text-primary",
    instructor: "bg-primary text-primary-foreground",
    program_manager: "bg-accent text-primary",
    admin: "bg-destructive/10 text-destructive",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Slideout Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-display text-xl font-bold text-foreground">User Profile</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {/* Identity */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-card flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0 shadow-brand-sm">
                {user.avatar || user.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${roleColors[user.role] || "bg-muted text-muted-foreground"}`}>
                    {user.role.replace("_", " ").toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    user.status === "active" || user.status === "on-track" ? "bg-emerald-50 text-emerald-700" :
                    user.status === "pending" || user.status === "at-risk" ? "bg-amber-50 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {user.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-border text-xs gap-2"
                onClick={() => onAction("email", user)}
              >
                <Mail className="w-4 h-4" /> Email User
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-border text-xs gap-2"
                onClick={() => onAction("edit", user)}
              >
                <Edit className="w-4 h-4" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-border text-xs gap-2"
                onClick={() => onAction("transcript", user)}
              >
                <Award className="w-4 h-4 text-primary" /> Get Transcript
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 text-xs gap-2"
                onClick={() => onAction("suspend", user)}
              >
                <Shield className="w-4 h-4" /> Suspend
              </Button>
            </div>

            {/* Progress / Stats */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" /> Learning Activity
              </h4>
              <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-4">
                {user.progress !== undefined ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-foreground">Program Progress</span>
                      <span className="font-bold text-foreground">{user.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${user.progress >= 70 ? "bg-emerald-500" : "bg-amber-400"}`}
                        style={{ width: `${user.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-center text-muted-foreground py-2">
                    No active enrollments.
                  </div>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Account Details
              </h4>
              <div className="bg-muted/30 border border-border rounded-2xl p-4 text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined Date</span>
                  <span className="font-medium text-foreground">{user.joined}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium text-foreground">Today, 2:40 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Certificates</span>
                  <span className="font-medium text-foreground">2 Earned</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
