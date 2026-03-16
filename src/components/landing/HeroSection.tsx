import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const outcomes = [
  "Cohort programs in Data, Tech & Business",
  "Certificates recognised by 200+ employers",
  "Job matching & career placement support",
];

const stats = [
  { value: "50K+", label: "Learners" },
  { value: "10+", label: "Years Impact" },
  { value: "95%", label: "Completion" },
  { value: "200+", label: "Employers" },
];

const partners = [
  { name: "Jobberman", logo: null },
  { name: "Darling", logo: null },
  { name: "Veuve Clicquot", logo: null },
  { name: "BellaNaija", logo: null },
  { name: "MTN", logo: null },
  { name: "Microsoft", logo: null },
];

const learnerAvatars = [
  { initials: "AO", color: "bg-gradient-to-br from-primary to-primary-light" },
  { initials: "NK", color: "bg-secondary" },
  { initials: "FH", color: "bg-primary" },
  { initials: "ZM", color: "bg-primary/70" },
];

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  return (
    <section ref={heroRef} className="bg-background pt-16 overflow-hidden">
      {/* ─── HERO IMAGE — rounded rectangle inside container ─── */}
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-[220px] sm:h-[320px] md:h-[400px] lg:h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          <motion.div
            style={{ y: imageY, scale: imageScale }}
            className="absolute inset-0 will-change-transform"
          >
            <img
              src="/21.jpg"
              alt="She Leads Africa Learner"
              className="w-full h-full object-cover object-[center_30%]"
            />
          </motion.div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />
        </motion.div>
      </div>

      {/* ─── CONTENT BELOW IMAGE ─── */}
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl pt-8 sm:pt-10 pb-10">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-2.5 mb-4"
          >
            <span className="w-6 h-0.5 bg-secondary rounded-full" />
            <span className="text-xs font-bold text-secondary uppercase tracking-[0.18em]">
              She Leads Africa
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07 }}
            className="font-display text-[36px] sm:text-[44px] lg:text-[56px] xl:text-[64px] font-bold text-foreground leading-[1.05] tracking-tight mb-4"
          >
            Your career,
            <br />
            <span className="text-primary">redefined.</span>
          </motion.h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 max-w-xl"
          >
            Structured programs in data, tech, and leadership — built for
            ambitious African women ready to earn more and lead more.
          </motion.p>

          {/* Checklist */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-2 mb-7"
          >
            {outcomes.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm text-foreground/80"
              >
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </motion.ul>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.26 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button
                size="lg"
                className="h-12 px-8 text-sm font-semibold rounded-xl gradient-card text-primary-foreground shadow-md hover:opacity-90 gap-2 transition-opacity"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start for Free"} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/programs">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-sm font-semibold rounded-xl border-border text-foreground hover:bg-muted"
              >
                Browse Programs
              </Button>
            </Link>
          </motion.div>

          {/* Social proof row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.34 }}
            className="flex items-center gap-3"
          >
            <div className="flex -space-x-2.5">
              {learnerAvatars.map((a) => (
                <div
                  key={a.initials}
                  className={`w-8 h-8 rounded-full ${a.color} border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 text-secondary fill-secondary"
                  />
                ))}
                <span className="text-xs font-bold text-foreground ml-1">
                  4.9
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Trusted by{" "}
                <strong className="text-foreground">50,000+</strong> women
                across Africa
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.44 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 py-8 px-4 sm:px-8 rounded-2xl bg-muted/40 border border-border/60 mb-10"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── TRUST STRIP ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="border-y border-border bg-muted/30 backdrop-blur-sm"
      >
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] shrink-0">
              Learners from
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-8 sm:gap-x-10 gap-y-3">
              {partners.map(({ name }) => (
                <motion.span
                  key={name}
                  whileHover={{ opacity: 1, scale: 1.05 }}
                  className="text-sm sm:text-base font-bold text-foreground/30 hover:text-foreground/60 transition-all duration-200 cursor-default select-none"
                >
                  {name}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
