import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, BookOpen,
  BarChart3, Briefcase, Heart, Code, Palette, DollarSign, Megaphone, Shield,
  User, Upload, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { isOnboardingRole, normalizeUserRole, isStaffRole } from "@/lib/userRole";
import { useOnboardingStore, type OnboardingRoleChoice } from "@/store/useOnboardingStore";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/** Self-serve signups are learners only. Instructors and staff are invited from User management. */
const ROLES = [
  { id: "student" as const, label: "Student Learner", desc: "I want to take courses and build skills", icon: BookOpen },
] as const;

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
];

const allowedRoles = ["student"] as const;

const roleStepSchema = z.object({
  roleChoice: z
    .string()
    .min(1, "Please select a role")
    .refine((v) => (allowedRoles as readonly string[]).includes(v), "Please select a valid role"),
});

const skillsStepSchema = z.object({
  skills: z.array(z.string().min(1)).min(1, "Add at least one skill"),
});

const interestsStepSchema = z.object({
  interests: z.array(z.string().min(1)).min(1, "Select at least one interest"),
});

const avatarStepSchema = z.object({
  avatarUrl: z.union([z.literal(""), z.string().url("Use a valid image URL after upload")]),
});

export default function OnboardingPage() {
  const { user, appUser, needsOnboarding, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const store = useOnboardingStore();
  const role = store.formData.role ?? null;
  const skills = useMemo(() => store.formData.skills ?? [], [store.formData.skills]);
  const interests = useMemo(() => store.formData.interests ?? [], [store.formData.interests]);
  const avatarUrl = store.formData.avatarUrl ?? null;

  const [finishing, setFinishing] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If an admin/instructor/PM opens /onboarding directly, leave immediately (belt-and-suspenders with guards below).
  useEffect(() => {
    if (!appUser) return;
    const r = normalizeUserRole(appUser.role);
    if (isStaffRole(r)) {
      navigate("/dashboard", { replace: true });
    }
  }, [appUser, navigate]);

  const totalSteps = 5;
  const step = Math.max(0, Math.min(store.currentStep, totalSteps - 1));
  const prevStepRef = useRef(step);
  const progress = ((step + 1) / totalSteps) * 100;

  const roleForm = useForm<z.infer<typeof roleStepSchema>>({
    resolver: zodResolver(roleStepSchema),
    mode: "onChange",
    defaultValues: { roleChoice: role ?? "" },
  });

  const skillsForm = useForm<z.infer<typeof skillsStepSchema>>({
    resolver: zodResolver(skillsStepSchema),
    mode: "onChange",
    defaultValues: { skills },
  });

  const interestsForm = useForm<z.infer<typeof interestsStepSchema>>({
    resolver: zodResolver(interestsStepSchema),
    mode: "onChange",
    defaultValues: { interests },
  });

  const avatarForm = useForm<z.infer<typeof avatarStepSchema>>({
    resolver: zodResolver(avatarStepSchema),
    mode: "onChange",
    defaultValues: { avatarUrl: avatarUrl ?? "" },
  });

  // Clear legacy persisted roles from before the funnel was limited to student-only self-signup.
  useEffect(() => {
    if (role != null && role !== "student") {
      useOnboardingStore.getState().setFormData({ role: null });
      roleForm.reset({ roleChoice: "" });
    }
  }, [role, roleForm]);

  // Keep the current step forms synchronized with persisted Zustand state.
  useEffect(() => {
    if (step !== 1) return;
    roleForm.reset({ roleChoice: role ?? "" });
    void roleForm.trigger();
  }, [step, role, roleForm]);

  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;
    if (step !== 2) return;
    // Only reset the form when *entering* step 2, not on every skills change (avoids fighting the text input).
    if (prev === 2) return;
    skillsForm.reset({ skills });
    void skillsForm.trigger();
  }, [step, skills, skillsForm]);

  useEffect(() => {
    if (step !== 3) return;
    interestsForm.reset({ interests });
    void interestsForm.trigger();
  }, [step, interests, interestsForm]);

  useEffect(() => {
    if (step !== 4) return;
    avatarForm.reset({ avatarUrl: avatarUrl ?? "" });
    void avatarForm.trigger();
  }, [step, avatarUrl, avatarForm]);

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return roleForm.formState.isValid;
    if (step === 2) return skillsForm.formState.isValid;
    if (step === 3) return interestsForm.formState.isValid;
    return true; // avatar step: photo is optional
  };

  const roleError = roleForm.formState.errors.roleChoice?.message;
  const skillsError = skillsForm.formState.errors.skills?.message;
  const interestsError = interestsForm.formState.errors.interests?.message;
  const avatarError = avatarForm.formState.errors.avatarUrl?.message;

  if (!user) return <Navigate to="/" replace />;
  
  // CRITICAL: Staff roles (admin, instructor, program_manager) should NEVER see onboarding
  if (appUser && isStaffRole(normalizeUserRole(appUser.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Onboarding is only for self-serve learners (students).
  if (appUser && !isOnboardingRole(appUser.role)) return <Navigate to="/dashboard" replace />;
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;

  const enterX = store.direction > 0 ? 20 : store.direction < 0 ? -20 : 0;
  const exitX = store.direction > 0 ? -20 : store.direction < 0 ? 20 : 0;

  const addSkillFromInput = () => {
    if (!skillInput.trim()) return;
    const newSkill = skillInput.trim();
    const nextSkills = skills.includes(newSkill) ? skills : [...skills, newSkill];
    store.setFormData({ skills: nextSkills });
    skillsForm.setValue("skills", nextSkills, { shouldValidate: true });
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkillFromInput();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const publicUrl = await api.uploadAvatar(user.id, file);
      if (!publicUrl) throw new Error("Upload failed");
      store.setFormData({ avatarUrl: publicUrl });
      avatarForm.setValue("avatarUrl", publicUrl, { shouldValidate: true });
      toast.success("Photo uploaded");
    } catch {
      toast.error("Avatar upload failed. Try a smaller JPG or PNG.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // Mark auth context as complete first (includes local override to prevent redirect loops).
      await completeOnboarding({ completed: true, interests });

      // Best-effort: persist extra onboarding fields to profiles row.
      // If the DB isn't fully migrated yet, we still allow the user to proceed to the dashboard.
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          role: "student",
          avatar_url: avatarUrl || null,
          onboarding_completed: true,
          skills,
          interests,
        })
        .eq("id", user.id);
      if (profileUpdateError) {
        console.warn("Onboarding profile update failed:", profileUpdateError.message);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });

      toast.success("Profile setup complete! Welcome aboard.");
      useOnboardingStore.getState().resetForm();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to finalize onboarding setup.");
      setFinishing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── Modern Minimalist Wizard Panel ─── */}
      <div className="flex-1 flex flex-col pt-8 pb-12">
        <div className="w-full max-w-2xl mx-auto px-6 lg:px-12 flex-1 flex flex-col justify-center relative">
          
          {/* Progress Indication */}
          <div className="absolute top-0 left-6 right-6 lg:left-12 lg:right-12 mt-4 hidden sm:block">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CONNECT HER Setup</span>
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
             </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: enterX, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: exitX, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                  Welcome to CONNECT HER LMS. <br/><span className="text-muted-foreground">Let's set you up.</span>
                </h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                  We need a few details to personalize your workspace, secure your permissions, and curate the best learning resources for your account.
                </p>
              </motion.div>
            )}

            {/* Step 1: Role Choice */}
            {step === 1 && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: enterX, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: exitX, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Select your primary role</h1>
                <p className="text-muted-foreground mb-8">This determines your dashboard layout and system permissions.</p>
                {roleError && <p className="text-sm text-destructive mb-4">{roleError}</p>}
                <div className="grid gap-3">
                  {ROLES.map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        store.setFormData({ role: id });
                        roleForm.setValue("roleChoice", id, { shouldValidate: true, shouldDirty: true });
                      }}
                      className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                        role === id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40 bg-card"
                      }`}>
                      <div className={`p-3 rounded-xl flex shrink-0 ${role === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: enterX, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: exitX, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">What are your skills?</h1>
                <p className="text-muted-foreground mb-8">Add skills you have or want to develop. Press Enter or click Add.</p>
                
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    type="text"
                    autoComplete="off"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => {
                      if (skillInput.trim()) addSkillFromInput();
                    }}
                    placeholder="e.g. Project Management"
                    className="w-full px-5 py-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg shadow-sm sm:flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 rounded-xl px-6"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addSkillFromInput}
                  >
                    Add
                  </Button>
                </div>

                {skillsError && <p className="text-sm text-destructive mb-6">{skillsError}</p>}

                <div className="flex flex-wrap gap-2 mb-8 min-h-[100px] content-start">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-sm">
                      {skill}
                      <button
                        onClick={() => {
                          const nextSkills = skills.filter((s) => s !== skill);
                          store.setFormData({ skills: nextSkills });
                          skillsForm.setValue("skills", nextSkills, { shouldValidate: true });
                        }}
                        className="hover:text-primary-foreground/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && <span className="text-muted-foreground text-sm italic py-2">No skills added yet.</span>}
                </div>

                <div className="pt-6 border-t border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Popular Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SKILLS.filter(s => !skills.includes(s)).map((skill) => (
                      <button
                        key={skill}
                        onClick={() => {
                          const nextSkills = skills.includes(skill) ? skills : [...skills, skill];
                          store.setFormData({ skills: nextSkills });
                          skillsForm.setValue("skills", nextSkills, { shouldValidate: true });
                        }}
                        className="px-3 py-1.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/40 text-muted-foreground text-xs font-semibold hover:bg-muted hover:text-foreground transition-colors">
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: enterX, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: exitX, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Your learning interests</h1>
                <p className="text-muted-foreground mb-8">Select categories to personalize your course recommendations.</p>
                {interestsError && <p className="text-sm text-destructive mb-4">{interestsError}</p>}
                
                <div className="grid grid-cols-2 gap-3">
                  {INTEREST_CATEGORIES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        const nextInterests = interests.includes(id)
                          ? interests.filter((i) => i !== id)
                          : [...interests, id];
                        store.setFormData({ interests: nextInterests });
                        interestsForm.setValue("interests", nextInterests, { shouldValidate: true, shouldDirty: true });
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        interests.includes(id) ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40 bg-card"
                      }`}>
                      <Icon className={`w-5 h-5 ${interests.includes(id) ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-sm">{label}</span>
                      {interests.includes(id) && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Avatar */}
            {step === 4 && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, x: enterX, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: exitX, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              >
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Almost done! Profile photo</h1>
                <p className="text-muted-foreground mb-8">
                  Add a professional headshot if you like—you can skip this and upload one later from your profile.
                </p>
                
                <div className="flex flex-col items-center justify-center p-12 ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card rounded-3xl shadow-sm text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-4 ring-background shadow-xl">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground/40" />
                      )}
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                  
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="rounded-full shadow-sm mb-2">
                    <Upload className="w-4 h-4 mr-2" /> Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground max-w-[200px]">JPG, PNG or WEBP. Max 2MB.</p>
                  {avatarError && <p className="text-sm text-destructive mt-3">{avatarError}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border/40">
             <Button variant="ghost" onClick={() => store.prevStep()} disabled={step === 0}
               className={`rounded-full px-6 font-semibold ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}>
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>

             {step < totalSteps - 1 ? (
               <Button
                 onClick={() => {
                   if (step === 0) return store.nextStep();

                   if (step === 1) {
                     roleForm.handleSubmit(
                       (values) => {
                        store.setFormData({ role: values.roleChoice as OnboardingRoleChoice });
                         store.nextStep();
                       },
                       () => toast.error("Please select a role to continue.")
                     )();
                     return;
                   }

                   if (step === 2) {
                     skillsForm.handleSubmit(
                      (values) => {
                        store.setFormData({ skills: values.skills });
                        store.nextStep();
                      },
                       () => toast.error("Add at least one skill to continue.")
                     )();
                     return;
                   }

                   if (step === 3) {
                     interestsForm.handleSubmit(
                      (values) => {
                        store.setFormData({ interests: values.interests });
                        store.nextStep();
                      },
                       () => toast.error("Select at least one interest to continue.")
                     )();
                     return;
                   }

                   store.nextStep();
                 }}
                 disabled={!canContinue()}
                 className="rounded-full px-8 font-bold bg-primary hover:bg-primary/90 text-white shadow-brand">
                 Continue <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
             ) : (
               <Button
                 onClick={() => {
                   avatarForm.handleSubmit(
                     () => handleFinish(),
                     () => toast.error("Fix the photo URL or clear the upload and try again.")
                   )();
                 }}
                 disabled={finishing || !canContinue()}
                 className="rounded-full px-10 font-bold bg-primary hover:bg-primary/90 text-white shadow-brand">
                 {finishing ? (
                   <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizing...</>
                 ) : (
                   <>Launch CONNECT HER <ArrowRight className="w-4 h-4 ml-2" /></>
                 )}
               </Button>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

