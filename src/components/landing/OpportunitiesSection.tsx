import { Link } from "react-router-dom";
import { ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OpportunitiesSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl ring-1 ring-black/5 p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Briefcase className="w-4 h-4" /> Opportunities
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Job openings from SLA partners and recruiters
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Browse roles like a job search platform, apply on company sites, or post your own openings if you are hiring.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/opportunities">
              <Button className="rounded-full px-6 h-11 font-semibold gap-2">
                Browse opportunities <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
