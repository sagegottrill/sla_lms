import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Upload, Briefcase, GraduationCap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allPrograms } from "@/data/mockData";
import { toast } from "sonner";

export default function ProgramApplicationPage() {
  const { id } = useParams();
  const program = allPrograms.find((p) => p.id === Number(id));
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    currentRole: "",
    company: "",
    yearsExperience: "",
    linkedIn: "",
    education: "",
    whyApply: "",
    goals: "",
    hearAbout: "",
    resume: null as File | null,
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-semibold mb-4">Program not found</p>
          <Link to="/programs"><Button variant="outline" className="rounded-xl">Browse Programs</Button></Link>
        </div>
      </div>
    );
  }

  const validateStep = () => {
    if (step === 1 && (!form.fullName.trim() || !form.email.trim() || !form.phone.trim())) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    if (step === 1 && !form.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (step === 2 && (!form.currentRole.trim() || !form.yearsExperience)) {
      toast.error("Please fill in your professional background.");
      return false;
    }
    if (step === 3 && !form.whyApply.trim()) {
      toast.error("Please tell us why you're applying.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    setSubmitted(true);
    toast.success("Application submitted successfully!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-5 pt-24 pb-16 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-secondary" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Application Received!</h1>
            <p className="text-muted-foreground mb-2">Thank you for applying to</p>
            <p className="text-lg font-semibold text-foreground mb-6">{program.title}</p>
            <div className="bg-card rounded-2xl border border-border p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Application ID</span>
                <span className="text-primary font-mono font-medium">APP-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Program</span>
                <span className="text-foreground font-medium">{program.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start date</span>
                <span className="text-foreground">{new Date(program.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Program fee</span>
                <span className="font-bold text-foreground">₦{program.price}</span>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-foreground font-semibold mb-2">What happens next?</p>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Our team reviews your application (2–3 business days)</li>
                <li className="flex gap-2"><span className="text-primary font-bold">2.</span> You'll receive an acceptance email at {form.email}</li>
                <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Complete payment to secure your spot</li>
                <li className="flex gap-2"><span className="text-primary font-bold">4.</span> Get your onboarding pack and cohort details</li>
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/programs"><Button className="gradient-card text-primary-foreground rounded-xl px-8">Browse More Programs</Button></Link>
              <Link to="/"><Button variant="outline" className="rounded-xl px-8">Back to Home</Button></Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/programs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to programs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-8">
        {/* Program banner */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
          <div className="h-32 sm:h-40 overflow-hidden">
            <img src={program.image} alt={program.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-5">
            <span className="text-xs text-secondary font-semibold">{program.category} · {program.duration}</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">{program.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { n: 1, label: "Personal Info", icon: GraduationCap },
            { n: 2, label: "Background", icon: Briefcase },
            { n: 3, label: "Motivation", icon: Target },
          ].map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === n ? "gradient-card text-primary-foreground" : step > n ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {step > n ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === n ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {n < 3 && <div className="w-8 sm:w-12 h-0.5 bg-border ml-1" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-2xl border border-border p-6 space-y-5">

          {step === 1 && (
            <>
              <h2 className="font-display text-lg font-bold text-foreground">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                  <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Amara Osei"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="amara@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number *</label>
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 800 000 0000"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Country</label>
                  <select value={form.country} onChange={(e) => update("country", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select country</option>
                    {["Nigeria", "Kenya", "Ghana", "South Africa", "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Cameroon", "Senegal", "Other"].map(c =>
                      <option key={c}>{c}</option>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Lagos"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-lg font-bold text-foreground">Professional Background</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Current Role *</label>
                  <input value={form.currentRole} onChange={(e) => update("currentRole", e.target.value)} placeholder="Marketing Manager"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Company / Organisation</label>
                  <input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Flutterwave"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Years of Experience *</label>
                  <select value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select</option>
                    {["0–1 years", "2–3 years", "4–5 years", "6–10 years", "10+ years"].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Highest Education</label>
                  <select value={form.education} onChange={(e) => update("education", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select</option>
                    {["Secondary / A-Levels", "Diploma / HND", "Bachelor's Degree", "Master's Degree", "PhD / Doctorate", "Professional Certification", "Self-taught"].map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">LinkedIn Profile</label>
                <input value={form.linkedIn} onChange={(e) => update("linkedIn", e.target.value)} placeholder="https://linkedin.com/in/your-profile"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Resume / CV (optional)</label>
                <label className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-4 h-4" />
                  {form.resume ? form.resume.name : "Click to upload PDF or DOCX"}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setForm((p) => ({ ...p, resume: e.target.files?.[0] || null }))} />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-lg font-bold text-foreground">Your Motivation</h2>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Why are you applying to this program? *</label>
                <textarea value={form.whyApply} onChange={(e) => update("whyApply", e.target.value)} rows={4}
                  placeholder="Tell us about your motivation, what you hope to achieve, and how this program fits your career goals..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Where do you see yourself in 2 years?</label>
                <textarea value={form.goals} onChange={(e) => update("goals", e.target.value)} rows={3}
                  placeholder="Describe your career aspirations and how completing this program will help you get there..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">How did you hear about us?</label>
                <select value={form.hearAbout} onChange={(e) => update("hearAbout", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select</option>
                  {["Social Media", "Friend / Referral", "Google Search", "LinkedIn", "SLA Newsletter", "Event / Conference", "Other"].map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-xl">Back</Button>
            ) : <div />}
            {step < 3 ? (
              <Button onClick={handleNext} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">Continue</Button>
            ) : (
              <Button onClick={handleSubmit} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 px-8">Submit Application</Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
