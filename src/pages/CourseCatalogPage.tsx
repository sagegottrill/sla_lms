import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search, Star, Clock, Users, BookOpen, X, SlidersHorizontal,
  Database, Megaphone, Crown, TrendingUp, Code, Briefcase, Heart, Palette,
  ArrowRight, Loader2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import { useCourses } from "@/hooks/useQueries";
import { coursePathSegment } from "@/lib/publicRoutes";
import { FilterChips } from "@/components/dashboard/FilterChips";
import { api } from "@/services/api";

const categoryIcons: Record<string, typeof BookOpen> = {
  "Data Science": Database,
  Marketing: Megaphone,
  "Digital Marketing": Megaphone,
  Leadership: Crown,
  Finance: TrendingUp,
  Technology: Code,
  Business: Briefcase,
  Health: Heart,
  Design: Palette,
  "Career Development": TrendingUp,
  Entrepreneurship: Briefcase,
  "Administrative and Business Support": Briefcase,
};

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const sortOptions = ["Most Popular", "Highest Rated", "Newest", "Price: Low to High", "Price: High to Low"];
const priceRanges = ["Any Price", "Free", 'Under ₦50,000', '₦50,000–₦100,000', 'Over ₦100,000'];

const normalizedCoursePrice = (price: unknown) => {
  const value = Number(price ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : null;
};

export default function CourseCatalogPage() {
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") || "";
  const categoryFromUrl = searchParams.get("category") || "";
  const [search, setSearch] = useState(qFromUrl);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setSearch(qFromUrl);
  }, [qFromUrl]);

   // Debounced Supabase search — fires 350ms after user stops typing
   useEffect(() => {
     if (!search.trim()) { setSearchResults(null); return; }
     const timer = setTimeout(async () => {
       setSearching(true);
       const response = await api.searchCourses(search.trim());
       setSearchResults(response.success ? response.data || [] : []);
       setSearching(false);
     }, 350);
     return () => clearTimeout(timer);
   }, [search]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    categoryFromUrl ? [categoryFromUrl] : []
  );
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [sort, setSort] = useState("Most Popular");
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategories([categoryFromUrl]);
    }
  }, [categoryFromUrl]);

  const { data: allCourses = [] } = useCourses({ publishedOnly: true });

  // Use Supabase search results when a query is active, otherwise use full catalog
  // Ensure we always have an array
  const baseList = Array.isArray(searchResults) 
    ? searchResults 
    : Array.isArray(allCourses) 
    ? allCourses 
    : [];

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of allCourses) {
      const cat = String(c.category || "").trim();
      if (!cat) continue;
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    const entries = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        icon: categoryIcons[name] || BookOpen,
        count,
      }));
    return [{ name: "All", icon: BookOpen, count: allCourses.length }, ...entries];
  }, [allCourses]);

  const categoryOptions = useMemo(
    () => categoryData.filter((c) => c.name !== "All").map((c) => ({ label: `${c.name} (${c.count})`, value: c.name })),
    [categoryData],
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

  const filtered = baseList
    .filter((c: any) => {
      const matchCat   = selectedCategories.length === 0 || selectedCategories.includes(c.category);
      const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(c.level);
      const matchPrice = selectedPrices.length === 0 || selectedPrices.some((r) => matchesPriceRange(c, r));
      return matchCat && matchLevel && matchPrice;
    })
    .sort((a: any, b: any) => {
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
              />
              {searching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
              {search && !searching && (
                <button
                  onClick={() => { setSearch(""); setSearchResults(null); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
              {filtered.map((course) => (
                <div
                  key={course.id}
                  className="bg-card md:rounded-2xl shadow-sm border-0 md:overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-row md:flex-col p-4 md:p-0 rounded-xl"
                >
                  <Link to={`/courses/${coursePathSegment(course)}`} className="block relative shrink-0 md:aspect-video overflow-hidden w-20 h-20 rounded-[4px] md:w-full md:h-auto md:rounded-none">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <div className="pl-4 md:p-4 flex flex-col flex-1 min-w-0">
                    <div className="hidden md:flex items-center gap-2 mb-1.5 text-xs">
                      {course.category ? (
                        <span className="text-secondary font-semibold">{course.category}</span>
                      ) : null}
                      {course.level ? (
                        <span className="text-muted-foreground">· {course.level}</span>
                      ) : null}
                    </div>
                    <Link to={`/courses/${coursePathSegment(course)}`}>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1 leading-snug">{course.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-1 md:mb-2 line-clamp-1">{course.instructor}</p>
                    <div className="hidden md:flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                      <span className="text-xs font-bold text-foreground">{Number(course.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(course.reviewCount ?? 0).toLocaleString()} review{(course.reviewCount ?? 0) === 1 ? "" : "s"})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3">
                      {course.duration ? (
                        <>
                          <Clock className="w-3 h-3 hidden md:block" />
                          <span>{course.duration}</span>
                          <span className="mx-1">·</span>
                        </>
                      ) : null}
                      <Users className="w-3 h-3 hidden md:block" />
                      <span>
                        {(course.students ?? 0).toLocaleString()}
                        <span className="hidden md:inline"> student{(course.students ?? 0) === 1 ? "" : "s"}</span>
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-base md:text-lg font-display font-bold text-foreground pr-2">
                        {normalizedCoursePrice(course.price) === 0
                          ? "Free"
                          : normalizedCoursePrice(course.price) === null
                            ? "Price unavailable"
                            : `₦${normalizedCoursePrice(course.price)?.toLocaleString()}`}
                      </span>
                      <Link
                        to={`/courses/${coursePathSegment(course)}`}
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
