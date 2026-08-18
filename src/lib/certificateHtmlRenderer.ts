import html2canvas from "html2canvas";
import QRCode from "qrcode";
import {
  mergeCertificateConfig,
  type CertificateConfig,
} from "@/lib/certificateConfig";
import { buildCertificateHtml } from "@/lib/certificateHtmlTemplate";
import { getSiteUrl } from "@/lib/siteUrl";

export type LuxuryCertificateInput = {
  studentName: string;
  courseTitle: string;
  credentialId: string;
  completedAt?: string | null;
  config?: CertificateConfig | Record<string, unknown> | null;
};

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);
}

/**
 * Renders the premium luxury certificate via HTML/CSS + html2canvas.
 * Matches the open-source template-overlay pattern (Certiva, CertifyHub).
 */
export async function renderLuxuryCertificateBlob(
  input: LuxuryCertificateInput,
): Promise<Blob | null> {
  const config = mergeCertificateConfig(input.config);
  const verificationUrl = `${getSiteUrl()}/dashboard/certificates`;
  const html = buildCertificateHtml({
    studentName: input.studentName,
    courseTitle: input.courseTitle,
    credentialId: input.credentialId,
    completedAt: input.completedAt,
    verificationUrl,
    config,
  });

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "1400px";
  iframe.style.height = "990px";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) return null;
    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      if (iframe.contentDocument?.readyState === "complete") resolve();
    });

    const root = doc.querySelector(".cert-root") as HTMLElement | null;
    if (!root) return null;

    if (config.show_qr) {
      const qrEl = doc.getElementById("cert-qr") as HTMLImageElement | null;
      if (qrEl) {
        qrEl.src = await QRCode.toDataURL(verificationUrl, {
          margin: 1,
          width: 120,
          color: { dark: "#17324D", light: "#FFFFFF" },
        });
      }
    }

    await waitForImages(root);
    await document.fonts.ready;

    const canvas = await html2canvas(root, {
      width: 1400,
      height: 990,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } finally {
    document.body.removeChild(iframe);
  }
}
