import { motion } from "framer-motion";
import { MoveRight, Zap, Database, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const migrationSteps = [
  {
    icon: Database,
    title: "Export Metadata",
    text: "Extract your student & course data from Blackboard, Moodle, or Canvas."
  },
  {
    icon: Zap,
    title: "Instant Import",
    text: "Our AI-powered engine maps your legacy data to SLA in seconds."
  },
  {
    icon: ShieldCheck,
    title: "Verify & Launch",
    text: "Run a quick validation check and go live with 100% data integrity."
  }
];

export default function MigrationSection() {
  return (
    <section className="py-24 bg-primary text-white overflow-hidden relative">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-[40%] h-full bg-white/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
      
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Content Side */}
          <div className="w-full lg:w-1/2 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-[0.2em]"
            >
              <Zap className="w-4 h-4 text-white" /> Effortless Migration
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
            >
              Switch to SLA in <span className="text-teal-300 italic">3 simple clicks</span>.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/80 max-w-lg leading-relaxed font-medium"
            >
              Worried about legacy data? Our dedicated migration team helps you move from any platform with zero downtime and 100% data security.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
               <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-primary hover:bg-white/90 text-lg font-bold w-full sm:w-auto">
                 Request Free Migration Audit
               </Button>
               <div className="flex items-center gap-3 text-white/70">
                 <Mail className="w-5 h-5" />
                 <span className="text-sm font-bold">concierge@sheleadsafrica.org</span>
               </div>
            </motion.div>
          </div>

          {/* Steps Side */}
          <div className="w-full lg:w-1/2 relative">
            <div className="space-y-8">
              {migrationSteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                  className="group flex items-start gap-8 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">{step.title}</h3>
                    <p className="text-white/60 leading-relaxed font-medium">
                      {step.text}
                    </p>
                  </div>
                  {i < migrationSteps.length - 1 && (
                     <div className="hidden lg:block absolute -right-4 top-1/2 translate-y-full opacity-20">
                       <MoveRight className="w-8 h-8 rotate-90" />
                     </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Corner decoration */}
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-400/20 rounded-full blur-[60px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
