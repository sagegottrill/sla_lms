import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, BadgeCheck, ClipboardList, Lock, Share2, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { getCertificateVerifyUrl } from "@/lib/certificateUrls";
import { Btn, Card, Empty, Skeleton } from "@kit";
import { motion } from "@kit";
import { fmtDate } from "@kit";
import { hapticSuccess } from "../lib/haptics";

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
import Sheet from "../components/Sheet";

/**
 * CERTIFICATES — every certificate the learner earned, with a tamper-proof
 * credential ID. Tap to view; Share fires the native Android share sheet with
 * the public verification URL (the /verify/:credentialId route on the web app).
 */
export default function Certificates() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: certs, isLoading } = useQuery({
    queryKey: ["certificates", "mobile", appUser?.id],
    queryFn: () => api.getCertificates(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { data: enrollments } = useQuery({
    queryKey: ["enrollments", "mobile-certs", appUser?.id],
    queryFn: () => api.getUserEnrollments(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  /* Locked: finished (or 100%) but no credential issued — the required
     post-assessment is the usual reason. */
  const locked = (enrollments ?? [])
    .filter((e: any) => {
      const hasCert = (certs ?? []).some((c: any) => Number(c.course_id) === Number(e.course_id));
      const finished = Number(e.progress ?? 0) >= 100 || e.status === "completed";
      return finished && !hasCert && Number(e.course_id) > 0;
    })
    .map((e: any) => ({
      courseId: Number(e.course_id),
      title: e.courses?.title ?? "Course",
      assessmentUrl: e.courses?.post_assessment_url ? String(e.courses.post_assessment_url) : "",
      assessmentTitle: String(e.courses?.post_assessment_title ?? "Post-Assessment"),
    }));

  const open = (certs ?? []).find((c) => c.id === openId);

  const verifyUrl = (c: any) =>
    getCertificateVerifyUrl(String(c.credential_id ?? c.credentialId ?? ""));

  const share = async (c: any) => {
    const text = `🎓 I just earned the "${c.course_title ?? c.certificate_name ?? "SLA"}" certificate from She Leads Africa! Verify it: ${verifyUrl(c)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My SLA Certificate", text, url: verifyUrl(c) });
        void hapticSuccess();
        toast.success("Shared! 🎉");
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard — paste it anywhere.");
      }
    } catch { /* user dismissed the sheet */ }
  };

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-gradient-to-br from-[#271066] to-primary px-5 pb-10 pt-8 text-white">
        <h1 className="font-display text-2xl font-bold">Certificates</h1>
        <p className="mt-1 text-sm text-white/80">Verifiable proof of the work you've put in.</p>
      </div>

      <div className="-mt-6 space-y-3 px-4 pb-4">
        {locked.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <p className="flex items-center gap-1.5 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
              <Lock className="h-3.5 w-3.5" /> Locked — finish to earn
            </p>
            {locked.map((l) => (
              <motion.div key={l.courseId} whileTap={{ scale: 0.98 }} transition={{ ease: [...EASE_PREMIUM] }}>
                <Card
                  onClick={() => navigate(`/course/${l.courseId}/learn`)}
                  className="flex items-center gap-3 border-0 bg-amber-400/5 p-4 ring-1 ring-amber-400/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15">
                    {l.assessmentUrl ? (
                      <ClipboardList className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Award className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {l.assessmentUrl
                        ? `Complete the ${l.assessmentTitle} to unlock your certificate.`
                        : "Tap the course and re-save any lesson to refresh your certificate."}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-amber-400/20 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                    {l.assessmentUrl ? "Assessment" : "Resume"}
                  </span>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <Card key={i} className="p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-2 h-3 w-1/2" /></Card>)}
          </div>
        ) : (certs ?? []).length === 0 ? (
          <Card>
            <Empty
              icon={Award}
              title="No certificates yet"
              sub="Complete 100% of a course to earn your first verifiable certificate."
            />
          </Card>
        ) : (
          (certs ?? []).map((c) => (
            <Card key={c.id} onClick={() => setOpenId(c.id)} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.course_title ?? c.certificate_name ?? "Certificate"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Issued {fmtDate(c.completed_at ?? c.issued_at)}</p>
                  <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/70">ID: {c.credential_id ?? "—"}</p>
                </div>
                <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              </div>
            </Card>
          ))
        )}
      </div>

      {open && (
        <Sheet onClose={() => setOpenId(null)}>
          <div className="bg-gradient-to-b from-[#271066] to-primary px-6 pb-20 pt-8 text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
              <Award className="h-9 w-9" />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">She Leads Africa</p>
            <p className="mt-2 font-display text-xl font-bold leading-snug">{open.course_title ?? open.certificate_name}</p>
            <p className="mt-2 text-sm text-white/85">awarded to</p>
            <p className="font-display text-base font-bold">{appUser?.name}</p>
            <p className="mt-3 text-xs text-white/70">{fmtDate(open.completed_at ?? open.issued_at)}</p>
          </div>
          <div className="rounded-t-3xl -mt-12 bg-card p-5">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="min-w-0 flex-1 truncate text-[11px] text-emerald-800">
                Anyone can verify this… <span className="font-mono">{open.credential_id}</span>
              </p>
            </div>
            <Btn size="lg" className="mt-4 w-full rounded-2xl" onClick={() => void share(open)}>
              <Share2 className="h-5 w-5" /> Share on socials
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}
