import { useEffect, useMemo, useState } from "react";
import {
  Search, Star, Clock, Users, BookOpen, X, SlidersHorizontal,
  Database, Megaphone, Crown, TrendingUp, Code, Briefcase, Heart, Palette,
  ArrowRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import { useCourses } from "@/hooks/useQueries";
import { FilterChips } from "@/components/dashboard/FilterChips";

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
  const qFromUrl = searchParams.get("q") || "";
  const [search, setSearch] = useState(qFromUrl);

  useEffect(() => {
    setSearch(qFromUrl);
  }, [qFromUrl]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [sort, setSort] = useState("Most Popular");
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: allCourses = [] } = useCourses({ publishedOnly: true });

  const categoryOptions = useMemo(
    () => categoryData.filter((c) => c.name !== "All").map((c) => ({ label: c.name, value: c.name })),
    [],
  );
  const levelOptions = useMemo(() => levels.filter((l) => l !== "All Levels").map((l) => ({ label: l, value: l })), []);
  const priceOptions = useMemo(() => {
    const withoutAny = priceRanges.filter((p) => p !== "Any Price");
    return withoutAny.map((p) => ({ label: p, value: p }));
  }, []);

  const toggleMulti = (arr: string[], value: string) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

  const matchesPriceRange = (course: any, range: string) => {
    const price = Number(course?.price ?? 0);
    if (!Number.isFinite(price)) return false;
    if (range === "Free") return price === 0;
    if (range === "Under ₦50,000") return price > 0 && price < 50000;
    if (range === "₦50,000–₦100,000") return price >= 50000 && price <= 100000;
    if (range === "Over ₦100,000") return price > 100000;
    return false;
  };

  const filtered = allCourses
    .filter(c => {
      const matchSearch =
        (c.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.instructor ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes(c.category);
      const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(c.level);
      const matchPrice = selectedPrices.length === 0 || selectedPrices.some((r) => matchesPriceRange(c, r));
      return matchSearch && matchCat && matchLevel && matchPrice;
    })
    .sort((a, b) => {
      if (sort === "Highest Rated") return b.rating - a.rating;
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      return b.students - a.students;
    });

  const activeFilterCount = selectedCategories.length + selectedLevels.length + selectedPrices.length;

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Category</h3>
        <FilterChips
          options={categoryOptions}
          selectedValues={selectedCategories}
          onToggle={(v) => setSelectedCategories((prev) => toggleMulti(prev, v))}
          onClear={() => setSelectedCategories([])}
          allLabel="All Categories"
        />
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Level</h3>
        <FilterChips
          options={levelOptions}
          selectedValues={selectedLevels}
          onToggle={(v) => setSelectedLevels((prev) => toggleMulti(prev, v))}
          onClear={() => setSelectedLevels([])}
          allLabel="All Levels"
        />
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Price</h3>
        <FilterChips
          options={priceOptions}
          selectedValues={selectedPrices}
          onToggle={(v) => setSelectedPrices((prev) => toggleMulti(prev, v))}
          onClear={() => setSelectedPrices([])}
          allLabel="Any Price"
        />
      </div>

      {activeFilterCount > 0 && (
        <>
          <div className="border-t border-border" />
          <button
            onClick={() => { setSelectedCategories([]); setSelectedLevels([]); setSelectedPrices([]); }}
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
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
                Explore Courses
              </h1>
              <p className="text-muted-foreground">Courses designed for African professionals and leaders</p>
            </div>
            <div className="relative max-w-sm w-full md:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses, instructors..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
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
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
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
                  className="px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {sortOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Mobile filter panel */}
            {mobileFiltersOpen && (
              <div className="lg:hidden bg-card rounded-2xl shadow-sm border-0 p-6 mb-6">
                <FilterSidebar />
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategories.map((cat) => (
                  <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    {cat}
                    <button
                      onClick={() => setSelectedCategories((prev) => prev.filter((v) => v !== cat))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedLevels.map((lvl) => (
                  <span key={lvl} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-primary text-xs font-medium">
                    {lvl}
                    <button
                      onClick={() => setSelectedLevels((prev) => prev.filter((v) => v !== lvl))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedPrices.map((pr) => (
                  <span key={pr} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {pr}
                    <button
                      onClick={() => setSelectedPrices((prev) => prev.filter((v) => v !== pr))}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Course grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((course, i) => (
                <div
                  key={course.id}
                  className="bg-card md:rounded-2xl shadow-sm border-0 md:overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-row md:flex-col p-4 md:p-0 rounded-xl"
                >
                  <Link to={`/courses/${course.id}`} className="block relative shrink-0 md:aspect-video overflow-hidden w-20 h-20 rounded-[4px] md:w-full md:h-auto md:rounded-none">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {course.bestseller && (
                      <span className="hidden md:inline-block absolute top-3 left-3 bg-secondary text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">BESTSELLER</span>
                    )}
                    <span className="hidden md:inline-block absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-card/90 backdrop-blur text-muted-foreground font-medium">{course.level}</span>
                  </Link>
                  <div className="pl-4 md:p-4 flex flex-col flex-1 min-w-0">
                    <span className="hidden md:block text-xs text-secondary font-semibold mb-1.5">{course.category}</span>
                    <Link to={`/courses/${course.id}`}>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1 leading-snug">{course.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-1 md:mb-2 line-clamp-1">{course.instructor}</p>
                    <div className="hidden md:flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                      <span className="text-xs font-bold text-foreground">{course.rating}</span>
                      <span className="text-xs text-muted-foreground">({course.students.toLocaleString()} students)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3">
                      <Clock className="w-3 h-3 hidden md:block" />
                      <span>{course.duration}</span>
                      <span className="mx-1">·</span>
                      <Users className="w-3 h-3 hidden md:block" />
                      <span>{(course.students / 1000).toFixed(1)}k <span className="hidden md:inline">students</span></span>
                    </div>
                    {/* Pill tags — hidden on mobile to save space */}
                    <div className="hidden md:flex flex-wrap gap-1.5 mb-3">
                      {course.price === 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Free</span>
                      )}
                      <span className="text-[10px] font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full">Certificate</span>
                      {course.bestseller && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Bestseller</span>
                      )}
                      {course.level && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{course.level}</span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-base md:text-lg font-display font-bold text-foreground pr-2">₦{course.price}</span>
                      <Link
                        to={`/courses/${course.id}`}
                        className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-card text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Enrol Now <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-24 max-w-sm mx-auto bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 mt-8">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="font-display text-lg font-semibold text-foreground mb-1">
                  {search || activeFilterCount > 0 ? `No results found` : "No courses available yet"}
                </p>
                <p className="text-sm text-muted-foreground mb-6 px-4">
                  {search || activeFilterCount > 0 ? "Try adjusting your filters or search terms." : "Check back later for new programs and courses designed for African professionals."}
                </p>
                {(search || activeFilterCount > 0) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedCategories([]);
                      setSelectedLevels([]);
                      setSelectedPrices([]);
                    }}
                    className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Clear search & filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
