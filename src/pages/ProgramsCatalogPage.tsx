import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, Calendar, Clock, BookOpen, ChevronRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const programs = [
  {
    id: 1, title: "Women in Data Science 2026", subtitle: "A 12-week intensive cohort program for women breaking into data.",
    cohort: "Cohort 4", startDate: "Apr 7, 2026", deadline: "Mar 28, 2026", capacity: 200, enrolled: 145,
    duration: "12 weeks", courses: 5, category: "Technology", level: "Intermediate",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop",
    partners: ["Google", "Microsoft", "Andela"], featured: true,
  },
  {
    id: 2, title: "Startup Founders Accelerator", subtitle: "From idea to pitch deck — an 8-week program for early-stage founders.",
    cohort: "Cohort 2", startDate: "Apr 14, 2026", deadline: "Apr 4, 2026", capacity: 100, enrolled: 80,
    duration: "8 weeks", courses: 8, category: "Business", level: "Advanced",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=340&fit=crop",
    partners: ["Techstars Africa", "Norrsken"], featured: false,
  },
  {
    id: 3, title: "Leadership Excellence Program", subtitle: "Equip yourself to lead with confidence across African boardrooms.",
    cohort: "Cohort 3", startDate: "May 1, 2026", deadline: "Apr 20, 2026", capacity: 80, enrolled: 22,
    duration: "10 weeks", courses: 6, category: "Leadership", level: "Advanced",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=340&fit=crop",
    partners: ["Deloitte Africa", "KPMG"], featured: true,
  },
  {
    id: 4, title: "Digital Finance & Fintech", subtitle: "Master mobile money, digital banking & fintech product management.",
    cohort: "Cohort 1", startDate: "May 12, 2026", deadline: "May 1, 2026", capacity: 120, enrolled: 34,
    duration: "8 weeks", courses: 7, category: "Finance", level: "Intermediate",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=340&fit=crop",
    partners: ["MTN MoMo", "Flutterwave"], featured: false,
  },
  {
    id: 5, title: "Health Systems Leadership", subtitle: "Strengthen health management skills for women in public health.",
    cohort: "Cohort 2", startDate: "Jun 2, 2026", deadline: "May 22, 2026", capacity: 60, enrolled: 10,
    duration: "6 weeks", courses: 4, category: "Health", level: "Beginner",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=340&fit=crop",
    partners: ["WHO Africa", "UNICEF"], featured: false,
  },
];

const categories = ["All", "Technology", "Business", "Leadership", "Finance", "Health"];

function useCountdown(deadline: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Closed"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      setTimeLeft(`${d}d ${h}h left`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [deadline]);
  return timeLeft;
}

function ProgramCard({ prog, i }: { prog: typeof programs[0]; i: number }) {
  const countdown = useCountdown(prog.deadline);
  const pct = Math.round((prog.enrolled / prog.capacity) * 100);
  const spotsLeft = prog.capacity - prog.enrolled;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-md transition-all hover:-translate-y-0.5 group">
      <div className="relative h-44 overflow-hidden">
        <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-foreground/40" />
        {prog.featured && (
          <span className="absolute top-3 left-3 bg-gold text-gold-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" /> FEATURED
          </span>
        )}
        <div className="absolute top-3 right-3 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          {countdown}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="text-[10px] font-semibold text-primary-foreground/70 uppercase tracking-wider">{prog.cohort}</span>
          <h3 className="font-display text-base font-bold text-primary-foreground line-clamp-1">{prog.title}</h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{prog.subtitle}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Starts {prog.startDate}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{prog.duration}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{prog.courses} courses</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{spotsLeft} spots left</span>
        </div>
        {/* Capacity bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{prog.enrolled}/{prog.capacity} enrolled</span>
            <span className={`font-semibold ${pct >= 80 ? "text-destructive" : "text-secondary"}`}>{pct}% full</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-destructive" : pct >= 60 ? "bg-gold" : "bg-secondary"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {/* Partners */}
        {prog.partners.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Partners:</span>
            {prog.partners.map(p => (
              <span key={p} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{p}</span>
            ))}
          </div>
        )}
        <Link to={`/programs/${prog.id}/apply`}>
          <Button className="w-full gradient-card text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2">
            Apply Now <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function ProgramsCatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = programs.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <div className="gradient-hero pt-16 py-14 px-6">
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
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? "gradient-card text-primary-foreground shadow-brand-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[["5", "Active Programs"], ["455", "Total Participants"], ["3", "Upcoming Cohorts"]].map(([v, l]) => (
            <div key={l} className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-2xl font-bold font-display text-primary">{v}</div>
              <div className="text-xs text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>

        {/* Programs grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prog, i) => <ProgramCard key={prog.id} prog={prog} i={i} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">No programs found</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
