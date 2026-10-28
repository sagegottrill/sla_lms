import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Award, BookOpen, Briefcase, CalendarClock, GraduationCap, Loader2, MessagesSquare, Sparkles } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/react-query";
import { Card, Empty, PageLoader, ProgressBar, Tag } from "@kit";
import { cn, fmtDate, initials, isApp } from "@kit";

/**
 * HOME TAB — greeting, quick-access tiles (programs/jobs/live/awards),
 * enrolled-course continue rail (real data), live forum pulse. Mobile-native.
 */
export default function Home() {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile", appUser?.id],
    queryFn: () => api.getUserEnrollments(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { data: threads, isLoading: loadingThreads } = useQuery({
    queryKey: [...queryKeys.forumThreads.base, "mobile"],
    queryFn: () => api.getForumThreads(),
    select: (r) => (r.success ? (r.data ?? []).slice(0, 3) : []),
  });

  if (!appUser) return <PageLoader />;

  const firstName = appUser.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const active = (enrollments ?? []).filter((e: any) => e.status !== "dropped");
  const continueRail = active.slice(0, 6);

  return (
    <div className="min-h-full">
      {/* header */}
      <header className={cn("bg-gradient-to-br from-primary to-[#271066] px-5 pb-14 pt-8 text-white", isApp && "pt-12")}>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">{greeting},</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold">{firstName} 👋</h1>
          <p className="mt-1 text-sm text-white/80">Your SLA campus, in your pocket.</p>
        </motion.div>

        {/* quick stats */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { label: "Enrolled", value: active.length, icon: BookOpen },
            { label: "Completed", value: active.filter((e: any) => (e.progress ?? 0) >= 100).length, icon: GraduationCap },
            { label: "Courses live", value: "—", icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur">
              <Icon className="h-4 w-4 text-white/80" />
              <p className="mt-1 text-lg font-bold leading-none">{value}</p>
              <p className="mt-1 text-[10px] font-medium text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* quick access tiles */}
      <section className="-mt-8 px-4">
        <div className="mb-5 grid grid-cols-4 gap-2.5">
          {[
            { to: "/programs", label: "Programs", icon: GraduationCap, tint: "bg-accent text-[#271066]" },
            { to: "/jobs", label: "Jobs", icon: Briefcase, tint: "bg-primary/10 text-primary" },
            { to: "/sessions", label: "Live", icon: CalendarClock, tint: "bg-emerald-100 text-emerald-700" },
            { to: "/certificates", label: "Awards", icon: Award, tint: "bg-amber-100 text-amber-700" },
          ].map(({ to, label, icon: Icon, tint }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-semibold text-foreground">{label}</span>
            </Link>
          ))}
        </div>

        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <BookOpen className="h-5 w-5 text-primary" /> Continue learning
        </h2>
        {loadingEnrollments ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : continueRail.length === 0 ? (
          <Card className="p-5 text-center">
            <Empty icon={BookOpen} title="No courses yet" sub="Browse the catalog and enroll to start learning." />
            <Link to="/tabs/courses" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Explore courses <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ) : (
          <div className="no-scrollbar-scroll -mx-4 flex gap-3 px-4 pb-2">
            {continueRail.map((e: any, i: number) => {
              const c = e.courses ?? {};
              return (
                <motion.div key={e.id ?? i} whileTap={{ scale: 0.97 }}>
                  <Card
                    onClick={() => c?.id && navigate(`/course/${c.id}/learn`)}
                    className="w-64 shrink-0 overflow-hidden"
                  >
                    {c?.image ? (
                      <img src={c.image} alt="" className="h-28 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-28 items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15">
                        <BookOpen className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                    <div className="p-3.5">
                      <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{c?.title ?? "Course"}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{e.progress ?? 0}% complete</span>
                        <span>{e.status === "completed" ? "Done 🎉" : "Resume"}</span>
                      </div>
                      <ProgressBar value={e.progress ?? 0} className="mt-2" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* forums pulse */}
      <section className="mt-6 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <MessagesSquare className="h-5 w-5 text-secondary" /> Community
          </h2>
          <Link to="/tabs/forums" className="text-xs font-semibold text-primary">See all</Link>
        </div>
        {loadingThreads ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2.5">
            {(threads ?? []).length === 0 ? (
              <Card className="p-4 text-center text-sm text-muted-foreground">No forum posts yet — start the conversation!</Card>
            ) : (
              (threads ?? []).map((t: any) => (
                <TappableThread key={t.id} thread={t} />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TappableThread({ thread }: { thread: any }) {
  const navigate = useNavigate();
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card onClick={() => navigate(`/forum/${thread.id}`)} className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-xs font-bold text-[#4a3db3]">
          {initials(thread.author_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{thread.title}</p>
          <p className="text-xs text-muted-foreground">
            {thread.author_name ?? "Member"} · {fmtDate(thread.created_at, { day: "numeric", month: "short" })}
          </p>
        </div>
        <Tag color="blue">{thread.replies_count ?? 0} replies</Tag>
      </Card>
    </motion.div>
  );
}
