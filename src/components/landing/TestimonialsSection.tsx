import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Adaeze Okafor",
    role: "Data Analyst at Access Bank",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face",
    content: "Connecta completely transformed my career. The Data Leadership Accelerator gave me the skills and confidence to move from admin work to leading data projects at one of Nigeria's top banks.",
    rating: 5, program: "Data Leadership Accelerator",
  },
  {
    name: "Kamara Bah",
    role: "Tech Founder, Fintech startup",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
    content: "I came in knowing nothing about building software. After the Tech Founders Bootcamp, I launched my MVP and raised my first seed round. The mentors and community are truly world-class.",
    rating: 4, program: "Tech Founders Bootcamp",
  },
  {
    name: "Dr. Lindiwe Dube",
    role: "Finance Manager, MTN Group",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face",
    content: "The Women in Finance Certificate is exceptional. The curriculum is practical, the instructors are top-tier, and the network of women I built here has opened doors I never imagined.",
    rating: 5, program: "Women in Finance Certificate",
  },
];

const partners = ["Google", "Microsoft", "Flutterwave", "Access Bank", "MTN", "Andela", "Jumia", "Paystack"];

export default function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 sm:mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 text-primary">
            Success Stories
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Professionals who achieved their goals
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            Over 50,000 smart, ambitious young women have already built their empires with Connecta.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-16 sm:mb-20">
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col p-5 sm:p-6 rounded-2xl bg-card border border-border hover:shadow-brand-md transition-all duration-300">
              <Quote className="w-7 h-7 mb-4 opacity-10 text-primary" />
              <p className="text-foreground/75 text-sm leading-relaxed flex-1 mb-5">{t.content}</p>
              <div className="flex mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-secondary fill-secondary" />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/15" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-accent text-accent-foreground">
                  {t.program}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-7">
            Trusted by learners from leading organisations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {partners.map((partner) => (
              <motion.div key={partner} whileHover={{ scale: 1.03 }}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-card border border-border font-semibold text-xs sm:text-sm text-muted-foreground hover:text-primary hover:border-primary/20 transition-all">
                {partner}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
