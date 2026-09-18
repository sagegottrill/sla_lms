import { CANONICAL_SITE_URL } from "./siteUrl";

/**
 * Per-route SEO.
 *
 * The app is a client-rendered SPA, so the only head tags a crawler is
 * guaranteed to see are the static ones in `index.html`. Everything below
 * improves what browsers, social scrapers with JS and Google's renderer see;
 * it does NOT replace server-side prerendering for the public marketing routes.
 */

export const SITE_NAME = "SLA ConnectHer";
export const SITE_URL = CANONICAL_SITE_URL;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/sla_logo_transparent.png`;
export const OG_IMAGE_ALT = "She Leads Africa — CONNECT HER learning platform";

export interface RouteSeo {
  /** Used verbatim as document.title (branding included where useful). */
  title: string;
  /** Keep under ~160 characters so Google does not truncate it. */
  description: string;
  /** Keep this path out of the index (private surface or soft-404). */
  noindex?: boolean;
}

/**
 * First matching rule wins, so order specific patterns before general ones
 * (`/courses/:id/checkout` must be tested before `/courses/:id`).
 *
 * Anything that matches no rule falls through to DEFAULT_SEO, which is
 * noindex — a path we did not consciously mark as public should never be
 * indexed as a duplicate of the app shell.
 */
const ROUTE_SEO: { pattern: RegExp; seo: RouteSeo }[] = [
  {
    pattern: /^\/$/,
    seo: {
      title: "SLA ConnectHer — Courses & Career Programs for African Women",
      description:
        "Practical courses, cohort programs and career pathways for ambitious African women. Learn online, earn certificates, get hired.",
    },
  },
  {
    pattern: /^\/courses$/,
    seo: {
      title: `Online Courses for African Women | ${SITE_NAME}`,
      description:
        "Browse self-paced courses in virtual assistance, design, data analysis, digital marketing and more. Learn practical skills and earn a certificate.",
    },
  },
  {
    pattern: /^\/courses\/[^/]+\/checkout$/,
    seo: {
      title: `Checkout | ${SITE_NAME}`,
      description: "Complete your course enrolment.",
      noindex: true,
    },
  },
  {
    pattern: /^\/courses\/[^/]+$/,
    seo: {
      title: `Course Details | ${SITE_NAME}`,
      description:
        "Course outline, instructor, duration and pricing for this She Leads Africa CONNECT HER course.",
    },
  },
  {
    pattern: /^\/programs$/,
    seo: {
      title: `Cohort Programs & Career Pathways | ${SITE_NAME}`,
      description:
        "Join a She Leads Africa cohort program: structured learning, mentorship and placement support for African women building careers.",
    },
  },
  {
    pattern: /^\/programs\/[^/]+\/apply$/,
    seo: {
      title: `Program Application | ${SITE_NAME}`,
      description: "Apply for this She Leads Africa cohort program.",
      noindex: true,
    },
  },
  {
    pattern: /^\/opportunities$/,
    seo: {
      title: `Jobs, Grants and Opportunities | ${SITE_NAME}`,
      description:
        "Curated jobs, internships, grants and scholarships for African women, updated by She Leads Africa.",
    },
  },
  {
    pattern: /^\/for-teams$/,
    seo: {
      title: `Training for Teams and Organisations | ${SITE_NAME}`,
      description:
        "Upskill your team with She Leads Africa — cohort-based training and measurable learning outcomes for organisations.",
    },
  },
  {
    pattern: /^\/privacy$/,
    seo: {
      title: `Privacy Policy | ${SITE_NAME}`,
      description:
        "How She Leads Africa collects, uses, stores and protects your personal data under Nigeria's NDPA, Kenya's DPA and the GDPR.",
    },
  },
  {
    pattern: /^\/terms$/,
    seo: {
      title: `Terms and Conditions | ${SITE_NAME}`,
      description:
        "The terms that govern your use of the CONNECT HER learning platform, accounts, courses, certificates and community.",
    },
  },
  {
    pattern: /^\/cookies$/,
    seo: {
      title: `Cookie and Storage Policy | ${SITE_NAME}`,
      description:
        "The cookies and browser storage CONNECT HER uses, why each is needed, and how to control them.",
    },
  },
  {
    pattern: /^\/refunds$/,
    seo: {
      title: `Refund and Cancellation Policy | ${SITE_NAME}`,
      description:
        "When and how you can request a refund or cancel an enrolment, and how long a refund takes to reach you.",
    },
  },
  // Private / account surfaces: reachable only with an account, so they must not
  // compete with public pages in search results.
  {
    pattern: /^\/(dashboard|onboarding|forgot-password|reset-password|auth|verify)(\/|$)/,
    seo: {
      title: `Account | ${SITE_NAME}`,
      description: "Your She Leads Africa CONNECT HER account.",
      noindex: true,
    },
  },
];

const DEFAULT_SEO: RouteSeo = {
  title: `Page not found | ${SITE_NAME}`,
  description: "The page you are looking for could not be found.",
  noindex: true,
};

/** Strip query/hash-agnostic trailing slashes so `/courses/` === `/courses`. */
export function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function resolveRouteSeo(pathname: string): RouteSeo {
  const path = normalizePath(pathname);
  for (const rule of ROUTE_SEO) {
    if (rule.pattern.test(path)) return rule.seo;
  }
  return DEFAULT_SEO;
}

/**
 * Canonical is always built from the production origin, never `window.location`,
 * so Vercel preview deployments do not emit self-referencing canonicals that
 * would compete with the live site.
 */
export function canonicalUrlFor(pathname: string): string {
  const path = normalizePath(pathname);
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

/** Apply the metadata for `pathname` to the live document head. */
export function applyRouteSeo(pathname: string): void {
  if (typeof document === "undefined") return;

  const path = normalizePath(pathname);
  const seo = resolveRouteSeo(path);
  const canonical = canonicalUrlFor(path);

  document.title = seo.title;

  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  upsertCanonical(canonical);

  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:type", path === "/" ? "website" : "article");
  upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
  upsertMeta("property", "og:image:alt", OG_IMAGE_ALT);

  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", DEFAULT_OG_IMAGE);
}
