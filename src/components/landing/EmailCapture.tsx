import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ArrowRight, CheckCircle2, FileText, BarChart3, Target, Sparkles, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const leadMagnets = [
  {
    id: "career-guide",
    icon: FileText,
    title: "2026 Career Playbook for African Women in Tech",
    description: "42-page guide covering salary benchmarks, in-demand skills, interview prep, and negotiation frameworks used by 500+ Connecta graduates.",
    tag: "Most Downloaded",
    tagColor: "bg-secondary text-primary",
    stats: "12,400+ downloads",
  },
  {
    id: "skill-assessment",
    icon: Target,
    title: "Free Skill Assessment — Find Your Path",
    description: "5-minute quiz that maps your strengths to the right career track: Data, Tech, Finance, or Leadership. Get a personalised learning plan.",
    tag: "Interactive",
    tagColor: "bg-primary text-primary-foreground",
    stats: "8,200+ completed",
    isQuiz: true,
  },
  {
    id: "salary-report",
    icon: BarChart3,
    title: "African Women in Business — Salary Report 2026",
    description: "Real compensation data from 3,000+ professionals across Nigeria, Kenya, Ghana, and South Africa. Know your worth before your next negotiation.",
    tag: "New",
    tagColor: "bg-foreground text-background",
    stats: "5,600+ downloads",
  },
];

export default function EmailCapture() {
  const [selectedMagnet, setSelectedMagnet] = useState(leadMagnets[0].id);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activeMagnet = leadMagnets.find(m => m.id === selectedMagnet)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitted(true);
    toast.success(activeMagnet.isQuiz ? "Redirecting to your assessment..." : "Check your inbox — your download is on the way!");
  };

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 text-primary">
            Free Resources
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Level Up before you even enroll
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            Grab a free resource and see why 50,000+ smart, ambitious Professionals trust Connecta to accelerate their careers.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left — Resource cards */}
          <div className="lg:col-span-3 space-y-3">
            {leadMagnets.map((magnet, i) => {
              const Icon = magnet.icon;
              const isActive = selectedMagnet === magnet.id;
              return (
                <motion.button
                  key={magnet.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => { setSelectedMagnet(magnet.id); setSubmitted(false); }}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-accent shadow-brand-sm"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? "gradient-card" : "bg-muted"
                    }`}>
                      <Icon className={`w-6 h-6 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className={`font-semibold text-sm leading-snug ${isActive ? "text-primary" : "text-foreground"}`}>{magnet.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${magnet.tagColor}`}>{magnet.tag}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{magnet.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {magnet.stats}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full gradient-card flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right — Capture form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
                    {activeMagnet.isQuiz ? <Target className="w-8 h-8 text-secondary" /> : <Download className="w-8 h-8 text-secondary" />}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {activeMagnet.isQuiz ? "Ready to discover your path!" : "It's on its way!"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeMagnet.isQuiz
                      ? "Your personalised skill assessment is ready. Start now and get your learning plan in 5 minutes."
                      : `We've sent "${activeMagnet.title}" to ${email}. Check your inbox (and spam folder).`
                    }
                  </p>
                  {activeMagnet.isQuiz ? (
                    <Link to="/dashboard/skills">
                      <Button className="gradient-card text-primary-foreground rounded-xl gap-2 hover:opacity-90">
                        Start Assessment <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="rounded-xl gap-2" onClick={() => toast.success("Download started!")}>
                      <Download className="w-4 h-4" /> Download Now
                    </Button>
                  )}
                  <button onClick={() => setSubmitted(false)} className="block mx-auto text-xs text-muted-foreground hover:text-foreground mt-2">
                    Get another resource →
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <activeMagnet.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">{activeMagnet.isQuiz ? "Start Your Assessment" : "Get Your Free Download"}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                    {activeMagnet.isQuiz
                      ? "Enter your email to save your results and get a personalised learning plan."
                      : "Enter your details and we'll send it straight to your inbox — no strings attached."
                    }
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                    />
                    <Button type="submit" className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold hover:opacity-90 gap-2">
                      {activeMagnet.isQuiz ? (
                        <><Target className="w-4 h-4" /> Take the Assessment</>
                      ) : (
                        <><Download className="w-4 h-4" /> Send Me the Free Guide</>
                      )}
                    </Button>
                  </form>
                  <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
                    <Shield className="w-3 h-3 shrink-0" />
                    <span>No spam, ever. Unsubscribe anytime. 100% free.</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
