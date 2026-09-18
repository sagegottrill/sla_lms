import LegalPageShell, { type LegalSection } from "@/components/legal/LegalPageShell";
import { LEGAL_COMPANY as C } from "@/lib/legal/company";

const sections: LegalSection[] = [
  {
    heading: "These terms",
    paragraphs: [
      `These Terms and Conditions govern your use of ${C.siteUrl} and the courses, programs, certificates and community offered through it (the "platform"). The platform is operated by ${C.legalName}, ${C.addressLines.join(", ")}.`,
      "By creating an account, enrolling in a course or program, or otherwise using the platform, you agree to these terms. If you do not agree, please do not use the platform.",
    ],
  },
  {
    heading: "Who may use the platform",
    bullets: [
      `You must be at least ${C.minimumAge} years old to create an account. If you are younger, you may only use the platform with the involvement and consent of a parent or guardian.`,
      "You must provide accurate information and keep it up to date. Enrolling or certifying under a false identity is a breach of these terms.",
      "You are responsible for making sure your use of the platform is lawful where you live.",
    ],
  },
  {
    heading: "Your account",
    bullets: [
      "Keep your password confidential. You are responsible for activity that happens through your account.",
      "Do not share, sell or transfer your account, or let anyone else complete assessments or certifications as you.",
      "Tell us promptly if you believe your account has been accessed without your permission.",
    ],
  },
  {
    heading: "Courses, programs and enrolment",
    bullets: [
      "Course and program descriptions, curricula, schedules and instructors may change. We may update, reschedule or withdraw a course or cohort where necessary, and will tell you if a change affects an enrolment you have paid for.",
      "Program cohorts have capacity limits and application requirements. Being eligible does not guarantee a place.",
      "Unless we expressly state otherwise for a specific offering, our courses and certificates are not accredited academic qualifications and do not confer a degree, diploma or professional licence.",
      "Individual course and program pages may include additional rules. Where they conflict with these terms, the specific page governs that offering.",
    ],
  },
  {
    heading: "Prices, payments and taxes",
    bullets: [
      "Prices are shown on each course or program page and may change. The price you pay is the one displayed when you complete checkout.",
      "Payments are processed by our payment provider. By paying, you also agree to their terms. We do not store your full card details.",
      "You are responsible for any taxes, duties or bank charges that apply in your country.",
    ],
  },
  {
    heading: "Refunds and cancellation",
    paragraphs: [
      `Refunds are governed by our Refund and Cancellation Policy at /refunds, which forms part of these terms. In short: you may request a refund within ${C.refundWindowDays} days of an unused course purchase, and program withdrawals follow the cohort rules set out in that policy.`,
      "Nothing in these terms or that policy removes any right you have under the consumer protection law of your country.",
    ],
  },
  {
    heading: "Your content",
    bullets: [
      "You keep ownership of the work you submit — portfolio pieces, résumés, assignments, forum posts and other materials.",
      "You grant us a non-exclusive licence to host, store, display and process that content only as needed to operate and improve the platform, to assess your work, and to issue certificates. This licence ends when you delete the content, except for copies retained in backups or where we must keep it by law.",
      "You confirm you have the rights to everything you upload, and that your content does not infringe anyone else's rights or break any law.",
      "Do not upload content that is unlawful, hateful, harassing, misleading, sexually explicit, or that shares someone else's personal data without their permission.",
      "We may remove content that breaches these terms, and may suspend accounts that repeatedly do so.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Copy, record, download, resell or redistribute course materials, videos or assessments, or share your access with others.",
      "Use the platform to scrape data, send spam, or run automated traffic against our systems.",
      "Attempt to bypass access controls, paywalls, cohort limits or assessment integrity measures.",
      "Impersonate She Leads Africa, an instructor, a partner organisation or another learner.",
      "Interfere with the platform's security, availability or integrity, or with other learners' use of it.",
      "Use the platform to build or train a competing product.",
    ],
  },
  {
    heading: "Intellectual property",
    paragraphs: [
      `All platform content — course videos, lesson text, assessments, design, branding, and the software itself — is owned by ${C.legalName} or its licensors and is protected by copyright and related rights. Your enrolment gives you a personal, non-transferable, non-exclusive licence to access that content for your own learning. It does not transfer ownership.`,
      "If you believe content on the platform infringes your rights, contact us with details and we will investigate and, where appropriate, remove it.",
    ],
  },
  {
    heading: "Third-party content and links",
    paragraphs: [
      "The platform may include embedded videos, links to employer listings, partner sites or other third-party material. We do not control that material and are not responsible for it. Where an opportunity is listed by a third party, any application, offer of employment or engagement is between you and that organisation.",
    ],
  },
  {
    heading: "Availability and changes to the service",
    paragraphs: [
      "We work to keep the platform available but we do not promise uninterrupted service. We may carry out maintenance, change features, or suspend parts of the platform, and we will try to give advance notice of anything that affects your access to paid content.",
    ],
  },
  {
    heading: "No guarantee of outcomes",
    paragraphs: [
      "The platform is educational. Completing a course or program does not guarantee employment, an interview, a promotion, a particular income, or any other specific outcome. Any testimonials, statistics or case studies we publish describe individual experiences and are not a promise of your results.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, we are not liable for indirect or consequential losses, loss of profit, loss of opportunity, or loss of data arising from your use of the platform. Where we are liable, our total liability is limited to the amount you paid us for the specific course or program giving rise to the claim.",
      "Nothing in these terms limits liability that cannot lawfully be limited, including for fraud, or for death or personal injury caused by our negligence.",
    ],
  },
  {
    heading: "Suspension and termination",
    bullets: [
      "You may stop using the platform at any time and can ask us to close your account.",
      "We may suspend or terminate your access if you breach these terms, if we are required to by law, or to protect other learners or the platform. Where a breach is serious, access may end immediately.",
      "If we terminate your account without cause, we will refund the unused portion of any fees you have paid for access you will no longer receive.",
    ],
  },
  {
    heading: "Governing law and disputes",
    paragraphs: [
      `These terms are governed by the laws of ${C.governingLaw}, and disputes are subject to the exclusive jurisdiction of ${C.jurisdiction}, without affecting any right you have to bring a claim in your own country under mandatory consumer law.`,
      `Before starting formal proceedings, please contact us at ${C.contactEmail} so we can try to resolve the matter directly.`,
    ],
  },
  {
    heading: "Changes to these terms",
    paragraphs: [
      "We may update these terms as the platform evolves. The date at the top of this page shows the current version. For material changes we will give reasonable notice before they take effect, and continuing to use the platform after that means you accept the updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms and Conditions"
      summary="The agreement between you and She Leads Africa for using CONNECT HER — accounts, courses, payments, content, conduct and liability."
      sections={sections}
    />
  );
}
