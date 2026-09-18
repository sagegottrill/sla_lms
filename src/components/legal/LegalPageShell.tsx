import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalPageShellProps {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
  /** Optional note rendered after the last section, before the contact block. */
  closingNote?: string;
}

/**
 * Shared chrome for /privacy, /terms, /cookies and /refunds.
 *
 * Content is passed as data rather than JSX so the four policies stay readable
 * and reviewable as prose in git diffs.
 */
export default function LegalPageShell({
  eyebrow,
  title,
  summary,
  sections,
  closingNote,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">{eyebrow}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-3">{summary}</p>
          <p className="text-xs text-muted-foreground mb-12">
            Last updated {LEGAL_COMPANY.lastUpdated} · Applies to {LEGAL_COMPANY.siteUrl}
          </p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-xl font-bold text-foreground mb-3">{section.heading}</h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2 mt-1">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="text-sm text-muted-foreground leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {closingNote && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-10">{closingNote}</p>
          )}

          <div className="mt-14 rounded-2xl bg-muted/50 ring-1 ring-black/5 p-6">
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Contact us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Questions about this policy, your data, a purchase or your account can be sent to{" "}
              <a
                href={`mailto:${LEGAL_COMPANY.contactEmail}`}
                className="text-primary font-semibold underline underline-offset-4 decoration-primary/30 hover:decoration-primary"
              >
                {LEGAL_COMPANY.contactEmail}
              </a>
              . We aim to reply within {LEGAL_COMPANY.contactResponseDays} days.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {LEGAL_COMPANY.legalName} · {LEGAL_COMPANY.addressLines.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <a href={`mailto:${LEGAL_COMPANY.contactEmail}`} className="hover:text-foreground transition-colors">
                {LEGAL_COMPANY.contactEmail}
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
