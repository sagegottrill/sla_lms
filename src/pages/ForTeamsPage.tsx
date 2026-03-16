import { motion } from "framer-motion";
import { Users, BarChart3, Award, Shield, ArrowRight, CheckCircle2, Building2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const benefits = [
    { title: "Bulk Enrollment", desc: "Enroll your entire team in curated learning paths with a single dashboard.", icon: Users },
    { title: "Progress Tracking", desc: "Real-time analytics on team completion rates, engagement, and skill gaps.", icon: BarChart3 },
    { title: "Custom Programs", desc: "Work with our team to build bespoke training aligned to your business KPIs.", icon: BookOpen },
    { title: "Accredited Certificates", desc: "Employees earn industry-recognized certificates that boost their profiles.", icon: Award },
];

const tiers = [
    { name: "Starter", price: '₦500,000', period: "/quarter", seats: "Up to 25 seats", features: ["Access to all courses", "Team dashboard", "Email support", "Quarterly reports"], highlight: false },
    { name: "Growth", price: '₦1,000,000', period: "/quarter", seats: "Up to 100 seats", features: ["Everything in Starter", "Custom learning paths", "Dedicated account manager", "API access", "Monthly reports"], highlight: true },
    { name: "Enterprise", price: "Custom", period: "", seats: "Unlimited seats", features: ["Everything in Growth", "Custom programs", "On-site workshops", "SSO integration", "SLA guarantees", "White-label option"], highlight: false },
];

const logos = ["Access Bank", "GTBank", "Flutterwave", "MTN", "Andela", "Microsoft", "Google", "Paystack"];

export default function ForTeamsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero */}
            <section className="pt-16">
                <div className="gradient-hero py-20 sm:py-28">
                    <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <span className="inline-flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-[0.15em] mb-5">
                                    <Building2 className="w-4 h-4" /> For Teams & Enterprise
                                </span>
                                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-5 leading-tight">
                                    Upskill your workforce.<br />Measurably.
                                </h1>
                                <p className="text-primary-foreground/65 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
                                    Give your team access to SLA's structured programs, industry certifications, and on-demand courses — with real-time analytics to track ROI.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link to="/signup">
                                        <Button size="lg" className="rounded-xl px-8 h-12 bg-secondary text-primary font-semibold hover:opacity-90 gap-2">
                                            Get Started <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <a href="mailto:teams@sheleadsafrica.org">
                                        <Button size="lg" className="rounded-xl px-8 h-12 font-semibold bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm">
                                            Contact Sales
                                        </Button>
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By */}
            <section className="py-10 border-b border-border">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold text-center mb-6">Trusted by leading organizations</p>
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                        {logos.map(l => (
                            <span key={l} className="text-sm font-bold text-foreground/25 hover:text-foreground/50 transition-colors">{l}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 sm:py-20">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Why Teams Choose Connecta</span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Everything your team needs</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {benefits.map(({ title, desc, icon: Icon }, i) => (
                            <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-card rounded-2xl border border-border p-6 hover:shadow-brand-sm transition-shadow">
                                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-display font-bold text-foreground mb-2">{title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-16 sm:py-20 bg-muted/30">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">Pricing</span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Simple pricing for every team</h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">All plans include full course access, team dashboards, and learner certificates.</p>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                        {tiers.map(({ name, price, period, seats, features, highlight }, i) => (
                            <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className={`rounded-2xl border p-6 flex flex-col ${highlight ? "border-primary bg-card shadow-brand-md scale-[1.02]" : "border-border bg-card"}`}>
                                {highlight && <span className="text-[10px] font-bold text-primary-foreground bg-primary px-3 py-1 rounded-full w-fit mb-4">MOST POPULAR</span>}
                                <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
                                <p className="text-xs text-muted-foreground mb-4">{seats}</p>
                                <div className="mb-5">
                                    <span className="font-display text-3xl font-bold text-foreground">{price}</span>
                                    <span className="text-sm text-muted-foreground">{period}</span>
                                </div>
                                <ul className="space-y-2.5 flex-1 mb-6">
                                    {features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{f}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/signup">
                                    <Button className={`w-full rounded-xl h-10 text-sm font-semibold ${highlight ? "gradient-card text-primary-foreground hover:opacity-90" : "border-2 border-primary text-primary bg-transparent hover:bg-primary/5"}`}>
                                        {price === "Custom" ? "Contact Us" : "Get Started"}
                                    </Button>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 gradient-hero">
                <div className="container mx-auto px-5 sm:px-6 lg:px-8 text-center">
                    <Shield className="w-10 h-10 text-secondary mx-auto mb-4" />
                    <h2 className="font-display text-3xl font-bold text-primary-foreground mb-3">Ready to transform your team?</h2>
                    <p className="text-primary-foreground/60 mb-8 max-w-md mx-auto">Join 200+ organizations using Connecta to upskill their workforce.</p>
                    <a href="mailto:teams@connecta.africa">
                        <Button size="lg" className="rounded-xl px-8 h-12 bg-secondary text-primary font-semibold hover:opacity-90">
                            Talk to Sales
                        </Button>
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    );
}
