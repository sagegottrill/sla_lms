import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeOff, ArrowRight, Check, Star, TrendingUp, Award, Users, Upload, GraduationCap, LayoutDashboard, Shield, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const roles: { value: UserRole; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "student",         label: "Student",          desc: "Learn at your own pace",   icon: GraduationCap },
  { value: "instructor",      label: "Instructor",        desc: "Teach and earn",            icon: BookOpen },
  { value: "program_manager", label: "Program Manager",   desc: "Run cohort programs",       icon: ClipboardList },
  { value: "admin",           label: "Administrator",     desc: "Manage the platform",       icon: Shield },
];

const benefits = [
  "Courses taught by Africa's top professionals",
  "Structured programs with real-world outcomes",
  "Career matching with 500+ employers",
  "Certificate recognition across industries",
];

const proofStats = [
  { icon: Users, value: "50K+", label: "Professionals" },
  { icon: Award, value: "95%", label: "Completion rate" },
  { icon: TrendingUp, value: "+131%", label: "Avg. income growth" },
];



export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signup(name, email, password, role);
    setLoading(false);
    if (!error) {
      navigate("/onboarding");
    } else {
      console.error(error);
      // In a real app we would use a toast notification here
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — social proof */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: "hsl(213 61% 15%)" }}>
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(hsl(204 80% 80%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-15 rounded-full" style={{ background: "radial-gradient(hsl(12 91% 64%), transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <img src="/sla_logo_transparent.png" alt="SLA Connecta" className="h-10 w-auto" />
        </Link>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-[36px] font-bold text-primary-foreground leading-[1.1] mb-3">
              Start building<br />your empire.
            </h2>
            <p className="text-primary-foreground/60 text-base">
              Everything you need to build skills, earn certificates, and make your next Power Move.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {proofStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-primary-foreground/8 rounded-2xl p-4 border border-primary-foreground/10">
                <Icon className="w-5 h-5 text-secondary mb-2" />
                <div className="font-display text-xl font-bold text-primary-foreground">{value}</div>
                <div className="text-xs text-primary-foreground/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary/25 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-secondary" />
                </div>
                <p className="text-primary-foreground/75 text-sm">{item}</p>
              </div>
            ))}
          </div>


        </div>

        {/* Rating */}
        <div className="relative z-10">
          <div className="flex gap-1 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />)}
            <span className="text-sm font-bold text-primary-foreground ml-1.5">4.9/5</span>
          </div>
          <p className="text-xs text-primary-foreground/40">Based on 12,000+ learner reviews</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/sla_logo_transparent.png" className="h-8 w-auto" alt="SLA Connecta" />
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? "gradient-card text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 2 && <div className={`h-0.5 w-10 transition-all ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">Step {step} of 2</span>
          </div>

          {step === 1 ? (
            <>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1.5">Create your account</h1>
              <p className="text-muted-foreground mb-8">Start your learning journey today — it's free</p>
              <form onSubmit={handleStep1} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Amara Osei"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-shadow"
                  />
                </div>
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
                      minLength={6}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-shadow"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Profile Photo <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">{profilePhoto ? profilePhoto.name : "Upload photo (JPG, PNG)"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <Button type="submit" className="w-full gradient-card text-primary-foreground h-11 rounded-xl font-semibold hover:opacity-90 transition-opacity mt-1">
                  <span className="flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1.5">Choose your role</h1>
              <p className="text-muted-foreground mb-8">How will you use Connecta?</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3">
                  {roles.slice(0, 2).map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        role === r.value
                          ? "border-primary bg-accent shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <r.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.desc}</div>
                      </div>
                      {role === r.value && (
                        <div className="w-5 h-5 rounded-full gradient-card flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-card text-primary-foreground h-11 rounded-xl font-semibold hover:opacity-90 transition-opacity mt-1">
                  {loading ? "Creating account..." : (
                    <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>
                  )}
                </Button>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground text-center transition-colors">
                  ← Back
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
