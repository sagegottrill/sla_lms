import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Video, FileText, HelpCircle, ChevronDown, ChevronRight,
  Plus, Trash2, GripVertical, Upload, Check, AlertCircle, Clock,
  Settings, Eye, Zap, ToggleLeft, ToggleRight, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";

/* ─── Types ───────────────────────────────────────────────────────── */
type LessonType = "video" | "reading" | "quiz";

interface Lesson {
  id: string;
  type: LessonType;
  title: string;
  expanded: boolean;
  contentLabel?: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: "mcq" | "truefalse" | "peer";
  options?: string[];
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

async function uploadFileToCoursesBucket(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `thumbnails/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("courses").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = supabase.storage.from("courses").getPublicUrl(path);
  return data.publicUrl;
}

const LESSON_ICONS: Record<LessonType, React.ElementType> = {
  video: Video,
  reading: FileText,
  quiz: HelpCircle,
};

const STEP_LABELS = [
  "Identity",
  "Curriculum",
  "Content",
  "Assessment",
  "Settings",
];

/* ─── Status Badge ────────────────────────────────────────────────── */
function StatusDot({ status }: { status: "draft" | "missing" | "ready" }) {
  const map = {
    draft:   { color: "bg-amber-400",   label: "Draft" },
    missing: { color: "bg-destructive",  label: "Missing Content" },
    ready:   { color: "bg-emerald-500",  label: "Ready to Publish" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
      <span className={cn("w-2 h-2 rounded-full", s.color)} />
      {s.label}
    </span>
  );
}

/* ─── Step 1: Identity ────────────────────────────────────────────── */
function StepIdentity({ data, onChange, courseThumbnailUrl, onCourseThumbnailUrl }: {
  data: { title: string; description: string; subject: string; objectives: string };
  onChange: (field: string, value: string) => void;
  courseThumbnailUrl?: string | null;
  onCourseThumbnailUrl?: (url: string) => void;
}) {
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbUploading, setThumbUploading] = useState(false);

  const fields = [
    { key: "title", label: "Course Title", placeholder: "e.g. BoostHer Digital Marketing Bootcamp", type: "input" },
    { key: "subject", label: "Subject Area", placeholder: "e.g. Digital Marketing, Finance, Leadership", type: "input" },
    { key: "description", label: "Course Description", placeholder: "A compelling overview of what the learner will achieve...", type: "textarea" },
    { key: "objectives", label: "Learning Objectives", placeholder: "By the end of this course, learners will be able to...", type: "textarea" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Define the "shell" of your course. This is what learners and search indices will see first.
        </p>
      </div>
      {onCourseThumbnailUrl ? (
        <div className="space-y-2 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-4">
          <label className="text-sm font-semibold text-foreground">Course thumbnail (cover image)</label>
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setThumbUploading(true);
              const url = await uploadFileToCoursesBucket(file);
              setThumbUploading(false);
              if (url) {
                onCourseThumbnailUrl(url);
                toast.success("Thumbnail uploaded.");
              }
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            {courseThumbnailUrl ? (
              <img src={courseThumbnailUrl} alt="Course thumbnail" className="w-28 h-20 object-cover rounded-xl ring-1 ring-border" />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={thumbUploading}
              onClick={() => thumbInputRef.current?.click()}
            >
              {thumbUploading ? "Uploading…" : courseThumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
            </Button>
          </div>
        </div>
      ) : null}
      {fields.map(f => (
        <div key={f.key} className="space-y-2">
          <label className="text-sm font-semibold text-foreground">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea
              rows={3}
              className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              placeholder={f.placeholder}
              value={data[f.key as keyof typeof data]}
              onChange={e => onChange(f.key, e.target.value)}
            />
          ) : (
            <input
              className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              placeholder={f.placeholder}
              value={data[f.key as keyof typeof data]}
              onChange={e => onChange(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Step 2: Curriculum Builder ─────────────────────────────────── */
function StepCurriculum({ modules, setModules }: {
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
}) {
  const addModule = () => setModules(m => [...m, { id: uid(), title: "New Module", lessons: [], expanded: true }]);

  const addLesson = (moduleId: string, type: LessonType) => {
    setModules(m => m.map(mod => mod.id === moduleId ? {
      ...mod,
      lessons: [...mod.lessons, { id: uid(), type, title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, expanded: false }],
    } : mod));
  };

  const deleteModule = (id: string) => setModules(m => m.filter(mod => mod.id !== id));
  const deleteLesson = (modId: string, lesId: string) => setModules(m => m.map(mod =>
    mod.id === modId ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lesId) } : mod
  ));

  const toggleModule = (id: string) => setModules(m => m.map(mod => mod.id === id ? { ...mod, expanded: !mod.expanded } : mod));
  const updateModuleTitle = (id: string, title: string) => setModules(m => m.map(mod => mod.id === id ? { ...mod, title } : mod));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Build the skeleton first — Modules contain Lessons. No file uploads yet, just structure.
      </p>
      <AnimatePresence>
        {modules.map((mod, mi) => (
          <motion.div key={mod.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card overflow-hidden"
          >
            {/* Module Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-muted/30">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">M{mi + 1}</span>
              <input
                className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                value={mod.title}
                onChange={e => updateModuleTitle(mod.id, e.target.value)}
              />
              <button onClick={() => deleteModule(mod.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => toggleModule(mod.id)} className="text-muted-foreground"><ChevronDown className={cn("w-4 h-4 transition-transform", mod.expanded && "rotate-180")} /></button>
            </div>

            {/* Lessons */}
            <AnimatePresence>
              {mod.expanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-5 py-3 space-y-2">
                    {mod.lessons.map((les, li) => {
                      const Icon = LESSON_ICONS[les.type];
                      return (
                        <div key={les.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background ring-1 ring-black/5 dark:ring-white/10 border-0 group">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest w-12">{les.type}</span>
                          <input
                            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                            value={les.title}
                            onChange={e => setModules(prev => prev.map(m => m.id === mod.id ? {
                              ...m, lessons: m.lessons.map(l => l.id === les.id ? { ...l, title: e.target.value } : l)
                            } : m))}
                          />
                          <button onClick={() => deleteLesson(mod.id, les.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    })}
                    {/* Add Lesson */}
                    <div className="flex gap-2 pt-2">
                      {(["video", "reading", "quiz"] as LessonType[]).map(t => {
                        const Icon = LESSON_ICONS[t];
                        return (
                          <button key={t} onClick={() => addLesson(mod.id, t)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary hover:text-primary transition-colors">
                            <Icon className="w-3.5 h-3.5" />{t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      <button onClick={addModule}
        className="w-full border border-dashed border-border rounded-2xl py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Module
      </button>
    </div>
  );
}

/* ─── Step 3: Content Injection ───────────────────────────────────── */
function StepContent({ modules, setModules }: {
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingLessonRef = useRef<{ modId: string; lesId: string } | null>(null);

  const handlePickFile = (modId: string, lesId: string) => {
    pendingLessonRef.current = { modId, lesId };
    fileRef.current?.click();
  };

  const onLessonFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const ctx = pendingLessonRef.current;
    pendingLessonRef.current = null;
    if (!file || !ctx) return;
    const url = await uploadFileToCoursesBucket(file);
    if (!url) return;
    setModules((m: Module[]) =>
      m.map((mod: Module) =>
        mod.id === ctx.modId
          ? {
              ...mod,
              lessons: mod.lessons.map((l: Lesson) =>
                l.id === ctx.lesId ? { ...l, contentLabel: url, expanded: false } : l,
              ),
            }
          : mod,
      ),
    );
    toast.success("File uploaded successfully!");
  };

  const toggleLesson = (modId: string, lesId: string) => {
    setModules((m: Module[]) => m.map((mod: Module) => mod.id === modId ? {
      ...mod, lessons: mod.lessons.map((l: Lesson) => l.id === lesId ? { ...l, expanded: !l.expanded } : l)
    } : mod));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click any lesson to open its inline upload zone. No page navigation needed.
      </p>
      <input ref={fileRef} type="file" className="hidden" onChange={onLessonFileSelected} />
      {modules.map(mod => (
        <div key={mod.id} className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden">
          <div className="px-5 py-3 bg-muted/30 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{mod.title}</span>
          </div>
          <div className="divide-y divide-border">
            {mod.lessons.map(les => {
              const Icon = LESSON_ICONS[les.type];
              return (
                <div key={les.id}>
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => toggleLesson(mod.id, les.id)}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="flex-1 text-sm text-foreground">{les.title}</span>
                    {les.contentLabel ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />{les.contentLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />No content
                      </span>
                    )}
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", les.expanded && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {les.expanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 pt-2 flex gap-4">
                          <div
                            className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                            onClick={() => handlePickFile(mod.id, les.id)}
                          >
                            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                            <p className="text-sm font-semibold text-foreground">Upload {les.type === "video" ? "Video" : "File"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">MP4, PDF, DOCX (Max 2GB)</p>
                          </div>
                          {les.type === "video" && (
                            <div
                              className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                              onClick={() => toast.success("Transcript uploaded!")}
                            >
                              <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                              <p className="text-sm font-semibold text-foreground">Attach Transcript</p>
                              <p className="text-xs text-muted-foreground mt-0.5">TXT, VTT, PDF (Max 10MB)</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {mod.lessons.length === 0 && (
              <p className="text-sm text-muted-foreground px-5 py-4">No lessons added yet. Go back to Curriculum to add lessons.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Step 4: Assessment Builder ─────────────────────────────────── */
function StepAssessment({ questions, setQuestions }: {
  questions: QuizQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
}) {
  const addBlock = (type: QuizQuestion["type"]) => {
    setQuestions(q => [...q, {
      id: uid(), type, text: "",
      options: type === "mcq" ? ["Option A", "Option B", "Option C", "Option D"] : undefined,
    }]);
  };

  const typeLabel: Record<QuizQuestion["type"], string> = {
    mcq: "Multiple Choice", truefalse: "True / False", peer: "Peer Review Prompt",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Use pre-built quiz blocks. No logic needed from scratch.</p>

      {/* Block Templates */}
      <div className="grid grid-cols-3 gap-3">
        {(["mcq", "truefalse", "peer"] as const).map(t => (
          <button key={t} onClick={() => addBlock(t)}
            className="rounded-xl border border-dashed border-border p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors group">
            <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
            <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{typeLabel[t]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{typeLabel[q.type]}</span>
              <button onClick={() => setQuestions(prev => prev.filter(x => x.id !== q.id))} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={2}
              className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              placeholder={q.type === "peer" ? "Write your peer review prompt here..." : `Question ${i + 1}: What is...`}
              value={q.text}
              onChange={e => setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, text: e.target.value } : x))}
            />
            {q.type === "mcq" && (
              <div className="grid grid-cols-2 gap-2">
                {q.options?.map((opt, oi) => (
                  <input key={oi}
                    className="rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    value={opt}
                    onChange={e => setQuestions(prev => prev.map(x => x.id === q.id ? {
                      ...x, options: x.options?.map((o, idx) => idx === oi ? e.target.value : o)
                    } : x))}
                  />
                ))}
              </div>
            )}
            {q.type === "truefalse" && (
              <div className="flex gap-3">
                {["True", "False"].map(v => (
                  <span key={v} className="rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted px-4 py-2 text-sm font-medium text-foreground">{v}</span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step 5: Instance Settings ───────────────────────────────────── */
function StepSettings({ settings, onChange }: {
  settings: { title: string; status: "draft" | "published"; deadline: string; advancedOpen: boolean };
  onChange: (field: string, value: string | boolean) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <p className="text-sm text-muted-foreground">Critical settings first. Secondary options are tucked below.</p>

      {/* Critical Path */}
      <div className="space-y-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6">
        <h3 className="text-sm font-bold text-foreground">Publication</h3>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Course Title (Confirmation)</label>
          <input className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={settings.title} onChange={e => onChange("title", e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-foreground">Status:</span>
          <button
            onClick={() => onChange("status", settings.status === "draft" ? "published" : "draft")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors",
              settings.status === "published"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            {settings.status === "published" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {settings.status.charAt(0).toUpperCase() + settings.status.slice(1)}
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Enrollment Deadline</label>
          <input type="date" className="rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={settings.deadline} onChange={e => onChange("deadline", e.target.value)} />
        </div>
      </div>

      {/* Advanced Settings Accordion (Inverted Pyramid) */}
      <div className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
          onClick={() => onChange("advancedOpen", !settings.advancedOpen)}
        >
          <span className="text-sm font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4" /> Advanced Settings</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", settings.advancedOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {settings.advancedOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 pt-2 space-y-4 border-t border-border">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">SEO Title</label>
                  <input className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-2.5 text-sm focus:outline-none" placeholder="Optimized search title…" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Social Share Description</label>
                  <textarea rows={2} className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-2.5 text-sm resize-none focus:outline-none" placeholder="Description shown in social previews…" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Student Group Restrictions</label>
                  <input className="w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-4 py-2.5 text-sm focus:outline-none" placeholder="e.g. BoostHer, SheHive Premium only…" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Main Wizard ─────────────────────────────────────────────────── */
export default function CourseAuthoringWizard() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = useMemo(() => {
    const raw = searchParams.get("courseId") ?? searchParams.get("id");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [searchParams]);

  const [step, setStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  /** Course cover URL (same bucket path pattern as lesson uploads; wired when this wizard persists to API). */
  const [courseThumbnailUrl, setCourseThumbnailUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [identity, setIdentity] = useState({ title: "", description: "", subject: "", objectives: "" });
  const [modules, setModules] = useState<Module[]>([
    { id: uid(), title: "Module 1: Introduction", expanded: true, lessons: [] },
  ]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [settings, setSettings] = useState<{ title: string; status: "draft" | "published"; deadline: string; advancedOpen: boolean }>(
    { title: "", status: "draft", deadline: "", advancedOpen: false }
  );

  const handleIdentityChange = (field: string, value: string) => setIdentity(p => ({ ...p, [field]: value }));
  const handleSettingsChange = (field: string, value: string | boolean) =>
    setSettings(p => ({ ...p, [field]: value } as typeof p));

  useEffect(() => {
    let cancelled = false;
    if (!courseIdFromUrl) return;

    (async () => {
      try {
        const c: any = await api.getCourseById(courseIdFromUrl);
        if (!c || cancelled) return;

        setIdentity({
          title: String(c.title ?? ""),
          description: String(c.description ?? ""),
          subject: String(c.category ?? ""),
          objectives: Array.isArray(c.what_youll_learn) ? c.what_youll_learn.join("\n") : "",
        });
        setCourseThumbnailUrl(typeof c.image === "string" ? c.image : null);

        const cur = Array.isArray(c.curriculum) ? c.curriculum : [];
        const mapped: Module[] = cur.map((m: any) => {
          const items = Array.isArray(m?.items) ? m.items : [];
          return {
            id: uid(),
            title: String(m?.module ?? "Module"),
            expanded: false,
            lessons: items.map((it: any) => {
              const title = typeof it === "string" ? it : String(it?.title ?? "Lesson");
              const typeGuess: LessonType =
                (it?.type === "reading" || it?.type === "quiz" || it?.type === "video") ? it.type : "reading";
              const url =
                typeof it === "object"
                  ? (it?.content_url ?? it?.vimeo_url ?? it?.transcript_url ?? "")
                  : "";
              return {
                id: uid(),
                type: typeGuess,
                title,
                expanded: false,
                contentLabel: typeof url === "string" && url.length > 0 ? url : undefined,
              };
            }),
          };
        });
        if (mapped.length > 0) setModules(mapped);

        setSettings((prev) => ({
          ...prev,
          title: String(c.title ?? prev.title),
          status: (c.status === "published" ? "published" : "draft"),
        }));
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to load course for editing.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseIdFromUrl]);

  const canGoNext = step < STEP_LABELS.length - 1;
  const canGoBack = step > 0;

  const handlePublish = async () => {
    if (!appUser?.id) {
      toast.error("Please log in to publish.");
      return;
    }
    const title = (settings.title || identity.title || "").trim();
    if (!title) {
      toast.error("Course title is required.");
      setStep(0);
      return;
    }

    // Ensure all lessons have content URLs before publishing.
    const missingContent = modules.flatMap((m) => m.lessons).some((l) => !l.contentLabel);
    if (missingContent) {
      toast.error("Some lessons are missing uploaded content. Please upload all lesson files before publishing.");
      setStep(2);
      return;
    }

    const curriculum = modules.map((m) => ({
      module: m.title,
      lessons: m.lessons.length,
      duration: "",
      items: m.lessons.map((l) => {
        const url = l.contentLabel ?? "";
        return {
          title: l.title,
          type: l.type,
          duration: "",
          // Compatibility with existing course viewer patterns in this repo:
          vimeo_url: l.type === "video" ? url : "",
          transcript_url: l.type === "reading" ? url : "",
          content_url: url,
        };
      }),
    }));

    const payload: Record<string, unknown> = {
      title,
      subtitle: "",
      description: identity.description?.trim() ?? "",
      instructor: appUser?.name ?? "Instructor",
      instructor_id: appUser.id,
      category: identity.subject?.trim() ?? "",
      level: "Beginner",
      price: 0,
      original_price: null,
      image: courseThumbnailUrl,
      badge: "New",
      bestseller: false,
      language: "English",
      last_updated: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      status: "published",
      what_youll_learn: String(identity.objectives ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      curriculum,
      reviews: [],
    };

    setSaving(true);
    try {
      if (courseIdFromUrl) {
        await api.updateCourse(courseIdFromUrl, payload);
      } else {
        await api.createCourse(payload);
      }

      toast.success(`"${title}" published successfully!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.base });
      navigate("/dashboard/courses", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to publish course.");
    } finally {
      setSaving(false);
    }
  };

  const stepStatus = (): "draft" | "missing" | "ready" => {
    if (step === 4 && settings.status === "published") return "ready";
    if (step === 2 && modules.flatMap(m => m.lessons).some(l => !l.contentLabel)) return "missing";
    return "draft";
  };

  const stepComponents = [
    <StepIdentity
      data={identity}
      onChange={handleIdentityChange}
      courseThumbnailUrl={courseThumbnailUrl}
      onCourseThumbnailUrl={setCourseThumbnailUrl}
    />,
    <StepCurriculum modules={modules} setModules={setModules} />,
    <StepContent modules={modules} setModules={setModules} />,
    <StepAssessment questions={questions} setQuestions={setQuestions} />,
    <StepSettings settings={settings} onChange={handleSettingsChange} />,
  ];

  return (
    <div className="space-y-0">
      {/* Wizard Header */}
      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-sm mb-6 overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground text-base">Course Authoring Wizard</h2>
              <StatusDot status={stepStatus()} />
            </div>
          </div>
          <button
            onClick={() => setPreviewMode(p => !p)}
            className={cn(
              "flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-colors",
              previewMode ? "bg-primary text-white border-primary" : "text-muted-foreground border-border hover:border-primary hover:text-primary"
            )}
          >
            <Eye className="w-3.5 h-3.5" />{previewMode ? "Exit Preview" : "Student View"}
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex">
          {STEP_LABELS.map((label, i) => (
            <button key={label} onClick={() => setStep(i)}
              className={cn(
                "flex-1 py-3 text-center text-[11px] font-bold transition-colors border-b-2",
                i === step
                  ? "border-primary text-primary bg-primary/5"
                  : i < step
                  ? "border-emerald-400 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}>
              <span className={cn("rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold",
                i < step ? "bg-emerald-100 text-emerald-700" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-sm p-6 min-h-[400px]">
        {previewMode ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Eye className="w-12 h-12 opacity-30" />
            <p className="text-sm font-semibold">Student Preview Mode</p>
            <p className="text-xs max-w-xs text-center">This is where the live course preview will render. Toggle off to continue editing.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              {stepComponents[step]}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" size="sm" className="rounded-xl"
          disabled={!canGoBack} onClick={() => setStep(s => s - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <span className="text-xs text-muted-foreground font-medium">Step {step + 1} of {STEP_LABELS.length}</span>

        {step === STEP_LABELS.length - 1 ? (
          <Button size="sm" className="bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2"
            onClick={handlePublish}
            disabled={saving}
          >
            <Zap className="w-4 h-4" /> Publish Course
          </Button>
        ) : (
          <Button size="sm" className="bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2"
            onClick={() => setStep(s => s + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
