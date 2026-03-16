import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Video, FileText, HelpCircle, Upload, ArrowLeft, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const categories = ["Data Science", "Technology", "Business", "Leadership", "Finance", "Marketing", "Career Development"];
const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];

type Lesson = { id: number; title: string; type: "video" | "text" | "quiz" };
type Module = { id: number; title: string; lessons: Lesson[]; open: boolean };

const defaultModules: Module[] = [
  { id: 1, title: "Module 1: Introduction", open: true, lessons: [{ id: 1, title: "Welcome to the Course", type: "video" }, { id: 2, title: "Course Overview", type: "text" }] },
  { id: 2, title: "Module 2: Core Concepts", open: false, lessons: [{ id: 3, title: "Key Principles", type: "video" }] },
];

const lessonIcons = { video: Video, text: FileText, quiz: HelpCircle };

export default function CourseBuilderPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [modules, setModules] = useState<Module[]>(defaultModules);

  const toggleModule = (id: number) => setModules(m => m.map(mod => mod.id === id ? { ...mod, open: !mod.open } : mod));
  const addModule = () => setModules(m => [...m, { id: Date.now(), title: `Module ${m.length + 1}: Untitled`, open: true, lessons: [] }]);
  const addLesson = (moduleId: number) => setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, lessons: [...mod.lessons, { id: Date.now(), title: "New Lesson", type: "video" }] } : mod));
  const deleteLesson = (moduleId: number, lessonId: number) => setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) } : mod));

  const steps = ["Course Info", "Curriculum", "Publish"];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/courses" className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Create New Course</h1>
          <p className="text-muted-foreground text-sm">Share your expertise with learners across Africa</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => setStep((i + 1) as 1 | 2 | 3)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${step === i + 1 ? "gradient-card text-primary-foreground shadow-brand-sm" : step > i + 1 ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 border-current">{i + 1}</span>
              {s}
            </button>
            {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Course Information</h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Course Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Data Analytics with Python & Power BI"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="What will students learn in this course?"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select level</option>
                  {levels.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Thumbnail Image</label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB · 1280×720px recommended</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Pricing</label>
              <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setIsFree(false)} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${!isFree ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"}`}>Paid</button>
                <button onClick={() => setIsFree(true)} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${isFree ? "border-secondary bg-accent text-secondary" : "border-border text-muted-foreground"}`}>Free</button>
              </div>
              {!isFree && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              )}
            </div>
            <Button onClick={() => setStep(2)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">Continue to Curriculum →</Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Curriculum Builder</h2>
            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleModule(mod.id)} className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground text-sm">{mod.title}</span>
                      <span className="text-xs text-muted-foreground">({mod.lessons.length} lessons)</span>
                    </div>
                    {mod.open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {mod.open && (
                    <div className="p-3 space-y-2 bg-card">
                      {mod.lessons.map((lesson) => {
                        const Icon = lessonIcons[lesson.type];
                        return (
                          <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <input defaultValue={lesson.title}
                              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
                            <select defaultValue={lesson.type} className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-muted-foreground focus:outline-none">
                              <option value="video">Video</option>
                              <option value="text">Text</option>
                              <option value="quiz">Quiz</option>
                            </select>
                            <button onClick={() => deleteLesson(mod.id, lesson.id)} className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <button onClick={() => addLesson(mod.id)} className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Lesson
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addModule} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                <Plus className="w-4 h-4" /> Add Module
              </button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Back</Button>
              <Button onClick={() => setStep(3)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">Continue to Publish →</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Review & Publish</h2>
            <div className="bg-muted/50 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground">{title || "Untitled Course"}</h3>
              <p className="text-sm text-muted-foreground">{description || "No description yet."}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full font-medium">{category || "No category"}</span>
                <span className="bg-muted px-2 py-1 rounded-full">{level || "No level"}</span>
                <span className="bg-accent text-primary px-2 py-1 rounded-full font-medium">{isFree ? "Free" : price ? `$${price}` : "No price set"}</span>
                <span className="bg-muted px-2 py-1 rounded-full">{modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons across {modules.length} modules</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">← Back</Button>
              <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={() => {
                toast.success("Draft saved successfully!");
              }}><Save className="w-4 h-4" /> Save Draft</Button>
              <Button className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 flex items-center gap-2" onClick={() => {
                if (!title.trim()) { toast.error("Please enter a course title before publishing."); return; }
                toast.success(`"${title}" has been published successfully!`);
              }}><Eye className="w-4 h-4" /> Publish Course</Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
