import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, ArrowRight, BarChart3, Award, Star, Clock, RotateCcw, Users, Smartphone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Question {
  id: number; text: string; options: string[]; correct: number;
}

interface Assessment {
  id: string; title: string; category: string; questions: Question[]; duration: string; icon: React.ElementType;
}

const assessments: Assessment[] = [
  {
    id: "data", title: "Data Analytics", category: "Data Science", duration: "10 min", icon: BarChart3,
    questions: [
      { id: 1, text: "Which function in Excel is used to look up a value in a table?", options: ["SUMIF", "VLOOKUP", "COUNTIF", "INDEX"], correct: 1 },
      { id: 2, text: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Logic", "System Query Language", "Standard Query Library"], correct: 0 },
      { id: 3, text: "Which Python library is primarily used for data manipulation?", options: ["NumPy", "Matplotlib", "Pandas", "Scikit-learn"], correct: 2 },
      { id: 4, text: "What type of chart best shows trends over time?", options: ["Pie chart", "Bar chart", "Line chart", "Scatter plot"], correct: 2 },
      { id: 5, text: "In a dataset, what does an 'outlier' refer to?", options: ["The most common value", "A missing data point", "A value significantly different from others", "The median value"], correct: 2 },
    ],
  },
  {
    id: "leadership", title: "Leadership & Management", category: "Leadership", duration: "8 min", icon: Users,
    questions: [
      { id: 1, text: "What is the primary role of a transformational leader?", options: ["Maintain status quo", "Inspire and motivate change", "Enforce rules strictly", "Delegate all decisions"], correct: 1 },
      { id: 2, text: "Which conflict resolution style involves both parties giving up something?", options: ["Avoiding", "Competing", "Compromising", "Accommodating"], correct: 2 },
      { id: 3, text: "What does SMART stand for in goal setting?", options: ["Simple, Measured, Achievable, Relevant, Timely", "Specific, Measurable, Achievable, Relevant, Time-bound", "Strategic, Meaningful, Actionable, Realistic, Targeted", "Standard, Managed, Aligned, Reviewed, Tracked"], correct: 1 },
      { id: 4, text: "What is emotional intelligence primarily about?", options: ["IQ score", "Technical skills", "Recognizing and managing emotions", "Physical fitness"], correct: 2 },
      { id: 5, text: "What is the best approach when giving constructive feedback?", options: ["Focus only on negatives", "Be vague to avoid conflict", "Be specific, timely, and solution-oriented", "Wait until the annual review"], correct: 2 },
    ],
  },
  {
    id: "marketing", title: "Digital Marketing", category: "Marketing", duration: "8 min", icon: Smartphone,
    questions: [
      { id: 1, text: "What does SEO stand for?", options: ["Social Engine Optimization", "Search Engine Optimization", "System Email Outreach", "Site Engagement Operations"], correct: 1 },
      { id: 2, text: "Which metric measures the percentage of visitors who leave after viewing only one page?", options: ["Click-through rate", "Conversion rate", "Bounce rate", "Engagement rate"], correct: 2 },
      { id: 3, text: "What is A/B testing used for?", options: ["Testing website speed", "Comparing two versions to see which performs better", "Auditing backlinks", "Scheduling posts"], correct: 1 },
      { id: 4, text: "Which platform is best for B2B marketing?", options: ["TikTok", "LinkedIn", "Snapchat", "Pinterest"], correct: 1 },
      { id: 5, text: "What does CTA stand for in marketing?", options: ["Click Through Analytics", "Call to Action", "Customer Traffic Analysis", "Content Target Audience"], correct: 1 },
    ],
  },
  {
    id: "finance", title: "Financial Literacy", category: "Finance", duration: "8 min", icon: DollarSign,
    questions: [
      { id: 1, text: "What is compound interest?", options: ["Interest on the principal only", "Interest on both principal and accumulated interest", "A fixed interest rate", "Interest paid monthly"], correct: 1 },
      { id: 2, text: "What does ROI stand for?", options: ["Rate of Inflation", "Return on Investment", "Revenue Over Income", "Risk of Insolvency"], correct: 1 },
      { id: 3, text: "What is diversification in investing?", options: ["Putting all money in one stock", "Spreading investments across different assets", "Only investing in bonds", "Day trading"], correct: 1 },
      { id: 4, text: "What is a balance sheet?", options: ["A monthly budget", "A record of income", "A financial statement showing assets, liabilities, and equity", "A tax form"], correct: 2 },
      { id: 5, text: "What is the purpose of an emergency fund?", options: ["Invest in stocks", "Cover unexpected expenses", "Pay for vacations", "Start a business"], correct: 1 },
    ],
  },
];

interface Result { assessmentId: string; score: number; total: number; date: string; level: string; }

function getLevel(pct: number): string {
  if (pct >= 80) return "Advanced";
  if (pct >= 60) return "Intermediate";
  if (pct >= 40) return "Beginner";
  return "Novice";
}

function getLevelColor(level: string): string {
  if (level === "Advanced") return "text-secondary bg-accent";
  if (level === "Intermediate") return "text-primary bg-accent";
  if (level === "Beginner") return "text-amber-600 bg-amber-50";
  return "text-muted-foreground bg-muted";
}

export default function SkillsAssessmentPage() {
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Result[]>([
    { assessmentId: "data", score: 4, total: 5, date: "Feb 20, 2026", level: "Advanced" },
  ]);

  const startAssessment = (a: Assessment) => {
    setActiveAssessment(a);
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
  };

  const selectAnswer = (qId: number, optIndex: number) => {
    setAnswers({ ...answers, [qId]: optIndex });
  };

  const finishAssessment = () => {
    if (!activeAssessment) return;
    const score = activeAssessment.questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
    const pct = (score / activeAssessment.questions.length) * 100;
    const level = getLevel(pct);
    setResults(prev => [...prev.filter(r => r.assessmentId !== activeAssessment.id), { assessmentId: activeAssessment.id, score, total: activeAssessment.questions.length, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), level }]);
    setShowResults(true);
    toast.success(`You scored ${score}/${activeAssessment.questions.length} — ${level} level!`);
  };

  if (activeAssessment && !showResults) {
    const q = activeAssessment.questions[currentQ];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveAssessment(null)} className="text-sm text-muted-foreground hover:text-foreground">&larr; Back</button>
          <span className="text-xs text-muted-foreground">{currentQ + 1} of {activeAssessment.questions.length}</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div className="h-full gradient-card rounded-full" animate={{ width: `${((currentQ + 1) / activeAssessment.questions.length) * 100}%` }} />
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <span className="text-xs text-secondary font-semibold">{activeAssessment.title}</span>
          <h2 className="font-display text-xl font-bold text-foreground mt-2 mb-6">{q.text}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => selectAnswer(q.id, i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[q.id] === i ? "border-primary bg-accent ring-1 ring-primary/20" : "border-border hover:border-primary/30 bg-card"
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    answers[q.id] === i ? "gradient-card text-primary-foreground" : "border-2 border-border text-muted-foreground"
                  }`}>{String.fromCharCode(65 + i)}</div>
                  <span className="text-sm text-foreground">{opt}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)} className="rounded-xl">Previous</Button>
          {currentQ < activeAssessment.questions.length - 1 ? (
            <Button onClick={() => setCurrentQ(c => c + 1)} disabled={answers[q.id] === undefined} className="gradient-card text-primary-foreground rounded-xl gap-2 hover:opacity-90">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={finishAssessment} disabled={answers[q.id] === undefined} className="gradient-card text-primary-foreground rounded-xl gap-2 hover:opacity-90">
              Submit Assessment
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (activeAssessment && showResults) {
    const result = results.find(r => r.assessmentId === activeAssessment.id)!;
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto">
          <Award className="w-12 h-12 text-secondary" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-foreground">Assessment Complete!</h1>
        <p className="text-lg text-muted-foreground">{activeAssessment.title}</p>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="text-5xl font-display font-bold text-foreground">{pct}%</div>
          <p className="text-muted-foreground">{result.score} out of {result.total} correct</p>
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${getLevelColor(result.level)}`}>{result.level}</span>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => startAssessment(activeAssessment)} className="rounded-xl gap-2"><RotateCcw className="w-4 h-4" /> Retake</Button>
          <Button onClick={() => setActiveAssessment(null)} className="gradient-card text-primary-foreground rounded-xl gap-2 hover:opacity-90">Back to Assessments</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Skills Assessment</h1>
        <p className="text-muted-foreground text-sm mt-1">Test your knowledge and get skill-level badges for your profile</p>
      </div>

      {results.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Your Skill Levels</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {results.map(r => {
              const a = assessments.find(x => x.id === r.assessmentId);
              return (
                <div key={r.assessmentId} className="p-3 rounded-xl border border-border bg-muted/30">
                  <p className="text-sm font-semibold text-foreground">{a?.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getLevelColor(r.level)}`}>{r.level}</span>
                    <span className="text-xs text-muted-foreground">{r.score}/{r.total}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {assessments.map(a => {
          const existing = results.find(r => r.assessmentId === a.id);
          const Icon = a.icon;
          return (
            <motion.div key={a.id} whileHover={{ y: -2 }}
              className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3 hover:shadow-brand-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                {existing && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getLevelColor(existing.level)}`}>{existing.level}</span>}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{a.category} · {a.questions.length} questions · {a.duration}</p>
              </div>
              <Button onClick={() => startAssessment(a)} variant={existing ? "outline" : "default"}
                className={`mt-auto rounded-xl text-sm ${!existing ? "gradient-card text-primary-foreground hover:opacity-90" : ""}`}>
                {existing ? "Retake Assessment" : "Start Assessment"}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
