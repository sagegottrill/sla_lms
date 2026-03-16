import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Code2, Briefcase, TrendingUp, Users, DollarSign, Megaphone, Globe } from "lucide-react";

const categories = [
  { icon: BarChart3, label: "Data Science",       courses: 48, color: "bg-accent", iconColor: "text-primary" },
  { icon: Code2,     label: "Technology",          courses: 72, color: "bg-accent", iconColor: "text-primary" },
  { icon: Briefcase, label: "Business",            courses: 56, color: "bg-accent", iconColor: "text-primary" },
  { icon: TrendingUp,label: "Career Development",  courses: 34, color: "bg-accent", iconColor: "text-primary" },
  { icon: DollarSign,label: "Finance",             courses: 29, color: "bg-accent", iconColor: "text-primary" },
  { icon: Users,     label: "Leadership",          courses: 41, color: "bg-accent", iconColor: "text-primary" },
  { icon: Megaphone, label: "Digital Marketing",   courses: 37, color: "bg-accent", iconColor: "text-primary" },
  { icon: Globe,     label: "Entrepreneurship",    courses: 25, color: "bg-accent", iconColor: "text-primary" },
];

export default function CategoriesSection() {
  return (
    <section className="py-14 sm:py-16 bg-background">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">

        {/* Header — left-aligned like Educax */}
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
          <Link to="/courses" className="text-sm font-semibold text-primary hover:underline shrink-0">
            All Categories →
          </Link>
        </motion.div>

        {/* Grid — 4 columns desktop like Educax/Udemy */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.label} to="/courses">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/25 hover:shadow-brand-sm transition-all cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl ${cat.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.courses} courses</p>
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
