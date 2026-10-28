import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, GraduationCap, Sparkles, Users, X } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { Btn, Card, Empty, PageLoader, Skeleton, Tag } from "@kit";
import { fmtMoney, friendlyError, errorText } from "@kit";
import { hapticSuccess } from "../lib/haptics";
import Sheet from "../components/Sheet";

/**
 * PROGRAMS — SLA's flagship cohorts (income-progression tracks, certificates,
 * mentors). Browse, open a detail sheet, and enroll in one tap. Already-active
 * enrollments show a green "Active" chip with a Continue link into My Learning.
 */
export default function Programs() {
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  const { data: programs, isLoading } = useQuery({
    queryKey: [queryKeys.programs.base, "mobile"],
    queryFn: () => api.getPrograms({ activeCatalog: true }),
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { data: userPrograms } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile-programs", appUser?.id],
    queryFn: () => api.getUserPrograms(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const enrolledIds = new Set(
    (userPrograms ?? [])
      .map((up: any) => String(up?.programs?.id ?? up?.program_id ?? up?.id ?? ""))
  );

  const enroll = async (programId: number, title: string) => {
    if (!appUser) return;
    setEnrolling(programId);
    try {
      const res = await api.enrollUserInProgram(appUser.id, programId);
      if (!res.success) {
        toast.error(friendlyError(errorText(res.error)));
        return;
      }
      void hapticSuccess();
      toast.success(`You're in! “${title}” reserved for you 🎉`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setEnrolling(null);
    }
  };

  const open = (programs ?? []).find((p) => p.id === openId);

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-gradient-to-br from-primary to-[#271066] px-5 pb-10 pt-8 text-white">
        <h1 className="font-display text-2xl font-bold">Programs</h1>
        <p className="mt-1 text-sm text-white/80">Cohort-based tracks with mentorship, certificates and career support.</p>
      </div>

      <div className="-mt-6 space-y-3 px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="space-y-2 p-4"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </Card>
            ))}
          </div>
        ) : (programs ?? []).length === 0 ? (
          <Card><Empty icon={GraduationCap} title="No programs open right now" sub="New cohorts drop regularly — check back soon." /></Card>
        ) : (
          (programs ?? []).map((p, i) => {
            const active = enrolledIds.has(String(p.id));
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card onClick={() => setOpenId(p.id)} className="overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-32 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15">
                      <GraduationCap className="h-9 w-9 text-primary/60" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Tag color="violet">{p.category}</Tag>
                      {p.status && <Tag color={p.status === "active" ? "green" : "gray"}>{p.status}</Tag>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug">{p.title}</p>
                    {p.tagline && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.tagline}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-base font-bold">
                        {p.price > 0 ? fmtMoney(p.price) : "Free"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> {p.enrolled ?? 0}{p.capacity ? `/${p.capacity}` : ""} enrolled
                      </span>
                    </div>
                    {active && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> You're enrolled — find it in My Learning
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {open && (
        <Sheet onClose={() => setOpenId(null)}>
          {open.image && <img src={open.image} alt="" className="h-40 w-full object-cover" />}
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Tag color="violet">{open.category}</Tag>
              {open.level && <Tag color="gray">{open.level}</Tag>}
            </div>
            <h2 className="mt-2 font-display text-xl font-bold leading-tight">{open.title}</h2>
            {open.tagline && <p className="mt-1 text-sm font-medium text-primary">{open.tagline}</p>}
            {open.description && (
              <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-foreground/85">{open.description.replace(/<[^>]*>/g, "")}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {[
                { label: "Duration", value: open.duration, icon: CalendarDays },
                { label: "Starts", value: fmtDateSafe(open.startDate), icon: Sparkles },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-muted/70 p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">{value || "—"}</p>
                </div>
              ))}
            </div>

            {Array.isArray(open.highlights) && open.highlights.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you get</p>
                <div className="mt-2 space-y-1.5">
                  {open.highlights.slice(0, 5).map((h: string, i: number) => (
                    <p key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {h}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/70 p-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Tuition</p>
                <p className="font-display text-lg font-bold">
                  {open.price > 0 ? fmtMoney(open.price) : "Free"}
                  {open.originalPrice > 0 && open.price > 0 && open.originalPrice > open.price && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">{fmtMoney(open.originalPrice)}</span>
                  )}
                </p>
              </div>
              {open.deadline && (
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Apply by</p>
                  <p className="font-semibold">{fmtDateSafe(open.deadline)}</p>
                </div>
              )}
            </div>

            {enrolledIds.has(String(open.id)) ? (
              <Btn size="lg" variant="outline" className="mt-4 w-full rounded-2xl" onClick={() => navigate("/tabs/courses")}>
                Go to My Learning
              </Btn>
            ) : (
              <Btn
                size="lg"
                loading={enrolling === open.id}
                className="mt-4 w-full rounded-2xl"
                onClick={() => void enroll(open.id, open.title)}
              >
                {open.price > 0 ? `Enroll · ${fmtMoney(open.price)}` : "Enroll free"}
              </Btn>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function fmtDateSafe(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

