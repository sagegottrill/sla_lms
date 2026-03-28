import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How are She Leads Africa programs different from typical online courses?",
    a: "SLA programs are cohort-based, meaning you learn alongside a group of ambitious women on the same schedule. Each program includes live sessions with industry practitioners, real-world case studies drawn from African markets, and access to our alumni community — not just pre-recorded videos."
  },
  {
    q: "Can I try the platform before committing to a paid program?",
    a: "Yes! We offer free introductory courses and micro-certifications so you can explore career tracks like Data Analytics, Leadership, and Entrepreneurship before enrolling in a full cohort program."
  },
  {
    q: "Are SLA certificates recognized?",
    a: "Our certificates reflect completed learning on this platform. Graduates use them in portfolios and professional profiles; curriculum is aligned with practical skills for African markets."
  },
  {
    q: "I'm not in Nigeria — can I still participate?",
    a: "Yes! SLA serves women across 20+ African countries and beyond. All courses and programs are delivered online, so you can participate from anywhere. Our community includes members from Lagos to Nairobi to Accra to Johannesburg and beyond."
  },
  {
    q: "What kind of support do I get during a program?",
    a: "Every cohort program comes with a dedicated program manager, peer accountability groups, career coaching sessions, and access to the private SLA community where you can network with fellow learners and alumni."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about learning with She Leads Africa.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="group border-b border-border/60">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors"
                >
                  <span className="text-base sm:text-lg font-bold text-foreground pr-8">
                    {faq.q}
                  </span>
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 flex items-center justify-center transition-all",
                    openIndex === index ? "bg-primary border-primary text-white" : "group-hover:border-primary/40"
                  )}>
                    {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 text-muted-foreground leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-16 p-8 rounded-2xl bg-muted/30 ring-1 ring-black/5 dark:ring-white/10 border-0 text-center"
          >
            <HelpCircle className="w-10 h-10 text-primary/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-6">Can't find the answer you're looking for? Please chat with our friendly team.</p>
            <button className="text-sm font-bold text-primary hover:text-primary/90 transition-colors">
              Get in touch
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
