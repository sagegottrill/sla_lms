/** Editable certificate template stored on courses / programs. */
export type CertificateConfig = {
  org_name: string;
  program_label: string;
  logo_url: string;
  partner_logo_url: string;
  background_url: string;
  accent_color: string;
  title: string;
  presented_to_label: string;
  body_template: string;
  signer1_name: string;
  signer1_title: string;
  signer2_name: string;
  signer2_title: string;
};

/** Defaults match the Aisha Salihu / Young Nigeria Works sample layout. */
export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  org_name: "She Leads Africa",
  program_label: "Young Nigeria Works",
  logo_url: "/sla_logo_transparent.png",
  partner_logo_url: "",
  background_url: "",
  accent_color: "#0A4D8C",
  title: "CERTIFICATE OF COMPLETION",
  presented_to_label: "PRESENTED TO :",
  body_template:
    "For participating and completing the {{course_title}} of the {{program_label}}",
  signer1_name: "Afolashayo Ajayi",
  signer1_title: "PROGRAMS MANAGER",
  signer2_name: "Iquo Oyekunle",
  signer2_title: "HEAD, OPERATIONS AND PROGRAMS",
};

export function mergeCertificateConfig(raw: unknown): CertificateConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (key: keyof CertificateConfig, fallback: string) => {
    const v = o[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };
  return {
    org_name: str("org_name", DEFAULT_CERTIFICATE_CONFIG.org_name),
    program_label: str("program_label", DEFAULT_CERTIFICATE_CONFIG.program_label),
    logo_url: str("logo_url", DEFAULT_CERTIFICATE_CONFIG.logo_url),
    partner_logo_url: str("partner_logo_url", DEFAULT_CERTIFICATE_CONFIG.partner_logo_url),
    background_url: str("background_url", DEFAULT_CERTIFICATE_CONFIG.background_url),
    accent_color: str("accent_color", DEFAULT_CERTIFICATE_CONFIG.accent_color),
    title: str("title", DEFAULT_CERTIFICATE_CONFIG.title),
    presented_to_label: str("presented_to_label", DEFAULT_CERTIFICATE_CONFIG.presented_to_label),
    body_template: str("body_template", DEFAULT_CERTIFICATE_CONFIG.body_template),
    signer1_name: str("signer1_name", DEFAULT_CERTIFICATE_CONFIG.signer1_name),
    signer1_title: str("signer1_title", DEFAULT_CERTIFICATE_CONFIG.signer1_title),
    signer2_name: str("signer2_name", DEFAULT_CERTIFICATE_CONFIG.signer2_name),
    signer2_title: str("signer2_title", DEFAULT_CERTIFICATE_CONFIG.signer2_title),
  };
}

export function fillCertificateBody(
  template: string,
  vars: { course_title: string; program_label: string },
): string {
  return template
    .replace(/\{\{\s*course_title\s*\}\}/gi, vars.course_title)
    .replace(/\{\{\s*program_label\s*\}\}/gi, vars.program_label);
}
