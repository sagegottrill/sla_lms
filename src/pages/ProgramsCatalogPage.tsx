import { useState, useEffect } from "react";

import { Search, Users, Calendar, Clock, BookOpen, ChevronRight, Award, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePrograms } from "@/hooks/useQueries";
import { programPathSegment } from "@/lib/publicRoutes";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface Program {
  id: number;
  public_id?: string | null;
  title: string;
  tagline?: string | null;
  description: string;
  category: string;
  duration: string;
  start_date: string;
  deadline: string;
  application_deadline?: string | null;
  capacity: number;
  enrolled?: number;
  price: number;
  image: string;
  highlights: string[];
  courses: string[];
  course_count: number;
  status: string;
  level?: string | null;
  cohort?: string;
  tag?: string;
  featured?: boolean;
  partners?: string[];
}

const categories = ["All", "Technology", "Business", "Leadership", "Finance", "Health"];

function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!deadline) { setTimeLeft("Open"); return; }
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Applications Closed"); return; }
      const d = Math.floor(diff / 86400000);
      setTimeLeft(`${d} Days Left to Apply`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [deadline]);
  return timeLeft;
}

function ProgramCard({ prog }: { prog: Program }) {
  const chosenDeadline = prog.application_deadline ?? prog.deadline ?? null;
  const countdown = useCountdown(chosenDeadline);
  const enrolled = prog.enrolled || 0;
  const pct = prog.capacity > 0 ? Math.round((enrolled / prog.capacity) * 100) : 0;
  const spotsLeft = prog.capacity - enrolled;

  return (
    <div className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-brand-md transition-all group">
      <div className="relative h-44 overflow-hidden">
        {prog.image ? (
          <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full gradient-hero flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-primary-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/40" />
        {prog.featured && (
          <span className="absolute top-3 left-3 bg-gold text-gold-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" /> FEATURED
          </span>
        )}
        {chosenDeadline && (
          <div className="absolute top-3 right-3 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {countdown}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {(prog.tag || prog.cohort) && (
            <span className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-wider">
              {(prog as { tag?: string }).tag ?? prog.cohort}
            </span>
          )}
          <h3 className="font-display text-base font-bold text-primary-foreground line-clamp-1">{prog.title}</h3>
          {prog.tagline ? (
            <p className="text-[11px] text-primary-foreground/80 line-clamp-1 mt-0.5">
              {prog.tagline}
            </p>
          ) : null}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {prog.level ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {prog.level}
            </span>
          ) : null}
          {prog.category ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {prog.category}
            </span>
          ) : null}
          <span className="ml-auto text-sm font-semibold text-foreground">
            {prog.price > 0 ? `₦${Number(prog.price).toLocaleString()}` : "Free"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{prog.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {prog.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Starts {new Date(prog.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
          {prog.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{prog.duration}</span>}
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{prog.course_count || 0} courses</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}</span>
        </div>
        {/* Capacity bar */}
        {prog.capacity > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{enrolled}/{prog.capacity} enrolled</span>
              <span className={`font-semibold ${pct >= 80 ? "text-destructive" : "text-secondary"}`}>{pct}% full</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-destructive" : pct >= 60 ? "bg-gold" : "bg-secondary"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {/* Partners */}
        {prog.partners && prog.partners.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Partners:</span>
            {prog.partners.map((p: string) => (
              <span key={p} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p}</span>
            ))}
          </div>
        )}
        <Link to={`/programs/${programPathSegment(prog)}/apply`}>
          <Button className="w-full gradient-card text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2">
            Apply Now <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ProgramsCatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { data: programs = [], isLoading: loading } = usePrograms({ activeCatalog: true });

  // Ensure programs is always an array before filtering
  const safePrograms = Array.isArray(programs) ? programs : [];
  
  const filtered = safePrograms.filter(p => {
    const matchSearch = (p.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  const activeCount = safePrograms.filter(p => p.status === "active").length;
  const totalParticipants = safePrograms.reduce((sum, p) => sum + (p.enrolled || 0), 0);
  const upcomingCount = safePrograms.filter(p => p.status === "upcoming").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <div className="gradient-hero pt-28 pb-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Cohort Programs
          </h1>
          <p className="text-primary-foreground/70 text-lg mb-8">Structured, Tribe-led programs built for Professionals</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search programs..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-brand-md"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? "gradient-card text-primary-foreground shadow-brand-sm" : "bg-card ring-1 ring-black/5 dark:ring-white/10 border-0 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[[String(activeCount), "Active Programs"], [String(totalParticipants), "Total Participants"], [String(upcomingCount), "Upcoming Cohorts"]].map(([v, l]) => (
            <div key={l} className="bg-card rounded-2xl shadow-sm border-0 p-4 text-center">
              <div className="text-2xl font-bold font-display text-primary">{v}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading programs...</p>
          </div>
        )}

        {/* Programs grid */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((prog) => <ProgramCard key={prog.id} prog={prog} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">No programs found</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon — new cohorts are being prepared.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

