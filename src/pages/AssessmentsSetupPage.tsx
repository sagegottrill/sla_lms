import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, ClipboardList, BarChart3, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useCourses, usePrograms, useInstructorCourses } from "@/hooks/useQueries";

type Scope = "course" | "program" | "general";

type QDraft = { text: string; options: [string, string, string, string]; correct: number };

const ICONS = ["Target", "BarChart3", "Users", "Smartphone", "DollarSign", "Star", "Clock"] as const;

const emptyQuestion = (): QDraft => ({
  text: "",
  options: ["", "", "", ""],
  correct: 0,
});

export default function AssessmentsSetupPage() {
  const { appUser } = useAuth();
  const [searchParams] = useSearchParams();
  const role = appUser?.role;
  const canProgramOrGeneral = role === "admin" || role === "program_manager";

  const { data: allCourses = [], isLoading: loadingAllCourses } = useCourses({ publishedOnly: false });
  const { data: programs = [], isLoading: loadingPrograms } = usePrograms({ activeCatalog: false });
  const { data: myCourses = [], isLoading: loadingMyCourses } = useInstructorCourses(
    role === "instructor" ? appUser?.id : undefined
  );

  const courseOptions = useMemo(() => {
    if (role === "instructor") return myCourses;
    return allCourses;
  }, [role, myCourses, allCourses]);

  const [scope, setScope] = useState<Scope>(() => (canProgramOrGeneral ? "course" : "course"));
  const [courseId, setCourseId] = useState<number | "">("");
  const [programId, setProgramId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Course check");
  const [duration, setDuration] = useState("15 min");
  const [iconName, setIconName] = useState<string>("Target");
  const [questions, setQuestions] = useState<QDraft[]>([emptyQuestion(), emptyQuestion()]);

  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Array<Record<string, unknown>>>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    const p = searchParams.get("programId");
    const c = searchParams.get("courseId");
    if (p && canProgramOrGeneral) {
      const n = Number(p);
      if (Number.isFinite(n)) {
        setScope("program");
        setProgramId(n);
      }
    } else if (c) {
      const n = Number(c);
      if (Number.isFinite(n)) {
        setScope("course");
        setCourseId(n);
      }
    }
  }, [searchParams, canProgramOrGeneral]);

   const loadExisting = useCallback(async () => {
     setLoadingList(true);
     try {
       if (scope === "general" && canProgramOrGeneral) {
         const response = await api.getSkillsAssessments({ globalOnly: true });
         setExisting(response.success ? response.data || [] : []);
         return;
       }
       if (scope === "course" && courseId !== "") {
         const response = await api.getSkillsAssessments({ courseId: Number(courseId) });
         setExisting(response.success ? response.data || [] : []);
         return;
       }
       if (scope === "program" && programId !== "") {
         const response = await api.getSkillsAssessments({ programId: Number(programId) });
         setExisting(response.success ? response.data || [] : []);
         return;
       }
       setExisting([]);
     } finally {
       setLoadingList(false);
     }
   }, [scope, courseId, programId, canProgramOrGeneral]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const addQuestion = () => setQuestions((q) => [...q, emptyQuestion()]);
  const removeQuestion = (i: number) => setQuestions((q) => q.filter((_, idx) => idx !== i));
  const updateQ = (i: number, patch: Partial<QDraft>) =>
    setQuestions((q) => q.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Add a title for this assessment.");
      return;
    }
    if (scope === "course" && courseId === "") {
      toast.error("Select a course.");
      return;
    }
    if (scope === "program" && programId === "") {
      toast.error("Select a program.");
      return;
    }

    const built = questions
      .map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        correct_index: q.correct,
      }))
      .filter((q) => q.text.length > 0 && q.options.length >= 2);

    if (built.length === 0) {
      toast.error("Add at least one question with 2 or more answer options.");
      return;
    }

     setSaving(true);
     const response = await api.createAssessment({
       title: title.trim(),
       description: description.trim(),
       category: category.trim(),
       duration: duration.trim(),
       icon_name: iconName,
       course_id: scope === "course" ? Number(courseId) : null,
       program_id: scope === "program" ? Number(programId) : null,
       questions: built.map((q) => ({
         text: q.text,
         options: q.options,
         correct_index: Math.min(q.correct_index, q.options.length - 1),
       })),
     });
     setSaving(false);
     if (!response.success || !response.data) {
       toast.error("Could not save assessment. Check permissions and run the latest Supabase SQL migration if needed.");
       return;
     }
     toast.success("Assessment published.");
     setTitle("");
     setDescription("");
     setQuestions([emptyQuestion(), emptyQuestion()]);
     void loadExisting();
  };

   const handleDelete = async (assessmentId: string) => {
     if (!confirm("Delete this assessment and all its questions?")) return;
     const response = await api.deleteAssessment(assessmentId);
     if (!response.success || !response.data) {
       toast.error("Could not delete. You may not have permission.");
       return;
     }
     toast.success("Assessment removed.");
     void loadExisting();
   };

   const handleViewResults = async (assessmentId: string) => {
     setViewingResults(assessmentId);
     setLoadingResults(true);
     const response = await api.getAssessmentResults(assessmentId);
     setResults(response.success ? response.data || [] : []);
     setLoadingResults(false);
   };

  const coursesLoading = role === "instructor" ? loadingMyCourses : loadingAllCourses;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Assessments setup
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Attach quizzes to a course or program. Learners take them from Skills Assessment or the course page.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scope</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScope("course")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                scope === "course" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              Course
            </button>
            {canProgramOrGeneral && (
              <button
                type="button"
                onClick={() => setScope("program")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  scope === "program" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                Program
              </button>
            )}
            {canProgramOrGeneral && (
              <button
                type="button"
                onClick={() => setScope("general")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  scope === "general" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                General library
              </button>
            )}
          </div>
        </div>

        {scope === "course" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Course</label>
            <select
              value={courseId === "" ? "" : String(courseId)}
              onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
              disabled={coursesLoading}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
            >
              <option value="">{coursesLoading ? "Loading courses…" : "Select a course"}</option>
              {courseOptions.map((c: { id: number; title: string }) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {scope === "program" && canProgramOrGeneral && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Program</label>
            <select
              value={programId === "" ? "" : String(programId)}
              onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : "")}
              disabled={loadingPrograms}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
            >
              <option value="">{loadingPrograms ? "Loading programs…" : "Select a program"}</option>
              {programs.map((p: { id: number; title: string }) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Module 3 knowledge check"
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Category label</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Duration label</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="15 min"
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Icon</label>
            <select
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm"
            >
              {ICONS.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Questions</p>
            <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={addQuestion}>
              <Plus className="w-4 h-4" /> Add question
            </Button>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/20 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Question {i + 1}</span>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                value={q.text}
                onChange={(e) => updateQ(i, { text: e.target.value })}
                placeholder="Question text"
                className="w-full px-3 py-2 rounded-lg bg-background text-sm ring-1 ring-black/5 dark:ring-white/10 border-0"
              />
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, j) => (
                  <input
                    key={j}
                    value={opt}
                    onChange={(e) => {
                      const next = [...q.options] as [string, string, string, string];
                      next[j] = e.target.value;
                      updateQ(i, { options: next });
                    }}
                    placeholder={`Option ${j + 1}`}
                    className="w-full px-3 py-2 rounded-lg bg-background text-xs ring-1 ring-black/5 dark:ring-white/10 border-0"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Correct answer:</span>
                <select
                  value={q.correct}
                  onChange={(e) => updateQ(i, { correct: Number(e.target.value) })}
                  className="rounded-lg bg-background text-xs px-2 py-1 ring-1 ring-black/5 dark:ring-white/10 border-0"
                >
                  {[0, 1, 2, 3].map((j) => (
                    <option key={j} value={j}>
                      Option {j + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          disabled={saving}
          className="w-full sm:w-auto rounded-xl gap-2"
          onClick={() => void handleSubmit()}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Publishing…" : "Publish assessment"}
        </Button>
      </div>

      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6">
        <h2 className="font-semibold text-foreground mb-3">Existing for this scope</h2>
        {loadingList ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : existing.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assessments yet. Pick a course or program above (or general), then publish one.</p>
        ) : (
          <ul className="space-y-2">
            {existing.map((row) => (
              <li key={String(row.id)}>
                <div className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{String(row.title ?? "")}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(row.total_questions ?? 0)} questions ·{" "}
                      <Link to="/dashboard/skills" className="text-primary hover:underline">
                        preview in Skills
                      </Link>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-1 text-xs"
                      onClick={() => viewingResults === String(row.id) ? setViewingResults(null) : void handleViewResults(String(row.id))}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      {viewingResults === String(row.id) ? "Hide" : "Results"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg text-destructive border-destructive/30"
                      onClick={() => void handleDelete(String(row.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Results panel */}
                {viewingResults === String(row.id) && (
                  <div className="mt-2 mb-4 bg-muted/20 rounded-xl p-4">
                    {loadingResults ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading results…
                      </div>
                    ) : results.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students have taken this assessment yet.</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{results.length} submissions</span>
                          <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />
                            Avg: {Math.round(results.reduce((a, r) => a + (r.score / r.total) * 100, 0) / results.length)}%
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {results.map((r: any) => {
                            const pct = Math.round((r.score / r.total) * 100);
                            return (
                              <div key={r.id} className="flex items-center gap-3 text-xs">
                                <div className="w-28 truncate text-foreground font-medium">
                                  {r.profiles?.name ?? r.profiles?.email ?? "Student"}
                                </div>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-primary" : "bg-amber-500"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right font-semibold text-foreground">{pct}%</span>
                                <span className={`w-20 text-right text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  r.level_name === "Advanced"     ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                  r.level_name === "Intermediate" ? "bg-primary/10 text-primary" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {r.level_name ?? "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
