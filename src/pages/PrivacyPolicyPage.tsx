import LegalPageShell, { type LegalSection } from "@/components/legal/LegalPageShell";
import { LEGAL_COMPANY as C } from "@/lib/legal/company";

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      `${C.brandName} is an online learning platform operated by ${C.legalName}, ${C.addressLines.join(", ")}. For the purposes of Nigeria's Data Protection Act 2023, Kenya's Data Protection Act 2019 and the EU/UK General Data Protection Regulation, ${C.legalName} is the data controller for the personal data described in this policy.`,
      `You can reach us about anything in this policy at ${C.contactEmail}.`,
    ],
  },
  {
    heading: "What we collect",
    paragraphs: ["We collect only what we need to run your account and deliver your learning:"],
    bullets: [
      "Account details you provide when you sign up: your full name and email address, and a password (stored only as a secure hash — we never see it in plain text).",
      "Profile information you choose to add after signing up, such as your goals, skills, portfolio items, résumé content and notification preferences.",
      "Learning activity: the courses and programs you enrol in, your progress, assessment submissions, forum posts and anything you submit through the platform.",
      "Certificate records: the name, credential identifier and completion details shown on a verifiable certificate.",
      "Payment information: paid enrolments are processed by our payment provider. We receive a payment reference, amount, currency, status and limited payer details (such as the email address used at checkout). We do not receive or store your full card number, CVV or bank credentials.",
      "Communications: messages you send to support, feedback you submit, and your consent records.",
      "Technical data: IP address, browser and device type, and server log data generated when you use the platform, used for security, reliability and diagnostics.",
    ],
  },
  {
    heading: "How we use your data, and why we are allowed to",
    bullets: [
      "To create and secure your account, and to authenticate you — this is necessary to perform our contract with you.",
      "To deliver courses, programs, assessments and certificates, and to track progress — performance of our contract.",
      "To process payments, invoices and refunds — performance of our contract and our legal accounting obligations.",
      "To send service messages such as enrolment confirmations, password resets, cohort schedules and certificate notices — performance of our contract. These are not marketing.",
      "To send marketing about courses, programs and opportunities — only with your consent, which you can withdraw at any time from your notification preferences or by emailing us.",
      "To keep the platform secure, prevent abuse and fix problems — our legitimate interest in operating a safe, reliable service.",
      "To meet legal, tax and regulatory obligations, and to respond to lawful requests — compliance with the law.",
    ],
  },
  {
    heading: "What we do not do",
    bullets: [
      "We do not sell or rent your personal data.",
      "We do not run advertising trackers, third-party analytics or behaviour-profiling pixels on this platform. We do not build advertising profiles of you.",
      "We do not use your portfolio, résumé or written submissions for anything other than providing the service to you, unless you explicitly ask us to share them.",
    ],
  },
  {
    heading: "Cookies and browser storage",
    paragraphs: [
      "We use a small amount of essential browser storage to keep you signed in and remember your preferences. No advertising or analytics cookies are set. See our Cookie and Storage Policy at /cookies for the full list of what is stored and how to clear it.",
    ],
  },
  {
    heading: "Who we share data with",
    paragraphs: [
      "We share personal data only with service providers who help us run the platform, and only as far as they need it. These are our categories of recipient:",
    ],
    bullets: [
      "Cloud hosting and content delivery: Vercel (website hosting and edge network).",
      "Database, authentication and file storage: Supabase, hosted in the European Union.",
      "Payment processing: Paystack, for card and bank payments and refunds.",
      "Optional social sign-in: Google, if you choose to sign in with a Google account.",
      "Video and media embeds: YouTube and Vimeo, which load content when a lesson or page includes an embedded video. Those providers may set their own storage when the embed loads.",
      "Email delivery and communication tools, used to send the service messages and marketing you have consented to.",
      "Professional advisers, auditors, or a prospective buyer in the event of a merger or acquisition, under confidentiality obligations.",
      "Law enforcement or regulators, where we are legally required to disclose.",
    ],
  },
  {
    heading: "International transfers",
    paragraphs: [
      "Some of our providers process data outside your country, including in the European Union, the United Kingdom and the United States. Where personal data leaves Nigeria or Kenya, we rely on appropriate safeguards — such as contractual protections and transfer mechanisms recognised under applicable law — and we only transfer to providers we have assessed for adequate protection.",
    ],
  },
  {
    heading: "How long we keep it",
    bullets: [
      "Account and profile data: while your account is active, and for a reasonable period afterwards in case you return. You can ask us to delete it at any time.",
      "Learning records and certificate records: kept for as long as the certificate needs to remain verifiable, so third parties who check a credential get an accurate answer.",
      "Payment and tax records: kept for the period required by applicable accounting and tax law.",
      "Support conversations: kept for a reasonable period so we can resolve follow-ups consistently.",
      "Server logs: kept for a short operational window unless we need them longer to investigate a security incident.",
    ],
  },
  {
    heading: "Keeping your data safe",
    paragraphs: [
      "We protect your data with encryption in transit, hashed passwords, role-based access controls in the platform and restricted access to production systems on a need-to-know basis. No online service can promise perfect security, but if a breach ever puts your rights at risk we will notify you and the relevant authority as required by law.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "Depending on where you live, you have some or all of the following rights over your personal data. We honour these requests regardless of which law gives them to you, as a matter of good practice:",
    ],
    bullets: [
      "Access — a copy of the personal data we hold about you.",
      "Correction — fixing data that is inaccurate or incomplete.",
      "Deletion — erasing data we no longer need, subject to records we must keep by law (for example, certificate and tax records).",
      "Restriction and objection — limiting how we use your data, including objecting to marketing at any time.",
      "Portability — receiving your data in a structured, commonly used format where this applies.",
      "Withdrawing consent — where processing relies on consent, withdrawing it does not affect what we did before you withdrew.",
      "Complaining — see the section below.",
    ],
  },
  {
    heading: "Exercising your rights",
    paragraphs: [
      `Send your request to ${C.contactEmail} from the email address on your account, or tell us enough to identify you if you can no longer access it. We aim to respond within ${C.contactResponseDays} days. We may ask for information to confirm your identity before acting, so that we do not hand your data to someone else.`,
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      `The platform is intended for people aged ${C.minimumAge} and over. If you are below that age, you may only use it with the involvement and consent of a parent or guardian, who should contact us at ${C.contactEmail}. If we learn that we hold personal data of a child without the required guardian consent, we will delete it.`,
    ],
  },
  {
    heading: "Links to other sites",
    paragraphs: [
      "The platform links to third-party sites — for example employer listings, partner organisations or external opportunity pages. This policy does not cover them. Check their own privacy notices before sharing your data with them.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "If we change how we handle personal data, we will update this page and the date at the top. For material changes we will also tell you by email or in the platform before they take effect.",
    ],
  },
  {
    heading: "Complaints",
    paragraphs: [
      `Please contact us first at ${C.contactEmail} — most concerns are resolved faster that way. If you are not satisfied, you can complain to your local data protection authority, including the Nigeria Data Protection Commission, the Office of the Data Protection Commissioner in Kenya, or the supervisory authority in your EU/UK country of residence.`,
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      summary="What personal data we collect when you use CONNECT HER, why we collect it, who we share it with, and the rights you have over it."
      sections={sections}
    />
  );
}
