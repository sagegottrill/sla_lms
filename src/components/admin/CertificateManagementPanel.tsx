import { useMemo, useState } from "react";
import {
  Award,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Share2,
  ShieldOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getCertificateVerifyUrl } from "@/lib/certificateUrls";
import { mergeCertificateConfig } from "@/lib/certificateConfig";
import {
  downloadCertificatePdf,
  downloadOrOpenCertificate,
} from "@/lib/certificateRenderer";

export type ManagedCertificate = {
  id: number;
  user_id: string;
  course_id?: number | null;
  program_id?: number | null;
  course_title?: string;
  credential_id?: string;
  completed_at?: string;
  status?: string;
  profiles?: { name?: string; email?: string } | null;
};

async function resolveCertConfig(cert: ManagedCertificate) {
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

async function renderCert(
  cert: ManagedCertificate,
  opts: { open?: boolean; pdf?: boolean },
) {
  const config = await resolveCertConfig(cert);
  const input = {
    studentName: cert.profiles?.name || "Learner",
    courseTitle: cert.course_title || "Course",
    credentialId: cert.credential_id || "N/A",
    completedAt: cert.completed_at,
    config,
    open: opts.open,
  };
  if (opts.pdf) {
    await downloadCertificatePdf(input);
  } else {
    await downloadOrOpenCertificate(input);
  }
}

type Props = {
  certificates: ManagedCertificate[];
  loading: boolean;
  onRefresh: () => void;
};

export default function CertificateManagementPanel({
  certificates,
  loading,
  onRefresh,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const active = certificates.filter((c) => (c.status ?? "active") === "active").length;
    const revoked = certificates.filter((c) => c.status === "revoked").length;
    const thisMonth = certificates.filter((c) => {
      if (!c.completed_at) return false;
      const d = new Date(c.completed_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total: certificates.length, active, revoked, thisMonth };
  }, [certificates]);

  const filtered = certificates.filter((cert) => {
    const status = cert.status ?? "active";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      cert.profiles?.name?.toLowerCase().includes(q) ||
      cert.profiles?.email?.toLowerCase().includes(q) ||
      cert.course_title?.toLowerCase().includes(q) ||
      cert.credential_id?.toLowerCase().includes(q)
    );
  });

  const runAction = async (certId: number, action: () => Promise<void>) => {
    setBusyId(certId);
    try {
      await action();
    } catch (e) {
      console.error(e);
      toast.error("Action failed. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    const header = ["Learner", "Email", "Course", "Credential ID", "Status", "Issued"];
    const rows = filtered.map((c) => [
      c.profiles?.name ?? "",
      c.profiles?.email ?? "",
      c.course_title ?? "",
      c.credential_id ?? "",
      c.status ?? "active",
      c.completed_at ? new Date(c.completed_at).toISOString() : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificates-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          [stats.total, "Total issued", Award],
          [stats.active, "Active", Award],
          [stats.revoked, "Revoked", ShieldOff],
          [stats.thisMonth, "This month", Users],
        ].map(([val, label, Icon]) => (
          <div
            key={String(label)}
            className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5"
          >
            <Icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{val}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search learner, course, credential ID…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "revoked"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              className="rounded-lg capitalize"
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
          <Button size="sm" variant="outline" className="rounded-lg" onClick={onRefresh}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={exportCsv}>
            <FileText className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Learner</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Credential</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Issued</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((cert) => {
                  const status = cert.status ?? "active";
                  const isBusy = busyId === cert.id;
                  return (
                    <tr key={cert.id} className={status === "revoked" ? "opacity-70" : ""}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {cert.profiles?.name || "Learner"}
                        </div>
                        <div className="text-xs text-muted-foreground">{cert.profiles?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground max-w-[200px] truncate">
                        {cert.course_title}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {cert.credential_id}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                            status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {cert.completed_at
                          ? new Date(cert.completed_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(cert.id, async () => {
                                      await renderCert(cert, { open: true });
                                      toast.success("Certificate opened.");
                                    })
                                  }
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(cert.id, async () => {
                                      await renderCert(cert, { open: false });
                                      toast.success("PNG downloaded.");
                                    })
                                  }
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PNG
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(cert.id, async () => {
                                      await renderCert(cert, { pdf: true });
                                      toast.success("PDF downloaded.");
                                    })
                                  }
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const url = getCertificateVerifyUrl(cert.credential_id || "");
                                    navigator.clipboard.writeText(url);
                                    toast.success("Verify link copied.");
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Copy verify link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(cert.id, async () => {
                                      const res = await api.resendCertificateEmailForRow(cert);
                                      if (res.success) toast.success("Email sent.");
                                      else toast.error(res.error || "Email failed.");
                                    })
                                  }
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Resend email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {status === "active" ? (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      runAction(cert.id, async () => {
                                        const res = await api.revokeCertificate(cert.id);
                                        if (res.success) {
                                          toast.success("Certificate revoked.");
                                          onRefresh();
                                        } else toast.error(res.error || "Revoke failed.");
                                      })
                                    }
                                  >
                                    <ShieldOff className="w-4 h-4 mr-2" />
                                    Revoke
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  onClick={() =>
                                    runAction(cert.id, async () => {
                                      const res = await api.reissueCertificate(cert.id);
                                      if (res.success) {
                                        toast.success("Certificate reissued with new ID.");
                                        onRefresh();
                                      } else toast.error(res.error || "Reissue failed.");
                                    })
                                  }
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Reissue
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all"
                          ? "No certificates match your filters"
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

      <p className="text-xs text-muted-foreground">
        Templates are configured per course or program in the Course/Program Builder → Certificate
        Design step. Issue certificates automatically on course completion or bulk-issue from the
        Program Manager dashboard.
      </p>
    </div>
  );
}
