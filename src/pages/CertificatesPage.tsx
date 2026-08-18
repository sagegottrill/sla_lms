import { useState, useEffect, useCallback } from "react";
import { Award, Download, ExternalLink, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/services/api";
import { mergeCertificateConfig } from "@/lib/certificateConfig";
import {
  downloadCertificatePdf,
  downloadOrOpenCertificate,
} from "@/lib/certificateRenderer";
import CertificateManagementPanel from "@/components/admin/CertificateManagementPanel";

async function resolveCertConfig(cert: {
  course_id?: number | null;
  program_id?: number | null;
}) {
  if (cert.course_id) {
    const res = await api.getCourseCertificateConfig(cert.course_id);
    return mergeCertificateConfig(res.success ? res.data : null);
  }
  if (cert.program_id) {
    const res = await api.getProgramCertificateConfig(cert.program_id);
    return mergeCertificateConfig(res.success ? res.data : null);
  }
  return mergeCertificateConfig(null);
}

async function handleCertAction(
  cert: {
    course_id?: number | null;
    program_id?: number | null;
    course_title?: string;
    credential_id?: string;
    completed_at?: string;
    status?: string;
  },
  userName: string,
  opts: { open?: boolean; pdf?: boolean },
) {
  if (cert.status === "revoked") {
    toast.error("This certificate has been revoked.");
    return;
  }
  try {
    const config = await resolveCertConfig(cert);
    const input = {
      studentName: userName,
      courseTitle: cert.course_title || "Course",
      credentialId: cert.credential_id || "N/A",
      completedAt: cert.completed_at,
      config,
      open: opts.open,
    };
    if (opts.pdf) {
      await downloadCertificatePdf(input);
      toast.success("PDF downloaded!");
    } else {
      await downloadOrOpenCertificate(input);
      toast.success(opts.open ? "Certificate opened." : "Certificate downloaded!");
    }
  } catch (e) {
    console.error(e);
    toast.error("Could not generate certificate.");
  }
}

const STAFF_ROLES = ["admin", "program_manager", "instructor"] as const;

export default function CertificatesPage() {
  const { appUser } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [allCertificates, setAllCertificates] = useState<any[]>([]);

  const isStaff = STAFF_ROLES.includes(appUser?.role as (typeof STAFF_ROLES)[number]);

  const load = useCallback(async () => {
    if (!appUser?.id) return;
    setLoading(true);
    try {
      if (isStaff) {
        const res = await api.getAllCertificates();
        setAllCertificates(res.success ? res.data || [] : []);
      } else {
        const [certsResponse, enrollRes] = await Promise.all([
          api.getCertificates(appUser.id),
          api.getUserEnrollments(appUser.id),
        ]);
        setCertificates(certsResponse.success ? certsResponse.data || [] : []);
        const enrolls = enrollRes.success ? enrollRes.data || [] : [];
        setInProgressCount(
          enrolls.filter((e: any) => Number(e.progress ?? 0) < 100).length,
        );
        setTotalHours(
          Math.round(
            enrolls.reduce(
              (acc: number, e: any) => acc + (Number(e.progress ?? 0) / 100) * 20,
              0,
            ),
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [appUser?.id, isStaff]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      <div className="border-b border-border/40 pb-6">
        <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">
          {isStaff ? "Certificate Management" : "My Certificates"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isStaff
            ? "Issue, verify, revoke, reissue, and export credentials across the platform."
            : `${certificates.length} digital credentials earned.`}
        </p>
      </div>

      {isStaff ? (
        <CertificateManagementPanel
          certificates={allCertificates}
          loading={loading}
          onRefresh={() => void load()}
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              [loading ? "…" : certificates.length, "Earned"],
              [loading ? "…" : inProgressCount, "In Progress"],
              [loading ? "…" : `${totalHours}h`, "Hours Learned"],
            ].map(([val, label]) => (
              <div
                key={String(label)}
                className="bg-muted/20 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex flex-col items-center justify-center"
              >
                <div className="font-display text-3xl font-bold text-foreground mb-1">
                  {val}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && certificates.length === 0 && (
            <div className="bg-muted/10 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-16 text-center">
              <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                No certificates yet
              </h3>
              <p className="text-base text-muted-foreground">
                Complete a course to earn your first certificate.
              </p>
            </div>
          )}

          {!loading && certificates.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-card rounded-2xl shadow-sm border-0 p-6 flex flex-col gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {cert.course_title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {cert.credential_id}
                    </p>
                    {cert.status === "revoked" && (
                      <p className="text-xs text-destructive mt-1 font-semibold uppercase">
                        Revoked
                      </p>
                    )}
                    {cert.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(cert.completed_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto flex-wrap">
                    <Button
                      size="sm"
                      className="rounded-xl flex-1 min-w-[100px]"
                      disabled={cert.status === "revoked"}
                      onClick={() =>
                        handleCertAction(cert, appUser?.name || "Student", {})
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> PNG
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={cert.status === "revoked"}
                      onClick={() =>
                        handleCertAction(cert, appUser?.name || "Student", { pdf: true })
                      }
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={cert.status === "revoked"}
                      onClick={() =>
                        handleCertAction(cert, appUser?.name || "Student", { open: true })
                      }
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
