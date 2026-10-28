import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, GraduationCap, MapPin, Wallet, Building2, Mail } from "lucide-react";
import { Btn } from "@kit";
import { api } from "@/services/api";
import { Card, Empty, Input, Skeleton } from "@kit";
import { fmtDate } from "@kit";
import Sheet from "../components/Sheet";

/**
 * OPPORTUNITIES — SLA's live jobs board. Searchable list; opening a job shows
 * the write-up with an Apply button (application URL, or the contact email's
 * mailto fallback).
 */
export default function Jobs() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", "mobile"],
    queryFn: () => api.getJobs(),
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  const rows = useMemo(() => {
    const open = (jobs ?? []).filter((j) => (j.status ?? "open") === "open");
    if (!q.trim()) return open;
    const n = q.toLowerCase();
    return open.filter((j) => `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(n));
  }, [jobs, q]);

  const open = rows.find((j) => j.id === openId);

  const applyUrl = open?.application_url
    ? open.application_url.startsWith("http")
      ? open.application_url
      : `https://${open.application_url}`
    : open?.contact_email
      ? `mailto:${open.contact_email}?subject=Application: ${encodeURIComponent(open.title)}`
      : null;

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-gradient-to-br from-primary to-[#271066] px-5 pb-6 pt-8 text-white">
        <h1 className="font-display text-2xl font-bold">Opportunities</h1>
        <p className="mt-1 text-sm text-white/80">Roles and gigs curated by the SLA network.</p>
        <div className="relative mt-3">
          <svg viewBox="0 0 24 24" className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <Input
            placeholder="Search roles, companies, cities…"
            className="border-transparent bg-card pl-11 text-foreground"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
          />
        </div>
      </div>

      <div className="-mt-2 space-y-3 px-4 pb-4 pt-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="p-4"><div className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></Card>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card><Empty icon={Briefcase} title={q ? "No matching roles" : "No openings right now"} sub="New opportunities land on this board daily — check back." /></Card>
        ) : (
          rows.map((j) => (
            <Card key={j.id} onClick={() => setOpenId(j.id)} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{j.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" /> {j.company}
                  </p>
                  {j.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {j.location}
                    </p>
                  )}
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-4.5 w-4.5 text-primary" />
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {j.type && <Tag2>{j.type}</Tag2>}
                {j.salary && (
                  <Tag2><Wallet className="h-3 w-3" /> {j.salary}</Tag2>
                )}
                <span className="text-[11px] text-muted-foreground">· posted {fmtDate(j.created_at, { day: "numeric", month: "short" })}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {open && (
        <Sheet onClose={() => setOpenId(null)}>
          <div className="p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-3 font-display text-xl font-bold leading-tight">{open.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{open.company}{open.location ? ` · ${open.location}` : ""}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {open.type && <Tag2>{open.type}</Tag2>}
              {open.salary && <Tag2><Wallet className="h-3 w-3" /> {open.salary}</Tag2>}
            </div>

            {open.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{open.description}</p>
            )}

            {applyUrl && (
              <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block">
                <Btn2>Apply now</Btn2>
              </a>
            )}
            {open.contact_email && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {open.contact_email}
              </p>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}


function Btn2({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white">
      {children}
    </span>
  );
}

function Tag2({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}
