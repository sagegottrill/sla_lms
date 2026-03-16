import { motion } from "framer-motion";
import { Globe, Users, Briefcase, TrendingUp } from "lucide-react";

const differentiators = [
    {
        title: "African-Focused Content",
        desc: "Every course is built for the African market — real case studies, local industry examples, and culturally relevant teaching.",
        icon: Globe,
        color: "bg-accent text-primary",
    },
    {
        title: "Cohort Accountability",
        desc: "Learn alongside a community, not alone. Our cohort model delivers 3× higher completion rates than self-paced platforms.",
        icon: Users,
        color: "bg-accent text-primary",
    },
    {
        title: "Direct Employer Connections",
        desc: "Our employer network actively recruits from Connecta graduates — connecting you to real opportunities, not just certificates.",
        icon: Briefcase,
        color: "bg-accent text-primary",
    },
    {
        title: "Proven Career Impact",
        desc: "On average, Connecta alumni see a +131% income increase within 18 months of completing a program.",
        icon: TrendingUp,
        color: "bg-accent text-primary",
    },
];

export default function WhyConnectaSection() {
    return (
        <section className="py-16 sm:py-20 bg-background">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left — Headline */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Why Connecta?</span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-5 leading-tight">
                            Not just a platform.<br />A movement for African women.
                        </h2>
                        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg">
                            We combine high-growth curriculum with a powerful sisterhood and employer partnerships to deliver real power moves — not just certifications.
                        </p>
                    </motion.div>

                    {/* Right — Grid cards */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {differentiators.map(({ title, desc, icon: Icon, color }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -3 }}
                                className="bg-card rounded-2xl border border-border p-5 hover:shadow-brand-sm transition-all"
                            >
                                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-foreground text-sm mb-1.5">{title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
