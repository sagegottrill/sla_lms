import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroSection() {
  const { openAuthModal } = useAuth();
  return (
    <section className="relative pt-24 pb-16 bg-[#F5F5F5] overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          
          {/* Content side (Left) */}
          <div className="w-full lg:w-1/2 text-left space-y-6 order-2 lg:order-1">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              Achieve your career goals with world-class learning
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Learn practical skills from world-class institutions and industry experts—on your schedule.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <button onClick={() => openAuthModal("signup")}>
                <Button size="lg" className="rounded-lg px-8 h-12 text-base font-semibold bg-primary text-white hover:bg-primary/90 gap-2">
                  Join for Free <ArrowRight className="w-4 h-4" />
                </Button>
              </button>
              <Link to="/programs">
                <Button variant="outline" size="lg" className="rounded-lg px-8 h-12 text-base font-semibold ring-1 ring-black/5 dark:ring-white/10 border-0 hover:bg-muted gap-2">
                  Explore Programs
                </Button>
              </Link>
            </div>
          </div>

          {/* Image — full-width feel on mobile, balanced on desktop */}
          <div className="w-full lg:w-1/2 relative order-1 lg:order-2 -mx-5 sm:mx-0">
            <div className="relative rounded-none sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
              <img
                src="/sla_hero_career_fair.jpg"
                alt="Learners at a She Leads Africa programme"
                className="relative z-10 w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[340px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
