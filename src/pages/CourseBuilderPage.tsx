import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Video,
  FileText, HelpCircle, ArrowLeft, Save, CheckCircle2, Loader2,
  GripVertical, Link2, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCourse, useCreateCourseMutation, useUpdateCourseMutation } from "@/hooks/useQueries";
import { useUIStore } from "@/store/useUIStore";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Data Science", "Technology", "Business", "Leadership", "Finance", "Marketing", "Health", "Design", "Career Development"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const BADGES = ["New", "Bestseller", "Hot", "Popular", "Top Rated", "Free"];

type LessonType = "video" | "text" | "quiz";
type Lesson = { id: number; title: string; type: LessonType; vimeo_url?: string; duration?: string; transcript_url?: string };
type Module = { id: number; title: string; lessons: Lesson[]; open: boolean };

const lessonIcons: Record<LessonType, React.ElementType> = { video: Video, text: FileText, quiz: HelpCircle };

const inputCls = "w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

export default function CourseBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdRaw = searchParams.get("edit");
  const editId = editIdRaw ? Number(editIdRaw) : 0;
  const isEdit = Number.isFinite(editId) && editId > 0;

  const createCourse = useCreateCourseMutation();
  const updateCourse = useUpdateCourseMutation();
  const { isTheaterMode, toggleTheaterMode } = useUIStore();

  const { data: existingCourse, isLoading: loadingExisting } = useCourse(isEdit ? editId : 0);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  /** After a new course is first saved, we get a row `id` for course-scoped storage paths. */
  const [savedNewCourseId, setSavedNewCourseId] = useState<number | null>(null);
  const thumbnailCourseId = isEdit && editId > 0 ? editId : savedNewCourseId;

  // Step 1 — Course Info
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [badge, setBadge] = useState(BADGES[0]);
  const [language, setLanguage] = useState("English");
  const [image, setImage] = useState("");
  const [instructor, setInstructor] = useState("");
  const [instructorTitle, setInstructorTitle] = useState("");
  const [instructorBio, setInstructorBio] = useState("");
  const [instructorAvatar, setInstructorAvatar] = useState("");

  // Step 2 — Curriculum
  const [modules, setModules] = useState<Module[]>([
    { id: 1, title: "Module 1: Introduction", open: true, lessons: [{ id: 1, title: "Welcome to the Course", type: "video", vimeo_url: "" }] },
  ]);
  const [whatYoullLearn, setWhatYoullLearn] = useState<string[]>(["", "", ""]);

  // Hydrate builder in edit mode.
  useEffect(() => {
    if (!isEdit || !existingCourse) return;
    const c = existingCourse as any;
    setTitle(String(c.title ?? ""));
    setSubtitle(String(c.subtitle ?? ""));
    setDescription(String(c.description ?? ""));
    setCategory(typeof c.category === "string" && c.category ? c.category : CATEGORIES[0]);
    setLevel(typeof c.level === "string" && c.level ? c.level : LEVELS[0]);
    const p = typeof c.price === "number" ? c.price : Number(c.price ?? 0);
    setIsFree(p === 0);
    setPrice(p ? String(p) : "");
    const op = typeof c.original_price === "number" ? c.original_price : Number(c.original_price ?? 0);
    setOriginalPrice(op ? String(op) : "");
    setBadge(typeof c.badge === "string" && c.badge ? c.badge : BADGES[0]);
    setLanguage(typeof c.language === "string" && c.language ? c.language : "English");
    setImage(String(c.image ?? ""));
    setInstructor(String(c.instructor ?? ""));
    setInstructorTitle(String(c.instructor_title ?? ""));
    setInstructorBio(String(c.instructor_bio ?? ""));
    setInstructorAvatar(String(c.instructor_avatar ?? ""));

    const wyl = c.what_youll_learn;
    if (Array.isArray(wyl)) {
      const arr = wyl.map((x: any) => String(x ?? "")).filter(Boolean);
      setWhatYoullLearn(arr.length ? arr : ["", "", ""]);
    }
    const cur = c.curriculum;
    if (Array.isArray(cur)) {
      // Map stored curriculum JSON into builder module/lesson state.
      const mappedModules: Module[] = cur.map((m: any, idx: number) => {
        const items = Array.isArray(m?.items) ? m.items : [];
        const lessons: Lesson[] = items.map((it: any, li: number) => ({
          id: Date.now() + idx * 1000 + li,
          title: String(it?.title ?? ""),
          type: (it?.type === "text" || it?.type === "quiz" || it?.type === "video") ? it.type : "video",
          vimeo_url: typeof it?.vimeo_url === "string" ? it.vimeo_url : "",
          duration: typeof it?.duration === "string" ? it.duration : "",
          transcript_url: typeof it?.transcript_url === "string" ? it.transcript_url : "",
        }));
        return {
          id: Date.now() + idx,
          title: String(m?.module ?? `Module ${idx + 1}`),
          open: idx === 0,
          lessons,
        };
      });
      if (mappedModules.length) setModules(mappedModules);
    }
  }, [isEdit, existingCourse]);

  // Utils
  const toggleModule = (id: number) => setModules(m => m.map(mod => mod.id === id ? { ...mod, open: !mod.open } : mod));
  const addModule = () => setModules(m => [...m, { id: Date.now(), title: `Module ${m.length + 1}: Untitled`, open: true, lessons: [] }]);
  const removeModule = (id: number) => setModules(m => m.filter(mod => mod.id !== id));
  const updateModuleTitle = (id: number, t: string) => setModules(m => m.map(mod => mod.id === id ? { ...mod, title: t } : mod));
  const addLesson = (moduleId: number) => setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, lessons: [...mod.lessons, { id: Date.now(), title: "New Lesson", type: "video", vimeo_url: "" }] } : mod));
  const removeLesson = (moduleId: number, lessonId: number) => setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) } : mod));
  const updateLesson = (moduleId: number, lessonId: number, key: keyof Lesson, val: string) =>
    setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, lessons: mod.lessons.map(l => l.id === lessonId ? { ...l, [key]: val } : l) } : mod));
  const updateWYL = (i: number, val: string) => setWhatYoullLearn(arr => arr.map((v, idx) => idx === i ? val : v));
  const addWYL = () => setWhatYoullLearn(arr => [...arr, ""]);
  const removeWYL = (i: number) => setWhatYoullLearn(arr => arr.filter((_, idx) => idx !== i));

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination) return;

    // We only mutate local builder state (no DB sync during dragging).
    if (type === "module") {
      const items = Array.from(modules);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setModules(items);
      return;
    }

    if (type === "lesson") {
      const parseLessonsDroppableId = (droppableId: string) => {
        const prefix = "lessons-";
        if (!droppableId.startsWith(prefix)) return null;
        const maybeId = Number(droppableId.slice(prefix.length));
        return Number.isFinite(maybeId) ? maybeId : null;
      };

      const fromModuleId = parseLessonsDroppableId(source.droppableId);
      const toModuleId = parseLessonsDroppableId(destination.droppableId);
      if (fromModuleId == null || toModuleId == null) return;

      const updated = Array.from(modules);
      const fromModuleIndex = updated.findIndex((m) => m.id === fromModuleId);
      const toModuleIndex = updated.findIndex((m) => m.id === toModuleId);
      if (fromModuleIndex < 0 || toModuleIndex < 0) return;

      const fromModule = updated[fromModuleIndex];
      const toModule = updated[toModuleIndex];

      const fromLessons = Array.from(fromModule.lessons);
      const [movedLesson] = fromLessons.splice(source.index, 1);
      if (!movedLesson) return;

      if (fromModuleId === toModuleId) {
        fromLessons.splice(destination.index, 0, movedLesson);
        updated[fromModuleIndex] = { ...fromModule, lessons: fromLessons };
      } else {
        const toLessons = Array.from(toModule.lessons);
        toLessons.splice(destination.index, 0, movedLesson);
        updated[fromModuleIndex] = { ...fromModule, lessons: fromLessons };
        updated[toModuleIndex] = { ...toModule, lessons: toLessons };
      }

      setModules(updated);
    }
  };

  /** Thumbnail → Supabase Storage bucket `courses` (see supabase/storage_setup.sql). */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!thumbnailCourseId) {
      toast.error("Save your course as a draft or publish once first so it has an ID, then upload the thumbnail.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      // Browser-side image compression
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split(".").pop() ?? "jpg";
      const filePath = `thumbnails/${thumbnailCourseId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('courses')
        .upload(filePath, compressedFile, {
          upsert: true,
          contentType: compressedFile.type || file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('courses')
        .getPublicUrl(filePath);

      setImage(publicUrl);
      toast.success("Thumbnail compressed and uploaded!");
    } catch (err: any) {
      toast.error(`Image upload failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      setUploadingImage(false);
      // allow re-selecting the same file
      if (imageRef.current) imageRef.current.value = "";
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) { toast.error("Course title is required."); setStep(1); return; }
    if (!instructor.trim()) { toast.error("Instructor name is required."); setStep(1); return; }
    setSaving(true);

    const curriculum = modules.map(mod => ({
      module: mod.title,
      lessons: mod.lessons.length,
      duration: "",
      items: mod.lessons.map(l => ({
        title: l.title,
        type: l.type,
        duration: l.duration || "",
        vimeo_url: l.vimeo_url || "",
        transcript_url: l.transcript_url || ""
      })),
    }));

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      instructor: instructor.trim(),
      instructor_title: instructorTitle.trim(),
      instructor_bio: instructorBio.trim(),
      instructor_avatar: instructorAvatar.trim(),
      category,
      level,
      price: isFree ? 0 : Number(price) || 0,
      original_price: originalPrice ? Number(originalPrice) : null,
      image: image.trim() || null,
      badge: isFree ? "Free" : badge,
      bestseller: badge === "Bestseller",
      language,
      last_updated: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      status,
      what_youll_learn: whatYoullLearn.filter(Boolean),
      curriculum,
      reviews: [],
    };

    const mutate = isEdit
      ? updateCourse.mutate.bind(updateCourse, { id: editId, updates: payload })
      : createCourse.mutate.bind(createCourse, payload as any);

    mutate({
      onSuccess: (data: unknown) => {
        const row = data as { id?: number } | null | undefined;
        if (!isEdit && row?.id != null) {
          const nid = Number(row.id);
          if (Number.isFinite(nid)) setSavedNewCourseId(nid);
        }
        toast.success(status === "published" ? "Course published successfully!" : (isEdit ? "Course updated." : "Draft saved."));
        setPublished(status === "published");
        if (status === "published") setTimeout(() => navigate("/dashboard/courses"), 1500);
      },
      onError: (err: any) => toast.error(`Failed to save: ${err.message}`),
      onSettled: () => setSaving(false)
    } as any);
  };

  const steps = ["Course Info", "Curriculum", "Publish"];

  if (published) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-secondary" />
          </div>
        </motion.div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Course Published!</h1>
        <p className="text-muted-foreground mb-6">Your course is now live and visible to all students.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard/courses"><Button className="gradient-card text-primary-foreground rounded-xl">View Courses</Button></Link>
          <Button variant="outline" onClick={() => { setPublished(false); setStep(1); setTitle(""); setSubtitle(""); setInstructor(""); }} className="rounded-xl">Create Another</Button>
        </div>
      </div>
    );
  }

  if (isEdit && loadingExisting) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading course…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/courses" className="w-9 h-9 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{isEdit ? "Edit course" : "Create New Course"}</h1>
          <p className="text-muted-foreground text-sm">Share your expertise with learners across Africa</p>
        </div>
        <div className="ml-auto hidden sm:block">
          <Button variant="outline" onClick={toggleTheaterMode} className="rounded-xl h-9 gap-2 text-xs font-semibold">
            {isTheaterMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isTheaterMode ? "Exit Theater Mode" : "Focus Mode"}
          </Button>
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

      {/* ── STEP 1: Course Info ── */}
      {step === 1 && (
        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Basic Information</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Course Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Data Analytics with Python & Power BI" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Subtitle</label>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Short compelling description shown below the title" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Course Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Full description of the course content and goals..." className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Language</label>
                <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="English" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Badge</label>
                <select value={badge} onChange={e => setBadge(e.target.value)} className={inputCls}>
                  {BADGES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Pricing</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setIsFree(!isFree)} className={`w-11 h-6 rounded-full transition-colors ${isFree ? "bg-primary" : "bg-muted"} relative`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isFree ? "left-6" : "left-1"}`} />
                </div>
                <span className="text-sm text-foreground">This is a free course</span>
              </label>
              {!isFree && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Price (₦) *</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="75000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Original Price (₦) — for discount display</label>
                    <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="150000" className={inputCls} />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Course Thumbnail</h3>
              <div 
                onClick={() => imageRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${uploadingImage ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
              >
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {image ? (
                  <div className="relative inline-block">
                     <img src={image} alt="preview" className="w-full max-w-sm h-40 object-cover rounded-xl shadow-sm" />
                     {uploadingImage && <div className="absolute inset-0 bg-background/50 rounded-xl flex items-center justify-center backdrop-blur-sm"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                  </div>
                ) : (
                  <div className="py-4">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><Video className="w-5 h-5 text-muted-foreground" /></div>
                    )}
                    <p className="text-sm font-medium text-foreground">{uploadingImage ? "Compressing & Uploading..." : "Upload Thumbnail Image"}</p>
                    <p className="text-xs text-muted-foreground mt-1 text-balance">JPG, PNG, WebP will be automatically compressed client-side to save bandwidth.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Instructor Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Dr. Amara Osei" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title / Role</label>
                <input value={instructorTitle} onChange={e => setInstructorTitle(e.target.value)} placeholder="Lead Data Scientist, Google Africa" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Bio</label>
                <textarea value={instructorBio} onChange={e => setInstructorBio(e.target.value)} rows={3} placeholder="Short instructor bio..." className={inputCls + " resize-none"} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Avatar Image URL</label>
                <input value={instructorAvatar} onChange={e => setInstructorAvatar(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={() => setStep(2)} className="gradient-card text-primary-foreground rounded-xl px-8">Next: Curriculum →</Button>
          </div>
        </motion.div>
      )}

      {/* ── STEP 2: Curriculum ── */}
      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          {/* What You'll Learn */}
          <div className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">What Students Will Learn</h2>
              <Button variant="outline" size="sm" onClick={addWYL} className="rounded-xl gap-1 text-xs"><Plus className="w-3 h-3" /> Add Point</Button>
            </div>
            {whatYoullLearn.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item} onChange={e => updateWYL(i, e.target.value)} placeholder={`Learning outcome ${i + 1}...`} className={inputCls} />
                {whatYoullLearn.length > 1 && (
                  <button onClick={() => removeWYL(i)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>

          {/* Modules */}
          <div className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground">Course Curriculum</h2>
              <Button variant="outline" size="sm" onClick={addModule} className="rounded-xl gap-1 text-xs"><Plus className="w-3 h-3" /> Add Module</Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules" type="module">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {modules.map((mod, mi) => (
                      <Draggable key={mod.id.toString()} draggableId={mod.id.toString()} index={mi}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`ring-1 ring-black/5 dark:ring-white/10 border-0 rounded-xl overflow-hidden bg-background ${snapshot.isDragging ? 'shadow-xl ring-primary/40 rotate-[1deg] scale-[1.01]' : 'shadow-sm'}`}
                          >
                            <div className="flex items-center gap-2 p-3 bg-card border-b border-border/40">
                              <div {...provided.dragHandleProps} className="cursor-grab hover:text-primary p-1">
                                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                              </div>
                              <input
                                value={mod.title}
                                onChange={e => updateModuleTitle(mod.id, e.target.value)}
                                className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                                placeholder={`Module ${mi + 1}: Title`}
                              />
                              <button onClick={() => addLesson(mod.id)} className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline shrink-0 bg-primary/5 px-2 py-1 rounded-md">
                                <Plus className="w-3 h-3" /> Lesson
                              </button>
                              <button onClick={() => toggleModule(mod.id)} className="text-muted-foreground p-1 hover:bg-muted rounded-md transition-colors">
                                <ChevronDown className={`w-4 h-4 transition-transform ${mod.open ? "rotate-180" : ""}`} />
                              </button>
                              <button onClick={() => removeModule(mod.id)} className="text-muted-foreground hover:text-destructive p-1 hover:bg-destructive/10 rounded-md transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {mod.open && (
                              <Droppable droppableId={`lessons-${mod.id}`} type="lesson">
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`divide-y divide-border/50 bg-card transition-colors ${snapshot.isDraggingOver ? "ring-1 ring-primary/30" : ""}`}
                                  >
                                    {mod.lessons.length === 0 && (
                                      <p className="text-xs text-muted-foreground px-4 py-4 text-center">
                                        No lessons yet — click <span className="font-semibold text-primary">+ Lesson</span> above.
                                      </p>
                                    )}
                                    {mod.lessons.map((lesson, li) => {
                                      const Icon = lessonIcons[lesson.type];
                                      return (
                                        <Draggable
                                          key={lesson.id.toString()}
                                          draggableId={`lesson-${lesson.id}`}
                                          index={li}
                                        >
                                          {(provided, lessonSnapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`px-5 py-3 space-y-2 ${lessonSnapshot.isDragging ? "bg-primary/5" : ""}`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="cursor-grab hover:text-primary p-1 rounded-md shrink-0"
                                                >
                                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                </div>

                                                <div className="flex items-center gap-1">
                                                  {(["video", "text", "quiz"] as LessonType[]).map((t) => (
                                                    <button
                                                      key={t}
                                                      onClick={() => updateLesson(mod.id, lesson.id, "type", t)}
                                                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all ${
                                                        lesson.type === t
                                                          ? "bg-accent text-primary"
                                                          : "text-muted-foreground hover:bg-muted"
                                                      }`}
                                                    >
                                                      {t === "video" ? (
                                                        <Video className="w-3 h-3" />
                                                      ) : t === "text" ? (
                                                        <FileText className="w-3 h-3" />
                                                      ) : (
                                                        <HelpCircle className="w-3 h-3" />
                                                      )}
                                                      {t === "quiz" ? "exam" : t}
                                                    </button>
                                                  ))}
                                                </div>

                                                <input
                                                  value={lesson.title}
                                                  onChange={(e) => updateLesson(mod.id, lesson.id, "title", e.target.value)}
                                                  className="flex-1 text-sm text-foreground font-medium bg-transparent border-b border-transparent hover:border-border focus:outline-none focus:border-primary pb-0.5 px-1 transition-colors"
                                                  placeholder="Lesson title..."
                                                />

                                                <input
                                                  value={lesson.duration || ""}
                                                  onChange={(e) => updateLesson(mod.id, lesson.id, "duration", e.target.value)}
                                                  className="w-16 text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:outline-none focus:border-primary pb-0.5 px-1 text-center transition-colors"
                                                  placeholder="e.g. 12m"
                                                />

                                                <button
                                                  onClick={() => removeLesson(mod.id, lesson.id)}
                                                  className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/5 transition-colors"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>

                                              {lesson.type === "video" && (
                                                <div className="flex flex-col gap-2 pl-2 border-l-2 border-primary/20 ml-2 w-full mt-2">
                                                  <div className="flex items-center gap-2">
                                                    <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <input
                                                      value={lesson.vimeo_url || ""}
                                                      onChange={(e) => updateLesson(mod.id, lesson.id, "vimeo_url", e.target.value)}
                                                      placeholder="Vimeo or YouTube URL (or Vimeo numeric ID)"
                                                      className="flex-1 text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:outline-none focus:border-primary pb-0.5 transition-colors"
                                                    />
                                                  </div>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <input
                                                      value={lesson.transcript_url || ""}
                                                      onChange={(e) => updateLesson(mod.id, lesson.id, "transcript_url", e.target.value)}
                                                      placeholder="Transcript Document URL for accessibility..."
                                                      className="flex-1 text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:outline-none focus:border-primary pb-0.5 transition-colors"
                                                    />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}

                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Back</Button>
            <Button onClick={() => setStep(3)} className="gradient-card text-primary-foreground rounded-xl px-8">Next: Publish →</Button>
          </div>
        </motion.div>
      )}

      {/* ── STEP 3: Publish ── */}
      {step === 3 && (
        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border-0 p-6">
            <h2 className="font-semibold text-foreground mb-4">Course Summary</h2>
            <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              {[
                ["Title", title || "—"],
                ["Category", category],
                ["Level", level],
                ["Language", language],
                ["Price", isFree ? "Free" : `₦${Number(price).toLocaleString()}`],
                ["Badge", badge],
                ["Instructor", instructor || "—"],
                ["Modules", `${modules.length} modules, ${modules.reduce((a, m) => a + m.lessons.length, 0)} lessons`],
                ["Learning Points", whatYoullLearn.filter(Boolean).length.toString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground truncate max-w-[180px]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {image && (
            <div className="bg-card rounded-2xl shadow-sm border-0 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Course Thumbnail Preview</h3>
              <img src={image} alt="Course thumbnail" className="w-full max-w-sm h-40 object-cover rounded-xl" />
            </div>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">← Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving} className="rounded-xl gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
              </Button>
              <Button onClick={() => handleSave("published")} disabled={saving} className="gradient-card text-primary-foreground rounded-xl px-8 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? "Publishing..." : "Publish Course"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
