import { motion } from "framer-motion";
import { FolderOpen, BookOpen, Clock, Users, ChevronRight, Award, Calendar, Play } from "lucide-react";

const programs: any[] = [];

export default function MyPrograms() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">Structured learning tracks with Tribe support</p>
        </div>
        <a href="/programs" className="text-sm font-semibold text-primary hover:underline">Browse programs</a>
      </div>

      {programs.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border-0 p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
          <FolderOpen className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h2 className="text-xl font-display font-medium text-foreground mb-2">
            You haven't joined any programs yet
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-8">
            Programs are structured learning tracks with direct support and cohort community.
          </p>
          <a href="/programs" className="px-6 py-3 rounded-xl gradient-card text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Discover Programs
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {programs.map((prog, i) => (
            <motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-brand-sm transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 relative overflow-hidden shrink-0">
                  <img src={prog.image} alt={prog.title} className="w-full h-48 md:h-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/50" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full w-fit mb-2 ${prog.status === "active" ? "bg-secondary text-primary" : "bg-muted/80 text-foreground"}`}>
                      {prog.status === "active" ? "● Active" : "✓ Completed"}
                    </span>
                    <h3 className="font-display font-bold text-primary-foreground text-base leading-snug">{prog.title}</h3>
                    <p className="text-primary-foreground/70 text-xs mt-1">{prog.cohort}</p>
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{prog.description}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{prog.participants} participants</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Deadline: {prog.deadline}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{prog.totalCourses} courses</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground font-medium">{prog.coursesCompleted}/{prog.totalCourses} courses completed</span>
                      <span className="font-bold text-foreground">{prog.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${prog.progress}%` }} transition={{ duration: 1, delay: i * 0.2 }}
                        className={`h-full rounded-full ${prog.progress === 100 ? "bg-secondary" : "bg-primary"}`} />
                    </div>
                  </div>

                  {/* Course pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {prog.courses.map((c, ci) => (
                      <span key={c} className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${ci < prog.coursesCompleted ? "bg-accent text-primary border-secondary/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {ci < prog.coursesCompleted ? "✓ " : ""}{c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Managed by <span className="font-medium text-foreground">{prog.manager}</span></p>
                    {prog.status === "active" ? (
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-card text-primary-foreground text-xs font-semibold hover:opacity-90">
                        <Play className="w-3 h-3" /> Continue
                      </button>
                    ) : (
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-primary text-xs font-semibold hover:bg-secondary/20 transition-colors">
                        <Award className="w-3 h-3" /> Get Certificate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
