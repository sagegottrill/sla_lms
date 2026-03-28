import { Mail, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

/**
 * Lightweight “teams / partners” route — no employer portal or pricing.
 * Voice-note direction: LMS-first; enterprise enquiries go through email.
 */
export default function ForTeamsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Organizations & partners</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            Cohort learning for teams
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            This site is focused on learners taking SLA programs and courses. If you represent a company, school, or sponsor
            interested in cohort access, custom programmes, or partnerships, write to us — we’ll route you to the right lead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <Link to="/programs">
              <Button size="lg" className="rounded-xl px-8 h-12 w-full sm:w-auto gap-2">
                <BookOpen className="w-4 h-4" /> Browse programs
              </Button>
            </Link>
            <a href="mailto:info@sheleadsafrica.org?subject=Organizational%20%2F%20partner%20enquiry">
              <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 w-full sm:w-auto gap-2">
                <Mail className="w-4 h-4" /> info@sheleadsafrica.org
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-10 flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Instructor accounts are invite-only from your SLA admin dashboard.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
