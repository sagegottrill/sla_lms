import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Code2, Briefcase, TrendingUp, Users, DollarSign, Megaphone, Globe, Heart, Palette, BookOpen } from "lucide-react";
import { useCourses } from "@/hooks/useQueries";

const CATEGORY_META: Array<{
  label: string;
  aliases?: string[];
  icon: typeof BarChart3;
  color: string;
  iconColor: string;
}> = [
  { label: "Data Science", aliases: ["Data Science & Analytics", "Data"], icon: BarChart3, color: "bg-accent", iconColor: "text-primary" },
  { label: "Technology", aliases: ["Technology & Engineering", "Tech"], icon: Code2, color: "bg-accent", iconColor: "text-primary" },
  { label: "Business", aliases: ["Business & Entrepreneurship"], icon: Briefcase, color: "bg-accent", iconColor: "text-primary" },
  { label: "Career Development", icon: TrendingUp, color: "bg-accent", iconColor: "text-primary" },
  { label: "Finance", aliases: ["Finance & Investing"], icon: DollarSign, color: "bg-accent", iconColor: "text-primary" },
  { label: "Leadership", aliases: ["Leadership & Management"], icon: Users, color: "bg-accent", iconColor: "text-primary" },
  { label: "Digital Marketing", aliases: ["Marketing"], icon: Megaphone, color: "bg-accent", iconColor: "text-primary" },
  { label: "Entrepreneurship", icon: Globe, color: "bg-accent", iconColor: "text-primary" },
  { label: "Health", icon: Heart, color: "bg-accent", iconColor: "text-primary" },
  { label: "Design", icon: Palette, color: "bg-accent", iconColor: "text-primary" },
  { label: "Administrative and Business Support", icon: BookOpen, color: "bg-accent", iconColor: "text-primary" },
];

function normalizeCategory(raw: string): string {
  const s = raw.trim().toLowerCase();
  for (const meta of CATEGORY_META) {
    if (meta.label.toLowerCase() === s) return meta.label;
    if (meta.aliases?.some((a) => a.toLowerCase() === s)) return meta.label;
  }
  return raw.trim();
}

export default function CategoriesSection() {
  const { data: courses = [] } = useCourses({ publishedOnly: true });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of courses) {
      const key = normalizeCategory(String(c.category || "").trim());
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const fromMeta = CATEGORY_META
      .map((meta) => ({
        ...meta,
        courses: counts.get(meta.label) || 0,
      }))
      .filter((c) => c.courses > 0);

    // Include any DB categories not in the curated list
    const known = new Set(CATEGORY_META.map((m) => m.label));
    const extras = [...counts.entries()]
      .filter(([label]) => !known.has(label))
      .map(([label, n]) => ({
        label,
        icon: BookOpen,
        color: "bg-accent",
        iconColor: "text-primary",
        courses: n,
      }));

    const combined = [...fromMeta, ...extras].sort((a, b) => b.courses - a.courses);
    return combined.length > 0 ? combined : CATEGORY_META.slice(0, 8).map((m) => ({ ...m, courses: 0 }));
  }, [courses]);

  return (
    <section className="py-14 sm:py-16 bg-background">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10"
        >
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-[0.12em] block mb-2">Explore Topics</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Our Online Courses</h2>
          </div>
          <Link to="/courses" className="text-sm font-semibold text-primary hover:text-primary/90 transition-colors shrink-0">
            All Categories →
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.label} to={`/courses?category=${encodeURIComponent(cat.label)}`}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="group flex flex-col gap-3 p-4 sm:p-6 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card hover:border-primary/25 hover:shadow-brand-sm transition-all cursor-pointer h-full"
                >
                  <div className={`w-11 h-11 rounded-xl ${cat.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.courses} course{cat.courses === 1 ? "" : "s"}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
