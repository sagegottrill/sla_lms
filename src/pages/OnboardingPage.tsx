import { useState, useRef } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, BookOpen,
  BarChart3, Briefcase, Heart, Code, Palette, DollarSign, Megaphone, Shield,
  User, Upload, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { toast } from "sonner";

const ROLES = [
  { id: "student", label: "Student Learner", desc: "I want to take courses and build skills", icon: BookOpen },
  { id: "instructor", label: "Instructor", desc: "I want to teach and create courses", icon: Megaphone },
  { id: "program_manager", label: "Program Manager", desc: "I manage cohorts and enterprise learning", icon: Briefcase },
];

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

export default function OnboardingPage() {
  const { user, needsOnboarding, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const store = useOnboardingStore();
  
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Navigate to="/login" replace />;
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return store.roleChoice !== "";
    if (step === 2) return store.skills.length > 0;
    if (step === 3) return store.interests.length > 0;
    return true;
  };

  const handleAddSkill = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (!skillInput.trim()) return;
    store.addSkill(skillInput.trim());
    setSkillInput("");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      store.setAvatarUrl(publicUrl);
    } catch (err: any) {
      toast.error("Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // 1. Update Profile in DB using the captured data
      await supabase
        .from('profiles')
        .update({
          role: store.roleChoice,
          avatar_url: store.avatarUrl,
          onboarding_completed: true,
          // interests and skills mapping would go here if columns existed
        })
        .eq('id', user.id);

      // 2. Invalidate React Query Cache strictly as requested
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });

      // 3. Mark auth context as complete
      await completeOnboarding({ completed: true });
      
      // 4. Update local Zustand persistent state
      store.completeOnboarding();
      
      toast.success("Profile setup complete! Welcome aboard.");
      navigate("/dashboard");
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
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Connecta Setup</span>
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
             </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                  Welcome to Connecta LMS. <br/><span className="text-muted-foreground">Let's set you up.</span>
                </h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                  We need a few details to personalize your workspace, secure your permissions, and curate the best learning resources for your account.
                </p>
              </motion.div>
            )}

            {/* Step 1: Role Choice */}
            {step === 1 && (
              <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Select your primary role</h1>
                <p className="text-muted-foreground mb-8">This determines your dashboard layout and system permissions.</p>
                <div className="grid gap-3">
                  {ROLES.map(({ id, label, desc, icon: Icon }) => (
                    <button key={id} onClick={() => store.setRoleChoice(id as any)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                        store.roleChoice === id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40 bg-card"
                      }`}>
                      <div className={`p-3 rounded-xl flex shrink-0 ${store.roleChoice === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
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
              <motion.div key="skills" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">What are your skills?</h1>
                <p className="text-muted-foreground mb-8">Add skills you have or want to develop. Press Enter to add.</p>
                
                <div className="mb-6">
                  <input 
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="e.g. Project Management" 
                    className="w-full px-5 py-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mb-8 min-h-[100px] content-start">
                  {store.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-sm">
                      {skill}
                      <button onClick={() => store.removeSkill(skill)} className="hover:text-primary-foreground/70"><X className="w-4 h-4" /></button>
                    </span>
                  ))}
                  {store.skills.length === 0 && <span className="text-muted-foreground text-sm italic py-2">No skills added yet.</span>}
                </div>

                <div className="pt-6 border-t border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Popular Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SKILLS.filter(s => !store.skills.includes(s)).map((skill) => (
                      <button key={skill} onClick={() => store.addSkill(skill)}
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
              <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Your learning interests</h1>
                <p className="text-muted-foreground mb-8">Select categories to personalize your course recommendations.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {INTEREST_CATEGORIES.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => store.toggleInterest(id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        store.interests.includes(id) ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40 bg-card"
                      }`}>
                      <Icon className={`w-5 h-5 ${store.interests.includes(id) ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-sm">{label}</span>
                      {store.interests.includes(id) && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Avatar */}
            {step === 4 && (
              <motion.div key="avatar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Almost done! Add a photo</h1>
                <p className="text-muted-foreground mb-8">Complete your profile by uploading a professional headshot.</p>
                
                <div className="flex flex-col items-center justify-center p-12 ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card rounded-3xl shadow-sm text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-4 ring-background shadow-xl">
                      {store.avatarUrl ? (
                        <img src={store.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border/40">
             <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
               className={`rounded-full px-6 font-semibold ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}>
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>

             {step < totalSteps - 1 ? (
               <Button onClick={() => setStep(s => s + 1)} disabled={!canContinue()} 
                 className="rounded-full px-8 font-bold bg-[#0056D2] hover:bg-[#00419e] text-white shadow-brand">
                 Continue <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
             ) : (
               <Button onClick={handleFinish} disabled={finishing || !canContinue()} 
                 className="rounded-full px-10 font-bold bg-[#0056D2] hover:bg-[#00419e] text-white shadow-brand">
                 {finishing ? (
                   <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizing...</>
                 ) : (
                   <>Launch Connecta <ArrowRight className="w-4 h-4 ml-2" /></>
                 )}
               </Button>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
