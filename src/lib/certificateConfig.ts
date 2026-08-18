/** Editable certificate template stored on courses / programs. */
export type CertificateConfig = {
  org_name: string;
  program_label: string;
  logo_url: string;
  partner_logo_url: string;
  background_url: string;
  watermark_url: string;
  seal_url: string;
  accent_color: string;
  name_color: string;
  body_color: string;
  title: string;
  presented_to_label: string;
  body_template: string;
  layout_variant: "formal_luxury" | "clean_modern" | "official_academic";
  border_style: "double" | "minimal" | "none";
  show_qr: boolean;
  show_verification_url: boolean;
  show_credential_id: boolean;
  signer1_signature_url: string;
  signer1_name: string;
  signer1_title: string;
  signer2_signature_url: string;
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
  watermark_url: "",
  seal_url: "",
  accent_color: "#0A4D8C",
  name_color: "#0A4D8C",
  body_color: "#333333",
  title: "CERTIFICATE OF COMPLETION",
  presented_to_label: "PRESENTED TO :",
  body_template:
    "For participating and completing the {{course_title}} of the {{program_label}}",
  layout_variant: "formal_luxury",
  border_style: "double",
  show_qr: true,
  show_verification_url: true,
  show_credential_id: true,
  signer1_signature_url: "",
  signer1_name: "Afolashayo Ajayi",
  signer1_title: "PROGRAMS MANAGER",
  signer2_signature_url: "",
  signer2_name: "Iquo Oyekunle",
  signer2_title: "HEAD, OPERATIONS AND PROGRAMS",
};

export function mergeCertificateConfig(raw: unknown): CertificateConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (key: keyof CertificateConfig, fallback: string) => {
    const v = o[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };
  const bool = (key: keyof CertificateConfig, fallback: boolean) => {
    const v = o[key];
    return typeof v === "boolean" ? v : fallback;
  };
  const oneOf = <T extends string>(key: keyof CertificateConfig, allowed: readonly T[], fallback: T): T => {
    const v = o[key];
    return typeof v === "string" && allowed.includes(v as T) ? (v as T) : fallback;
  };
  return {
    org_name: str("org_name", DEFAULT_CERTIFICATE_CONFIG.org_name),
    program_label: str("program_label", DEFAULT_CERTIFICATE_CONFIG.program_label),
    logo_url: str("logo_url", DEFAULT_CERTIFICATE_CONFIG.logo_url),
    partner_logo_url: str("partner_logo_url", DEFAULT_CERTIFICATE_CONFIG.partner_logo_url),
    background_url: str("background_url", DEFAULT_CERTIFICATE_CONFIG.background_url),
    watermark_url: str("watermark_url", DEFAULT_CERTIFICATE_CONFIG.watermark_url),
    seal_url: str("seal_url", DEFAULT_CERTIFICATE_CONFIG.seal_url),
    accent_color: str("accent_color", DEFAULT_CERTIFICATE_CONFIG.accent_color),
    name_color: str("name_color", DEFAULT_CERTIFICATE_CONFIG.name_color),
    body_color: str("body_color", DEFAULT_CERTIFICATE_CONFIG.body_color),
    title: str("title", DEFAULT_CERTIFICATE_CONFIG.title),
    presented_to_label: str("presented_to_label", DEFAULT_CERTIFICATE_CONFIG.presented_to_label),
    body_template: str("body_template", DEFAULT_CERTIFICATE_CONFIG.body_template),
    layout_variant: oneOf(
      "layout_variant",
      ["formal_luxury", "clean_modern", "official_academic"] as const,
      DEFAULT_CERTIFICATE_CONFIG.layout_variant,
    ),
    border_style: oneOf(
      "border_style",
      ["double", "minimal", "none"] as const,
      DEFAULT_CERTIFICATE_CONFIG.border_style,
    ),
    show_qr: bool("show_qr", DEFAULT_CERTIFICATE_CONFIG.show_qr),
    show_verification_url: bool(
      "show_verification_url",
      DEFAULT_CERTIFICATE_CONFIG.show_verification_url,
    ),
    show_credential_id: bool(
      "show_credential_id",
      DEFAULT_CERTIFICATE_CONFIG.show_credential_id,
    ),
    signer1_signature_url: str(
      "signer1_signature_url",
      DEFAULT_CERTIFICATE_CONFIG.signer1_signature_url,
    ),
    signer1_name: str("signer1_name", DEFAULT_CERTIFICATE_CONFIG.signer1_name),
    signer1_title: str("signer1_title", DEFAULT_CERTIFICATE_CONFIG.signer1_title),
    signer2_signature_url: str(
      "signer2_signature_url",
      DEFAULT_CERTIFICATE_CONFIG.signer2_signature_url,
    ),
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
