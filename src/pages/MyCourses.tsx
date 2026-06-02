import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, Clock, Star, Filter, Search, CheckCircle2, AlertTriangle, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useUserEnrollments } from "@/hooks/useQueries";
import { coursePathSegment } from "@/lib/publicRoutes";

const tabs = ["All", "In Progress", "Completed", "Not Started", "Frozen"];

export default function MyCourses() {
  const { appUser } = useAuth();
  const { data: rawEnrollments = [], isLoading: loads1 } = useUserEnrollments(appUser?.id);
  const { data: catalog = [], isLoading: loads2 } = useCourses({ publishedOnly: true });

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const allCourses = rawEnrollments.map((e: any) => {
    const dbCourse = catalog.find((c) => c.id === e.course_id);
    return {
      ...dbCourse,
      enrollment: e,
      status: e.progress >= 100 ? "completed" : e.progress > 0 ? "in-progress" : "not-started",
    };
  }).filter((c) => c.id); // strip nulls


  const filtered = allCourses.filter((c) => {
    const matchTab =
      activeTab === "All" ||
      (activeTab === "In Progress" && c.status === "in-progress") ||
      (activeTab === "Completed" && c.status === "completed") ||
      (activeTab === "Not Started" && c.status === "not-started") ||
      (activeTab === "Frozen" && c.status === "frozen");
    const matchSearch =
      (c.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.category ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const inProgress = allCourses.filter(c => c.status === "in-progress").length;
  const completed  = allCourses.filter(c => c.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {inProgress} in progress · {completed} completed · {allCourses.length} total
          </p>
        </div>
        <a href="/courses" className="text-sm font-semibold text-primary hover:underline w-fit">
          + Browse more courses
        </a>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your courses..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm text-muted-foreground hover:bg-muted transition-colors w-fit">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t ? "bg-card shadow-brand-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {(loads1 || loads2) ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border-0 p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h2 className="text-xl font-display font-medium text-foreground mb-2">
            Ready to accelerate your career?
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-8">
            Start by exploring our curated learning paths and discover skills that push you forward.
          </p>
          <Link to="/courses" className="px-6 py-3 rounded-xl gradient-card text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Browse Course Catalog
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course: any, i: number) => (
          <Link to={`/courses/${coursePathSegment(course)}`} key={course.id}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-brand-sm transition-shadow group cursor-pointer">
            <div className="relative aspect-video overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-foreground/20" />
              {course.status === "completed" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/90 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              ) : course.status === "frozen" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40">
                  <div className="w-12 h-12 rounded-full bg-blue-500/90 flex items-center justify-center">
                    <Snowflake className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : course.status === "not-started" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-foreground/40 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full gradient-card flex items-center justify-center shadow-brand-md">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
              )}
              <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full ${
                course.status === "completed"   ? "bg-secondary text-primary" :
                course.status === "in-progress" ? "bg-primary text-primary-foreground" :
                course.status === "frozen"      ? "bg-blue-500 text-white" :
                "bg-muted/80 text-foreground"
              }`}>
                {course.status === "in-progress" ? "In Progress" : course.status === "completed" ? "Completed" : course.status === "frozen" ? "🔒 Access Frozen" : "Not Started"}
              </span>
              {course.frozen && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center" title="Access frozen — deadline passed">
                  <Snowflake className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-xs text-secondary font-medium">{course.category}</span>
                <h3 className="font-semibold text-foreground text-sm leading-snug mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 italic">▶ {course.lastLesson}</p>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{course.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${course.progress === 100 ? "bg-secondary" : "bg-primary"}`}
                    style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              {course.deadline && !course.frozen && course.status !== "completed" && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Deadline: {course.deadline}</span>
                </div>
              )}
              {course.frozen && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg cursor-pointer" onClick={(e) => { e.preventDefault(); toast.info("Contact support to request deadline extension for this course."); }}>
                  <Snowflake className="w-3 h-3" />
                  <span>Frozen since {course.deadline} — Request extension</span>
                </div>
              )}
            </div>
          </motion.div>
          </Link>
        ))}
        </div>
      )}
    </div>
  );
}
