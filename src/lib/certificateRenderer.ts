import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { getCertificateVerifyUrl } from "@/lib/certificateUrls";
import { renderLuxuryCertificateBlob } from "@/lib/certificateHtmlRenderer";
import {
  fillCertificateBody,
  mergeCertificateConfig,
  type CertificateConfig,
} from "@/lib/certificateConfig";

export type CertificateRenderInput = {
  studentName: string;
  courseTitle: string;
  credentialId: string;
  completedAt?: string | null;
  config?: CertificateConfig | Record<string, unknown> | null;
  open?: boolean;
  onDone?: (blob: Blob) => void;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  startSize: number,
  minSize: number,
  maxWidth: number,
  weight = "bold",
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

async function qrImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 150,
      color: { dark: "#17324D", light: "#0000" },
    });
    return loadImage(dataUrl);
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
}

function drawAngledBands(
  ctx: CanvasRenderingContext2D,
  accent: string,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.save();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvasWidth, 0);
  ctx.lineTo(canvasWidth, 92);
  ctx.lineTo(canvasWidth / 2, 26);
  ctx.lineTo(0, 92);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(canvasWidth * 0.56, 0);
  ctx.lineTo(canvasWidth, 0);
  ctx.lineTo(canvasWidth, 80);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(0, canvasHeight);
  ctx.lineTo(canvasWidth, canvasHeight);
  ctx.lineTo(canvasWidth, canvasHeight - 18);
  ctx.lineTo(0, canvasHeight - 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

type RichToken = { text: string; bold?: boolean };

function buildBodySegments(
  template: string,
  vars: { course_title: string; program_label: string },
): RichToken[] {
  const segments: RichToken[] = [];
  const regex = /\{\{\s*(course_title|program_label)\s*\}\}/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: template.slice(lastIndex, match.index) });
    }
    const key = match[1].toLowerCase();
    segments.push({
      text: key === "course_title" ? vars.course_title : vars.program_label,
      bold: true,
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) {
    segments.push({ text: template.slice(lastIndex) });
  }
  return segments;
}

function segmentsToWords(segments: RichToken[]): RichToken[] {
  const words: RichToken[] = [];
  for (const segment of segments) {
    for (const part of segment.text.split(/(\s+)/)) {
      if (!part) continue;
      words.push({ text: part, bold: segment.bold });
    }
  }
  return words;
}

function wrapRichWords(
  ctx: CanvasRenderingContext2D,
  words: RichToken[],
  maxWidth: number,
  baseFont: string,
  boldFont: string,
): RichToken[][] {
  const lines: RichToken[][] = [];
  let current: RichToken[] = [];
  let currentWidth = 0;

  for (const token of words) {
    ctx.font = token.bold ? boldFont : baseFont;
    const width = ctx.measureText(token.text).width;
    if (currentWidth + width > maxWidth && current.length > 0) {
      lines.push(current);
      current = [token];
      currentWidth = width;
    } else {
      current.push(token);
      currentWidth += width;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

function drawRichLine(
  ctx: CanvasRenderingContext2D,
  tokens: RichToken[],
  centerX: number,
  y: number,
  baseFont: string,
  boldFont: string,
) {
  let totalWidth = 0;
  for (const token of tokens) {
    ctx.font = token.bold ? boldFont : baseFont;
    totalWidth += ctx.measureText(token.text).width;
  }
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  let x = centerX - totalWidth / 2;
  for (const token of tokens) {
    ctx.font = token.bold ? boldFont : baseFont;
    ctx.fillText(token.text, x, y);
    x += ctx.measureText(token.text).width;
  }
  ctx.textAlign = prevAlign;
}

function formatLuxuryDate(completedAt?: string | null): string {
  const date = completedAt ? new Date(completedAt) : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.toLocaleDateString("en-US", { month: "long" })}, ${now.getFullYear()}`;
  }
  return `${date.toLocaleDateString("en-US", { month: "long" })}, ${date.getFullYear()}`;
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const spikes = 18;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#E7B238";
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI / spikes) * i;
    const r = i % 2 === 0 ? radius : radius * 0.82;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  const grad = ctx.createRadialGradient(-10, -12, 6, 0, 0, radius * 0.86);
  grad.addColorStop(0, "#FFE59B");
  grad.addColorStop(0.45, "#F3C858");
  grad.addColorStop(1, "#C88D17");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#9D6B10";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#D09A23";
  ctx.beginPath();
  ctx.moveTo(-radius * 0.4, radius * 0.52);
  ctx.lineTo(-radius * 0.08, radius * 1.28);
  ctx.lineTo(radius * 0.08, radius * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(radius * 0.4, radius * 0.52);
  ctx.lineTo(radius * 0.08, radius * 1.28);
  ctx.lineTo(-radius * 0.08, radius * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Renders certificate layouts. Luxury variant follows the SLA sample:
 * logos → title → presented to → name → body → date → signatures/seal.
 */
export async function generateCertificateImage(
  input: CertificateRenderInput,
): Promise<Blob | null> {
  const config = mergeCertificateConfig(input.config);
  if (config.layout_variant === "formal_luxury") {
    const htmlBlob = await renderLuxuryCertificateBlob(input);
    if (htmlBlob) return htmlBlob;
  }

  const verificationUrl = getCertificateVerifyUrl(input.credentialId);
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const accent = config.accent_color || "#0A4D8C";
  const nameColor = config.name_color || accent;
  const bodyColor = config.body_color || "#333333";
  const layoutIsClean = config.layout_variant === "clean_modern";
  const layoutIsAcademic = config.layout_variant === "official_academic";
  const layoutIsLuxury = config.layout_variant === "formal_luxury";

  // Background
  if (config.background_url) {
    const bg = await loadImage(config.background_url);
    if (bg) {
      ctx.drawImage(bg, 0, 0, 1400, 990);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 1400, 990);
    }
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1400, 990);
  }

  const watermark = await loadImage(config.watermark_url);
  if (watermark) {
    ctx.save();
    ctx.globalAlpha = layoutIsLuxury ? 0.11 : layoutIsClean ? 0.06 : 0.09;
    ctx.drawImage(
      watermark,
      layoutIsLuxury ? 0 : 445,
      layoutIsLuxury ? 120 : 210,
      layoutIsLuxury ? 1400 : 510,
      layoutIsLuxury ? 780 : 510,
    );
    ctx.restore();
  }

  // Outer frame
  if (layoutIsLuxury) {
    drawAngledBands(ctx, accent, 1400, 990);
  } else if (config.border_style === "double") {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 1320, 910);
    ctx.strokeStyle = layoutIsClean ? "#D7DEE7" : "#C9A227";
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, 1288, 878);
  } else if (config.border_style === "minimal") {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, 1296, 886);
  }

  // Logos
  const logo = await loadImage(config.logo_url);
  const partner = await loadImage(config.partner_logo_url);
  if (logo && partner && layoutIsLuxury) {
    ctx.drawImage(logo, 118, 98, 230, 78);
    ctx.drawImage(partner, 1052, 98, 230, 78);
  } else if (logo && partner) {
    ctx.drawImage(logo, 180, 88, 200, 70);
    ctx.drawImage(partner, 1020, 88, 200, 70);
    ctx.strokeStyle = "#C7CCD3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(700, 92);
    ctx.lineTo(700, 156);
    ctx.stroke();
  } else if (logo) {
    ctx.drawImage(logo, layoutIsLuxury ? 585 : 600, layoutIsLuxury ? 92 : 85, layoutIsLuxury ? 230 : 200, layoutIsLuxury ? 82 : 70);
  } else {
    ctx.fillStyle = accent;
    ctx.font = "bold 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(config.org_name.toUpperCase(), 700, layoutIsLuxury ? 142 : 130);
  }

  ctx.textAlign = "center";

  const titleParts = config.title.includes("\n")
    ? config.title.split("\n")
    : config.title.toUpperCase().includes("OF COMPLETION")
      ? ["CERTIFICATE", "OF COMPLETION"]
      : [config.title];

  let titleY = layoutIsLuxury ? 252 : 306;
  let nameY = 230;
  let bodyY = titleY + 74;

  if (layoutIsLuxury) {
    // Sample order: title → presented to → name → body → date
    ctx.fillStyle = "#111111";
    if (titleParts.length >= 2) {
      ctx.font = "300 58px Arial, Helvetica, sans-serif";
      ctx.fillText(titleParts[0].trim().toUpperCase(), 700, titleY);
      ctx.font = "bold 32px Arial, Helvetica, sans-serif";
      ctx.fillText(titleParts.slice(1).join(" ").trim().toUpperCase(), 700, titleY + 50);
    } else {
      ctx.font = "bold 40px Arial, Helvetica, sans-serif";
      ctx.fillText(titleParts[0].trim().toUpperCase(), 700, titleY + 24);
    }

    ctx.fillStyle = "#111111";
    ctx.font = "500 24px Arial, Helvetica, sans-serif";
    const presentedY = titleY + 112;
    ctx.fillText(config.presented_to_label, 700, presentedY);

    ctx.fillStyle = nameColor;
    const nameSize = fitText(ctx, input.studentName, "Georgia, serif", 56, 36, 900);
    ctx.font = `bold ${nameSize}px Georgia, serif`;
    nameY = presentedY + 78;
    ctx.fillText(input.studentName, 700, nameY);

    const nameWidth = ctx.measureText(input.studentName).width;
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(700 - nameWidth / 2 - 24, nameY + 14);
    ctx.lineTo(700 + nameWidth / 2 + 24, nameY + 14);
    ctx.stroke();

    const bodySegments = buildBodySegments(config.body_template, {
      course_title: input.courseTitle,
      program_label: config.program_label,
    });
    const bodyWords = segmentsToWords(bodySegments);
    const bodyBaseFont = "18px Arial, Helvetica, sans-serif";
    const bodyBoldFont = "bold 18px Arial, Helvetica, sans-serif";
    const richBodyLines = wrapRichWords(ctx, bodyWords, 900, bodyBaseFont, bodyBoldFont);
    ctx.fillStyle = bodyColor;
    bodyY = nameY + 64;
    for (const line of richBodyLines) {
      drawRichLine(ctx, line, 700, bodyY, bodyBaseFont, bodyBoldFont);
      bodyY += 28;
    }

    const dateStr = formatLuxuryDate(input.completedAt);
    ctx.fillStyle = accent;
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(dateStr, 700, bodyY + 18);
    bodyY += 18;
  } else {
    ctx.fillStyle = nameColor;
    const nameSize = fitText(ctx, input.studentName, "Georgia, serif", 58, 38, 1080);
    ctx.font = `bold ${nameSize}px Georgia, serif`;
    ctx.fillText(input.studentName, 700, nameY);

    ctx.fillStyle = accent;
    for (const part of titleParts) {
      ctx.font = layoutIsClean ? "600 38px Georgia, serif" : "bold 42px Georgia, serif";
      ctx.fillText(part.trim(), 700, titleY);
      titleY += layoutIsClean ? 44 : 48;
    }

    ctx.fillStyle = "#555555";
    ctx.font = layoutIsClean
      ? "600 14px system-ui, sans-serif"
      : "16px system-ui, sans-serif";
    ctx.fillText(config.presented_to_label, 700, titleY + 20);

    const body = fillCertificateBody(config.body_template, {
      course_title: input.courseTitle,
      program_label: config.program_label,
    });
    ctx.fillStyle = bodyColor;
    ctx.font = layoutIsAcademic ? "21px Georgia, serif" : "22px Georgia, serif";
    const bodyLines = wrapText(ctx, body, layoutIsClean ? 930 : 980);
    bodyY = titleY + 74;
    for (const line of bodyLines) {
      ctx.fillText(line, 700, bodyY);
      bodyY += layoutIsClean ? 30 : 32;
    }

    const dateStr = input.completedAt
      ? new Date(input.completedAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    ctx.fillStyle = accent;
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(dateStr, 700, bodyY + 40);
  }

  // Signature block
  const signer1Signature = await loadImage(config.signer1_signature_url);
  const signer2Signature = await loadImage(config.signer2_signature_url);
  const sigY = layoutIsLuxury ? 748 : 815;
  if (signer1Signature) {
    ctx.drawImage(
      signer1Signature,
      layoutIsLuxury ? 250 : 310,
      layoutIsLuxury ? 652 : 705,
      layoutIsLuxury ? 170 : 250,
      layoutIsLuxury ? 58 : 78,
    );
  }
  if (signer2Signature) {
    ctx.drawImage(
      signer2Signature,
      layoutIsLuxury ? 980 : 950,
      layoutIsLuxury ? 652 : 705,
      layoutIsLuxury ? 170 : 250,
      layoutIsLuxury ? 58 : 78,
    );
  }
  if (!layoutIsLuxury) {
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(220, sigY);
    ctx.lineTo(520, sigY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(880, sigY);
    ctx.lineTo(1180, sigY);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.font = layoutIsLuxury ? "bold 17px Georgia, serif" : "bold 18px Georgia, serif";
  ctx.fillText(config.signer1_name, layoutIsLuxury ? 335 : 370, sigY + 28);
  ctx.fillText(config.signer2_name, layoutIsLuxury ? 1065 : 1030, sigY + 28);

  ctx.fillStyle = layoutIsLuxury ? "#333333" : "#555555";
  ctx.font = layoutIsLuxury ? "11px Arial, Helvetica, sans-serif" : "12px system-ui, sans-serif";
  const title1Lines = wrapText(ctx, config.signer1_title, layoutIsLuxury ? 250 : 280);
  const title2Lines = wrapText(ctx, config.signer2_title, layoutIsLuxury ? 250 : 280);
  title1Lines.forEach((l, i) =>
    ctx.fillText(l, layoutIsLuxury ? 335 : 370, sigY + 50 + i * 15),
  );
  title2Lines.forEach((l, i) =>
    ctx.fillText(l, layoutIsLuxury ? 1065 : 1030, sigY + 50 + i * 15),
  );

  // Trust block
  const qr = config.show_qr ? await qrImage(verificationUrl) : null;
  const trustTop = layoutIsLuxury ? 930 : 842;
  const trustLeft = 84;
  const trustWidth = 1232;
  const trustHeight = 90;
  ctx.fillStyle = layoutIsClean ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.7)";
  if (!layoutIsLuxury) {
    ctx.fillRect(trustLeft, trustTop, trustWidth, trustHeight);
    ctx.strokeStyle = "rgba(23,50,77,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(trustLeft, trustTop, trustWidth, trustHeight);
  }

  const seal = await loadImage(config.seal_url);
  if (seal) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    if (layoutIsLuxury) {
      ctx.drawImage(seal, 628, 668, 144, 144);
    } else {
      ctx.drawImage(seal, 1210, 730, 96, 96);
    }
    ctx.restore();
  } else if (layoutIsLuxury) {
    drawSeal(ctx, 700, 736, 60);
  }

  if (qr) {
    ctx.drawImage(
      qr,
      layoutIsLuxury ? 1288 : trustLeft + 18,
      layoutIsLuxury ? 900 : trustTop + 10,
      layoutIsLuxury ? 64 : 70,
      layoutIsLuxury ? 64 : 70,
    );
  }

  const showTrust =
    config.show_credential_id || config.show_verification_url || config.show_qr;
  if (showTrust) {
    ctx.textAlign = "left";
    if (layoutIsLuxury) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 11px Arial, Helvetica, sans-serif";
      ctx.fillText("Verification", 96, trustTop + 14);
      ctx.font = "10px Arial, Helvetica, sans-serif";
      let trustY = trustTop + 30;
      if (config.show_credential_id) {
        ctx.fillText(`Certificate ID: ${input.credentialId}`, 96, trustY);
        trustY += 14;
      }
      if (config.show_verification_url) {
        ctx.fillText(`Verify at: ${verificationUrl}`, 96, trustY);
      }
    } else {
      ctx.fillStyle = "#5A6470";
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.fillText("Verification", trustLeft + 108, trustTop + 18);
      ctx.fillStyle = "#1F2937";
      ctx.font = "12px system-ui, sans-serif";
      let trustY = trustTop + 48;
      if (config.show_credential_id) {
        ctx.fillText(`Certificate ID: ${input.credentialId}`, trustLeft + 108, trustY);
        trustY += 20;
      }
      if (config.show_verification_url) {
        ctx.fillText(`Verify at: ${verificationUrl}`, trustLeft + 108, trustY);
      }
    }
    ctx.textAlign = "center";
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function downloadCertificatePdf(
  input: CertificateRenderInput,
): Promise<void> {
  const blob = await generateCertificateImage(input);
  if (!blob) return;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read certificate image."));
    reader.readAsDataURL(blob);
  });
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [1400, 990],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, 1400, 990);
  pdf.save(`SLA-Certificate-${input.credentialId}.pdf`);
}

export async function downloadOrOpenCertificate(
  input: CertificateRenderInput,
): Promise<void> {
  const blob = await generateCertificateImage(input);
  if (!blob) return;
  if (input.onDone) {
    input.onDone(blob);
    return;
  }
  const url = URL.createObjectURL(blob);
  if (input.open) {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = `SLA-Certificate-${input.credentialId}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
