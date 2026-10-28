import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, BadgeCheck, Share2, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Card, Empty, Skeleton } from "@kit";
import { fmtDate } from "@kit";
import { hapticSuccess } from "../lib/haptics";
import Sheet from "../components/Sheet";

/**
 * CERTIFICATES — every certificate the learner earned, with a tamper-proof
 * credential ID. Tap to view; Share fires the native Android share sheet with
 * the public verification URL (the /verify/:credentialId route on the web app).
 */
export default function Certificates() {
  const { appUser } = useAuth();
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: certs, isLoading } = useQuery({
    queryKey: ["certificates", "mobile-screen", appUser?.id],
    queryFn: () => api.getCertificates(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const open = (certs ?? []).find((c) => c.id === openId);

  const verifyUrl = (c: any) =>
    `https://sheleadsafrica.org/verify/${c.credential_id ?? c.credentialId ?? ""}`;

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
