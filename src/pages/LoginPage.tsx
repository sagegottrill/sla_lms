import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Star, TrendingUp, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { toast } from "sonner";

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "student", label: "Student", desc: "Access courses & programs" },
  { value: "instructor", label: "Instructor", desc: "Create & teach courses" },
  { value: "program_manager", label: "Program Manager", desc: "Manage cohorts & programs" },
  { value: "admin", label: "Administrator", desc: "Full platform access" },
];

const testimonials = [
  { name: "Amara Osei", role: "Data Analyst · Ghana", text: "Connecta gave me the skills and confidence to move into tech. I tripled my salary in 18 months.", initials: "AO" },
  { name: "Ngozi Obi", role: "Product Manager · Nigeria", text: "The cohort experience was transformative. Real mentorship, real outcomes.", initials: "NO" },
];

const proofStats = [
  { icon: Users, value: "50K+", label: "Women trained" },
  { icon: Award, value: "95%", label: "Completion rate" },
  { icon: TrendingUp, value: "+131%", label: "Avg. income growth" },
];

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (!error) {
      navigate("/dashboard");
    } else {
      toast.error(error.message || "Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — rich social proof */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: "hsl(213 61% 15%)" }}>
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(hsl(204 80% 80%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {/* Gradient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 rounded-full" style={{ background: "radial-gradient(hsl(12 91% 64%), transparent)", transform: "translate(30%, -30%)" }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <img src="/sla_logo_transparent.png" alt="SLA Connecta" className="h-10 w-auto" />
        </Link>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-[38px] font-bold text-primary-foreground leading-[1.1] mb-4">
              Africa's leading<br />career platform<br />for women.
            </h2>
            <p className="text-primary-foreground/60 text-base leading-relaxed">
              Join 50,000+ ambitious women building in-demand skills and landing better opportunities.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {proofStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-primary-foreground/8 rounded-2xl p-4 border border-primary-foreground/10">
                <Icon className="w-5 h-5 text-secondary mb-2" />
                <div className="font-display text-xl font-bold text-primary-foreground">{value}</div>
                <div className="text-xs text-primary-foreground/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial carousel */}
          <div className="bg-primary-foreground/8 rounded-2xl p-5 border border-primary-foreground/10">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-secondary fill-secondary" />)}
            </div>
            <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4">
                "{testimonials[activeTestimonial].text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-card flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {testimonials[activeTestimonial].initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">{testimonials[activeTestimonial].name}</p>
                  <p className="text-xs text-primary-foreground/50">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
            <div className="flex gap-1.5 mt-4">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-1 rounded-full transition-all ${i === activeTestimonial ? "bg-secondary w-6" : "bg-primary-foreground/25 w-3"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Employer logos */}
        <div className="relative z-10">
          <p className="text-xs text-primary-foreground/40 uppercase tracking-widest mb-3">Employers hiring our graduates</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {["GTBank", "Flutterwave", "Andela", "MTN", "Microsoft"].map(p => (
              <span key={p} className="text-sm font-bold text-primary-foreground/30">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/sla_logo_transparent.png" className="h-8 w-auto" alt="SLA Connecta" />
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground mb-1.5">Welcome back, Professional</h1>
          <p className="text-muted-foreground mb-8">Your empire isn’t going to build itself—let’s get back to work and make those dreams a reality today.</p>

          {/* Role selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">Sign in as</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.slice(0, 2).map((r) => (
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
                  <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-shadow"
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
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-shadow"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>


            <Button type="submit" disabled={loading} className="w-full gradient-card text-primary-foreground h-11 rounded-xl font-semibold hover:opacity-90 transition-opacity mt-1">
              {loading ? "Signing in..." : (
                <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border text-center">
             <Link to="/admin/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                Staff Portal Access <ArrowRight className="w-3 h-3" />
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
