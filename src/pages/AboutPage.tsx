import { motion } from "framer-motion";
import { Target, Users, Award, TrendingUp, Globe, Heart, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const stats = [
    { value: "300,000+", label: "Professionals Trained", icon: Users },
    { value: "30+",      label: "African Countries",    icon: Globe },
    { value: "200+",     label: "Employer Partners",    icon: Briefcase },
    { value: "+131%",    label: "Avg. Income Growth",   icon: TrendingUp },
];

const values = [
    {
        title: "Excellence",
        desc: "We set the highest standards in curriculum design, instruction quality, and learner outcomes — because Africa's women deserve nothing less.",
        icon: Award,
    },
    {
        title: "Community",
        desc: "Learning is stronger together. Our cohort model creates accountability, deep friendships, and lifelong professional networks.",
        icon: Heart,
    },
    {
        title: "Impact",
        desc: "Every program delivers measurable outcomes — real jobs, real income growth, real transformation in women's lives.",
        icon: Target,
    },
    {
        title: "Accessibility",
        desc: "World-class education must reach every ambitious woman across Africa, regardless of location, background, or financial standing.",
        icon: Globe,
    },
];

const team = [
    {
        name: "Yasmin Belo-Osagie",
        role: "Co-Founder & CEO",
        initials: "YB",
        bio: "Harvard-educated entrepreneur and global advocate for African women's economic empowerment.",
        img: null,
    },
    {
        name: "Afua Osei",
        role: "Co-Founder & COO",
        initials: "AO",
        bio: "Wharton MBA. Builds systems that turn ambition into measurable career outcomes for women across Africa.",
        img: null,
    },
    {
        name: "Dr. Amara Johnson",
        role: "VP of Learning",
        initials: "AJ",
        bio: "PhD in Education Technology. Architect of SLA's signature cohort-based curriculum model.",
        img: null,
    },
    {
        name: "Kemi Adeyemi",
        role: "Head of Partnerships",
        initials: "KA",
        bio: "Connects SLA graduates to 200+ employer partners across Africa, Europe, and North America.",
        img: null,
    },
];

const achievements = [
    "Founded in 2014 with a mission to shift the African career landscape",
    "Trained 300,000+ women across 30+ countries on the continent",
    "Partners include Google, Microsoft, Goldman Sachs, and Access Bank",
    "Alumni see an average income increase of 131% within 18 months",
    "Connecta is SLA's flagship digital learning platform for structured career advancement",
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero */}
            <section className="pt-16">
                <div className="gradient-hero py-24 sm:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(hsl(204 80% 80%) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                    <div className="container mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
                        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <span className="inline-block text-xs font-bold text-secondary uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full border border-secondary/30 bg-accent">
                                About She Leads Africa
                            </span>
                            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight max-w-4xl mx-auto">
                                Identifying, training, and investing in Africa's next generation of women leaders.
                            </h1>
                            <p className="text-primary-foreground/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                                Since 2014, She Leads Africa has dedicated itself to one bold idea: African women who are equipped, connected, and funded will transform the continent.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-14 border-b border-border bg-card">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                        {stats.map(({ value, label, icon: Icon }, i) => (
                            <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-card text-center py-10 px-6">
                                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">{value}</div>
                                <div className="text-sm text-muted-foreground mt-1.5 font-medium">{label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20 sm:py-24">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                        <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-4">Our Mission</span>
                            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
                                We exist to close the opportunity gap for African women.
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                She Leads Africa was founded on a simple but powerful belief: African women deserve the same quality of career infrastructure that professionals in global markets take for granted.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Connecta is the next step in that mission — a full learning management system built for our community. Structured cohort programs, on-demand courses, industry certifications, and direct employer connections, all in one place.
                            </p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-3">
                            {achievements.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 sm:py-24 bg-muted/30">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Our Values</span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">What drives everything we do</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {values.map(({ title, desc, icon: Icon }, i) => (
                            <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-card rounded-2xl border border-border p-7 group hover:shadow-brand-sm hover:border-primary/20 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                                    <Icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="font-display text-lg font-bold text-foreground mb-3">{title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 sm:py-24">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Leadership</span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Meet the Team</h2>
                        <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm">The people driving She Leads Africa's mission across the continent and beyond.</p>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {team.map(({ name, role, initials, bio }, i) => (
                            <motion.div key={name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-brand-sm transition-all duration-300">
                                {/* Photo placeholder — replace with <img> when photos are available */}
                                <div className="h-52 gradient-card relative flex items-center justify-center">
                                    <span className="text-4xl font-bold text-primary-foreground/90 font-display select-none">{initials}</span>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                </div>
                                <div className="p-5">
                                    <h4 className="font-display font-bold text-foreground">{name}</h4>
                                    <p className="text-xs font-semibold text-secondary mt-0.5 mb-3">{role}</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{bio}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 gradient-hero relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(hsl(204 80% 80%) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                <div className="container mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">Ready to join the community?</h2>
                    <p className="text-primary-foreground/65 mb-8 max-w-lg mx-auto">Join 300,000+ ambitious women across Africa already shaping their futures through She Leads Africa.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/signup">
                            <Button size="lg" className="rounded-xl px-8 h-12 bg-secondary text-primary font-semibold hover:opacity-90">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link to="/programs">
                            <Button size="lg" className="rounded-xl px-8 h-12 font-semibold bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm">
                                Browse Programs
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
