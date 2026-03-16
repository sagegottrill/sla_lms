import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Star, Clock, Users, BookOpen, X, SlidersHorizontal,
  Database, Megaphone, Crown, TrendingUp, Code, Briefcase, Heart, Palette,
  ArrowRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import { useCourses } from "@/hooks/useQueries";

const categoryData = [
  { name: "All", icon: BookOpen, count: 9 },
  { name: "Data Science", icon: Database, count: 1 },
  { name: "Marketing", icon: Megaphone, count: 1 },
  { name: "Leadership", icon: Crown, count: 1 },
  { name: "Finance", icon: TrendingUp, count: 1 },
  { name: "Technology", icon: Code, count: 1 },
  { name: "Business", icon: Briefcase, count: 2 },
  { name: "Health", icon: Heart, count: 1 },
  { name: "Design", icon: Palette, count: 1 },
];

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const sortOptions = ["Most Popular", "Highest Rated", "Newest", "Price: Low to High", "Price: High to Low"];
const priceRanges = ["Any Price", "Free", 'Under ₦50,000', '₦50,000–₦100,000', 'Over ₦100,000'];

export default function CourseCatalogPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [sort, setSort] = useState("Most Popular");
  const [priceRange, setPriceRange] = useState("Any Price");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: allCourses = [], isLoading } = useCourses();

  const filtered = allCourses
    .filter(c => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || c.category === category;
      const matchLevel = level === "All Levels" || c.level === level;
      const matchPrice = priceRange === "Any Price" || (priceRange === "Free" && c.price === 0) || (priceRange === 'Under ₦50,000' && c.price < 50000) || (priceRange === '₦50,000–₦100,000' && c.price >= 50000 && c.price <= 100000) || (priceRange === 'Over ₦100,000' && c.price > 100000);
      return matchSearch && matchCat && matchLevel && matchPrice;
    })
    .sort((a, b) => {
      if (sort === "Highest Rated") return b.rating - a.rating;
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      return b.students - a.students;
    });

  const activeFilterCount = [category !== "All", level !== "All Levels", priceRange !== "Any Price"].filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Category</h3>
        <div className="space-y-0.5">
          {categoryData.map(({ name, icon: Icon, count }) => (
            <button
              key={name}
              onClick={() => setCategory(name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${category === name
                ? "bg-accent text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{name}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Level */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Level</h3>
        <div className="space-y-0.5">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${level === l
                ? "bg-accent text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${level === l ? "border-primary" : "border-muted-foreground"}`}>
                {level === l && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Price */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Price</h3>
        <div className="space-y-0.5">
          {priceRanges.map(p => (
            <button
              key={p}
              onClick={() => setPriceRange(p)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${priceRange === p
                ? "bg-accent text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${priceRange === p ? "border-primary" : "border-muted-foreground"}`}>
                {priceRange === p && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              {p}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <>
          <div className="border-t border-border" />
          <button
            onClick={() => { setCategory("All"); setLevel("All Levels"); setPriceRange("Any Price"); }}
            className="w-full text-sm text-destructive hover:text-destructive/80 font-medium flex items-center gap-2 px-3 py-2"
          >
            <X className="w-4 h-4" /> Clear all filters
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Clean header — no dark green block */}
      <div className="pt-16 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
                Explore Courses
              </motion.h1>
              <p className="text-muted-foreground">Over 200 courses designed for African women leaders</p>
            </div>
            <div className="relative max-w-sm w-full md:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses, instructors..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Left sidebar filters — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">{activeFilterCount}</span>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5">{activeFilterCount}</span>}
                </button>
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{filtered.length}</strong> courses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">Sort by</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {sortOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Mobile filter panel */}
            {mobileFiltersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-card rounded-2xl border border-border p-5 mb-6"
              >
                <FilterSidebar />
              </motion.div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {category !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    {category}
                    <button onClick={() => setCategory("All")} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {level !== "All Levels" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-primary text-xs font-medium">
                    {level}
                    <button onClick={() => setLevel("All Levels")} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceRange !== "Any Price" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {priceRange}
                    <button onClick={() => setPriceRange("Any Price")} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Course grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col"
                >
                  <Link to={`/courses/${course.id}`} className="block relative aspect-video overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {course.bestseller && (
                      <span className="absolute top-3 left-3 bg-secondary text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">BESTSELLER</span>
                    )}
                    <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-card/90 backdrop-blur text-muted-foreground font-medium">{course.level}</span>
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs text-secondary font-semibold mb-1.5">{course.category}</span>
                    <Link to={`/courses/${course.id}`}>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1 leading-snug">{course.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{course.instructor}</p>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                      <span className="text-xs font-bold text-foreground">{course.rating}</span>
                      <span className="text-xs text-muted-foreground">({course.students.toLocaleString()} students)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <Clock className="w-3 h-3" />
                      <span>{course.duration} total</span>
                      <span className="mx-1">·</span>
                      <Users className="w-3 h-3" />
                      <span>{(course.students / 1000).toFixed(1)}k students</span>
                    </div>
                    {/* Price + CTA */}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-display font-bold text-foreground">₦{course.price}</span>
                      <Link
                        to={`/courses/${course.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-card text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Enrol Now <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-24 max-w-sm mx-auto">
                <BookOpen className="w-12 h-12 mx-auto text-primary/80 mb-4" />
                <p className="font-display text-lg font-semibold text-foreground mb-1">Your learning journey starts here.</p>
                <p className="text-sm text-muted-foreground">Don't wait until you're 'ready' to lead—the world needs your vision now. Pick your first course and start SLAying your professional goals!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
