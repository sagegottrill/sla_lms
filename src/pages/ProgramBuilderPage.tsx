import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, BookOpen, Calendar, Users, ArrowLeft, ChevronRight, Trash2, GripVertical, Upload, Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCourses, useCreateProgramMutation, useUpdateProgramMutation, useProgram } from "@/hooks/useQueries";
import { supabase } from "@/lib/supabase";
import CertificateDesignEditor from "@/components/admin/CertificateDesignEditor";
import {
  DEFAULT_CERTIFICATE_CONFIG,
  mergeCertificateConfig,
  type CertificateConfig,
} from "@/lib/certificateConfig";

const CATEGORIES = ["Data Science", "Technology", "Business", "Leadership", "Finance", "Marketing", "Health", "Design", "Administrative and Business Support"];
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"] as const;

type Partner = { id: number; name: string; logoUrl: string };
type Course = { id: number; title: string; category: string; duration: string };

export default function ProgramBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdRaw = searchParams.get("edit");
  const editId = editIdRaw ? Number(editIdRaw) : 0;
  const isEdit = Number.isFinite(editId) && editId > 0;

  const createProgram = useCreateProgramMutation();
  const updateProgram = useUpdateProgramMutation();
  const { data: programData, isLoading: loadingProgram } = useProgram(isEdit ? editId : 0);
  const { data: allCoursesData, isLoading: coursesLoading } = useCourses({ publishedOnly: false });

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
  }, [editId]);

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All Levels");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [cohort, setCohort] = useState("");
  const [image, setImage] = useState("");
  const [highlights, setHighlights] = useState<string[]>(["Live mentoring sessions", "Certificate from SLA"]);
  const [certificateConfig, setCertificateConfig] = useState<CertificateConfig>({
    ...DEFAULT_CERTIFICATE_CONFIG,
  });

  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextPartnerId = useRef(1);
  const [savedNewProgramId, setSavedNewProgramId] = useState<number | null>(null);
  const programIdForAssets = isEdit ? editId : savedNewProgramId;

  const allCourses = useMemo(
    () => (Array.isArray(allCoursesData) ? (allCoursesData as Array<Course & { status?: string }>) : []),
    [allCoursesData],
  );
  const availableCourses = useMemo(
    () => allCourses.filter((c) => c.status !== "archived"),
    [allCourses],
  );
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  useEffect(() => {
    if (!isEdit || !programData || hydrated) return;
    const p = programData as Record<string, unknown>;
    setTitle(String(p.title ?? ""));
    setTagline(String((p as any).tagline ?? ""));
    setDescription(String(p.description ?? ""));
    setCategory(typeof p.category === "string" && p.category ? p.category : CATEGORIES[0]);
    setLevel(
      typeof (p as any).level === "string" && (p as any).level
        ? String((p as any).level)
        : "All Levels",
    );
    setDuration(String(p.duration ?? ""));
    setStartDate(String(p.start_date ?? "").slice(0, 10));
    setDeadline(String(p.deadline ?? "").slice(0, 10));
    setApplicationDeadline(
      String((p as any).applicationDeadline ?? (p as any).application_deadline ?? "").slice(0, 10),
    );
    setCapacity(String(p.capacity ?? ""));
    setPrice(p.price != null ? String(p.price) : "");
    setOriginalPrice(p.original_price != null ? String(p.original_price) : "");
    setCohort(String(p.tag ?? (p as { cohort?: string }).cohort ?? ""));
    setImage(String(p.image ?? ""));
    const hl = p.highlights;
    if (Array.isArray(hl) && hl.length > 0) setHighlights(hl.map(String));
    setCertificateConfig(
      mergeCertificateConfig((p as any).certificateConfig ?? (p as any).certificate_config),
    );
    const rawPartners = (p as any).partners;
    if (Array.isArray(rawPartners)) {
      const mapped = rawPartners
        .map((x: any, idx: number) => ({
          id: idx + 1,
          name: String(x?.name ?? x ?? ""),
          logoUrl: String(x?.logo_url ?? x?.logoUrl ?? ""),
        }))
        .filter((x: Partner) => x.name.length > 0);
      setPartners(mapped);
      nextPartnerId.current = mapped.length > 0 ? Math.max(...mapped.map((x) => x.id)) + 1 : 1;
    }
    setHydrated(true);
  }, [isEdit, programData, hydrated]);

  useEffect(() => {
    if (!isEdit || !programData || !hydrated || allCourses.length === 0) return;
    const p = programData as { courses?: string[] };
    const titles = Array.isArray(p.courses) ? p.courses : [];
    const ids = titles
      .map((t) => allCourses.find((c) => c.title === t)?.id)
      .filter((id): id is number => typeof id === "number");
    setSelectedCourses(ids);
  }, [isEdit, programData, hydrated, allCourses]);

  const toggleCourse = (id: number) =>
    setSelectedCourses((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const addPartner = () => {
    if (!newPartnerName.trim()) return;
    const newPartner: Partner = {
      id: nextPartnerId.current++,
      name: newPartnerName.trim(),
      logoUrl: "",
    };
    setPartners((prev) => [...prev, newPartner]);
    setNewPartnerName("");
  };

  const removePartner = (id: number) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogoUpload = async (partnerId: number, file: File) => {
    if (!programIdForAssets) {
      toast.error("Save the program once first so it has an ID, then upload partner logos.");
      return;
    }
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `program-partners/${programIdForAssets}/${partnerId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("courses").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("courses").getPublicUrl(path);
      setPartners((prev) => prev.map((p) => (p.id === partnerId ? { ...p, logoUrl: data.publicUrl } : p)));
      toast.success("Logo uploaded.");
    } catch (e: any) {
      toast.error(e?.message ?? "Logo upload failed.");
    }
  };

  const buildPayload = (status: "upcoming" | "active") => {
    const selectedCourseTitles = availableCourses.filter((c) => selectedCourses.includes(c.id)).map((c) => c.title);
    return {
      title: title.trim(),
      tagline: tagline.trim() || null,
      description: description.trim(),
      category,
      level: level || null,
      duration: duration.trim() || "TBD",
      start_date: startDate || null,
      deadline: deadline || null,
      application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
      capacity: Number(capacity) || 100,
      price: Number(price) || 0,
      original_price: originalPrice.trim() ? Number(originalPrice) : null,
      image: image.trim() || null,
      highlights: highlights.filter(Boolean),
      courses: selectedCourseTitles,
      course_count: selectedCourses.length,
      partners: partners
        .filter((p) => p.name.trim().length > 0)
        .map((p) => ({ name: p.name.trim(), logo_url: p.logoUrl || null })),
      status,
      tag: cohort.trim() || null,
      certificate_config: certificateConfig,
    };
  };

  const handleSave = async (status: "upcoming" | "active") => {
    if (!title.trim()) {
      toast.error("Program title is required.");
      setStep(1);
      return;
    }
    setSaving(true);
    const payload = buildPayload(status);

    if (isEdit) {
      updateProgram.mutate(
        { id: editId, updates: payload },
        {
          onSuccess: () => {
            toast.success(status === "active" ? "Program updated & live." : "Draft saved.");
            if (status === "active") setTimeout(() => navigate(`/dashboard/programs/${editId}`), 1200);
            else setTimeout(() => navigate("/dashboard/programs"), 800);
          },
          onError: (err: unknown) =>
            toast.error(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`),
          onSettled: () => setSaving(false),
        },
      );
      return;
    }

    createProgram.mutate(payload, {
      onSuccess: (data: unknown) => {
        const row = data as { id?: number } | null | undefined;
        if (row?.id != null) {
          const nid = Number(row.id);
          if (Number.isFinite(nid)) setSavedNewProgramId(nid);
        }
        toast.success(status === "active" ? "Program launched!" : "Draft saved.");
        if (status === "active") setTimeout(() => navigate("/dashboard/programs"), 1500);
      },
      onError: (err: unknown) => toast.error(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`),
      onSettled: () => setSaving(false),
    });
  };

  const stepLabels = ["Program Details", "Partners & Sponsors", "Select Courses", "Preview & Launch"];

  if (isEdit && loadingProgram) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading program…</p>
      </div>
    );
  }

  if (isEdit && !loadingProgram && !programData) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-foreground font-medium">Program not found.</p>
        <Link to="/dashboard/programs" className="text-primary text-sm mt-4 inline-block">
          Back to programs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/programs"
          className="w-9 h-9 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{isEdit ? "Edit program" : "Create Program"}</h1>
          <p className="text-muted-foreground text-sm">Bundle courses into a structured learning track · set pricing on step 1</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {stepLabels.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((i + 1) as 1 | 2 | 3 | 4)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                step === i + 1
                  ? "gradient-card text-primary-foreground shadow-brand-sm"
                  : step > i + 1
                    ? "bg-accent text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-current">
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-sm border-0 p-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Program Details</h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Program Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Women in Data Science 2026"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tagline</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Build job-ready skills in 12 weeks"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Shown under the title on the public program card.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the program goals and outcomes..."
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Duration label</label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 12 weeks"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
                >
                  {LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
              <div />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Enrollment deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Application deadline (countdown)</label>
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Price (NGN)</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 = show as free on catalog"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Original price (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Strike-through on landing"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Max participants</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Hero image URL</label>
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cohort label</label>
              <input
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="e.g. Cohort 3 · Spring 2026"
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Shown on program cards (stored as tag).</p>
            </div>
            <Button onClick={() => setStep(2)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">
              Continue →
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Partners & Sponsors</h2>
              <p className="text-sm text-muted-foreground">Optional — add partner or sponsor logos for the public listing.</p>
            </div>

            <div className="flex gap-2">
              <input
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPartner()}
                placeholder="Enter partner/sponsor name..."
                className="flex-1 px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button onClick={addPartner} size="sm" className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 px-4 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            {partners.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Added Partners ({partners.length})</p>
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/30"
                  >
                    <div className="relative group">
                      {partner.logoUrl ? (
                        <div className="w-14 h-14 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden bg-white flex items-center justify-center">
                          <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-contain p-1" />
                        </div>
                      ) : (
                        <button
                          type="button"
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
                          type="button"
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

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{partner.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {partner.logoUrl ? "Logo uploaded ✓" : "Click to upload logo"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePartner(partner.id)}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                <Image className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No partners added yet</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                const partnerId = Number(fileInputRef.current?.getAttribute("data-partner-id"));
                if (file && partnerId) handleLogoUpload(partnerId, file);
                e.target.value = "";
              }}
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                ← Back
              </Button>
              <Button onClick={() => setStep(3)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">
                {partners.length === 0 ? "Skip →" : "Continue →"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Select Courses</h2>
              <p className="text-sm text-muted-foreground">
                Includes published and draft courses (not archived). {coursesLoading ? "Loading catalog…" : `${availableCourses.length} available.`}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Selected ({selectedCourses.length})</p>
              <div className="space-y-2">
                {availableCourses
                  .filter((c) => selectedCourses.includes(c.id))
                  .map((course, i) => (
                    <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-accent">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                      <span className="w-5 h-5 rounded-full gradient-card flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.category} · {course.duration} ·{" "}
                          <span className="capitalize">{(course as { status?: string }).status ?? "—"}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCourse(course.id)}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Available courses</p>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {availableCourses
                  .filter((c) => !selectedCourses.includes(c.id))
                  .map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 hover:border-primary/30 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{(course as { status?: string }).status ?? "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCourse(course.id)}
                        className="text-xs px-3 py-1.5 rounded-lg gradient-card text-primary-foreground hover:opacity-90 font-medium"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                ← Back
              </Button>
              <Button onClick={() => setStep(4)} className="gradient-card text-primary-foreground rounded-xl hover:opacity-90">
                Preview →
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Preview & Launch</h2>
            <div className="bg-muted/50 rounded-xl p-6 space-y-3">
              <h3 className="font-display font-bold text-foreground text-lg">{title || "Untitled Program"}</h3>
              {cohort && <p className="text-xs font-semibold text-primary uppercase tracking-wider">{cohort}</p>}
              <p className="text-sm text-muted-foreground">{description || "No description."}</p>
              <p className="text-sm font-semibold text-foreground">
                {Number(price) > 0 ? `₦${Number(price).toLocaleString()}${originalPrice && Number(originalPrice) > Number(price) ? ` · was ₦${Number(originalPrice).toLocaleString()}` : ""}` : "Free"}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {selectedCourses.length} courses
                </span>
                <span className="bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Deadline: {deadline || "Not set"}
                </span>
                <span className="bg-accent text-primary px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Max {capacity || "∞"} participants
                </span>
              </div>

              {partners.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">Partners & Sponsors</p>
                  <div className="flex flex-wrap gap-3">
                    {partners.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 bg-card shadow-sm border-0 rounded-xl px-3 py-2">
                        {p.logoUrl ? (
                          <img src={p.logoUrl} alt={p.name} className="w-6 h-6 object-contain rounded" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            {(p.name ?? "").charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <CertificateDesignEditor
              value={certificateConfig}
              onChange={setCertificateConfig}
              assetOwnerId={programIdForAssets}
              previewCourseTitle={title.trim() || "Sample Program"}
            />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">
                ← Back
              </Button>
              <Button variant="outline" onClick={() => handleSave("upcoming")} disabled={saving} className="rounded-xl gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save as Draft
              </Button>
              <Button
                onClick={() => handleSave("active")}
                disabled={saving}
                className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                {saving ? "Saving…" : isEdit ? "Save & publish" : "Launch Program"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
