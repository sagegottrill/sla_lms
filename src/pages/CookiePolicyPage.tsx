import LegalPageShell, { type LegalSection } from "@/components/legal/LegalPageShell";
import { LEGAL_COMPANY as C } from "@/lib/legal/company";

const sections: LegalSection[] = [
  {
    heading: "The short version",
    paragraphs: [
      "We do not use advertising cookies, third-party analytics, or tracking pixels on this platform. The only things we store in your browser are strictly necessary for the site to work: keeping you signed in, remembering that you are signed in, remembering your interface preferences, and keeping the page working as you navigate.",
      "Because none of this storage is used to track you across other sites or to build a profile of you, we do not currently ask for cookie consent. If we ever add analytics or advertising technology, we will ask for your consent first and let you decline.",
    ],
  },
  {
    heading: "What we store, and why",
    bullets: [
      "Authentication token — stored by our authentication provider in your browser's local storage so you stay signed in between visits. Without it, you would have to log in on every page load. It is removed when you sign out or clear your browser data.",
      "Session and account state — small records that tell the interface who you are, what role you have and which parts of the dashboard to show.",
      "Onboarding and preference state — so you do not have to repeat steps such as onboarding choices or notification settings.",
      "Interface preference cookie — remembers whether a collapsible panel in the dashboard is open or closed. It affects layout only and contains no personal data.",
      "Security and load-balancing cookies set by our hosting and infrastructure providers, used to keep connections secure and to route requests correctly.",
    ],
  },
  {
    heading: "What we do not store",
    bullets: [
      "No advertising or remarketing cookies.",
      "No third-party analytics or session-recording tools.",
      "No cross-site tracking identifiers.",
      "No card or bank details — payments are handled entirely by our payment provider on their own domain.",
    ],
  },
  {
    heading: "Embedded content",
    paragraphs: [
      "Some lessons and pages embed video or other media from third parties such as YouTube or Vimeo, and some pages display images hosted by external services. When such content loads, that provider may set its own cookies or storage and receive your IP address and browser details. We do not control those, and their cookies are outside this policy. If you prefer to avoid them, you can block third-party cookies in your browser settings; embedded media may then not play.",
    ],
  },
  {
    heading: "How to control or remove this storage",
    bullets: [
      "Browser settings — every major browser lets you view, block and delete cookies and site data, and to clear data automatically when you close the browser. Deleting our storage will sign you out.",
      "Private or incognito windows — browsing this way keeps the storage isolated and discards it when you close the window.",
      "Signing out — removes the authentication record we control; it does not clear other preference records, which you can remove with your browser's clear-data tools.",
    ],
  },
  {
    heading: "Do Not Track and consent signals",
    paragraphs: [
      "Because we do not track you across sites, there is nothing for a Do Not Track or Global Privacy Control signal to switch off. We honour such signals by simply continuing not to track.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: [
      `If we introduce anything that tracks you, this page will be updated and consent will be requested before it loads. Questions can go to ${C.contactEmail}.`,
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Cookie and Storage Policy"
      summary="What this platform stores in your browser, why each item is needed, and whether we ask for consent."
      sections={sections}
    />
  );
}
