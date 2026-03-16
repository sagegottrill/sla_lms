import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Plus, X, Briefcase, Award, BookOpen, Edit2, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const skillCategories = {
  Technical: ["Python", "SQL", "Power BI", "Excel", "Tableau", "Machine Learning", "Data Analysis", "JavaScript", "React"],
  Business: ["Project Management", "Business Analysis", "Strategy", "Financial Modelling", "Marketing", "Sales"],
  "Soft Skills": ["Leadership", "Communication", "Negotiation", "Critical Thinking", "Public Speaking", "Mentorship"],
};

const initialExperiences = [
  { id: 1, title: "Data Analyst", company: "TechCorp Lagos", period: "2024 – Present", desc: "Leading data analytics initiatives across 3 product lines." },
  { id: 2, title: "Business Intelligence Intern", company: "GTBank", period: "2023", desc: "Built automated reporting dashboards using Power BI." },
];

const earnedCertificates = [
  { title: "Data Analytics with Python & Power BI", issuer: "Connecta / She Leads Africa", date: "Jan 2026", id: "SLA-001" },
  { title: "Women in Leadership", issuer: "Connecta / She Leads Africa", date: "Oct 2025", id: "SLA-002" },
  { title: "Entrepreneurship & Business Modeling", issuer: "Connecta / She Leads Africa", date: "Jul 2025", id: "SLA-003" },
];

export default function ProfilePage() {
  const { appUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("Passionate data analyst and aspiring entrepreneur. Completed 3 SLA programs. Ready to lead Africa's digital transformation.");
  const [headline, setHeadline] = useState("Data Analyst · SLA Alumni · Future Tech Founder");
  const [location, setLocation] = useState("Lagos, Nigeria");
  const [linkedin, setLinkedin] = useState("linkedin.com/in/amara-osei");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Python", "SQL", "Power BI", "Data Analysis", "Leadership", "Communication"]);
  const [experiences, setExperiences] = useState(initialExperiences);
  const [addingExp, setAddingExp] = useState(false);
  const [newExp, setNewExp] = useState({ title: "", company: "", period: "", desc: "" });
  const [saved, setSaved] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const addExperience = () => {
    if (!newExp.title || !newExp.company) return;
    setExperiences(prev => [...prev, { ...newExp, id: Date.now() }]);
    setNewExp({ title: "", company: "", period: "", desc: "" });
    setAddingExp(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Your professional identity on She Leads Africa</p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </Button>
        ) : (
          <Button onClick={handleSave} className="rounded-xl gradient-card text-primary-foreground flex items-center gap-2">
            <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Profile"}
          </Button>
        )}
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Cover */}
        <div className="h-28 gradient-hero relative">
          {editing && (
            <button className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-primary-foreground/20 text-primary-foreground flex items-center justify-center hover:bg-primary-foreground/30">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl gradient-card border-4 border-card flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-brand-sm">
                {appUser?.name?.charAt(0)}
              </div>
              {editing && (
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center shadow-brand-sm">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="pb-2">
              <h2 className="font-display text-xl font-bold text-foreground">{appUser?.name}</h2>
              {editing ? (
                <input value={headline} onChange={e => setHeadline(e.target.value)} className="text-sm text-muted-foreground bg-transparent border-b border-dashed border-border focus:outline-none w-72" />
              ) : (
                <p className="text-sm text-muted-foreground">{headline}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              {editing ? (
                <input value={location} onChange={e => setLocation(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              ) : (
                <p className="text-sm text-foreground mt-1">{location}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">LinkedIn</label>
              {editing ? (
                <input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              ) : (
                <a href={`https://${linkedin}`} target="_blank" rel="noreferrer" className="text-sm text-primary mt-1 flex items-center gap-1 hover:underline">
                  {linkedin} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            {editing ? (
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            ) : (
              <p className="text-sm text-foreground mt-1 leading-relaxed">{bio}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Skills */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display text-lg font-bold text-foreground mb-5">Skills</h3>
        {Object.entries(skillCategories).map(([cat, skills]) => (
          <div key={cat} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <button key={skill} onClick={() => editing && toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedSkills.includes(skill)
                      ? "gradient-card text-primary-foreground shadow-brand-sm"
                      : "bg-muted text-muted-foreground border border-border"
                  } ${editing ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}>
                  {skill}
                  {editing && selectedSkills.includes(skill) && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        {editing && <p className="text-xs text-muted-foreground mt-2">Click skills to add/remove them from your profile</p>}
      </div>

      {/* Work Experience */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Work Experience
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={() => setAddingExp(true)} className="rounded-xl text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id} className="flex gap-4 p-4 rounded-xl bg-muted/40 relative group">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{exp.title}</p>
                <p className="text-xs text-secondary">{exp.company} · {exp.period}</p>
                <p className="text-xs text-muted-foreground mt-1">{exp.desc}</p>
              </div>
              {editing && (
                <button onClick={() => setExperiences(prev => prev.filter(e => e.id !== exp.id))} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {addingExp && (
          <div className="mt-4 p-4 rounded-xl border border-dashed border-primary/40 bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Job Title" value={newExp.title} onChange={e => setNewExp(p => ({ ...p, title: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input placeholder="Company" value={newExp.company} onChange={e => setNewExp(p => ({ ...p, company: e.target.value }))} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <input placeholder="Period (e.g. 2024 – Present)" value={newExp.period} onChange={e => setNewExp(p => ({ ...p, period: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <textarea placeholder="Description" value={newExp.desc} onChange={e => setNewExp(p => ({ ...p, desc: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            <div className="flex gap-2">
              <Button size="sm" onClick={addExperience} className="rounded-lg gradient-card text-primary-foreground text-xs">Add</Button>
              <Button size="sm" variant="outline" onClick={() => setAddingExp(false)} className="rounded-lg text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-gold" /> Certificates Earned
        </h3>
        <div className="space-y-3">
          {earnedCertificates.map((cert) => (
            <div key={cert.id} className="flex items-center gap-4 p-4 rounded-xl bg-accent border border-secondary/20">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{cert.title}</p>
                <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.date} · ID: {cert.id}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg text-xs border-border text-foreground flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Learning summary */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-5">
          <BookOpen className="w-5 h-5 text-secondary" /> Learning Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[["6", "Courses Enrolled"], ["3", "Certificates Earned"], ["124h", "Total Learning Time"]].map(([v, l]) => (
            <div key={l} className="text-center p-4 rounded-xl bg-muted/40">
              <div className="text-2xl font-bold font-display text-primary">{v}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
