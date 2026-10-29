import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CalendarClock,
  GraduationCap,
  Loader2,
  MessagesSquare,
  Star,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/services/api";
import { queryKeys } from "@/lib/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, Card, Empty, PageLoader, ProgressBar, Tag } from "@kit";
import { cn, fmtDate, fmtMoney, initials, isApp, devPreviewUser } from "@kit";

/**
 * HOME — role-aware command center.
 *
 * Design bar (the vault's "10K DNA"): near-black ink statement hero with ONE
 * earned accent, proof-as-UI stat pills (real numbers, no adjectives),
 * hairline discipline, and a single premium easing curve. Every number on
 * this screen is real data from the shared backend — nothing decorative.
 */

// One easing curve everywhere (students see it too via motion components).
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/* ---------- shared hero chrome ---------- */

function Statement({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <header className="top-safe overflow-hidden bg-[hsl(var(--ink))] px-5 pb-8 pt-9 text-[hsl(var(--ink-foreground))]">
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [...EASE_PREMIUM] }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[hsl(var(--ink-muted))]">{kicker}</p>
          <img src="/sla_logo_transparent.png" alt="" className="h-6 w-6 invert brightness-0 opacity-90" layout="intrinsic" />
        </div>
        <h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.08] tracking-[-0.04em]">{title}</h1>
        <p className="mt-1.5 text-sm text-[hsl(var(--ink-muted))]">{sub}</p>
      </motion.div>
    </header>
  );
}

function StatPills({ items }: { items: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string }[] }) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, delay: 0.08, ease: [...EASE_PREMIUM] }}
      className="-mt-5 px-4"
    >
      <div className="flex overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        {items.map(({ icon: Icon, value, label }, i) => (
          <div key={label} className={cn("flex-1 px-3 py-3", i > 0 && "border-l border-border")}>
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold leading-none tracking-tight">{value}</p>
            <p className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SectionHead({ icon: Icon, children, to }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; to?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-[-0.02em]">
        <Icon className="h-4 w-4 text-primary" />
        {children}
      </h2>
      {to && (
        <Link to={to} className="text-xs font-semibold text-primary ease-premium active:opacity-70">
          See all
        </Link>
      )}
    </div>
  );
}

function TileRail({ tiles }: { tiles: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; tint: string }[] }) {
  return (
    <div className="mb-1 grid grid-cols-4 gap-2.5">
      {tiles.map(({ to, label, icon: Icon, tint }) => (
        <Link key={to} to={to} className="flex flex-col items-center gap-1.5 ease-premium active:scale-95">
          <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-black/5", tint)}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-[10px] font-semibold">{label}</span>
        </Link>
      ))}
    </div>
  );
}

/* ---------- role dispatch ---------- */

export default function Home() {
  const { appUser: authUser } = useAuth();
  const appUser = authUser ?? devPreviewUser();
  if (!appUser) return <PageLoader />;
  const role = appUser.role;
  if (role === "instructor") return <InstructorHome appUser={appUser} />;
  if (role === "program_manager" || role === "admin") return <StaffHome appUser={appUser} isAdmin={role === "admin"} />;
  return <StudentHome appUser={appUser} />;
}

/* ---------- STUDENT ---------- */

function StudentHome({ appUser }: { appUser: any }) {
  const navigate = useNavigate();
  const firstName = appUser.name.split(" ")[0];

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: [...queryKeys.enrollments.base, "mobile", appUser.id],
    queryFn: () => api.getUserEnrollments(appUser.id),
    select: (r) => (r.success ? r.data ?? [] : []),
  });
  const { data: threads, isLoading: loadingThreads } = useQuery({
    queryKey: [...queryKeys.forumThreads.base, "mobile"],
    queryFn: () => api.getForumThreads(),
    select: (r) => (r.success ? (r.data ?? []).slice(0, 3) : []),
  });

  const active = (enrollments ?? []).filter((e: any) => e.status !== "dropped");
  const completed = active.filter((e: any) => (e.progress ?? 0) >= 100).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const continueRail = active.slice(0, 6);

  return (
    <div className="min-h-full">
      <Statement
        kicker={`${greeting}, ${firstName}`}
        title={active.length ? "Your next lesson is waiting." : "Your first lesson is waiting."}
        sub="She Leads Africa · built for founders and leaders."
      />

      <StatPills
        items={[
          { icon: BookOpen, value: active.length, label: "Enrolled" },
          { icon: GraduationCap, value: completed, label: "Completed" },
          { icon: TrendingUp, value: active.length ? `${Math.round(active.reduce((a: number, e: any) => a + (e.progress ?? 0), 0) / active.length)}%` : "0%", label: "Avg progress" },
        ]}
      />

      <section className="px-4 pt-6">
        <TileRail
          tiles={[
            { to: "/programs", label: "Programs", icon: GraduationCap, tint: "bg-accent text-accent-foreground" },
            { to: "/jobs", label: "Jobs", icon: Briefcase, tint: "bg-primary/10 text-primary" },
            { to: "/sessions", label: "Live", icon: CalendarClock, tint: "bg-emerald-100 text-emerald-700" },
            { to: "/certificates", label: "Awards", icon: Award, tint: "bg-amber-100 text-amber-700" },
          ]}
        />
      </section>

      <section className="px-4 pt-6">
        <SectionHead icon={BookOpen} to="/tabs/courses">Continue</SectionHead>
        {loadingEnrollments ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : continueRail.length === 0 ? (
          <Card className="p-5 text-center">
            <Empty icon={BookOpen} title="Nothing enrolled yet" sub="Browse the catalog and start." />
            <Link to="/tabs/courses" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Explore courses <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ) : (
          <div className="no-scrollbar-scroll -mx-4 flex gap-3 px-4 pb-2">
            {continueRail.map((e: any, i: number) => {
              const c = e.courses ?? {};
              return (
                <motion.div key={e.id ?? i} whileTap={{ scale: 0.97 }} transition={{ ease: [...EASE_PREMIUM] }}>
                  <Card
                    onClick={() => c?.id && navigate(`/course/${c.id}/learn`)}
                    className="w-64 shrink-0 overflow-hidden"
                  >
                    {c?.image ? (
                      <img src={c.image} alt="" className="h-28 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-28 items-center justify-center bg-primary/10">
                        <BookOpen className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                    <div className="p-3.5">
                      <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{c?.title ?? "Course"}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{e.progress ?? 0}% complete</span>
                        <span>{e.status === "completed" ? "Done" : "Resume"}</span>
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

      <section className="px-4 pb-8 pt-6">
        <SectionHead icon={MessagesSquare} to="/tabs/forums">Community</SectionHead>
        {loadingThreads ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (threads ?? []).length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted-foreground">No posts yet — start the conversation.</Card>
        ) : (
          <div className="space-y-2.5">
            {(threads ?? []).map((t: any) => (
              <TappableThread key={t.id} thread={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TappableThread({ thread }: { thread: any }) {
  const navigate = useNavigate();
  return (
    <motion.div whileTap={{ scale: 0.98 }} transition={{ ease: [...EASE_PREMIUM] }}>
      <Card onClick={() => navigate(`/forum/${thread.id}`)} className="flex items-center gap-3 p-3.5">
        <Avatar name={thread.author_name} className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{thread.title}</p>
          <p className="text-xs text-muted-foreground">
            {thread.author_name ?? "Member"} · {fmtDate(thread.created_at, { day: "numeric", month: "short" })}
          </p>
        </div>
        <Tag color="blue">{thread.replies_count ?? 0}</Tag>
      </Card>
    </motion.div>
  );
}

/* ---------- INSTRUCTOR ---------- */

function InstructorHome({ appUser }: { appUser: any }) {
  const navigate = useNavigate();
  const firstName = appUser.name.split(" ")[0];

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: [...queryKeys.stats.base, "mobile-instructor", appUser.id],
    queryFn: () => api.getInstructorStats(appUser.id),
    select: (r) => (r.success ? r.data : null),
  });
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: [...queryKeys.courses.base, "mobile-instructor", appUser.id],
    queryFn: () => api.getInstructorCourses(appUser.id),
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  return (
    <div className="min-h-full">
      <Statement
        kicker={`Classroom · ${firstName}`}
        title="Teach, track, get paid."
        sub="Your students and earnings, live."
      />

      <StatPills
        items={[
          { icon: Users, value: loadingStats ? "—" : (stats?.totalStudents ?? 0).toLocaleString(), label: "Students" },
          { icon: BookOpen, value: loadingStats ? "—" : (stats?.activeCourses ?? 0), label: "Courses" },
          { icon: Star, value: loadingStats ? "—" : (stats?.avgRating ?? "—"), label: "Avg rating" },
          { icon: Wallet, value: loadingStats ? "—" : fmtMoney(stats?.totalRevenue ?? 0), label: "Revenue" },
        ]}
      />

      <section className="px-4 pb-8 pt-7">
        <SectionHead icon={BookOpen}>Your courses</SectionHead>
        {loadingCourses ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (courses ?? []).length === 0 ? (
          <Card className="p-5 text-center">
            <Empty icon={BookOpen} title="No courses yet" sub="Create your first course on the web — course building is a desk job, students find you here." />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {(courses ?? []).slice(0, 6).map((c: any, i: number) => (
              <motion.div key={c.id ?? i} whileTap={{ scale: 0.98 }} transition={{ ease: [...EASE_PREMIUM] }}>
                <Card onClick={() => c?.id && navigate(`/course/${c.id}`)} className="flex items-center gap-3 p-3.5">
                  {c?.image ? (
                    <img src={c.image} alt="" className="h-12 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary/60" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.title ?? "Course"}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.enrollments_count ?? c.enrollments ?? 0} students
                      {c.price ? ` · ${fmtMoney(Number(c.price) || Number(c.price) / 100)}` : ""}
                    </p>
                  </div>
                  <Tag color="blue">{c.published ? "Live" : "Draft"}</Tag>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- PROGRAM MANAGER / ADMIN ---------- */

function StaffHome({ appUser, isAdmin }: { appUser: any; isAdmin: boolean }) {
  const firstName = appUser.name.split(" ")[0];

  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: [...queryKeys.programs.base, "mobile-staff"],
    queryFn: () => api.getPrograms(),
    select: (r) => (r.success ? r.data ?? [] : []),
  });
  const { data: participants, isLoading: loadingParticipants } = useQuery({
    queryKey: ["program-participants", "mobile-staff"],
    queryFn: () => api.getProgramParticipants(),
    enabled: isAdmin,
    select: (r) => (r.success ? r.data ?? [] : []),
  });
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments", "mobile-admin"],
    queryFn: () => api.getPayments(),
    enabled: isAdmin,
    select: (r) => (r.success ? r.data ?? [] : []),
  });
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles", "mobile-admin"],
    queryFn: () => api.getProfiles(),
    enabled: isAdmin,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const successful = (payments ?? []).filter((p: any) => p.status === "successful");
  const revenue = successful.reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
  const newest = [...(profiles ?? [])]
    .sort((a: any, b: any) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 4);

  return (
    <div className="min-h-full">
      <Statement
        kicker={`${isAdmin ? "Admin" : "Programs"} · ${firstName}`}
        title={isAdmin ? "Here's the state of SLA." : "Your cohorts, at a glance."}
        sub={isAdmin ? "Users, courses and money — live numbers." : "Programs and participants, live numbers."}
      />

      <StatPills
        items={
          isAdmin
            ? [
                { icon: Users, value: loadingProfiles ? "—" : (profiles ?? []).length.toLocaleString(), label: "Members" },
                { icon: BookOpen, value: loadingPrograms ? "—" : (programs ?? []).length, label: "Courses+programs" },
                { icon: CalendarClock, value: loadingParticipants ? "—" : (participants ?? []).length.toLocaleString(), label: "Participants" },
                { icon: Wallet, value: loadingPayments ? "—" : fmtMoney(revenue), label: "Revenue" },
              ]
            : [
                { icon: GraduationCap, value: loadingPrograms ? "—" : (programs ?? []).length, label: "Programs" },
                { icon: Users, value: (participants ?? []).length ? participants.length.toLocaleString() : "—", label: "Participants" },
              ]
        }
      />

      <section className="px-4 pt-6">
        <TileRail
          tiles={[
            { to: "/programs", label: "Catalog", icon: GraduationCap, tint: "bg-accent text-accent-foreground" },
            { to: "/sessions", label: "Live", icon: CalendarClock, tint: "bg-emerald-100 text-emerald-700" },
            { to: "/jobs", label: "Jobs", icon: Briefcase, tint: "bg-primary/10 text-primary" },
            { to: "/tabs/forums", label: "Community", icon: MessagesSquare, tint: "bg-secondary/10 text-secondary" },
          ]}
        />
      </section>

      <section className="px-4 pt-7">
        <SectionHead icon={GraduationCap}>Live programs</SectionHead>
        {loadingPrograms ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (programs ?? []).length === 0 ? (
          <Card className="p-5 text-center">
            <Empty icon={GraduationCap} title="No programs yet" sub="Build your first program on the web — the cohort tools live there." />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {(programs ?? []).slice(0, 5).map((p: any, i: number) => (
              <motion.div key={p.id ?? i} whileTap={{ scale: 0.98 }} transition={{ ease: [...EASE_PREMIUM] }}>
                <Card className="p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.title ?? "Program"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.cohort_capacity ? `Capacity ${p.cohort_capacity}` : "Open"} {p.deadline ? `· closes ${fmtDate(p.deadline, { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                  {p.tuition && Number(p.tuition) > 0 && <Tag color="purple">{fmtMoney(p.tuition)}</Tag>}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="px-4 pb-8 pt-7">
          <SectionHead icon={Wallet}>Latest payments</SectionHead>
          {(loadingPayments || loadingProfiles || loadingParticipants) && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {!loadingPayments && successful.length === 0 && (
            <Card className="p-4 text-center text-sm text-muted-foreground">No successful payments yet.</Card>
          )}
          {successful.slice(0, 4).map((p: any) => (
            <Card key={p.id} className="mb-2.5 flex items-center justify-between p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.profiles?.name ?? "Member"}</p>
                <p className="text-xs text-muted-foreground">
                  {p.courses?.title ?? p.programs?.title ?? "Enrollment"} · {fmtDate(p.created_at, { day: "numeric", month: "short" })}
                </p>
              </div>
              <p className="ml-3 shrink-0 text-sm font-bold text-emerald-600">{fmtMoney(Number(p.amount) || 0)}</p>
            </Card>
          ))}

          <div className="mt-5">
            <SectionHead icon={UserRound}>Newest members</SectionHead>
            {newest.length === 0 && !loadingProfiles && (
              <Card className="p-4 text-center text-sm text-muted-foreground">No members visible yet — sign in with an admin account for member data.</Card>
            )}
            {newest.map((m: any, i: number) => (
              <div key={m.id ?? i} className="mb-2 flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border">
                <Avatar name={m.name} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.name ?? "Member"}</p>
                  <p className="text-xs capitalize text-muted-foreground">{m.role ?? "student"} · {fmtDate(m.created_at ?? m.joined, { day: "numeric", month: "short" })}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
