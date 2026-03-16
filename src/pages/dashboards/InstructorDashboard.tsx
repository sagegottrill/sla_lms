import { motion } from "framer-motion";
import { BookOpen, Users, DollarSign, Star, Plus, TrendingUp, Eye, Edit, BarChart2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, ResponsiveContainer, Tooltip } from "recharts";

const courses = [
  { id: 1, title: "Data Analytics with Python & Power BI", students: 8420, rating: 4.9, revenue: 12680, status: "published", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=160&fit=crop" },
  { id: 2, title: "Advanced Data Visualization", students: 3210, rating: 4.8, revenue: 4980, status: "published", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=160&fit=crop" },
  { id: 3, title: "Machine Learning Fundamentals", students: 0, rating: 0, revenue: 0, status: "draft", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=160&fit=crop" },
];

const stats = [
  { label: "Total Students", value: "11,630", icon: Users, color: "text-primary bg-accent" },
  { label: "Active Courses", value: "2", icon: BookOpen, color: "text-primary bg-accent" },
  { label: "Total Revenue", value: '₦17.6M', icon: DollarSign, color: "text-secondary bg-accent" },
  { label: "Avg. Rating", value: "4.85", icon: Star, color: "text-primary bg-accent" },
];



const revenueChartData = [40, 65, 50, 80, 70, 90, 60, 85, 75, 95, 88, 100].map((v, i) => ({ name: `D${i + 1}`, rev: v }));

const MiniTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-2 py-1 shadow-lg">
        <p className="text-[10px] text-foreground font-semibold">₦{(payload[0].value * 23.4).toFixed(0)}</p>
      </div>
    );
  }
  return null;
};

export default function InstructorDashboard() {
  const { appUser } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Instructor Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back, {appUser?.name?.split(" ")[0] ?? "Instructor"}</p>
        </div>
        <Link to="/dashboard/courses/new">
          <Button className="gradient-card text-primary-foreground rounded-xl shadow-brand-sm hover:opacity-90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Course
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-5 border border-border shadow-brand-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-display text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">My Courses</h2>
            <Link to="/dashboard/courses" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-4 flex gap-4 hover:shadow-brand-sm transition-shadow">
                <img src={course.image} alt={course.title} className="w-20 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students.toLocaleString()}</span>
                        {course.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold" />{course.rating}</span>}
                        {course.revenue > 0 && <span className="flex items-center gap-1 text-secondary font-medium"><DollarSign className="w-3 h-3" />{course.revenue.toLocaleString()}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${course.status === "published" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
                      {course.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Link to="/dashboard/courses/new" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"><Edit className="w-3 h-3" /> Edit</Link>
                    <Link to={`/courses/${course.id}`} className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1 transition-colors"><Eye className="w-3 h-3" /> Preview</Link>
                    <Link to="/dashboard/analytics" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"><BarChart2 className="w-3 h-3" /> Analytics</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Revenue chart — Recharts */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" /> Revenue (30 days)
            </h3>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip content={<MiniTooltip />} cursor={{ fill: "hsl(220, 14%, 96%)" }} />
                <Bar dataKey="rev" fill="hsl(204, 100%, 43%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-2xl font-bold font-display text-foreground">₦2,340,000 <span className="text-sm text-secondary font-body">this month</span></div>
          </div>


        </div>
      </div>
    </div>
  );
}
