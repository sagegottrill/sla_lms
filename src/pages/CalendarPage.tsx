import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Video, FileText, Zap, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const allEvents: Record<string, { title: string; time: string; type: "live" | "quiz" | "assignment" | "lesson"; course: string; color: string }[]> = {
  "2026-03-03": [
    { title: "Lesson: Introduction to Python", time: "9:00 AM", type: "lesson", course: "Data Analytics", color: "bg-accent text-accent-foreground" },
  ],
  "2026-03-04": [
    { title: "Live: Career Panel Discussion", time: "11:00 AM", type: "live", course: "Leadership", color: "bg-secondary text-primary" },
  ],
  "2026-03-05": [
    { title: "Live Q&A: Data Analytics Module 4", time: "10:00 AM", type: "live", course: "Data Analytics", color: "bg-secondary text-primary" },
    { title: "Lesson: Power BI Dashboards", time: "2:00 PM", type: "lesson", course: "Data Analytics", color: "bg-accent text-accent-foreground" },
  ],
  "2026-03-06": [
    { title: "Quiz: Brand Strategy Basics", time: "9:00 AM", type: "quiz", course: "Digital Marketing", color: "bg-accent text-primary" },
    { title: "Lesson: SEO Fundamentals", time: "4:00 PM", type: "lesson", course: "Digital Marketing", color: "bg-accent text-accent-foreground" },
  ],
  "2026-03-07": [
    { title: "Assignment Due: Business Model Canvas", time: "11:59 PM", type: "assignment", course: "Entrepreneurship", color: "bg-destructive/10 text-destructive" },
  ],
  "2026-03-08": [
    { title: "Live Workshop: Excel for Finance", time: "11:00 AM", type: "live", course: "Financial Modelling", color: "bg-secondary text-primary" },
  ],
  "2026-03-09": [
    { title: "Lesson: React Hooks Deep Dive", time: "3:00 PM", type: "lesson", course: "Web Dev Bootcamp", color: "bg-accent text-accent-foreground" },
    { title: "Weekly Review & Planning", time: "5:00 PM", type: "assignment", course: "All Courses", color: "bg-muted text-muted-foreground" },
  ],
  "2026-03-10": [
    { title: "Live Session: Women in Business", time: "10:00 AM", type: "live", course: "Leadership", color: "bg-secondary text-primary" },
  ],
  "2026-03-11": [
    { title: "Lesson: Advanced CSS Grid", time: "2:00 PM", type: "lesson", course: "Web Dev Bootcamp", color: "bg-accent text-accent-foreground" },
  ],
  "2026-03-12": [
    { title: "Quiz: Python Data Structures", time: "9:00 AM", type: "quiz", course: "Data Analytics", color: "bg-accent text-primary" },
  ],
  "2026-03-13": [
    { title: "Lesson: Financial Statement Analysis", time: "3:00 PM", type: "lesson", course: "Financial Modelling", color: "bg-accent text-accent-foreground" },
  ],
  "2026-03-15": [
    { title: "Assignment 2: Financial Modelling", time: "11:59 PM", type: "assignment", course: "Financial Modelling", color: "bg-destructive/10 text-destructive" },
  ],
  "2026-03-17": [
    { title: "Live: Marketing Trends 2026", time: "11:00 AM", type: "live", course: "Digital Marketing", color: "bg-secondary text-primary" },
  ],
  "2026-03-19": [
    { title: "Lesson: Node.js & Express", time: "2:00 PM", type: "lesson", course: "Web Dev Bootcamp", color: "bg-accent text-accent-foreground" },
  ],
  "2026-03-20": [
    { title: "Quiz: Leadership Mindset", time: "10:00 AM", type: "quiz", course: "Leadership", color: "bg-accent text-primary" },
  ],
};

const typeIcon: Record<string, React.ElementType> = { live: Video, quiz: Zap, assignment: FileText, lesson: BookOpen };

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(d: Date) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[d.getMonth()]} ${d.getDate()}`;
}

export default function CalendarPage() {
  const today = new Date(2026, 2, 6);
  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [selectedDate, setSelectedDate] = useState(formatDate(today));

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = weekDates[6];
  const weekLabel = `${formatDateDisplay(weekStart)}–${formatDateDisplay(weekEnd)}, ${weekStart.getFullYear()}`;

  const goToPrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const selectedEvents = allEvents[selectedDate] || [];

  const upcoming = Object.entries(allEvents)
    .flatMap(([date, evs]) => evs.map((ev) => ({ ...ev, date })))
    .filter((ev) => ev.date >= formatDate(today))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map((ev) => {
      const d = new Date(ev.date);
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...ev,
        dateDisplay: formatDateDisplay(d) + `, ${d.getFullYear()}`,
        urgency: diff <= 2 ? "soon" as const : diff <= 7 ? "upcoming" as const : "later" as const,
      };
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Learning Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay on track with your schedule</p>
        </div>
      </div>

      {/* Week view */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-foreground">Week of {weekLabel}</h2>
          <div className="flex gap-1">
            <button onClick={goToPrevWeek} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToNextWeek} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        {/* Day columns */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = formatDate(date);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === formatDate(today);
            const dayEvents = allEvents[dateStr];
            return (
              <div key={dateStr}>
                <button
                  onClick={() => setSelectedDate(dateStr)}
                  className={`w-full flex flex-col items-center p-2 rounded-xl transition-all ${isSelected ? "gradient-card text-primary-foreground shadow-brand-sm" : "hover:bg-muted"}`}
                >
                  <span className="text-xs font-medium">{dayNames[i]}</span>
                  <span className={`text-lg font-bold mt-0.5 ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}>{date.getDate()}</span>
                  {dayEvents && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((_, ei) => (
                        <span key={ei} className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground/70" : "bg-primary"}`} />
                      ))}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Events for selected day */}
        <div className="mt-5 space-y-2">
          {selectedEvents.length > 0 ? (
            selectedEvents.map((ev, i) => {
              const Icon = typeIcon[ev.type];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ev.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.course}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />{ev.time}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground text-sm py-4">No events scheduled for this day</p>
          )}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4">Upcoming Deadlines</h2>
        <div className="space-y-3">
          {upcoming.map((item, i) => {
            const Icon = typeIcon[item.type];
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.urgency === "soon" ? "bg-destructive/10 text-destructive" : item.urgency === "upcoming" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.dateDisplay}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.urgency === "soon" ? "bg-destructive/10 text-destructive" : item.urgency === "upcoming" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
                  {item.urgency === "soon" ? "Due Soon" : item.urgency === "upcoming" ? "Upcoming" : "Later"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
