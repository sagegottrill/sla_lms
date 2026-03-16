import { motion } from "framer-motion";
import { UserPlus, BookOpen, Users, Award } from "lucide-react";

const steps = [
    { step: "01", title: "Create your account", desc: "Sign up for free and tell us about your career goals so we can personalise your experience.", icon: UserPlus },
    { step: "02", title: "Explore & enroll", desc: "Browse 300+ courses or join a structured cohort program in data, tech, finance, and business.", icon: BookOpen },
    { step: "03", title: "Learn with the Tribe", desc: "Complete lessons alongside your cohort with live sessions, Sister-Mentors, and real-world projects.", icon: Users },
    { step: "04", title: "Earn & grow", desc: "Receive accredited certificates, build your portfolio, and make your next Power Move.", icon: Award },
];

export default function HowItWorksSection() {
    return (
        <section className="py-16 sm:py-20 bg-muted/30">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-12"
                >
                    <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">How It Works</span>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Start in 4 simple steps</h2>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {steps.map(({ step, title, desc, icon: Icon }, i) => (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className="relative bg-card rounded-2xl border border-border p-6 text-center hover:shadow-brand-sm transition-all group"
                        >
                            {/* Step number badge */}
                            <div className="w-10 h-10 rounded-full gradient-card flex items-center justify-center mx-auto mb-4 text-sm font-bold text-primary-foreground font-display group-hover:scale-110 transition-transform">
                                {step}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-display font-bold text-foreground mb-2 text-sm">{title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>

                            {/* Connector line (hidden on last + mobile) */}
                            {i < 3 && (
                                <div className="hidden lg:block absolute top-12 -right-3 w-6 border-t-2 border-dashed border-border" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
