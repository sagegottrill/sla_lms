import { motion } from "framer-motion";
import { BookOpen, Clock, Users, ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePrograms } from "@/hooks/useQueries";
import type { Program } from "@/types";

const tagStyles: Record<string, string> = {
  "Most Popular": "bg-primary text-primary-foreground",
  "Cohort Open": "bg-secondary text-primary",
  "New Program": "bg-foreground text-background",
};

function CountdownBadge({ deadline }: { deadline: string }) {
  const diff = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 86400000));
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${diff < 14 ? "text-secondary" : "text-primary-foreground/80"}`}>
      <CalendarDays className="w-3.5 h-3.5" />
      <span>Closes in {diff} days · {deadline}</span>
    </div>
  );
}

export default function ProgramsSection() {
  const { data: programs = [] } = usePrograms();

  return (
    <section id="programs" className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 sm:mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 text-primary">
            Structured Programs
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Cohort-Based Programs
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
                Instructor-led programs with live sessions, real projects, and a community that holds you accountable.
              </p>
            </div>
            <Link to="/programs" className="shrink-0">
              <Button variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted text-sm">
                All Programs →
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 p-5 sm:p-6 rounded-2xl border border-border bg-card"
        >
          {[
            { step: "01", title: "Pick a Program", desc: "Browse by career goal, deadline, and level" },
            { step: "02", title: "Enroll & Pay", desc: "Secure your spot before the enrollment deadline" },
            { step: "03", title: "Learn Together", desc: "Complete courses and projects with your cohort" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl gradient-card flex items-center justify-center shrink-0 font-display font-bold text-sm text-primary-foreground">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm mb-0.5">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Program Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {programs.map((program, i) => (
            <motion.div key={program.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5 }}
              className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-md transition-all duration-300">
              <div className="relative overflow-hidden h-44">
                <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${tagStyles[program.tag || "Most Popular"] ?? "bg-primary text-primary-foreground"}`}>
                  {program.tag || "Open"}
                </span>
                <div className="absolute bottom-3 left-3 right-3">
                  <CountdownBadge deadline={program.deadline || program.startDate} />
                </div>
              </div>

              <div className="flex flex-col flex-1 p-5 gap-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{program.level || "All Levels"} · {program.duration}</span>
                  <h3 className="font-display font-semibold text-foreground text-base leading-snug mt-1 group-hover:text-primary transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{program.tagline || program.category}</p>
                </div>

                <div className="space-y-1.5">
                  {(program.courses || program.highlights || []).slice(0, 3).map((c) => (
                    <div key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 shrink-0 text-primary" />{c}
                    </div>
                  ))}
                  {((program.courses || program.highlights || []).length > 3) && (
                    <p className="text-xs text-muted-foreground pl-5">+ {(program.courses || program.highlights || []).length - 3} more modules</p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{program.courseCount || (program.courses || program.highlights || []).length} modules</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{program.duration}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{program.students || program.enrolled}</span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-baseline gap-2">
                    {program.price === 0 ? (
                      <>
                        <span className="text-xl font-display font-bold text-foreground">Free</span>
                        {program.originalPrice && <span className="text-sm text-muted-foreground line-through">₦{program.originalPrice}</span>}
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-display font-bold text-foreground">₦{program.price}</span>
                        <span className="text-xs text-muted-foreground ml-1">one-time</span>
                      </>
                    )}
                  </div>
                  <Link to={`/programs/${program.id}/apply`}>
                    <Button size="sm" className="rounded-xl text-xs px-4 h-8 gradient-card text-primary-foreground hover:opacity-90 gap-1">
                      Enroll Now <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
