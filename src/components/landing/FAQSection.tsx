import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        q: "Is Connecta free to use?",
        a: "You can create an account and browse courses for free. Some courses are free, while premium courses and cohort programs require payment. We also offer scholarships for qualifying applicants.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept credit/debit cards (Visa, Mastercard), bank transfers, mobile money, and Flutterwave. All prices are displayed in NGN but charged in your local currency where supported.",
    },
    {
        q: "Are the certificates accredited?",
        a: "Yes. Certificates are issued by Connecta (She Leads Africa) and are recognised by our 200+ employer partners. Programs co-created with companies like Google and Microsoft carry additional co-branding.",
    },
    {
        q: "How do cohort programs work?",
        a: "Cohort programs run on a fixed schedule with a start and end date. You learn alongside a Tribe of ambitious women with live instructor sessions, group projects, and Sister-Mentorship. This model delivers 3× higher completion rates.",
    },
    {
        q: "Can I learn at my own pace?",
        a: "Absolutely. All individual courses are fully self-paced. Cohort programs follow a structured timeline but offer flexibility within each week to accommodate working professionals.",
    },
    {
        q: "Do you offer team or enterprise plans?",
        a: "Yes! We offer team plans starting at 25 seats with bulk pricing, custom learning paths, and a dedicated team dashboard. Visit our For Teams page to learn more.",
    },
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-16 sm:py-20 bg-background">
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center mb-12"
                    >
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">FAQ</span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Frequently asked questions</h2>
                        <p className="text-muted-foreground">Everything you need to know about Connecta.</p>
                    </motion.div>

                    <div className="space-y-2">
                        {faqs.map((faq, i) => {
                            const isOpen = openIndex === i;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                    className="bg-card rounded-2xl border border-border overflow-hidden"
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="font-semibold text-foreground text-sm pr-4">{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
