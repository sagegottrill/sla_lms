import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Users, Flame, Zap, Star, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}



export default function CtaSection() {
  const { isAuthenticated } = useAuth();
  const countdown = useCountdown("2026-03-31T23:59:59");


  return (
    <section className="py-16 sm:py-20 gradient-hero relative overflow-hidden">
      {/* Subtle animated dots */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Urgency banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30">
              <Flame className="w-4 h-4 text-secondary animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-secondary">Data Leadership Accelerator — Only 23 spots left</span>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left — Urgency copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-5 text-secondary">
                <CalendarDays className="w-3.5 h-3.5" /> Enrollment Closing Soon
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold text-primary-foreground mb-5 leading-[1.1]">
                Don't wait until<br />
                <span className="text-secondary">you're "ready."</span>
              </h2>
              <p className="text-primary-foreground/60 text-base sm:text-lg mb-8 leading-relaxed max-w-lg">
                Your empire isn't going to build itself. The Professionals who achieved their goals didn't wait. Next cohort applications close in:
              </p>

              {/* Countdown timer */}
              <div className="grid grid-cols-4 gap-3 mb-8 max-w-sm">
                {[
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.minutes, label: "Min" },
                  { value: countdown.seconds, label: "Sec" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-primary-foreground/8 border border-primary-foreground/12">
                    <div className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground tabular-nums">{String(value).padStart(2, "0")}</div>
                    <div className="text-[10px] text-primary-foreground/45 uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-xl px-8 h-12 text-base font-semibold hover:opacity-90 shadow-brand-md bg-secondary text-primary gap-2">
                    {isAuthenticated ? "Go to Dashboard" : "Secure Your Spot"} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/programs" className="w-full sm:w-auto">
                  <Button size="lg"
                    className="w-full sm:w-auto rounded-xl px-8 h-12 text-base font-semibold bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm">
                    View All Programs
                  </Button>
                </Link>
              </div>

            </motion.div>

            {/* Right — Stats + live activity */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="space-y-4"
            >
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "95%", label: "Completion rate", icon: Zap },
                  { value: "87%", label: "Got hired within 6 months", icon: Users },
                  { value: "+131%", label: "Average income increase", icon: Star },
                  { value: "4.9/5", label: "Learner satisfaction", icon: Star },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="p-4 rounded-xl bg-primary-foreground/6 border border-primary-foreground/10">
                    <Icon className="w-4 h-4 text-secondary mb-2" />
                    <div className="font-display text-xl font-bold text-primary-foreground">{value}</div>
                    <p className="text-[10px] text-primary-foreground/45 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>




            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
