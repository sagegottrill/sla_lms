import { useState, useEffect, useCallback } from "react";
import { Award, Download, Share2, ExternalLink, Loader2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getSiteUrl } from "@/lib/siteUrl";
import { supabase } from "@/lib/supabase";
import { mergeCertificateConfig } from "@/lib/certificateConfig";
import { downloadOrOpenCertificate } from "@/lib/certificateRenderer";

async function resolveCertConfig(courseId: number | null | undefined) {
  if (!courseId) return mergeCertificateConfig(null);
  const res = await api.getCourseCertificateConfig(courseId);
  return mergeCertificateConfig(res.success ? res.data : null);
}

async function handleCertAction(
  cert: {
    course_id?: number;
    course_title?: string;
    credential_id?: string;
    completed_at?: string;
  },
  userName: string,
  open: boolean,
) {
  try {
    const config = await resolveCertConfig(cert.course_id);
    await downloadOrOpenCertificate({
      studentName: userName,
      courseTitle: cert.course_title || "Course",
      credentialId: cert.credential_id || "N/A",
      completedAt: cert.completed_at,
      config,
      open,
    });
    toast.success(open ? "Certificate opened." : "Certificate downloaded!");
  } catch (e) {
    console.error(e);
    toast.error("Could not generate certificate.");
  }
}

export default function CertificatesPage() {
  const { appUser } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [allCertificates, setAllCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin =
    appUser?.role === "admin" ||
    appUser?.role === "program_manager" ||
    appUser?.role === "instructor";

  const load = useCallback(async () => {
    if (!appUser?.id) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const { data } = await supabase
          .from("certificates")
          .select("*, profiles(name, email)")
          .order("completed_at", { ascending: false });
        setAllCertificates(data || []);
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
  }, [appUser?.id, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAdmin = allCertificates.filter((cert) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cert.profiles?.name?.toLowerCase().includes(search) ||
      cert.profiles?.email?.toLowerCase().includes(search) ||
      cert.course_title?.toLowerCase().includes(search) ||
      cert.credential_id?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-20">
      <div className="border-b border-border/40 pb-6">
        <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">
          {isAdmin ? "Certificate Management" : "My Certificates"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Manage all certificates issued across the platform"
            : `${certificates.length} digital credentials earned.`}
        </p>
      </div>

      {isAdmin ? (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, course, credential…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm"
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-3">Learner</th>
                      <th className="px-6 py-3">Course</th>
                      <th className="px-6 py-3">Credential</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAdmin.map((cert) => (
                      <tr key={cert.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">
                            {cert.profiles?.name || "Student"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cert.profiles?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground">{cert.course_title}</td>
                        <td className="px-6 py-4">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {cert.credential_id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-xs"
                              onClick={() =>
                                handleCertAction(
                                  cert,
                                  cert.profiles?.name || "Student",
                                  true,
                                )
                              }
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${getSiteUrl()}/dashboard/certificates`,
                                );
                                toast.success("Link copied!");
                              }}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAdmin.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            {searchTerm
                              ? "No certificates found matching your search"
                              : "No certificates issued yet"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
                  <div className="flex gap-2 mt-auto">
                    <Button
                      size="sm"
                      className="rounded-xl flex-1"
                      onClick={() =>
                        handleCertAction(cert, appUser?.name || "Student", false)
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        handleCertAction(cert, appUser?.name || "Student", true)
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
