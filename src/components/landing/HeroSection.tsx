import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import hero1 from "@/assets/hero/1.jpg";
import hero2 from "@/assets/hero/2.jpg";
import hero3 from "@/assets/hero/3.jpg";
import hero4 from "@/assets/hero/4.jpg";
import hero5 from "@/assets/hero/5.jpg";
import hero6 from "@/assets/hero/6.jpg";
import hero7 from "@/assets/hero/7.jpg";
import hero8 from "@/assets/hero/8.jpg";
import hero9 from "@/assets/hero/9.jpg";
import hero10 from "@/assets/hero/10.jpg";
import hero11 from "@/assets/hero/11.jpg";

const ROTATE_MS = 5500;

const HERO_SLIDES = [
  { src: hero1, alt: "Women collaborating at a She Leads Africa programme", position: "center 35%" },
  { src: hero2, alt: "Learners engaging in a professional development session", position: "center center" },
  { src: hero3, alt: "Community of women building career skills together", position: "center 30%" },
  { src: hero4, alt: "Participants at a She Leads Africa learning event", position: "center 40%" },
  { src: hero5, alt: "Women networking and learning at a career programme", position: "center center" },
  { src: hero6, alt: "Group session at a She Leads Africa workshop", position: "center 35%" },
  { src: hero7, alt: "Portrait of a learner at a She Leads Africa event", position: "center top" },
  { src: hero8, alt: "Women participating in a leadership programme", position: "center center" },
  { src: hero9, alt: "Learners at a She Leads Africa community gathering", position: "center 40%" },
  { src: hero10, alt: "Professional development session for African women leaders", position: "center center" },
  { src: hero11, alt: "Women celebrating progress at a She Leads Africa programme", position: "center 35%" },
] as const;

export default function HeroSection() {
  const { openAuthModal } = useAuth();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const activeSlide = HERO_SLIDES[index];

  return (
    <section className="relative overflow-hidden min-h-[72vh] sm:min-h-[78vh]">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlide.src}
            src={activeSlide.src}
            alt={activeSlide.alt}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: activeSlide.position }}
          />
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/25" />

      <div className="relative container mx-auto px-5 sm:px-6 lg:px-8 py-24 sm:py-28 lg:py-32">
        <div className="max-w-2xl text-white space-y-6">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
            Achieve your career goals with world-class learning
          </h1>

          <p className="text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
            Learn practical skills from world-class institutions and industry experts, on your schedule.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
            <button onClick={() => openAuthModal("signup")}>
              <Button size="lg" className="rounded-lg px-8 h-12 text-base font-semibold bg-primary text-white hover:bg-primary/90 gap-2">
                Join for Free <ArrowRight className="w-4 h-4" />
              </Button>
            </button>
            <Link to="/programs">
              <Button
                variant="outline"
                size="lg"
                className="rounded-lg px-8 h-12 text-base font-semibold border-white/35 text-white bg-white/10 hover:bg-white/20"
              >
                Explore Programs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show hero slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
