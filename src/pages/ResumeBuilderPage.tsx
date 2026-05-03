import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Download, Eye, GripVertical, Briefcase, GraduationCap, Award, Star, Mail, Phone, MapPin, Linkedin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { api } from "@/services/api";

interface Experience {
  id: string; role: string; company: string; start: string; end: string; current: boolean; description: string;
}
interface Education {
  id: string; degree: string; school: string; year: string;
}

export default function ResumeBuilderPage() {
  const { appUser } = useAuth();
  const [activeSection, setActiveSection] = useState("personal");

  const [personal, setPersonal] = useState({
    fullName: appUser?.name ?? "", headline: "", email: appUser?.email ?? "", phone: "", location: "", linkedin: "", website: "", summary: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [experience, setExperience] = useState<Experience[]>([]);

  const [education, setEducation] = useState<Education[]>([]);

  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");

  const [template, setTemplate] = useState<"modern" | "classic" | "minimal">("modern");

  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveRunRef = useRef(0);

  // Load server draft once per signed-in user (by id only — avoid refetch when name/email updates elsewhere).
  useEffect(() => {
    if (!appUser?.id) {
      setResumeLoaded(true);
      return;
    }
    let cancelled = false;
    setResumeLoaded(false);
     (async () => {
       const response = await api.getResumeDraft(appUser.id);
       if (cancelled) return;
       if (response.success && response.data && typeof response.data === "object") {
         const d = response.data as Record<string, unknown>;
         const p = d.personal as Record<string, string> | undefined;
         if (p && typeof p === "object") {
           setPersonal({
             fullName: typeof p.fullName === "string" ? p.fullName : appUser.name ?? "",
             headline: typeof p.headline === "string" ? p.headline : "",
             email: typeof p.email === "string" ? p.email : appUser.email ?? "",
             phone: typeof p.phone === "string" ? p.phone : "",
             location: typeof p.location === "string" ? p.location : "",
             linkedin: typeof p.linkedin === "string" ? p.linkedin : "",
             website: typeof p.website === "string" ? p.website : "",
             summary: typeof p.summary === "string" ? p.summary : "",
           });
         }
         if (Array.isArray(d.skills)) setSkills(d.skills as string[]);
         if (Array.isArray(d.experience)) setExperience(d.experience as Experience[]);
         if (Array.isArray(d.education)) setEducation(d.education as Education[]);
         if (Array.isArray(d.certifications)) setCertifications(d.certifications as string[]);
         if (d.template === "modern" || d.template === "classic" || d.template === "minimal") {
           setTemplate(d.template);
         }
       }
       setResumeLoaded(true);
     })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only reload draft when auth user id changes
  }, [appUser?.id]);

  useEffect(() => {
    if (!resumeLoaded || !appUser?.id) return;
    saveRunRef.current += 1;
    const runId = saveRunRef.current;
    setSaveStatus("saving");
     const t = setTimeout(async () => {
       const response = await api.upsertResumeDraft(appUser.id, {
         personal,
         skills,
         experience,
         education,
         certifications,
         template,
       });
       if (runId !== saveRunRef.current) return;
       if (response.success) {
         setSaveStatus("saved");
         setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
       } else {
         setSaveStatus("error");
         toast.error("Could not save resume draft. Check your connection and try again.");
       }
     }, 1400);
    return () => clearTimeout(t);
  }, [personal, skills, experience, education, certifications, template, resumeLoaded, appUser?.id]);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const addExperience = () => {
    setExperience([...experience, { id: crypto.randomUUID(), role: "", company: "", start: "", end: "", current: false, description: "" }]);
  };

  const updateExp = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperience(experience.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addEducation = () => {
    setEducation([...education, { id: crypto.randomUUID(), degree: "", school: "", year: "" }]);
  };

  const updateEdu = (id: string, field: keyof Education, value: string) => {
    setEducation(education.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addCert = () => {
    if (newCert.trim()) { setCertifications([...certifications, newCert.trim()]); setNewCert(""); }
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const quality = useMemo(() => {
    const filledExperience = experience.filter((e) => e.role.trim() && e.company.trim() && e.description.trim());
    const filledEducation = education.filter((e) => e.degree.trim() && e.school.trim());
    const summaryLength = personal.summary.trim().length;

    const checks = [
      Boolean(personal.fullName.trim()),
      Boolean(personal.email.trim()),
      summaryLength >= 80,
      filledExperience.length >= 1,
      filledEducation.length >= 1,
      skills.length >= 4,
    ];

    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    return {
      score,
      summaryLength,
      filledExperience: filledExperience.length,
      filledEducation: filledEducation.length,
      hasRequiredIdentity: Boolean(personal.fullName.trim() && personal.email.trim()),
      hasMinimumContent:
        summaryLength >= 80 &&
        filledExperience.length >= 1 &&
        filledEducation.length >= 1 &&
        skills.length >= 4,
    };
  }, [personal.fullName, personal.email, personal.summary, experience, education, skills]);

  const handleDownload = async () => {
    const input = document.getElementById("resume-preview-content");
    if (!input) return;
    if (!quality.hasRequiredIdentity) {
      toast.error("Add your full name and email before downloading.");
      setActiveSection("personal");
      return;
    }
    if (!quality.hasMinimumContent) {
      toast.error("Add more resume details first (summary, experience, education, and at least 4 skills).");
      if (quality.summaryLength < 80) setActiveSection("summary");
      else if (quality.filledExperience < 1) setActiveSection("experience");
      else if (quality.filledEducation < 1) setActiveSection("education");
      else setActiveSection("skills");
      return;
    }

    setIsGenerating(true);
    toast.info("Preparing PDF...");

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let remainingHeight = imgHeight;
      let y = 0;

      // Multi-page PDF handling for long resumes.
      while (remainingHeight > 0) {
        pdf.addImage(imgData, "JPEG", 0, y, pdfWidth, imgHeight);
        remainingHeight -= pageHeight;
        y -= pageHeight;
        if (remainingHeight > 0) pdf.addPage();
      }
      pdf.save(`${personal.fullName.replace(/\s+/g, '_') || "Resume"}.pdf`);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    const el = document.getElementById("resume-preview-content");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.info("Scroll down to see the live preview.");
  };

  const sections = [
    { id: "personal", label: "Personal Info", icon: Mail },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "skills", label: "Skills", icon: Star },
    { id: "certifications", label: "Certifications", icon: Award },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-border/60 pb-6 pt-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground text-base mt-2">Create a professional, ATS-friendly resume for your portfolio and applications</p>
          {appUser?.id ? (
            <p className="text-xs text-muted-foreground mt-2">
              {!resumeLoaded
                ? "Loading your saved resume…"
                : saveStatus === "saving"
                  ? "Saving draft…"
                  : saveStatus === "saved"
                    ? "Draft saved to your account."
                    : saveStatus === "error"
                      ? "Save failed — try again."
                      : "Changes save automatically while you edit."}
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Sign in to save your resume to your account.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl gap-2 h-11 px-5 shadow-sm border-border/80 text-foreground" onClick={handlePreview}>
            <Eye className="w-4 h-4" /> Live Preview
          </Button>
          <Button 
            className="bg-primary text-white font-bold rounded-xl gap-2 h-11 px-6 shadow-md hover:bg-primary/90 min-w-[160px]" 
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-10">
        {/* Left — Section nav */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Sections</h3>
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}

          {/* Template picker */}
          <div className="pt-6 mt-6 border-t border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Template</h3>
            <div className="space-y-1">
              {(["modern", "classic", "minimal"] as const).map(t => (
                <button key={t} onClick={() => setTemplate(t)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm text-left capitalize transition-all ${
                    template === t ? "bg-muted text-foreground font-semibold ring-1 ring-black/5 dark:ring-white/10 border-0" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Resume Quality</h3>
            <div className="px-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ATS readiness</span>
                <span className={`font-semibold ${quality.score >= 80 ? "text-secondary" : quality.score >= 60 ? "text-primary" : "text-destructive"}`}>
                  {quality.score}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${quality.score >= 80 ? "bg-secondary" : quality.score >= 60 ? "bg-primary" : "bg-destructive"}`}
                  style={{ width: `${quality.score}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{quality.summaryLength >= 80 ? "OK" : "Add"} summary ({quality.summaryLength}/80+ chars)</p>
                <p>{quality.filledExperience >= 1 ? "OK" : "Add"} experience ({quality.filledExperience}/1+)</p>
                <p>{quality.filledEducation >= 1 ? "OK" : "Add"} education ({quality.filledEducation}/1+)</p>
                <p>{skills.length >= 4 ? "OK" : "Add"} skills ({skills.length}/4+)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Editor & Preview */}
        <div className="lg:col-span-3 space-y-10">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-8 shadow-sm">

            {activeSection === "personal" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", key: "fullName", placeholder: "Amara Osei", icon: null },
                    { label: "Professional Headline", key: "headline", placeholder: "Data Analyst | Career Switcher", icon: null },
                    { label: "Email", key: "email", placeholder: "amara@example.com", icon: Mail },
                    { label: "Phone", key: "phone", placeholder: "+234 800 000 0000", icon: Phone },
                    { label: "Location", key: "location", placeholder: "Lagos, Nigeria", icon: MapPin },
                    { label: "LinkedIn", key: "linkedin", placeholder: "linkedin.com/in/amara", icon: Linkedin },
                  ].map(({ label, key, placeholder, icon: Icon }) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
                      <div className="relative">
                        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                        <input value={(personal as any)[key]} onChange={e => setPersonal({ ...personal, [key]: e.target.value })}
                          placeholder={placeholder}
                          className={`w-full ${Icon ? "pl-10" : "px-4"} pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30`} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "summary" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Professional Summary</h2>
                <p className="text-sm text-muted-foreground">Write 2–3 sentences about your background, strengths, and career direction.</p>
                <textarea value={personal.summary} onChange={e => setPersonal({ ...personal, summary: e.target.value })} rows={5}
                  placeholder="Results-driven data analyst with 3+ years of experience in financial services and marketing analytics. Passionate about leveraging data to drive business decisions across Africa..."
                  className="w-full px-4 py-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <p className="text-xs text-muted-foreground">{personal.summary.length}/500 characters</p>
              </>
            )}

            {activeSection === "experience" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-foreground">Work Experience</h2>
                  <Button variant="outline" size="sm" onClick={addExperience} className="rounded-xl gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
                <div className="space-y-4">
                  {experience.map((exp, i) => (
                    <div key={exp.id} className="p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground"><GripVertical className="w-4 h-4" /><span className="text-xs font-semibold">Position {i + 1}</span></div>
                        <button onClick={() => setExperience(experience.filter(e => e.id !== exp.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input value={exp.role} onChange={e => updateExp(exp.id, "role", e.target.value)} placeholder="Job Title"
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={exp.company} onChange={e => updateExp(exp.id, "company", e.target.value)} placeholder="Company"
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input type="month" value={exp.start} onChange={e => updateExp(exp.id, "start", e.target.value)}
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        {!exp.current && <input type="month" value={exp.end} onChange={e => updateExp(exp.id, "end", e.target.value)}
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />}
                      </div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={exp.current} onChange={e => updateExp(exp.id, "current", e.target.checked)} className="rounded" /> Currently working here
                      </label>
                      <textarea value={exp.description} onChange={e => updateExp(exp.id, "description", e.target.value)} rows={2} placeholder="Key achievements and responsibilities..."
                        className="w-full px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "education" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-foreground">Education</h2>
                  <Button variant="outline" size="sm" onClick={addEducation} className="rounded-xl gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add</Button>
                </div>
                <div className="space-y-3">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex items-center gap-3 p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/30">
                      <div className="flex-1 grid sm:grid-cols-3 gap-3">
                        <input value={edu.degree} onChange={e => updateEdu(edu.id, "degree", e.target.value)} placeholder="Degree / Qualification"
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={edu.school} onChange={e => updateEdu(edu.id, "school", e.target.value)} placeholder="Institution"
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={edu.year} onChange={e => updateEdu(edu.id, "year", e.target.value)} placeholder="Year"
                          className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <button onClick={() => setEducation(education.filter(e => e.id !== edu.id))} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "skills" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                      {s}
                      <button onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} placeholder="Add a skill..."
                    className="flex-1 px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button variant="outline" onClick={addSkill} className="rounded-xl"><Plus className="w-4 h-4" /></Button>
                </div>
              </>
            )}

            {activeSection === "certifications" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Certifications</h2>
                <div className="space-y-2">
                  {certifications.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/30">
                      <div className="flex items-center gap-2"><Award className="w-4 h-4 text-secondary" /><span className="text-sm text-foreground">{c}</span></div>
                      <button onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === "Enter" && addCert()} placeholder="Add certification..."
                    className="flex-1 px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button variant="outline" onClick={addCert} className="rounded-xl"><Plus className="w-4 h-4" /></Button>
                </div>
              </>
            )}
          </motion.div>

          {/* Live Preview Card */}
          <div className="bg-muted/20 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
              <h3 className="text-xl font-bold text-foreground">Live Output Preview</h3>
              <span className="text-xs px-3 py-1.5 rounded-full bg-background ring-1 ring-black/5 dark:ring-white/10 border-0 text-foreground font-semibold capitalize shadow-sm">
                {template} template
              </span>
            </div>
            {/* The wrapper that will be captured by html2canvas */}
            <div id="resume-preview-content" className="bg-white p-10 max-w-[210mm] mx-auto min-h-[297mm] shadow-[0_2px_10px_rgba(0,0,0,0.08)] rounded-sm">
              <div className={`ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-lg p-8 bg-white h-full ${template === "modern" ? "border-l-4 border-l-primary" : template === "classic" ? "border-t-4 border-t-primary" : "border-none"}`}>
                <h2 className="text-3xl font-bold text-gray-900">{personal.fullName || "Your Name"}</h2>
              {personal.headline && <p className="text-sm text-primary font-medium mt-0.5">{personal.headline}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {personal.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal.email}</span>}
                {personal.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal.phone}</span>}
                {personal.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal.location}</span>}
              </div>
              {personal.summary && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{personal.summary}</p>}
              {experience.length > 0 && (
                <div className="mt-4 text-gray-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">Experience</h4>
                  {experience.filter(e => e.role).map(e => (
                    <div key={e.id} className="mb-4">
                      <p className="text-sm font-bold text-gray-900">{e.role} <span className="font-medium text-gray-600">at {e.company}</span></p>
                      <p className="text-[11px] text-gray-500 mb-1">{e.start} – {e.current ? "Present" : e.end}</p>
                      {e.description && <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{e.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {education.length > 0 && (
                <div className="mt-4 text-gray-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">Education</h4>
                  {education.filter(e => e.degree).map(e => (
                    <div key={e.id} className="mb-3">
                      <p className="text-sm font-bold text-gray-900">{e.degree}</p>
                      <p className="text-xs text-gray-600">{e.school} &bull; {e.year}</p>
                    </div>
                  ))}
                </div>
              )}
              {skills.length > 0 && (
                <div className="mt-4 text-gray-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">Skills</h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map(s => <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">{s}</span>)}
                  </div>
                </div>
              )}
              {certifications.length > 0 && (
                <div className="mt-4 text-gray-900">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">Certifications</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {certifications.map((c, i) => <li key={i} className="text-xs text-gray-700">{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
