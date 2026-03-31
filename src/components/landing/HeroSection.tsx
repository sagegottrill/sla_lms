import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroSection() {
  const { openAuthModal } = useAuth();
  return (
    <section className="relative overflow-hidden min-h-[72vh] sm:min-h-[78vh]">
      <img
        src="/sla_hero_career_fair.jpg"
        alt="Learners at a She Leads Africa programme"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

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
    </section>
  );
}
