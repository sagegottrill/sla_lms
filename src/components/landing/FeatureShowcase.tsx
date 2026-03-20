import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BarChart3, Smartphone, Laptop, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "teaching",
    title: "World-Class Teaching",
    icon: BookOpen,
    label: "For Instructors",
    description: "Build immersive courses with AI-powered assessment tools, live workshops, and automated grading.",
    points: ["SCORM & LTI Support", "Automated Quiz Generation", "Engagement Analytics"],
    image: "/connecta_hero_learner_1773797906898.png" // Placeholder or specific mockup image
  },
  {
    id: "learning",
    title: "Job-Ready Learning",
    icon: Smartphone,
    label: "For Students",
    description: "Learn on the go. Seamlessly switch between laptop and mobile while tracking your progress in real-time.",
    points: ["Offline Access", "Progress Tracking", "Interactive Forums"],
    image: "/connecta_hero_learner_1773797906898.png"
  },
  {
    id: "ops",
    title: "Enterprise Ops",
    icon: BarChart3,
    label: "For Institutions",
    description: "Take control of your entire organization with deep data analytics, revenue tracking, and compliance reporting.",
    points: ["SSO Integration", "Revenue Dashboards", "Regulatory Reporting"],
    image: "/connecta_hero_learner_1773797906898.png"
  }
];

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(features[0]);

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Everything you need to <span className="text-primary">succeed</span>.
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Interactive, data-driven, and built for the modern African professional.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Side: Tabs */}
          <div className="w-full lg:w-2/5 space-y-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature)}
                className={cn(
                  "w-full text-left p-8 rounded-3xl transition-all duration-300 border-2",
                  activeTab.id === feature.id 
                    ? "bg-white border-primary shadow-xl shadow-primary/5 ring-1 ring-primary/10" 
                    : "bg-transparent border-transparent hover:bg-white/50"
                )}
              >
                <div className="flex items-start gap-6">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                     activeTab.id === feature.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                   )}>
                     <feature.icon className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                     <p className={cn(
                       "text-[10px] uppercase font-black tracking-[0.2em]",
                       activeTab.id === feature.id ? "text-primary/70" : "text-muted-foreground/50"
                     )}>
                        {feature.label}
                     </p>
                     <h3 className="text-xl font-black text-foreground">{feature.title}</h3>
                     {activeTab.id === feature.id && (
                       <motion.p 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: "auto" }}
                         className="text-sm text-muted-foreground font-medium pt-3 leading-relaxed"
                       >
                         {feature.description}
                       </motion.p>
                     )}
                   </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right Side: Visual Mockup */}
          <div className="w-full lg:w-3/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 1.02 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative bg-white rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border-2 border-border/50 overflow-hidden min-h-[400px]"
              >
                {/* Mockup Top Bar */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="h-6 w-32 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse" />
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="h-10 w-3/4 bg-primary/5 rounded-xl border border-primary/10 flex items-center px-4">
                       <p className="text-xs font-black text-primary uppercase tracking-widest">{activeTab.title}</p>
                    </div>
                    <ul className="space-y-4">
                      {activeTab.points.map((point) => (
                        <li key={point} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <span className="text-sm font-bold text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="h-24 w-full bg-muted/30 rounded-2xl border border-dashed border-border" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-lg">
                    <img 
                      src={activeTab.image} 
                      alt="" 
                      className="w-full h-full object-cover grayscale opacity-50"
                    />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xl shadow-black/10 border border-white/50">
                          <Laptop className="w-10 h-10 text-primary" />
                       </div>
                    </div>
                  </div>
                </div>
                
                {/* Background Sparkles */}
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-[60px]" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
