import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, Clock, Star, Filter, Search, CheckCircle2, Lock, AlertTriangle, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const allCourses = [
  { id: 1, title: "Data Analytics with Python & Power BI", instructor: "Dr. Amara Osei", category: "Data Science", progress: 68, rating: 4.9, duration: "32h", status: "in-progress", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=220&fit=crop", lastLesson: "Module 4: Data Visualization with Matplotlib", deadline: "Mar 20, 2026", frozen: false },
  { id: 2, title: "Digital Marketing & Brand Strategy", instructor: "Aisha Kamara", category: "Marketing", progress: 32, rating: 4.8, duration: "22h", status: "in-progress", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=220&fit=crop", lastLesson: "Module 2: Building Your Brand Voice", deadline: "Mar 15, 2026", frozen: false },
  { id: 3, title: "Women in Leadership: From Manager to CEO", instructor: "CEO Ngozi Williams", category: "Leadership", progress: 100, rating: 5.0, duration: "18h", status: "completed", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=220&fit=crop", lastLesson: "Completed!", deadline: null, frozen: false },
  { id: 4, title: "Financial Modelling & Investment Analysis", instructor: "Chioma Eze, CFA", category: "Finance", progress: 0, rating: 4.7, duration: "26h", status: "frozen", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=220&fit=crop", lastLesson: "Module 1: Introduction to Financial Modelling", deadline: "Feb 28, 2026", frozen: true },
  { id: 5, title: "Full-Stack Web Development Bootcamp", instructor: "Fatima Al-Hassan", category: "Technology", progress: 15, rating: 4.8, duration: "48h", status: "in-progress", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=220&fit=crop", lastLesson: "Module 1: HTML & CSS Fundamentals", deadline: "Apr 30, 2026", frozen: false },
  { id: 6, title: "Entrepreneurship & Business Modeling", instructor: "Zara Mensah", category: "Business", progress: 100, rating: 4.9, duration: "28h", status: "completed", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=220&fit=crop", lastLesson: "Completed!", deadline: null, frozen: false },
];

const tabs = ["All", "In Progress", "Completed", "Not Started", "Frozen"];

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = allCourses.filter((c) => {
    const matchTab =
      activeTab === "All" ||
      (activeTab === "In Progress" && c.status === "in-progress") ||
      (activeTab === "Completed" && c.status === "completed") ||
      (activeTab === "Not Started" && c.status === "not-started") ||
      (activeTab === "Frozen" && c.status === "frozen");
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const inProgress = allCourses.filter(c => c.status === "in-progress").length;
  const completed  = allCourses.filter(c => c.status === "completed").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted transition-colors w-fit">
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

      {/* Course grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course, i) => (
          <Link to={`/courses/${course.id}`} key={course.id}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-sm transition-shadow group cursor-pointer">
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
                    <Lock className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold fill-gold" />{course.rating}</span>
              </div>
            </div>
          </motion.div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground max-w-sm mx-auto">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary" />
          <p className="font-semibold text-foreground mb-2">Your learning journey starts here.</p>
          <p className="text-sm">Don't wait until you're 'ready' to lead—the world needs your vision now. Pick your first course and start SLAying your professional goals!</p>
        </div>
      )}
    </div>
  );
}
