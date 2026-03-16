import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Download, Eye, GripVertical, Briefcase, GraduationCap, Award, Star, Mail, Phone, MapPin, Linkedin, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  const [skills, setSkills] = useState<string[]>(["Data Analysis", "Python", "Power BI", "Leadership", "Communication"]);
  const [newSkill, setNewSkill] = useState("");

  const [experience, setExperience] = useState<Experience[]>([
    { id: "1", role: "Marketing Analyst", company: "Flutterwave", start: "2024-01", end: "", current: true, description: "Led data-driven marketing campaigns, increasing conversion rates by 35%." },
    { id: "2", role: "Junior Analyst", company: "GTBank", start: "2022-06", end: "2023-12", current: false, description: "Supported financial reporting and dashboard development for the retail banking division." },
  ]);

  const [education, setEducation] = useState<Education[]>([
    { id: "1", degree: "BSc Economics", school: "University of Lagos", year: "2022" },
  ]);

  const [certifications, setCertifications] = useState<string[]>(["Women in Leadership — She Leads Africa", "Data Analytics with Python — Connecta"]);
  const [newCert, setNewCert] = useState("");

  const [template, setTemplate] = useState<"modern" | "classic" | "minimal">("modern");

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

  const handleDownload = async () => {
    const input = document.getElementById("resume-preview-content");
    if (!input) return;

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
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Resume Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a professional resume to share with employers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2 text-sm" onClick={handlePreview}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button 
            className="gradient-card text-primary-foreground rounded-xl gap-2 text-sm hover:opacity-90 min-w-[150px]" 
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left — Section nav */}
        <div className="space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === id ? "bg-accent text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}

          {/* Template picker */}
          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">Template</p>
            {(["modern", "classic", "minimal"] as const).map(t => (
              <button key={t} onClick={() => setTemplate(t)}
                className={`w-full px-4 py-2 rounded-xl text-sm text-left capitalize transition-all ${
                  template === t ? "bg-accent text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Right — Editor */}
        <div className="lg:col-span-3">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-5">

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
                          className={`w-full ${Icon ? "pl-10" : "px-4"} pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30`} />
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
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
                    <div key={exp.id} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground"><GripVertical className="w-4 h-4" /><span className="text-xs font-semibold">Position {i + 1}</span></div>
                        <button onClick={() => setExperience(experience.filter(e => e.id !== exp.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input value={exp.role} onChange={e => updateExp(exp.id, "role", e.target.value)} placeholder="Job Title"
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={exp.company} onChange={e => updateExp(exp.id, "company", e.target.value)} placeholder="Company"
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input type="month" value={exp.start} onChange={e => updateExp(exp.id, "start", e.target.value)}
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        {!exp.current && <input type="month" value={exp.end} onChange={e => updateExp(exp.id, "end", e.target.value)}
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />}
                      </div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={exp.current} onChange={e => updateExp(exp.id, "current", e.target.checked)} className="rounded" /> Currently working here
                      </label>
                      <textarea value={exp.description} onChange={e => updateExp(exp.id, "description", e.target.value)} rows={2} placeholder="Key achievements and responsibilities..."
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
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
                    <div key={edu.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                      <div className="flex-1 grid sm:grid-cols-3 gap-3">
                        <input value={edu.degree} onChange={e => updateEdu(edu.id, "degree", e.target.value)} placeholder="Degree / Qualification"
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={edu.school} onChange={e => updateEdu(edu.id, "school", e.target.value)} placeholder="Institution"
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={edu.year} onChange={e => updateEdu(edu.id, "year", e.target.value)} placeholder="Year"
                          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button variant="outline" onClick={addSkill} className="rounded-xl"><Plus className="w-4 h-4" /></Button>
                </div>
              </>
            )}

            {activeSection === "certifications" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Certifications</h2>
                <div className="space-y-2">
                  {certifications.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                      <div className="flex items-center gap-2"><Award className="w-4 h-4 text-secondary" /><span className="text-sm text-foreground">{c}</span></div>
                      <button onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === "Enter" && addCert()} placeholder="Add certification..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button variant="outline" onClick={addCert} className="rounded-xl"><Plus className="w-4 h-4" /></Button>
                </div>
              </>
            )}
          </motion.div>

          {/* Live Preview Card */}
          <div className="bg-card rounded-2xl border border-border p-6 mt-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Live Preview</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">{template} template</span>
            </div>
            {/* The wrapper that will be captured by html2canvas */}
            <div id="resume-preview-content" className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-sm">
              <div className={`border border-gray-200 rounded-xl p-8 bg-white h-full ${template === "modern" ? "border-l-4 border-l-primary" : template === "classic" ? "border-t-4 border-t-secondary" : ""}`}>
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
