import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Award, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { PageContainer } from "@/components/common/PageContainer";

type VerifyResult = {
  valid: boolean;
  status: string;
  credential_id: string;
  course_title: string;
  completed_at: string;
  recipient_name: string;
  org_name: string;
};

export default function VerifyCertificatePage() {
  const { credentialId = "" } = useParams();
  const decodedId = decodeURIComponent(credentialId);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await api.verifyCertificateByCredentialId(decodedId);
      if (cancelled) return;
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setResult(null);
        setError(res.error || "Certificate not found.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [decodedId]);

  const issuedDate = result?.completed_at
    ? new Date(result.completed_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <PageContainer className="py-16">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight">
            Certificate Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Confirm that a credential was issued by She Leads Africa ConnectHer.
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 p-8">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying credential…</p>
            </div>
          ) : error || !result ? (
            <div className="text-center py-8">
              <XCircle className="w-14 h-14 text-destructive/80 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">Not found</h2>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <code className="text-xs bg-muted px-3 py-1.5 rounded font-mono">{decodedId}</code>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive shrink-0" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {result.valid ? "Valid credential" : "Revoked credential"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {result.valid
                      ? "This certificate is authentic and currently active."
                      : "This credential exists but has been revoked and is no longer valid."}
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 text-sm">
                {[
                  ["Recipient", result.recipient_name],
                  ["Course / program", result.course_title],
                  ["Issued by", result.org_name],
                  ["Issue date", issuedDate],
                  ["Credential ID", result.credential_id],
                  ["Status", result.status],
                ].map(([label, value]) =>
                  value ? (
                    <div
                      key={label}
                      className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground text-right">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/">
              <ExternalLink className="w-4 h-4 mr-2" />
              Back to ConnectHer
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
