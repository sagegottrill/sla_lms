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

/**
 * Renders an SLA-style certificate matching the sample layout
 * (name → CERTIFICATE OF COMPLETION → PRESENTED TO → body → date → two signers).
 */
export async function generateCertificateImage(
  input: CertificateRenderInput,
): Promise<Blob | null> {
  const config = mergeCertificateConfig(input.config);
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const accent = config.accent_color || "#0A4D8C";

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

  // Outer frame
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, 1320, 910);
  ctx.strokeStyle = "#C9A227";
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, 1288, 878);

  // Logos
  const logo = await loadImage(config.logo_url);
  const partner = await loadImage(config.partner_logo_url);
  if (logo && partner) {
    ctx.drawImage(logo, 180, 90, 200, 70);
    ctx.drawImage(partner, 1020, 90, 200, 70);
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
  ctx.fillStyle = accent;
  ctx.font = "bold 56px Georgia, serif";
  ctx.fillText(input.studentName, 700, 230);

  // CERTIFICATE / OF COMPLETION
  const titleParts = config.title.includes("\n")
    ? config.title.split("\n")
    : config.title.toUpperCase().includes("OF COMPLETION")
      ? ["CERTIFICATE", "OF COMPLETION"]
      : [config.title];
  ctx.fillStyle = accent;
  ctx.font = "bold 42px Georgia, serif";
  let titleY = 310;
  for (const part of titleParts) {
    ctx.fillText(part.trim(), 700, titleY);
    titleY += 48;
  }

  // PRESENTED TO
  ctx.fillStyle = "#555555";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText(config.presented_to_label, 700, titleY + 20);

  // Body
  const body = fillCertificateBody(config.body_template, {
    course_title: input.courseTitle,
    program_label: config.program_label,
  });
  ctx.fillStyle = "#333333";
  ctx.font = "22px Georgia, serif";
  const bodyLines = wrapText(ctx, body, 980);
  let bodyY = titleY + 70;
  for (const line of bodyLines) {
    ctx.fillText(line, 700, bodyY);
    bodyY += 32;
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
  ctx.fillText(dateStr, 700, bodyY + 40);

  // Signers
  const sigY = 820;
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

  ctx.fillStyle = accent;
  ctx.font = "bold 18px Georgia, serif";
  ctx.fillText(config.signer1_name, 370, sigY + 28);
  ctx.fillText(config.signer2_name, 1030, sigY + 28);

  ctx.fillStyle = "#555555";
  ctx.font = "12px system-ui, sans-serif";
  const title1Lines = wrapText(ctx, config.signer1_title, 280);
  const title2Lines = wrapText(ctx, config.signer2_title, 280);
  title1Lines.forEach((l, i) => ctx.fillText(l, 370, sigY + 50 + i * 16));
  title2Lines.forEach((l, i) => ctx.fillText(l, 1030, sigY + 50 + i * 16));

  // Credential footer
  ctx.fillStyle = "#999999";
  ctx.font = "11px monospace";
  ctx.fillText(`Credential ID: ${input.credentialId}`, 700, 940);
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText(`Verify at ${getSiteUrl()}/dashboard/certificates`, 700, 958);

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
