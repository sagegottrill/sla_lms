import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const adminRoles: { value: UserRole; label: string; desc: string }[] = [
  { value: "program_manager", label: "Program Manager", desc: "Manage cohorts & programs" },
  { value: "admin", label: "Super Admin", desc: "Full platform control" },
];

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Passing the specific admin role for mock auth purposes before supabase real auth kicks in
    const { error } = await login(email, password);
    setLoading(false);
    if (!error) {
       navigate("/dashboard");
    } else {
       console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground">Staff Portal Access</h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to manage Connecta LMS</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">Select Access Level</label>
            <div className="grid grid-cols-2 gap-2">
              {adminRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    role === r.value
                      ? "border-primary bg-accent text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold">{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@sheleadsafrica.org"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90 h-11 rounded-xl font-semibold mt-4">
              {loading ? "Authenticating..." : (
                <span className="flex items-center gap-2">Secure Login <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

        </div>
        <div className="bg-muted px-8 py-4 border-t border-border text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                &larr; Return to Learner Portal
            </Link>
        </div>
      </motion.div>
    </div>
  );
}
