import { getSiteUrl } from "@/lib/siteUrl";

export function getCertificateVerifyUrl(credentialId: string): string {
  const id = credentialId.trim();
  return `${getSiteUrl()}/verify/${encodeURIComponent(id)}`;
}
