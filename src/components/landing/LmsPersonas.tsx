import { motion } from "framer-motion";
import { GraduationCap, Users, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const personas = [
  {
    id: "learner",
    title: "For Learners",
    description: "Build job-ready skills with expert-led courses and get certified by world-class institutions.",
    icon: GraduationCap,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    link: "/programs",
    cta: "Start Learning"
  },
  {
    id: "instructor",
    title: "For Instructors",
    description: "Launch your teaching empire. Use our AI tools to create, manage, and scale your impact across Africa.",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    link: "/signup?role=instructor",
    cta: "Start Teaching"
  },
  {
    id: "institution",
    title: "For Institutions",
    description: "Corporate training and school management at scale. Close skill gaps and automate compliance.",
    icon: Building2,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    link: "/for-teams",
    cta: "Connect Teams"
  }
];

export default function LmsPersonas() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-6"
          >
            Personalized learning for <span className="text-primary italic">everyone</span>, everywhere.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground font-medium"
          >
            SLA routes you to the exact tools and resources you need to achieve your specific goals.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((persona, i) => (
            <motion.div
              key={persona.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.2 }}
              whileHover={{ y: -10 }}
              className={cn(
                "group relative p-10 rounded-[2.5rem] border-2 transition-all duration-500",
                persona.bg,
                persona.border,
                "hover:shadow-2xl hover:shadow-black/5"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-white shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-500",
                persona.color
              )}>
                <persona.icon className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-foreground mb-4">{persona.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed mb-10 min-h-[5rem]">
                {persona.description}
              </p>

              <Link to={persona.link} className="inline-flex items-center gap-2 group/btn">
                <span className={cn("text-sm font-black uppercase tracking-widest transition-colors", persona.color)}>
                  {persona.cta}
                </span>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all group-hover/btn:translate-x-1",
                    persona.border,
                    "bg-white"
                )}>
                  <ArrowRight className={cn("w-4 h-4", persona.color)} />
                </div>
              </Link>
              
              {/* Decorative element */}
              <div className="absolute top-6 right-6 opacity-[0.03] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                <persona.icon className="w-32 h-32" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-primary/5 -z-10 pointer-events-none" />
    </section>
  );
}
