import { useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Users, BookOpen, Loader2, Mail, TrendingUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgram, useProgramParticipants } from "@/hooks/useQueries";
import { toast } from "sonner";

export default function ProgramCohortPage() {
  const { programId } = useParams();
  const id = Number(programId);
  const valid = Number.isFinite(id) && id > 0;

  const { data: program, isLoading: loadingProgram } = useProgram(valid ? id : 0);
  const { data: allParticipants = [], isLoading: loadingParts } = useProgramParticipants();

  const cohortParticipants = useMemo(() => {
    if (!valid) return [];
    return allParticipants.filter((p: { program_id?: number }) => p.program_id === id);
  }, [allParticipants, id, valid]);

  const cohortEmails = useMemo(() => {
    const set = new Set<string>();
    for (const p of cohortParticipants as { email?: string }[]) {
      const e = typeof p.email === "string" ? p.email.trim() : "";
      if (e.includes("@")) set.add(e);
    }
    return Array.from(set);
  }, [cohortParticipants]);

  const cohortMailto = useMemo(() => {
    if (cohortEmails.length === 0) return "";
    const title = (program as { title?: string } | undefined)?.title ?? "Program";
    const subject = encodeURIComponent(`[${title}] Update from She Leads Africa`);
    if (cohortEmails.length === 1) {
      return `mailto:${encodeURIComponent(cohortEmails[0])}?subject=${subject}`;
    }
    const [first, ...rest] = cohortEmails;
    const bcc = rest.map(encodeURIComponent).join(",");
    return `mailto:${encodeURIComponent(first)}?bcc=${bcc}&subject=${subject}`;
  }, [cohortEmails, program]);

  const copyCohortEmails = useCallback(() => {
    if (cohortEmails.length === 0) return;
    void navigator.clipboard.writeText(cohortEmails.join(", ")).then(
      () => toast.success("Emails copied to clipboard"),
      () => toast.error("Could not copy — select addresses manually"),
    );
  }, [cohortEmails]);

  if (!valid) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">Invalid program link.</p>
        <Link to="/dashboard/programs" className="text-primary text-sm font-semibold mt-4 inline-block">
          Back to programs
        </Link>
      </div>
    );
  }

  if (loadingProgram) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-foreground font-medium">Program not found.</p>
        <Link to="/dashboard/programs">
          <Button variant="outline" className="mt-4 rounded-xl">
            Back to programs
          </Button>
        </Link>
      </div>
    );
  }

  const courses = Array.isArray((program as { courses?: unknown }).courses)
    ? ((program as { courses: string[] }).courses ?? []).filter(Boolean)
    : [];
  const price = (program as { price?: number }).price;
  const status = (program as { status?: string }).status;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 border-b border-border/40 pb-6">
        <Link
          to="/dashboard/programs"
          className="w-10 h-10 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Cohort</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {(program as { title?: string }).title}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            <span className="capitalize">Status: {status ?? "—"}</span>
            <span>·</span>
            <span>
              Price:{" "}
              {typeof price === "number" && price > 0 ? `₦${price.toLocaleString()}` : "Free / not set"}
            </span>
            <span>·</span>
            <span>{courses.length} course{courses.length === 1 ? "" : "s"} in track</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {cohortMailto ? (
            <a href={cohortMailto}>
              <Button variant="outline" className="rounded-full text-xs gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email cohort
              </Button>
            </a>
          ) : null}
          {cohortEmails.length > 0 ? (
            <Button type="button" variant="outline" className="rounded-full text-xs gap-1.5" onClick={copyCohortEmails}>
              <Copy className="w-3.5 h-3.5" /> Copy emails
            </Button>
          ) : null}
          <Link to={`/dashboard/assessments/setup?programId=${id}`}>
            <Button variant="outline" className="rounded-full text-xs">
              Assessments
            </Button>
          </Link>
          <Link to={`/dashboard/skills?programId=${id}`}>
            <Button variant="outline" className="rounded-full text-xs">
              Open quizzes
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-5">
          <Users className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{cohortParticipants.length}</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Participants (enrolled)</p>
        </div>
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-5">
          <BookOpen className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{courses.length}</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Courses in cohort</p>
        </div>
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-5">
          <TrendingUp className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">
            {cohortParticipants.length
              ? Math.round(
                  cohortParticipants.reduce((a: number, p: { progress?: number }) => a + (p.progress ?? 0), 0) /
                    cohortParticipants.length
                )
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg. progress</p>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6">
          <h2 className="font-semibold text-foreground mb-3">Courses in this program</h2>
          <ul className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <li
                key={c}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/60 text-foreground font-medium"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Participants</h2>
          {loadingParts && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {cohortParticipants.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No participants linked to this cohort yet.
            <p className="mt-2 text-xs max-w-md mx-auto leading-relaxed">
              Learners appear here after they <strong className="text-foreground/90">apply while signed in</strong> (program enrollment) or when they
              are enrolled in courses whose <strong className="text-foreground/90">titles match</strong> the courses attached to this program in the
              builder.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-muted/20 border-b border-border/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Learner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {cohortParticipants.map((p: { id: string; name?: string; email?: string; progress?: number; status?: string }) => (
                  <tr key={p.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{p.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{p.email || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, p.progress ?? 0))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8">{Math.round(p.progress ?? 0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs capitalize text-muted-foreground">{p.status ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      {p.email ? (
                        <a href={`mailto:${encodeURIComponent(p.email)}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </Button>
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
