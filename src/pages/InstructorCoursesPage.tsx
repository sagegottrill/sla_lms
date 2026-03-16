import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, DollarSign, Star, Plus, Eye, Edit, BarChart2, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const courses = [
  { id: 1, title: "Data Analytics with Python & Power BI", students: 8420, rating: 4.9, revenue: 12680, status: "published", category: "Data Science", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=160&fit=crop", lessons: 48, price: 85000 },
  { id: 2, title: "Advanced Data Visualization", students: 3210, rating: 4.8, revenue: 4980, status: "published", category: "Data Science", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=160&fit=crop", lessons: 32, price: 65000 },
  { id: 3, title: "Machine Learning Fundamentals", students: 0, rating: 0, revenue: 0, status: "draft", category: "Technology", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=160&fit=crop", lessons: 12, price: 100000 },
];

export default function InstructorCoursesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">{courses.filter(c => c.status === "published").length} published · {courses.filter(c => c.status === "draft").length} draft</p>
        </div>
        <Button className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create New Course
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your courses..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="space-y-4">
        {filtered.map((course, i) => (
          <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-5 flex gap-5 hover:shadow-brand-sm transition-shadow">
            <img src={course.image} alt={course.title} className="w-32 h-20 rounded-xl object-cover shrink-0 hidden sm:block" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs text-secondary font-medium">{course.category}</span>
                  <h3 className="font-semibold text-foreground mt-0.5">{course.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students.toLocaleString()} students</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
                    {course.rating > 0 && <span className="flex items-center gap-1 text-gold"><Star className="w-3 h-3 fill-gold" />{course.rating}</span>}
                    {course.revenue > 0 && <span className="flex items-center gap-1 text-secondary font-semibold"><DollarSign className="w-3 h-3" />{course.revenue.toLocaleString()} earned</span>}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${course.status === "published" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
                  {course.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border">
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"><Edit className="w-3 h-3" /> Edit Course</button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"><Eye className="w-3 h-3" /> Preview</button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"><BarChart2 className="w-3 h-3" /> Analytics</button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors ml-auto"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
