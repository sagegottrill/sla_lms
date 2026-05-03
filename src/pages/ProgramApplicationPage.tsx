import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgram } from "@/hooks/useQueries";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { isCourseOrProgramRouteParam } from "@/lib/publicRoutes";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";

export default function ProgramApplicationPage() {
  const { id } = useParams();
  const routeInvalid = id != null && id !== "" && !isCourseOrProgramRouteParam(id);
  const { data: program, isLoading } = useProgram(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  if (routeInvalid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-semibold mb-4">Program not found</p>
          <Link to="/programs"><Button variant="outline" className="rounded-xl">Browse Programs</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

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
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    if (!form.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep() || !program) return;
     setSubmitting(true);
     try {
       const programId = (program as { id: number }).id;
       const payload = {
         user_id: user?.id ?? null,
         program_id: programId,
         full_name: form.fullName.trim(),
         phone: form.phone.trim(),
         email: form.email.trim(),
         status: "pending" as const,
       };
       const response = await api.createProgramApplication(payload);
       if (!response.success || !response.data) {
         toast.error("Could not submit your application. Please try again.");
         return;
       }
       void queryClient.invalidateQueries({ queryKey: ["program_applications", "pending"] });
       toast.success("Application submitted for review.");
     } finally {
       setSubmitting(false);
     }
     setSubmitted(true);
  };

  const startRaw = program
    ? (program as { start_date?: string; startDate?: string }).start_date ?? (program as { startDate?: string }).startDate
    : undefined;
  const startDisplay =
    startRaw && !isNaN(new Date(startRaw).getTime())
      ? new Date(startRaw).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "TBD";

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
            <div className="bg-card rounded-2xl shadow-sm border-0 p-6 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Application ID</span>
                <span className="text-primary font-mono font-medium">APP-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Program</span>
                <span className="text-foreground font-medium">{program.title}</span>
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
        <div className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden mb-8">
          <div className="h-32 sm:h-40 overflow-hidden">
            <img src={program.image} alt={program.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-6">
            <span className="text-xs text-secondary font-semibold">{program.category} · {program.duration}</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">{program.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
          </div>
        </div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-5">

          <h2 className="font-display text-lg font-bold text-foreground">Application</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
              <input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Amara Osei"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number *</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="amara@example.com"
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div />
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 px-8"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
