/**
 * Single source of truth for the facts that appear in legal pages, the footer
 * and structured data. Change a value here once instead of hunting through
 * policy prose.
 *
 * ⚠️ REVIEW BEFORE RELYING ON THIS: the fields marked [CONFIRM] are commercial
 * or legal choices, not facts I could read out of the codebase. Confirm them
 * with the business/legal owner (or local counsel) and edit here.
 */
export const LEGAL_COMPANY = {
  /** Registered entity shown in the footer as operating the platform. */
  legalName: "Devorent Nigeria Limited",
  /** Consumer-facing brand. */
  brandName: "She Leads Africa — CONNECT HER",
  shortBrandName: "SLA ConnectHer",
  /** Public URL of this platform. */
  siteUrl: "https://connecther.sheleadsafrica.org",
  /** Parent/group site. */
  groupSiteUrl: "https://sheleadsafrica.org",
  /** Address shown on policy pages. */
  addressLines: ["Lagos, Nigeria"],
  /** Privacy, refunds, legal notices and account requests all land here. */
  contactEmail: "info@sheleadsafrica.org",
  /** Target response time for data-subject and refund requests. */
  contactResponseDays: 30,

  /** [CONFIRM] Entity registration number, if you want it published. */
  registrationNumber: null as string | null,
  /** [CONFIRM] VAT/tax identification number, if you want it published. */
  taxId: null as string | null,

  /**
   * [CONFIRM] Refund window in days, counted from the date of purchase, for
   * unused enrolments. 7 days is the provisional default — this is a commercial
   * promise, so it must match what you actually honour at the payment provider.
   */
  refundWindowDays: 7,
  /** [CONFIRM] Business days a refund takes to settle after approval. */
  refundProcessingDays: 10,

  /**
   * [CONFIRM] Minimum age. The Terms assert 18+ (or a guardian's consent) and the
   * Privacy Policy treats anyone younger as a child whose data needs guardian
   * consent — keep these two consistent if you change this.
   */
  minimumAge: 18,

  /** Governing law + forum named in the Terms. */
  governingLaw: "the Federal Republic of Nigeria",
  /** [CONFIRM] Courts named as the forum for disputes. */
  jurisdiction: "the courts of Lagos State, Nigeria",

  /** Date printed at the top of every policy page. Update on each material edit. */
  lastUpdated: "18 September 2026",
} as const;
