import LegalPageShell, { type LegalSection } from "@/components/legal/LegalPageShell";
import { LEGAL_COMPANY as C } from "@/lib/legal/company";

const sections: LegalSection[] = [
  {
    heading: "Scope",
    paragraphs: [
      `This policy explains when you can get your money back for a purchase on ${C.siteUrl}, how to ask for it, and how long it takes. It applies to self-paced course purchases and to paid cohort program places. It forms part of our Terms and Conditions.`,
    ],
  },
  {
    heading: "Your statutory rights come first",
    paragraphs: [
      "Consumer protection law in your country may give you rights that are stronger than this policy — for example, rights relating to faulty or misdescribed services, or a cooling-off period for distance sales. Nothing in this policy reduces those rights, and where the law and this policy disagree, the law applies.",
    ],
  },
  {
    heading: "Self-paced courses",
    bullets: [
      `You can request a full refund within ${C.refundWindowDays} days of purchase if you have not started the course, or if you have used only a small part of it.`,
      "We may refuse a refund where a substantial part of the course has been completed, where the certificate has already been issued, or where you have repeatedly bought and refunded the same course.",
      "Courses bought at a discount, or as part of a bundle or promotional offer, are refunded at the amount you actually paid, and a bundle refund may void the promotional rate on the remaining items.",
    ],
  },
  {
    heading: "Cohort programs",
    bullets: [
      "If you withdraw before the cohort start date, you are entitled to a refund of fees paid, less any non-recoverable third-party costs we state at checkout.",
      "If you withdraw after the cohort has started, refunds are considered case by case and are normally pro-rated against the sessions remaining, because cohort places are limited and are held for you.",
      "Any deposit described as non-refundable at the point of payment is non-refundable, except where you are exercising a statutory right.",
      "If we cancel a cohort, or you are not offered a place after paying, you receive a full refund.",
    ],
  },
  {
    heading: "How to request a refund",
    paragraphs: [
      `Email ${C.contactEmail} from the address on your account with your full name, the course or program name, the date of purchase and the payment reference. If you no longer have access to that email address, tell us enough about the payment to help us find it.`,
      "We will confirm receipt, assess the request against this policy, and tell you the outcome in writing. We may ask a short clarifying question, for example which modules you have opened.",
    ],
  },
  {
    heading: "How long a refund takes",
    paragraphs: [
      `Approved refunds are submitted to our payment provider within ${C.refundProcessingDays} business days. The money then returns through your original payment method — card refunds commonly take a further 5 to 10 business days to appear, depending on your bank, and bank transfer refunds can take longer. We cannot speed up your bank's processing, and we will never ask for your card details to issue a refund.`,
    ],
  },
  {
    heading: "Failed, duplicate and unauthorised payments",
    bullets: [
      "If you were charged twice for the same purchase, contact us and we will refund the duplicate in full.",
      "If a payment failed but left your account, the amount is normally reversed by your bank automatically; if it is not, contact us with the reference and we will trace it with the payment provider.",
      "If you do not recognise a charge, tell your bank and then email us so we can investigate in parallel.",
    ],
  },
  {
    heading: "Chargebacks",
    paragraphs: [
      "Please contact us before raising a chargeback with your bank — we can usually resolve it faster. If a chargeback is raised while an account has access to paid content, we may suspend that access until the dispute is resolved, and access will be restored if the chargeback is resolved in your favour.",
    ],
  },
  {
    heading: "Cancelling your account",
    paragraphs: [
      "You can close your account at any time — see the account settings or email us. Closing your account does not by itself entitle you to a refund for content you have already accessed, but it stops any future charges. Certificate records may need to remain verifiable after closure; see our Privacy Policy.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      `We may update this policy; the date at the top of the page shows the current version. The version in force when you bought a course or program place applies to that purchase. Questions can go to ${C.contactEmail}.`,
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Refund and Cancellation Policy"
      summary="When you can get a refund for a course or cohort program, how to request one, and how long it takes to reach you."
      sections={sections}
    />
  );
}
