import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, Video } from "lucide-react";
import { api } from "@/services/api";
import { Card, Empty, Skeleton } from "@kit";
import Sheet from "../components/Sheet";
import { useState } from "react";

/**
 * LIVE SESSIONS — upcoming masterclasses/office hours with one-tap join.
 * Upcoming first; past sessions collapse below.
 */
export default function Sessions() {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["live-sessions", "mobile"],
    queryFn: () => api.getLiveSessions(),
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const { upcoming, past } = useMemo(() => {
    const list = (sessions ?? []);
    const up = list.filter((s) => new Date(s.starts_at).getTime() >= Date.now()).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    const pa = list.filter((s) => new Date(s.starts_at).getTime() < Date.now()).sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));
    return { upcoming: up, past: pa };
  }, [sessions]);

  const open = (sessions ?? []).find((s) => String(s.id) === openId);

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-6 backdrop-blur">
        <h1 className="font-display text-2xl font-bold">Live sessions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Masterclasses, office hours and reviews — join live.</p>
      </div>

      <div className="space-y-3 px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-2 h-3 w-1/2" /></Card>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <Card><Empty icon={CalendarClock} title="Nothing scheduled right now" sub="When a session is booked it shows up here first." /></Card>
        ) : (
          upcoming.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card onClick={() => setOpenId(String(s.id))} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(s.starts_at)}</p>
                    {new Date(s.starts_at).getTime() - Date.now() < 86_400_000 && (
                      <p className="mt-1 text-[11px] font-bold text-emerald-600">● Starting soon</p>
                    )}
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
                    <Video className="h-4 w-4 text-[#4a3db3]" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}

        {past.length > 0 && (
          <>
            <h2 className="pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent sessions</h2>
            {past.slice(0, 4).map((s) => (
              <Card key={s.id} onClick={() => setOpenId(String(s.id))} className="p-4 opacity-75">
                <p className="truncate text-sm font-semibold">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Held {fmtDateTime(s.starts_at)}</p>
              </Card>
            ))}
          </>
        )}
      </div>

      {open && (
        <Sheet onClose={() => setOpenId(null)}>
          <div className="p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-3 font-display text-xl font-bold leading-tight">{open.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{fmtDateTime(open.starts_at)}</p>
            {open.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{open.description}</p>
            )}
            {open.meeting_url && (
              <a href={open.meeting_url} target="_blank" rel="noopener noreferrer" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white">
                Join session <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function fmtDateTime(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");
}
