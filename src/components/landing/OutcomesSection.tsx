import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Briefcase, GraduationCap, DollarSign, Star, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const beforeAfter = [
  {
    name: "Adaeze Okafor",
    avatar: "AO",
    before: { role: "Admin Assistant", company: "Small firm", salary: "₦1.2M/yr" },
    after: { role: "Senior Data Analyst", company: "Access Bank", salary: "₦8.5M/yr" },
    program: "Data Leadership Accelerator",
    increase: "+608%",
    timeframe: "14 months",
  },
  {
    name: "Kamara Bah",
    avatar: "KB",
    before: { role: "Marketing Intern", company: "Startup", salary: "₦3.6M/yr" },
    after: { role: "Head of Growth", company: "Jumia", salary: "₦14M/yr" },
    program: "Digital Marketing Accelerator",
    increase: "+567%",
    timeframe: "18 months",
  },
  {
    name: "Nneoma Ude",
    avatar: "NU",
    before: { role: "Unemployed Graduate", company: "—", salary: "₦0" },
    after: { role: "Full-Stack Developer", company: "Andela", salary: "₦12M/yr" },
    program: "Tech Founders Bootcamp",
    increase: "Power Move",
    timeframe: "10 months",
  },
];

const hiringCompanies = [
  "Flutterwave", "Access Bank", "Andela", "MTN", "Paystack", "Jumia",
  "Microsoft", "Google", "GTBank", "Stanbic", "Dangote", "PwC Africa",
];

const impactStats = [
  { value: "50,000+", label: "Network of ambitious women", icon: DollarSign },
  { value: "10+", label: "Years of foundational legacy", icon: Briefcase },
  { value: "25+", label: "Countries represented", icon: MapPin },
];

export default function OutcomesSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 sm:mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 text-primary">
            Proven Results
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Real Professionals. Real outcomes.
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
                We don't just teach skills — we build empires. Here's what happens when you join the Tribe.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Impact stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {impactStats.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-5 text-center hover:shadow-brand-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">{value}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Before → After stories */}
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" /> Career Transformations
          </h3>
          <div className="grid md:grid-cols-3 gap-5">
            {beforeAfter.map((story, i) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-md transition-all"
              >
                {/* Header */}
                <div className="gradient-hero p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-foreground/15 border border-primary-foreground/20 flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {story.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-primary-foreground text-sm">{story.name}</p>
                    <p className="text-[10px] text-primary-foreground/50">{story.program}</p>
                  </div>
                  <div className="ml-auto px-2.5 py-1 rounded-full bg-secondary/25 text-secondary text-xs font-bold">
                    {story.increase}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Before */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Before Connecta</span>
                    </div>
                    <div className="pl-3 border-l-2 border-border space-y-1">
                      <p className="text-sm text-foreground font-medium">{story.before.role}</p>
                      <p className="text-xs text-muted-foreground">{story.before.company}</p>
                      <p className="text-xs text-muted-foreground">{story.before.salary}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-secondary" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{story.timeframe}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* After */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">After Connecta</span>
                    </div>
                    <div className="pl-3 border-l-2 border-secondary/30 space-y-1">
                      <p className="text-sm text-foreground font-semibold">{story.after.role}</p>
                      <p className="text-xs text-primary font-medium flex items-center gap-1"><Building className="w-3 h-3" />{story.after.company}</p>
                      <p className="text-xs text-secondary font-bold">{story.after.salary}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hiring companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl border border-border p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Where Our Graduates Work
              </h3>
              <p className="text-sm text-muted-foreground mt-1">200+ employers actively recruit from Connecta programs</p>
            </div>
            <Link to="/programs">
              <Button variant="outline" className="rounded-xl text-sm shrink-0">
                View Programs <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {hiringCompanies.map((company, i) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.04, y: -1 }}
                className="px-4 py-2.5 rounded-xl bg-muted/60 border border-border text-sm font-semibold text-foreground/60 hover:text-primary hover:border-primary/20 transition-all cursor-default"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
