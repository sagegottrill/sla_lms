import QRCode from "qrcode";
import { getSiteUrl } from "@/lib/siteUrl";
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
 * Renders an SLA-style certificate matching the sample layout
 * (name → CERTIFICATE OF COMPLETION → PRESENTED TO → body → date → two signers).
 */
export async function generateCertificateImage(
  input: CertificateRenderInput,
): Promise<Blob | null> {
  const config = mergeCertificateConfig(input.config);
  const verificationUrl = `${getSiteUrl()}/dashboard/certificates`;
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
      ctx.fillStyle = "#F7F3EC";
      ctx.fillRect(0, 0, 1400, 990);
    }
  } else {
    ctx.fillStyle = "#F7F3EC";
    ctx.fillRect(0, 0, 1400, 990);
  }

  const watermark = await loadImage(config.watermark_url);
  if (watermark) {
    ctx.save();
    ctx.globalAlpha = layoutIsLuxury ? 0.16 : layoutIsClean ? 0.06 : 0.09;
    ctx.drawImage(watermark, layoutIsLuxury ? 60 : 445, layoutIsLuxury ? 250 : 210, layoutIsLuxury ? 1280 : 510, layoutIsLuxury ? 660 : 510);
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
    ctx.drawImage(logo, 330, 92, 185, 64);
    ctx.drawImage(partner, 885, 92, 185, 64);
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
    ctx.drawImage(logo, 600, 85, 200, 70);
  } else {
    ctx.fillStyle = accent;
    ctx.font = "bold 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(config.org_name.toUpperCase(), 700, 130);
  }

  ctx.textAlign = "center";

  // Student name (top, prominent — matches sample)
  ctx.fillStyle = nameColor;
  const nameSize = fitText(
    ctx,
    input.studentName,
    "Georgia, serif",
    layoutIsLuxury ? 54 : 58,
    38,
    layoutIsLuxury ? 820 : 1080,
  );
  ctx.font = `bold ${nameSize}px Georgia, serif`;
  ctx.fillText(input.studentName, 700, layoutIsLuxury ? 450 : 230);

  // CERTIFICATE / OF COMPLETION
  const titleParts = config.title.includes("\n")
    ? config.title.split("\n")
    : config.title.toUpperCase().includes("OF COMPLETION")
      ? ["CERTIFICATE", "OF COMPLETION"]
      : [config.title];
  ctx.fillStyle = accent;
  let titleY = layoutIsLuxury ? 220 : 306;
  if (layoutIsLuxury) {
    ctx.font = "300 58px Arial, Helvetica, sans-serif";
    ctx.fillText("CERTIFICATE", 700, titleY);
    ctx.font = "bold 33px Arial, Helvetica, sans-serif";
    ctx.fillText("OF COMPLETION", 700, titleY + 56);
    titleY += 56;
  } else {
    ctx.font = layoutIsClean ? "600 38px Georgia, serif" : "bold 42px Georgia, serif";
    for (const part of titleParts) {
      ctx.fillText(part.trim(), 700, titleY);
      titleY += layoutIsClean ? 44 : 48;
    }
  }

  // PRESENTED TO
  ctx.fillStyle = layoutIsLuxury ? "#111111" : "#555555";
  ctx.font = layoutIsLuxury
    ? "500 26px Arial, Helvetica, sans-serif"
    : layoutIsClean
      ? "600 14px system-ui, sans-serif"
      : "16px system-ui, sans-serif";
  ctx.fillText(config.presented_to_label, 700, titleY + (layoutIsLuxury ? 62 : 20));

  // Body
  const body = fillCertificateBody(config.body_template, {
    course_title: input.courseTitle,
    program_label: config.program_label,
  });
  ctx.fillStyle = bodyColor;
  ctx.font = layoutIsLuxury
    ? "17px Arial, Helvetica, sans-serif"
    : layoutIsAcademic
      ? "21px Georgia, serif"
      : "22px Georgia, serif";
  const bodyLines = wrapText(ctx, body, layoutIsLuxury ? 860 : layoutIsClean ? 930 : 980);
  let bodyY = layoutIsLuxury ? 538 : titleY + 74;

  if (layoutIsLuxury) {
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(290, 490);
    ctx.lineTo(1110, 490);
    ctx.stroke();
  }

  for (const line of bodyLines) {
    ctx.fillText(line, 700, bodyY);
    bodyY += layoutIsLuxury ? 24 : layoutIsClean ? 30 : 32;
  }

  // Date
  const dateStr = input.completedAt
    ? new Date(input.completedAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  ctx.fillStyle = accent;
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText(dateStr, 700, bodyY + (layoutIsLuxury ? 16 : 40));

  // Signature block
  const signer1Signature = await loadImage(config.signer1_signature_url);
  const signer2Signature = await loadImage(config.signer2_signature_url);
  const sigY = layoutIsLuxury ? 760 : 815;
  if (signer1Signature) {
    ctx.drawImage(
      signer1Signature,
      310,
      layoutIsLuxury ? 665 : 705,
      layoutIsLuxury ? 130 : 250,
      layoutIsLuxury ? 48 : 78,
    );
  }
  if (signer2Signature) {
    ctx.drawImage(
      signer2Signature,
      960,
      layoutIsLuxury ? 665 : 705,
      layoutIsLuxury ? 145 : 250,
      layoutIsLuxury ? 48 : 78,
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
  ctx.font = "bold 18px Georgia, serif";
  ctx.fillText(config.signer1_name, layoutIsLuxury ? 405 : 370, sigY + 30);
  ctx.fillText(config.signer2_name, layoutIsLuxury ? 995 : 1030, sigY + 30);

  ctx.fillStyle = "#555555";
  ctx.font = "12px system-ui, sans-serif";
  const title1Lines = wrapText(ctx, config.signer1_title, 280);
  const title2Lines = wrapText(ctx, config.signer2_title, 280);
  title1Lines.forEach((l, i) =>
    ctx.fillText(l, layoutIsLuxury ? 405 : 370, sigY + 54 + i * 16),
  );
  title2Lines.forEach((l, i) =>
    ctx.fillText(l, layoutIsLuxury ? 995 : 1030, sigY + 54 + i * 16),
  );

  // Trust block
  const qr = config.show_qr ? await qrImage(verificationUrl) : null;
  const trustTop = layoutIsLuxury ? 874 : 842;
  const trustLeft = 84;
  const trustWidth = 1232;
  const trustHeight = layoutIsLuxury ? 56 : 90;
  ctx.fillStyle = layoutIsClean ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.7)";
  if (!layoutIsLuxury) {
    ctx.fillRect(trustLeft, trustTop, trustWidth, trustHeight);
    ctx.strokeStyle = "rgba(23,50,77,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(trustLeft, trustTop, trustWidth, trustHeight);
  }

  if (qr) {
    ctx.drawImage(qr, layoutIsLuxury ? 1160 : trustLeft + 18, layoutIsLuxury ? 836 : trustTop + 10, layoutIsLuxury ? 84 : 70, layoutIsLuxury ? 84 : 70);
  }

  const seal = await loadImage(config.seal_url);
  if (seal) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    if (layoutIsLuxury) {
      ctx.drawImage(seal, 635, 684, 130, 130);
    } else {
      ctx.drawImage(seal, 1210, 730, 96, 96);
    }
    ctx.restore();
  } else if (layoutIsLuxury) {
    drawSeal(ctx, 700, 745, 54);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#5A6470";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillText("Verification", layoutIsLuxury ? 210 : trustLeft + 108, trustTop + 20);
  ctx.fillStyle = "#1F2937";
  ctx.font = layoutIsLuxury ? "11px system-ui, sans-serif" : "12px system-ui, sans-serif";
  let trustY = trustTop + (layoutIsLuxury ? 36 : 48);
  if (config.show_credential_id) {
    ctx.fillText(`Certificate ID: ${input.credentialId}`, layoutIsLuxury ? 210 : trustLeft + 108, trustY);
    trustY += layoutIsLuxury ? 0 : 20;
  }
  if (config.show_verification_url) {
    ctx.fillText(`Verify at: ${verificationUrl}`, layoutIsLuxury ? 580 : trustLeft + 108, trustY);
  }
  ctx.textAlign = "center";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
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
