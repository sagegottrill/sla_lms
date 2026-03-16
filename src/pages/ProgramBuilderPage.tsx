import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, BookOpen, Calendar, Users, ArrowLeft, ChevronRight, Trash2, GripVertical, Upload, Image, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const CATEGORIES = ["Data Science", "Technology", "Business", "Leadership", "Finance", "Marketing", "Health", "Design"];
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

type Partner = { id: number; name: string; logoUrl: string };
type Course = { id: number; title: string; category: string; duration: string };

export default function ProgramBuilderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [highlights, setHighlights] = useState<string[]>(["Live mentoring sessions", "Certificate from SLA"]);

  // Step 2 — Partners
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextPartnerId = useRef(1);

  // Step 3 — Courses
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    if (step === 3) {
      setCoursesLoading(true);
      supabase.from("courses").select("id, title, category, duration").eq("status", "published")
        .then(({ data }) => { setAvailableCourses((data ?? []) as Course[]); setCoursesLoading(false); });
    }
  }, [step]);

  const toggleCourse = (id: number) => setSelectedCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const addPartner = () => {
    if (!newPartnerName.trim()) return;
    const newPartner: Partner = {
      id: nextPartnerId.current++,
      name: newPartnerName.trim(),
      logoUrl: "",
    };
    setPartners(prev => [...prev, newPartner]);
    setNewPartnerName("");
  };

  const removePartner = (id: number) => {
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const handleLogoUpload = (partnerId: number, file: File) => {
    const url = URL.createObjectURL(file);
    setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, logoUrl: url } : p));
  };


  const handleSave = async (status: "upcoming" | "active") => {
    if (!title.trim()) { toast.error("Program title is required."); setStep(1); return; }
    setSaving(true);
    const selectedCourseTitles = availableCourses
      .filter(c => selectedCourses.includes(c.id))
      .map(c => c.title);
    const { error } = await supabase.from("programs").insert({
      title: title.trim(),
      description: description.trim(),
      category,
      duration: duration.trim() || "TBD",
      start_date: startDate || null,
      deadline: deadline || null,
      capacity: Number(capacity) || 100,
      price: Number(price) || 0,
      image: image.trim() || null,
      highlights: highlights.filter(Boolean),
      courses: selectedCourseTitles,
      course_count: selectedCourses.length,
      status,
    });
    setSaving(false);
    if (error) { toast.error(`Failed to save: ${error.message}`); return; }
    toast.success(status === "active" ? "Program launched!" : "Draft saved.");
    setPublished(status === "active");
    if (status === "active") setTimeout(() => navigate("/dashboard/programs"), 1500);
  };

  const stepLabels = ["Program Details", "Partners & Sponsors", "Select Courses", "Preview & Launch"];


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/programs" className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Create Program</h1>
          <p className="text-muted-foreground text-sm">Bundle courses into a structured learning track</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        {stepLabels.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => setStep((i + 1) as 1 | 2 | 3 | 4)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${step === i + 1 ? "gradient-card text-primary-foreground shadow-brand-sm" : step > i + 1 ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-current">{i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        {/* Step 1: Program Details */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Program Details</h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Program Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Women in Data Science 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the program goals and outcomes..."
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Enrollment Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Max Participants</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 200"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cohort Name</label>
              <input placeholder="e.g. Cohort 3 · Spring 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <Button onClick={() => setStep(2)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">Continue →</Button>
          </motion.div>
        )}

        {/* Step 2: Partners & Sponsors */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Partners & Sponsors</h2>
              <p className="text-sm text-muted-foreground">Add partner or sponsor logos to be displayed on the program's public listing. This is optional.</p>
            </div>

            {/* Add Partner */}
            <div className="flex gap-2">
              <input
                value={newPartnerName}
                onChange={e => setNewPartnerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPartner()}
                placeholder="Enter partner/sponsor name..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button onClick={addPartner} size="sm" className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 px-4 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            {/* Partners List */}
            {partners.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Added Partners ({partners.length})</p>
                {partners.map(partner => (
                  <div key={partner.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    {/* Logo preview or upload */}
                    <div className="relative group">
                      {partner.logoUrl ? (
                        <div className="w-14 h-14 rounded-xl border border-border overflow-hidden bg-white flex items-center justify-center">
                          <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-contain p-1" />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            fileInputRef.current?.setAttribute("data-partner-id", String(partner.id));
                            fileInputRef.current?.click();
                          }}
                          className="w-14 h-14 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-0.5 hover:border-primary/40 hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground font-medium">Logo</span>
                        </button>
                      )}
                      {partner.logoUrl && (
                        <button
                          onClick={() => {
                            fileInputRef.current?.setAttribute("data-partner-id", String(partner.id));
                            fileInputRef.current?.click();
                          }}
                          className="absolute inset-0 bg-foreground/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Image className="w-4 h-4 text-primary-foreground" />
                        </button>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{partner.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {partner.logoUrl ? "Logo uploaded ✓" : "Click to upload logo"}
                      </p>
                    </div>

                    {/* Remove */}
                    <button onClick={() => removePartner(partner.id)} className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                <Image className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No partners added yet</p>
                <p className="text-xs text-muted-foreground/70">Add partner names above and upload their logos</p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                const partnerId = Number(fileInputRef.current?.getAttribute("data-partner-id"));
                if (file && partnerId) handleLogoUpload(partnerId, file);
                e.target.value = "";
              }}
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Back</Button>
              <Button onClick={() => setStep(3)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">
                {partners.length === 0 ? "Skip →" : "Continue →"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Courses */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Select Courses</h2>
              <p className="text-sm text-muted-foreground">Choose and order the courses included in this program</p>
            </div>

            {/* Selected */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Selected ({selectedCourses.length})</p>
              <div className="space-y-2">
                {availableCourses.filter(c => selectedCourses.includes(c.id)).map((course, i) => (
                  <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-accent">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                    <span className="w-5 h-5 rounded-full gradient-card flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.category} · {course.duration}</p>
                    </div>
                    <button onClick={() => toggleCourse(course.id)} className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Available Courses</p>
              <div className="space-y-2">
                {availableCourses.filter(c => !selectedCourses.includes(c.id)).map(course => (
                  <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.category} · {course.duration}</p>
                    </div>
                    <button onClick={() => toggleCourse(course.id)} className="text-xs px-3 py-1.5 rounded-lg gradient-card text-primary-foreground hover:opacity-90 font-medium">
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">← Back</Button>
              <Button onClick={() => setStep(4)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">Preview →</Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Preview & Launch */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Preview & Launch</h2>
            <div className="bg-muted/50 rounded-xl p-5 space-y-3">
              <h3 className="font-display font-bold text-foreground text-lg">{title || "Untitled Program"}</h3>
              <p className="text-sm text-muted-foreground">{description || "No description."}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full font-medium flex items-center gap-1"><BookOpen className="w-3 h-3" />{selectedCourses.length} courses</span>
                <span className="bg-muted px-2 py-1 rounded-full flex items-center gap-1"><Calendar className="w-3 h-3" />Deadline: {deadline || "Not set"}</span>
                <span className="bg-accent text-primary px-2 py-1 rounded-full font-medium flex items-center gap-1"><Users className="w-3 h-3" />Max {capacity || "∞"} participants</span>
              </div>

              {/* Partners preview */}
              {partners.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">Partners & Sponsors</p>
                  <div className="flex flex-wrap gap-3">
                    {partners.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                        {p.logoUrl ? (
                          <img src={p.logoUrl} alt={p.name} className="w-6 h-6 object-contain rounded" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">← Back</Button>
              <Button variant="outline" onClick={() => handleSave("upcoming")} disabled={saving} className="rounded-xl gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save as Draft
              </Button>
              <Button onClick={() => handleSave("active")} disabled={saving} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                {saving ? "Launching..." : "Launch Program"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
