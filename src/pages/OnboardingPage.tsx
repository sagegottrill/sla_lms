import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, BookOpen,
  BarChart3, Briefcase, Heart, Code, Palette, DollarSign, Megaphone, Shield,
  Target, Rocket, GraduationCap, Star, Users, Award, TrendingUp, Sparkles, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useQueries";
import { useEnrollment } from "@/contexts/EnrollmentContext";

const categories = [
  { id: "Data Science", label: "Data & Analytics", icon: BarChart3 },
  { id: "Technology", label: "Technology", icon: Code },
  { id: "Business", label: "Business", icon: Briefcase },
  { id: "Leadership", label: "Leadership", icon: Shield },
  { id: "Marketing", label: "Marketing", icon: Megaphone },
  { id: "Finance", label: "Finance", icon: DollarSign },
  { id: "Design", label: "Design", icon: Palette },
  { id: "Health", label: "Health & Wellness", icon: Heart },
];

const careerGoals = [
  { id: "switch", label: "Switch careers", desc: "Move into a completely new field", icon: Rocket },
  { id: "advance", label: "Get promoted", desc: "Level up in my current role", icon: Target },
  { id: "freelance", label: "Start freelancing", desc: "Work independently on my terms", icon: Zap },
  { id: "startup", label: "Build an empire", desc: "Launch my own company", icon: Sparkles },
  { id: "skills", label: "Learn new skills", desc: "Stay competitive and grow", icon: GraduationCap },
];

const experienceLevels = [
  { id: "beginner", label: "Beginner", sub: "0–1 years" },
  { id: "early", label: "Early career", sub: "2–3 years" },
  { id: "mid", label: "Mid-level", sub: "4–7 years" },
  { id: "senior", label: "Senior", sub: "8+ years" },
];

const stepMeta = [
  { title: "Your interests", sub: "What excites you?" },
  { title: "Your goals", sub: "Where are you headed?" },
  { title: "Your courses", sub: "Start learning" },
];

const proofStats = [
  { icon: Users, value: "50K+", label: "Professionals" },
  { icon: Award, value: "95%", label: "Completion rate" },
  { icon: TrendingUp, value: "+131%", label: "Income growth" },
];

export default function OnboardingPage() {
  const { user, completeOnboarding, needsOnboarding } = useAuth();
  const { enroll } = useEnrollment();
  const navigate = useNavigate();
  const { data: courses = [], isLoading } = useCourses();

  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [finishing, setFinishing] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;

  const toggleInterest = (id: string) =>
    setInterests((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleCourse = (id: number) =>
    setSelectedCourses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev);

  const recommendedCourses = courses.filter(
    (c) => interests.includes(c.category) || interests.length === 0
  );

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const canContinue = () => {
    if (step === 0) return interests.length > 0;
    if (step === 1) return goal !== "";
    return true;
  };

  const handleFinish = () => {
    setFinishing(true);
    selectedCourses.forEach((cid) => {
      const course = courses.find((c) => c.id === cid);
      if (course) enroll(course.id, course.curriculum?.[0]?.items?.[0] ?? "Module 1");
    });
    setTimeout(() => {
      completeOnboarding({ interests, selectedCourses, careerGoal: goal, experienceLevel: level });
      navigate("/dashboard");
    }, 1400);
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — brand side ─── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: "hsl(213 61% 15%)" }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(hsl(204 80% 80%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15 rounded-full" style={{ background: "radial-gradient(hsl(12 91% 64%), transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-10 rounded-full" style={{ background: "radial-gradient(hsl(204 90% 50%), transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <img src="/sla_logo_transparent.png" alt="SLA Connecta" className="h-10 w-auto" />
        </Link>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <motion.h2
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-display text-[34px] font-bold text-primary-foreground leading-[1.1] mb-3"
            >
              {step === 0 && <>Let's build your<br />personal path.</>}
              {step === 1 && <>Set your sights<br />on the top.</>}
              {step === 2 && <>Start learning<br />right away.</>}
            </motion.h2>
            <motion.p
              key={`sub-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-primary-foreground/55 text-base"
            >
              {step === 0 && "Tell us what you're passionate about and we'll curate courses just for you."}
              {step === 1 && "Your career goal helps us recommend the right programs, mentors, and opportunities."}
              {step === 2 && "We picked these based on your interests. Choose your first courses to dive into."}
            </motion.p>
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

          {/* Progress visualization */}
          <div className="bg-primary-foreground/8 rounded-2xl p-5 border border-primary-foreground/10">
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest mb-4">Your setup progress</p>
            <div className="space-y-3">
              {stepMeta.map((s, i) => (
                <div key={s.title} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300 ${
                    step > i
                      ? "bg-secondary text-primary"
                      : step === i
                      ? "bg-primary-foreground/20 text-primary-foreground ring-2 ring-secondary/50"
                      : "bg-primary-foreground/10 text-primary-foreground/40"
                  }`}>
                    {step > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold transition-colors duration-300 ${step >= i ? "text-primary-foreground" : "text-primary-foreground/35"}`}>{s.title}</p>
                    <p className="text-xs text-primary-foreground/40">{s.sub}</p>
                  </div>
                  {step === i && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="flex gap-1 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />)}
            <span className="text-sm font-bold text-primary-foreground ml-1.5">4.9/5</span>
          </div>
          <p className="text-xs text-primary-foreground/40">Rated by 12,000+ learners across Africa</p>
        </div>
      </div>

      {/* ─── Right Panel — form content ─── */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-border px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-card flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Connecta</span>
          </Link>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">Step {step + 1} of {totalSteps}</span>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(204 100% 43%), hsl(204 85% 55%))" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── Step 0: Interests ─── */}
              {step === 0 && (
                <motion.div key="interests" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
                    What are you interested in?
                  </h1>
                  <p className="text-muted-foreground text-sm mb-7">Pick the areas you'd like to explore. We'll personalize your feed.</p>

                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(({ id, label, icon: Icon }) => {
                      const selected = interests.includes(id);
                      return (
                        <motion.button
                          key={id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleInterest(id)}
                          className={`relative flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selected
                              ? "border-primary bg-accent shadow-sm ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 bg-card hover:shadow-sm"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                            selected ? "gradient-card" : "bg-muted"
                          }`}>
                            <Icon className={`w-5 h-5 transition-colors ${selected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{label}</span>
                          {selected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                              className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-card flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {interests.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 px-4 py-2.5 rounded-xl bg-accent border border-secondary/20 text-sm text-primary font-medium text-center">
                      {interests.length} area{interests.length > 1 ? "s" : ""} selected
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ─── Step 1: Career Goal ─── */}
              {step === 1 && (
                <motion.div key="goals" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
                    What's your main goal?
                  </h1>
                  <p className="text-muted-foreground text-sm mb-7">This shapes your learning recommendations and career support.</p>

                  <div className="space-y-2.5">
                    {careerGoals.map(({ id, label, desc, icon: Icon }) => {
                      const selected = goal === id;
                      return (
                        <motion.button
                          key={id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setGoal(id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selected
                              ? "border-primary bg-accent shadow-sm ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 bg-card hover:shadow-sm"
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                            selected ? "gradient-card" : "bg-muted"
                          }`}>
                            <Icon className={`w-5 h-5 ${selected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            selected ? "gradient-card" : "border-2 border-border"
                          }`}>
                            {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Experience level */}
                  <div className="mt-7">
                    <p className="text-sm font-semibold text-foreground mb-3">Where are you in your career?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {experienceLevels.map(({ id, label, sub }) => (
                        <button key={id} onClick={() => setLevel(id)}
                          className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                            level === id
                              ? "border-primary bg-accent ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 bg-card"
                          }`}>
                          <p className={`text-xs font-semibold ${level === id ? "text-primary" : "text-foreground"}`}>{label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 2: Courses ─── */}
              {step === 2 && (
                <motion.div key="courses" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
                    Pick your first courses
                  </h1>
                  <p className="text-muted-foreground text-sm mb-6">
                    Curated for you — select up to 5 to get started.
                    {selectedCourses.length > 0 && (
                      <span className="text-secondary font-semibold ml-1">{selectedCourses.length}/5 selected</span>
                    )}
                  </p>

                  <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1 scrollbar-thin">
                    {recommendedCourses.map((course, i) => {
                      const selected = selectedCourses.includes(course.id);
                      return (
                        <motion.button
                          key={course.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleCourse(course.id)}
                          className={`w-full flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all duration-200 ${
                            selected
                              ? "border-primary bg-accent shadow-sm ring-1 ring-primary/20"
                              : "border-border hover:border-primary/30 bg-card hover:shadow-sm"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img src={course.image} alt={course.title} className="w-[72px] h-[52px] rounded-xl object-cover" />
                            {selected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full gradient-card flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </motion.div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground leading-tight line-clamp-1">{course.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{course.instructor}</p>
                            <div className="flex items-center gap-2.5 mt-1">
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-secondary fill-secondary" />
                                <span className="text-[11px] font-bold text-foreground">{course.rating}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground">{course.duration}</span>
                              <span className="text-[11px] text-muted-foreground">{course.level}</span>
                              {course.price === 0 ? (
                                <span className="text-[11px] font-bold text-secondary">Free</span>
                              ) : (
                                <span className="text-[11px] font-bold text-foreground">₦{course.price}</span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12 flex justify-center">
                       <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                  ) : recommendedCourses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No courses matched. You can skip this step.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Navigation ─── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-xl gap-2 h-11 px-5 font-semibold">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue()}
                  className="gradient-card text-primary-foreground rounded-xl gap-2 h-11 px-6 font-semibold hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={finishing}
                  className="gradient-card text-primary-foreground rounded-xl gap-2 h-11 px-8 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {finishing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Start Learning <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Skip link */}
            {step < totalSteps - 1 && (
              <p className="text-center mt-3">
                <button onClick={() => setStep((s) => s + 1)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline">
                  Skip this step
                </button>
              </p>
            )}
            {step === totalSteps - 1 && selectedCourses.length === 0 && (
              <p className="text-center mt-3">
                <button onClick={handleFinish} disabled={finishing} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline">
                  Skip and go to dashboard
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
