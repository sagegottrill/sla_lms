import { motion } from "framer-motion";
import { Star, Clock, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCourses } from "@/hooks/useQueries";
import type { Course } from "@/types";

const badgeStyles: Record<string, string> = {
  Bestseller: "bg-secondary text-primary",
  Hot: "bg-destructive text-destructive-foreground",
  Free: "bg-primary text-primary-foreground",
  New: "bg-primary text-primary-foreground",
  Popular: "bg-primary text-primary-foreground",
  "Top Rated": "bg-secondary text-primary",
};

function CourseCard({ course, index }: { course: Course; index: number }) {
  return (
    <Link to={`/courses/${course.id}`}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-md transition-all duration-300 cursor-pointer h-full"
    >
      <div className="relative overflow-hidden aspect-video">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-foreground/8 group-hover:bg-foreground/0 transition-colors" />
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyles[course.badge] ?? "bg-primary text-primary-foreground"}`}>
          {course.badge}
        </span>
        {course.price === 0 && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{course.category}</span>
          <span className="text-xs text-muted-foreground">{course.level}</span>
        </div>
        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground">{course.instructor}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-primary">{course.rating}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-secondary" style={{ fill: i < Math.floor(course.rating) ? "hsl(var(--secondary))" : "none" }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({course.reviews.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-2">
            {course.price === 0 ? (
              <>
                <span className="text-base font-bold text-primary">Free</span>
                {course.originalPrice && <span className="text-xs text-muted-foreground line-through">₦{course.originalPrice}</span>}
              </>
            ) : (
              <>
                <span className="text-base font-bold text-foreground">₦{course.price}</span>
                {course.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">₦{course.originalPrice}</span>
                )}
              </>
            )}
          </div>
          <div className="inline-flex items-center justify-center rounded-lg text-xs px-3 h-7 gradient-card text-primary-foreground font-medium hover:opacity-90">
            Enroll
          </div>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}

export default function FeaturedCourses() {
  const { data: allCourses = [] } = useCourses();
  const courses = allCourses.slice(0, 6); // Just grab the first six to show on the landing page

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4"
        >
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 text-primary">
              Featured Courses
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Level Up Your Career Today
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-lg">
              Join the Tribe and learn from Africa's top Professionals.
            </p>
          </div>
          <Link to="/courses">
            <Button variant="outline" className="shrink-0 rounded-xl border-border text-foreground hover:bg-muted text-sm">
              View All Courses →
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
