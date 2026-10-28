import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, MapPin, Plus, Rocket, Sparkles, Target, X } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Input, Tag, Textarea } from "@kit";
import { friendlyError, errorText } from "@kit";
import { hapticSelect, hapticSuccess } from "../lib/haptics";

/**
 * ONBOARDING — a 3-step personalization wizard (headline & goal → skills →
 * location/LI). Runs once after sign-up for learners, and again on demand
 * from Profile → "Complete your profile". Writes straight to profiles.
 */
const SKILL_CHIPS = ["Leadership", "Marketing", "Finance", "Communication", "Sales", "Data Analysis", "Project Management", "Entrepreneurship", "Public Speaking", "Digital Strategy"];

export default function Onboarding() {
  const { appUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [headline, setHeadline] = useState(appUser?.headline ?? "");
  const [goal, setGoal] = useState(appUser?.careerGoal ?? "");
  const [skills, setSkills] = useState<string[]>(appUser?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [location, setLocation] = useState(appUser?.location ?? "");
  const [linkedin, setLinkedin] = useState(appUser?.linkedin ?? "");
  const [saving, setSaving] = useState(false);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.length >= 12) return;
    void hapticSelect();
    setSkills((prev) => (prev.some((x) => x.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]));
    setSkillInput("");
  };

  const finish = async () => {
    if (!appUser) return;
    setSaving(true);
    try {
      const updates = {
        headline: headline.trim() || null,
        career_goal: goal.trim() || null,
        skills,
        location: location.trim() || null,
        linkedin: linkedin.trim() || null,
        onboarding_completed: true,
      };
      const res = await api.updateProfile(appUser.id, updates);
      if (!res.success) throw new Error(errorText(res.error));
      await refreshProfile();
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void hapticSuccess();
      toast.success("Your SLA campus is now personalized ✨");
      navigate("/tabs/home", { replace: true });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0 — identity
    <>
      <StepIcon icon={Rocket} tint="bg-primary/10 text-primary" />
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight">How do you shine?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your headline is what mentors & recruiters see first.</p>
      <Input
        className="mt-5"
        placeholder="e.g. Aspiring product leader · Finance analyst"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        maxLength={90}
      />
      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Where are you headed?</p>
        <Textarea
          className="mt-2 min-h-24"
          placeholder="Your big career goal — be bold."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={280}
        />
      </div>
    </>,
    // Step 1 — skills
    <>
      <StepIcon icon={Sparkles} tint="bg-accent text-[#271066]" />
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight">Your skills</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick fast, or type your own — powers your recommendations.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SKILL_CHIPS.map((s) => (
          <button
            key={s}
            onClick={() => (skills.includes(s) ? setSkills(skills.filter((x) => x !== s)) : addSkill(s))}
            className={`flex items-center gap-1 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
              skills.includes(s) ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"
            }`}
          >
            {skills.includes(s) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Input
          placeholder="Add your own skill and hit +"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
        />
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Tag key={s} color="blue" className="gap-1">
                {s}
                <button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                  <X className="h-3 w-3" />
                </button>
              </Tag>
            ))}
          </div>
        )}
      </div>
    </>,
    // Step 2 — presence
    <>
      <StepIcon icon={MapPin} tint="bg-secondary/15 text-[#4a3db3]" />
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight">Almost there</h2>
      <p className="mt-1 text-sm text-muted-foreground">City and LinkedIn — so the right people find you.</p>
      <Input className="mt-5" placeholder="City, country (e.g. Lagos, Nigeria)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Input className="mt-3" placeholder="LinkedIn URL (linkedin.com/in/you)" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} inputMode="url" />
      <p className="mt-3 text-xs text-muted-foreground">You can edit all of this anytime from your profile.</p>
    </>,
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* progress dots */}
      <div className="flex items-center gap-2 px-6 pt-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : i === step ? "bg-primary" : "bg-muted"}`} />
        ))}
        <button onClick={() => navigate("/tabs/home", { replace: true })} className="ml-2 text-xs font-semibold text-muted-foreground">
          Skip
        </button>
      </div>

      <div className="flex-1 px-6 pt-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pad-bottom-safe px-6 pb-6">
        <div className="flex gap-2.5">
          {step > 0 && (
            <Btn variant="outline" className="h-13 w-14 rounded-2xl px-0" onClick={() => { void hapticSelect(); setStep((s) => s - 1); }} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Btn>
          )}
          <Btn
            size="lg"
            loading={saving}
            className="h-13 flex-1 rounded-2xl"
            onClick={() => { if (step < 2) { void hapticSelect(); setStep((s) => s + 1); } else void finish(); }}
          >
            {step < 2 ? "Continue" : (saving ? "Building your campus…" : "Finish")}
            {step < 2 && <ArrowRight className="h-5 w-5" />}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ icon: Icon, tint }: { icon: React.ComponentType<{ className?: string }>; tint: string }) {
  return (
    <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${tint}`}>
        <Icon className="h-7 w-7" />
      </div>
    </motion.div>
  );
}
