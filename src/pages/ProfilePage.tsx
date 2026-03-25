import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Plus, X, Briefcase, Award, BookOpen, Edit2, Save, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const skillCategories = {
  Technical: ["Python", "SQL", "Power BI", "Excel", "Tableau", "Machine Learning", "Data Analysis", "JavaScript", "React"],
  Business: ["Project Management", "Business Analysis", "Strategy", "Financial Modelling", "Marketing", "Sales"],
  "Soft Skills": ["Leadership", "Communication", "Negotiation", "Critical Thinking", "Public Speaking", "Mentorship"],
};

export default function ProfilePage() {
  const { appUser, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Initialize from real appUser data (Supabase)
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && customSkill.trim()) {
      e.preventDefault();
      const skill = customSkill.trim();
      if (!selectedSkills.includes(skill)) {
        setSelectedSkills(prev => [...prev, skill]);
      }
      setCustomSkill("");
    }
  };

  useEffect(() => {
    if (appUser) {
      setBio(appUser.bio || "");
      setHeadline(appUser.headline || "");
      setLocation(appUser.location || "");
      setLinkedin(appUser.linkedin || "");
      setSelectedSkills(appUser.skills ?? []);
    }
  }, [appUser]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleAvatarClick = () => {
    if (editing) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appUser) return;
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploadingAvatar(true);
    try {
      const publicUrl = await api.uploadAvatar(appUser.id, file);
      if (publicUrl) {
        await refreshProfile();
        toast.success("Profile photo updated!");
      } else {
        toast.error("Photo upload failed — check Supabase Storage bucket 'avatars' is public.");
        setAvatarPreview(null);
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!appUser) return;
    setSaving(true);
    try {
      const result = await api.updateProfile(appUser.id, {
        bio,
        headline,
        location,
        linkedin,
        skills: selectedSkills,
      });
      if (result) {
        await refreshProfile();
        toast.success("Profile saved!");
        setEditing(false);
      } else {
        toast.error("Save failed — check your Supabase connection.");
      }
    } catch {
      toast.error("Unexpected error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = avatarPreview || appUser?.avatar || null;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Profile Header section (Coursera-style minimalistic intro) */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-10 border-b border-border/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={handleAvatarClick}
                className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden shadow-sm relative ring-1 ring-black/5 dark:ring-white/10 border-0 ${editing ? "cursor-pointer hover:opacity-90" : "cursor-default"} ${currentAvatar ? "bg-muted" : "bg-primary text-white"}`}
              >
                {currentAvatar ? (
                  <img src={currentAvatar} alt={appUser?.name} className="w-full h-full object-cover" />
                ) : (
                  appUser?.name?.charAt(0) || "U"
                )}
                {editing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </div>
                )}
              </button>
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">{appUser?.name}</h1>
              {editing ? (
                <input value={headline} onChange={e => setHeadline(e.target.value)}
                  placeholder="Your professional headline (e.g. Data Scientist)"
                  className="mt-2 text-base text-muted-foreground bg-transparent border-b border-dashed border-border/80 focus:outline-none w-80 pb-1" />
              ) : (
                <p className="text-lg text-muted-foreground mt-1">{headline || "Add a professional headline"}</p>
              )}
            </div>
          </div>
          
          <div className="shrink-0 self-start sm:self-center">
            {!editing ? (
              <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl flex items-center gap-2 h-10 px-5 shadow-sm hover:bg-muted/50 border-border/80 text-foreground">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="rounded-xl flex items-center gap-2 h-10 px-6 font-bold bg-primary text-white shadow-md hover:bg-primary/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">About</h3>
            {editing ? (
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Write a brief professional summary..."
                className="w-full p-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-sm" />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bio || "No summary provided. Add a brief bio to tell others about your professional journey."}
              </p>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Location</h3>
              {editing ? (
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria"
                  className="w-full p-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
              ) : (
                <p className="text-sm text-muted-foreground">{location || "Not specified"}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">LinkedIn Profile</h3>
              {editing ? (
                <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname"
                  className="w-full p-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
              ) : linkedin ? (
                <a
                  href={linkedin.startsWith("http") ? linkedin : `https://${linkedin.replace(/^\/+/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary font-medium hover:text-primary/90 inline-flex items-center gap-1.5 transition-colors"
                >
                  {linkedin} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Not specified</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skills: view shows only skills stored in Supabase; edit mode shows the full skill picker */}
      <div className="py-10 border-b border-border/60">
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-2">Professional Skills</h2>
        <p className="text-sm text-muted-foreground mb-8">
          {editing ? "Tap skills to add or remove them, then save." : "Only skills you have added are shown here — synced from your account."}
        </p>

        {!editing ? (
          <div className="flex flex-wrap gap-2 min-h-[2.5rem] items-start">
            {selectedSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills listed yet. Edit your profile to add skills.</p>
            ) : (
              selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary ring-1 ring-primary/20"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8">
              {Object.entries(skillCategories).map(([cat, skills]) => (
                <div key={cat}>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">{cat}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedSkills.includes(skill)
                            ? "bg-primary text-white"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        } cursor-pointer`}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && <span className="ml-1 opacity-80">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedSkills.filter((s) => !Object.values(skillCategories).flat().includes(s)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Custom</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills
                      .filter((s) => !Object.values(skillCategories).flat().includes(s))
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-primary text-white cursor-pointer hover:opacity-90"
                        >
                          {skill} <span className="ml-1 opacity-80">✓</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 max-w-sm">
              <h3 className="text-sm font-semibold text-foreground mb-2">Add a custom skill</h3>
              <div className="relative">
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder="Type skill and press Enter..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5 bg-muted/30 p-3 rounded-lg w-fit ring-1 ring-black/5 dark:ring-white/10 border-0">
              <Edit2 className="w-3.5 h-3.5" /> Click skills to add or remove them, then save changes.
            </p>
          </>
        )}
      </div>

      {/* Account Info Section */}
      <div className="py-10">
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-6">Account Settings</h2>
        <div className="bg-muted/20 ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-2xl p-6">
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Email Address</p>
              <p className="font-medium text-foreground">{appUser?.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Account Role</p>
              <p className="font-medium text-foreground capitalize">{appUser?.role?.replace("_", " ") || "—"}</p>
            </div>
            <div className="flex items-end">
               <Button
                 variant="link"
                 className="text-primary h-auto p-0 font-semibold no-underline hover:no-underline transition-colors"
                 onClick={async () => {
                   if (!appUser?.email) {
                     toast.error("No email found on this account.");
                     return;
                   }
                   const { error } = await supabase.auth.resetPasswordForEmail(appUser.email, {
                     redirectTo: `${window.location.origin}/login`,
                   });
                   if (error) {
                     toast.error(error.message);
                     return;
                   }
                   toast.success("Password reset link sent. Check your email.");
                 }}
               >
                 Reset Password
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
