import { escapeHtml } from "@/lib/escapeHtml";
import type { CertificateConfig } from "@/lib/certificateConfig";
import { fillCertificateBody } from "@/lib/certificateConfig";

export type CertificateHtmlInput = {
  studentName: string;
  courseTitle: string;
  credentialId: string;
  completedAt?: string | null;
  verificationUrl: string;
  config: CertificateConfig;
};

function formatLuxuryDate(completedAt?: string | null): string {
  const date = completedAt ? new Date(completedAt) : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.toLocaleDateString("en-US", { month: "long" })}, ${now.getFullYear()}`;
  }
  return `${date.toLocaleDateString("en-US", { month: "long" })}, ${date.getFullYear()}`;
}

function bodyHtml(template: string, courseTitle: string, programLabel: string): string {
  let html = "";
  const regex = /\{\{\s*(course_title|program_label)\s*\}\}/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > last) {
      html += escapeHtml(template.slice(last, match.index));
    }
    const key = match[1].toLowerCase();
    const value = key === "course_title" ? courseTitle : programLabel;
    html += `<strong>${escapeHtml(value)}</strong>`;
    last = match.index + match[0].length;
  }
  if (last < template.length) {
    html += escapeHtml(template.slice(last));
  }
  if (!html) {
    html = escapeHtml(
      fillCertificateBody(template, {
        course_title: courseTitle,
        program_label: programLabel,
      }),
    );
  }
  return html;
}

function titleParts(title: string): [string, string] | [string] {
  if (title.includes("\n")) {
    const lines = title.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) return [lines[0], lines.slice(1).join(" ")];
    return [lines[0] ?? title];
  }
  if (title.toUpperCase().includes("OF COMPLETION")) {
    return ["CERTIFICATE", "OF COMPLETION"];
  }
  return [title];
}

/** Premium SLA certificate surface — clean white, not cream/yellow. */
export const CERTIFICATE_SURFACE = "#FFFFFF";

/**
 * Premium certificate HTML template (Certiva / pdf4.dev pattern):
 * white surface + optional watermark + positioned text fields + flex footer.
 */
export function buildCertificateHtml(input: CertificateHtmlInput): string {
  const { config, studentName, courseTitle, credentialId, verificationUrl } = input;
  const accent = config.accent_color || "#0A4D8C";
  const nameColor = config.name_color || accent;
  const bodyColor = config.body_color || "#333333";
  const titles = titleParts(config.title);
  const hasCustomBg = Boolean(config.background_url?.trim());
  const hasWatermark = Boolean(config.watermark_url?.trim());
  const dateStr = formatLuxuryDate(input.completedAt);
  const body = bodyHtml(config.body_template, courseTitle, config.program_label);

  const hasPartner = Boolean(config.partner_logo_url?.trim());
  const hasLogo = Boolean(config.logo_url?.trim());

  const logoBlock = hasLogo
    ? `<img src="${escapeHtml(config.logo_url)}" alt="" class="cert-logo cert-logo-primary" crossorigin="anonymous" />`
    : "";
  const partnerBlock = hasPartner
    ? `<img src="${escapeHtml(config.partner_logo_url)}" alt="" class="cert-logo cert-logo-partner" crossorigin="anonymous" />`
    : "";

  const logosHtml =
    hasPartner && hasLogo
      ? `<div class="cert-logos cert-logos-dual">
           <div>${partnerBlock}</div>
           <div>${logoBlock}</div>
         </div>`
      : hasLogo
        ? `<div class="cert-logos cert-logos-single">${logoBlock}</div>`
        : hasPartner
          ? `<div class="cert-logos cert-logos-single">${partnerBlock}</div>`
          : `<div class="cert-logos cert-logos-single"><div class="cert-org-fallback">${escapeHtml(config.org_name.toUpperCase())}</div></div>`;

  const sig1Img = config.signer1_signature_url
    ? `<img src="${escapeHtml(config.signer1_signature_url)}" alt="" class="cert-signature-img" crossorigin="anonymous" />`
    : "";
  const sig2Img = config.signer2_signature_url
    ? `<img src="${escapeHtml(config.signer2_signature_url)}" alt="" class="cert-signature-img" crossorigin="anonymous" />`
    : "";

  const sealBlock = config.seal_url
    ? `<img src="${escapeHtml(config.seal_url)}" alt="" class="cert-seal-img" crossorigin="anonymous" />`
    : `<div class="cert-seal-default" aria-hidden="true"></div>`;

  const verifyLines: string[] = [];
  if (config.show_credential_id) {
    verifyLines.push(`Certificate ID: ${escapeHtml(credentialId)}`);
  }
  if (config.show_verification_url) {
    verifyLines.push(`Verify at: ${escapeHtml(verificationUrl)}`);
  }

  const bgStyle = hasCustomBg
    ? `background-image:url('${escapeHtml(config.background_url)}');`
    : `background-color:${CERTIFICATE_SURFACE};`;

  const watermarkLayer = hasWatermark
    ? `<div class="cert-watermark" style="background-image:url('${escapeHtml(config.watermark_url)}')"></div>${
        hasCustomBg ? "" : '<div class="cert-white-wash"></div>'
      }`
    : "";

  const bandsLayer = hasCustomBg ? "" : `<div class="cert-bands" style="--accent:${accent}"></div>`;

  const titleHtml =
    titles.length >= 2
      ? `<div class="cert-title-main">${escapeHtml(titles[0].toUpperCase())}</div>
         <div class="cert-title-sub">${escapeHtml(titles[1].toUpperCase())}</div>`
      : `<div class="cert-title-single">${escapeHtml(titles[0].toUpperCase())}</div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cert-root {
    width: 1400px;
    height: 990px;
    position: relative;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    ${bgStyle}
    background-color: ${CERTIFICATE_SURFACE};
    background-size: cover;
    background-position: center;
  }
  .cert-bands::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 92px;
    background: ${accent};
    clip-path: polygon(0 0, 100% 0, 100% 92px, 50% 26px, 0 92px);
    z-index: 2;
  }
  .cert-bands::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 18px;
    background: ${accent};
    z-index: 2;
  }
  .cert-watermark {
    position: absolute;
    inset: 100px 0 72px 0;
    background-size: cover;
    background-position: center;
    filter: grayscale(100%) contrast(0.92);
    opacity: 0.11;
    z-index: 0;
    pointer-events: none;
  }
  .cert-white-wash {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.78);
    z-index: 1;
    pointer-events: none;
  }
  .cert-logos {
    position: relative;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 98px 118px 0;
    min-height: 78px;
  }
  .cert-logos-single {
    justify-content: center;
  }
  .cert-logo { max-height: 78px; max-width: 230px; object-fit: contain; }
  .cert-org-fallback {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 22px;
    color: ${accent};
    text-transform: uppercase;
  }
  .cert-content {
    position: relative;
    z-index: 3;
    text-align: center;
    padding: 36px 120px 0;
  }
  .cert-title-main {
    font-size: 58px;
    font-weight: 300;
    letter-spacing: 0.02em;
    color: #111;
    line-height: 1.05;
  }
  .cert-title-sub {
    font-size: 32px;
    font-weight: 700;
    color: #111;
    margin-top: 4px;
  }
  .cert-title-single {
    font-size: 40px;
    font-weight: 700;
    color: #111;
  }
  .cert-presented {
    margin-top: 28px;
    font-size: 24px;
    font-weight: 500;
    color: #111;
    letter-spacing: 0.04em;
  }
  .cert-name {
    margin-top: 28px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 700;
    color: ${nameColor};
    line-height: 1.15;
    display: inline-block;
    max-width: 900px;
    border-bottom: 2px solid #1F2937;
    padding-bottom: 8px;
  }
  .cert-body {
    margin-top: 32px;
    font-size: 18px;
    line-height: 1.55;
    color: ${bodyColor};
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }
  .cert-body strong { font-weight: 700; color: #111; }
  .cert-date {
    margin-top: 20px;
    font-family: Georgia, serif;
    font-size: 20px;
    font-style: italic;
    color: ${accent};
  }
  .cert-footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 130px;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 200px;
  }
  .cert-signer {
    width: 280px;
    text-align: center;
  }
  .cert-signature-img {
    max-width: 170px;
    max-height: 58px;
    object-fit: contain;
    display: block;
    margin: 0 auto 6px;
  }
  .cert-signer-name {
    font-family: Georgia, serif;
    font-size: 17px;
    font-weight: 700;
    color: ${accent};
  }
  .cert-signer-title {
    font-size: 11px;
    color: #333;
    margin-top: 4px;
    line-height: 1.35;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .cert-seal-wrap {
    width: 144px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding-bottom: 4px;
  }
  .cert-seal-img { width: 136px; height: 136px; object-fit: contain; }
  .cert-seal-default {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #FFE59B, #F3C858 45%, #C88D17 100%);
    box-shadow: 0 0 0 8px #E7B238, 0 0 0 10px rgba(157,107,16,0.35);
  }
  .cert-verify {
    position: absolute;
    left: 96px;
    bottom: 22px;
    z-index: 4;
    color: #fff;
    font-size: 10px;
    line-height: 1.45;
    max-width: 720px;
  }
  .cert-verify-label {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .cert-qr {
    position: absolute;
    right: 48px;
    bottom: 26px;
    z-index: 4;
    width: 64px;
    height: 64px;
    background: #fff;
    padding: 4px;
    border-radius: 4px;
  }
</style></head>
<body>
<div class="cert-root">
  ${bandsLayer}
  ${watermarkLayer}
  ${logosHtml}
  <div class="cert-content">
    ${titleHtml}
    <div class="cert-presented">${escapeHtml(config.presented_to_label)}</div>
    <div class="cert-name">${escapeHtml(studentName)}</div>
    <p class="cert-body">${body}</p>
    <div class="cert-date">${escapeHtml(dateStr)}</div>
  </div>
  <div class="cert-footer">
    <div class="cert-signer">
      ${sig1Img}
      <div class="cert-signer-name">${escapeHtml(config.signer1_name)}</div>
      <div class="cert-signer-title">${escapeHtml(config.signer1_title)}</div>
    </div>
    <div class="cert-seal-wrap">${sealBlock}</div>
    <div class="cert-signer">
      ${sig2Img}
      <div class="cert-signer-name">${escapeHtml(config.signer2_name)}</div>
      <div class="cert-signer-title">${escapeHtml(config.signer2_title)}</div>
    </div>
  </div>
  ${
    config.show_credential_id || config.show_verification_url
      ? `<div class="cert-verify">
           <div class="cert-verify-label">Verification</div>
           ${verifyLines.map((l) => `<div>${l}</div>`).join("")}
         </div>`
      : ""
  }
  ${config.show_qr ? `<img class="cert-qr" id="cert-qr" alt="QR" />` : ""}
</div>
</body></html>`;
}
