import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Check,
  Code,
  DollarSign,
  Heart,
  Loader2,
  Megaphone,
  Palette,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { queryKeys } from "@/lib/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Input } from "@kit";
import { errorText, friendlyError } from "@kit";
import { hapticSelect, hapticSuccess } from "../lib/haptics";

/**
 * ONBOARDING — an exact mirror of the web's OnboardingPage wizard
 * (src/pages/OnboardingPage.tsx): same 5 steps, same copy, same validation
 * rules, and the SAME persisted profiles fields — role, avatar_url, skills,
 * interests, onboarding_completed — so a web signup and an app signup land
 * in identical account state. One system, not two.
 */

const COMMON_SKILLS = ["React", "Python", "Digital Marketing", "Figma", "Data Analysis", "Leadership", "SEO", "Copywriting"];

const INTEREST_CATEGORIES = [
  { id: "Data Science", label: "Data & Analytics", icon: BarChart3 },
  { id: "Technology", label: "Technology", icon: Code },
  { id: "Business", label: "Business", icon: Briefcase },
  { id: "Leadership", label: "Leadership", icon: Shield },
  { id: "Marketing", label: "Marketing", icon: Megaphone },
  { id: "Finance", label: "Finance", icon: DollarSign },
  { id: "Design", label: "Design", icon: Palette },
  { id: "Health", label: "Health & Wellness", icon: Heart },
] as const;

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const { user, appUser, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // Web-parity fields (persisted to profiles exactly like the web wizard does)
  const [roleChoice, setRoleChoice] = useState<"student" | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = useMemo(() => Math.round(((step + 1) / TOTAL_STEPS) * 100), [step]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    void hapticSelect();
  };

  const addSkillFromInput = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const publicUrl = await api.uploadAvatar(user?.id ?? appUser?.id ?? "", file);
      if (!publicUrl) throw new Error("Upload failed");
      setAvatarUrl(publicUrl);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Avatar upload failed. Try a smaller JPG or PNG.");
      console.error("avatar upload:", errorText(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // Same two writes as the web: (1) completeOnboarding marks the auth
      // context complete + local override; (2) best-effort profiles row
      // update with the exact same columns and role value.
      await completeOnboarding({ completed: true, interests });

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          role: "student",
          avatar_url: avatarUrl || null,
          onboarding_completed: true,
          skills,
          interests,
        })
        .eq("id", appUser?.id ?? user?.id ?? "");
      if (profileUpdateError) {
        console.warn("Onboarding profile update failed:", profileUpdateError.message);
        toast.error(profileUpdateError.message);
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });
      void hapticSuccess();
      toast.success("Profile setup complete! Welcome aboard.");
      navigate("/tabs/home", { replace: true });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
      setFinishing(false);
    }
  };

  /* ---------- validation identical to the web zod rules ---------- */
  const canContinue = step !== 1 || !!roleChoice;
  const canFinish = true; // avatar is optional, matching the web

  const nextAction = () => {
    if (step === 1 && !roleChoice) return toast.error("Please select a role to continue.");
    if (step === 2 && skills.length === 0) return toast.error("Add at least one skill to continue.");
    if (step === 3 && interests.length === 0) return toast.error("Select at least one interest to continue.");
    if (step < TOTAL_STEPS - 1) go(step + 1);
    else void handleFinish();
  };

  const slide = {
    initial: { opacity: 0, x: dir * 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: dir * -24 },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* progress — same contract as the web: "CONNECT HER Setup" + % */}
      <div className="top-safe px-6 pt-6">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Connect Her Setup</span>
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      </div>

      <div className="flex-1 px-6 pt-7">
        <AnimatePresence mode="wait" initial={false}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" {...slide}>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em]">
                Welcome to CONNECT HER LMS. <span className="text-muted-foreground">Let's set you up.</span>
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                We need a few details to personalize your workspace, secure your permissions, and curate the best learning resources for your account.
              </p>
            </motion.div>
          )}

          {/* Step 1: Role (self-serve signups are learners only — same as web) */}
          {step === 1 && (
            <motion.div key="role" {...slide}>
              <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">Select your primary role</h1>
              <p className="mt-2 text-sm text-muted-foreground">This determines your dashboard layout and system permissions.</p>
              <button
                type="button"
                onClick={() => {
                  void hapticSelect();
                  setRoleChoice("student");
                }}
                className={`mt-7 flex w-full items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-all ${
                  roleChoice === "student" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <div className={`flex shrink-0 rounded-xl p-3 ${roleChoice === "student" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Student Learner</h3>
                  <p className="mt-1 text-sm text-muted-foreground">I want to take courses and build skills</p>
                </div>
                {roleChoice === "student" && <Check className="mt-1 h-5 w-5 text-primary" />}
              </button>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Instructors, program managers and admins are invited on the web (User management) — self-serve signups are learners only, same as the website.
              </p>
            </motion.div>
          )}

          {/* Step 2: Skills (same rule: at least one; Enter/Add + popular chips) */}
          {step === 2 && (
            <motion.div key="skills" {...slide}>
              <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">What are your skills?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Add skills you have or want to develop. Press Enter or click Add.</p>
              <div className="mt-5 flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. Project Management"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkillFromInput();
                      }
                    }}
                    onBlur={addSkillFromInput}
                    autoComplete="off"
                  />
                </div>
                <Btn variant="outline" className="shrink-0 rounded-xl px-6" onMouseDown={(e) => e.preventDefault()} onClick={addSkillFromInput}>
                  Add
                </Btn>
              </div>

              <div className="mt-6 flex min-h-[88px] flex-wrap content-start gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
                    {skill}
                    <button onClick={() => setSkills(skills.filter((s) => s !== skill))} aria-label={`Remove ${skill}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && <span className="py-2 text-sm italic text-muted-foreground">No skills added yet.</span>}
              </div>

              <div className="mt-4 border-t border-border/40 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popular Skills</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        void hapticSelect();
                        setSkills((prev) => [...prev, skill]);
                      }}
                      className="rounded-full bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground ring-1 ring-black/5 transition-colors active:bg-muted dark:ring-white/10"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Interests (same 8 categories, at least one — same as web) */}
          {step === 3 && (
            <motion.div key="interests" {...slide}>
              <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">Your learning interests</h1>
              <p className="mt-2 text-sm text-muted-foreground">Select categories to personalize your course recommendations.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {INTEREST_CATEGORIES.map(({ id, label, icon: Icon }) => {
                  const on = interests.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        void hapticSelect();
                        setInterests((prev) => (on ? prev.filter((i) => i !== id) : [...prev, id]));
                      }}
                      className={`flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all ${
                        on ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${on ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="flex-1 text-sm font-semibold leading-tight">{label}</span>
                      {on && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 4: Avatar (optional — same copy, same storage bucket flow) */}
          {step === 4 && (
            <motion.div key="avatar" {...slide}>
              <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">Almost done! Profile photo</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a professional headshot if you like — you can skip this and upload one later from your profile.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center rounded-3xl bg-card p-10 text-center ring-1 ring-black/5 dark:ring-white/10">
                <div className="relative mb-6">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-muted ring-4 ring-background">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground/40" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                <Btn variant="outline" className="rounded-full" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Photo
                </Btn>
                <p className="mt-2 max-w-[200px] text-xs text-muted-foreground">JPG, PNG or WEBP. Max 2MB.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* bottom navigation — Back / Continue / "Launch CONNECT HER" (web labels) */}
      <div className="pad-bottom-safe border-t border-border/40 px-6 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Btn variant="ghost" className="rounded-full px-5" onClick={() => go(step - 1)} disabled={step === 0}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Btn>
          {step < TOTAL_STEPS - 1 ? (
            <Btn
              size="lg"
              className="flex-1 rounded-full"
              onClick={nextAction}
              disabled={!canContinue}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Btn>
          ) : (
            <Btn size="lg" className="flex-1 rounded-full" onClick={() => void handleFinish()} disabled={finishing || !canFinish}>
              {finishing ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  Launch CONNECT HER <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
