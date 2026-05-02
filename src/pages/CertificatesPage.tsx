import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Award, Download, Share2, ExternalLink, Calendar, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/services/api";

// ─── PDF generator (canvas-based, unchanged) ─────────────────────────────────
function generateCertificatePDF(cert: {
  course_title: string; credential_id: string; instructor?: string;
  completed_at?: string; duration?: string;
}, userName: string, opts?: { open?: boolean }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 850;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0A4D8C"; ctx.fillRect(0, 0, 1200, 850);
  ctx.fillStyle = "#FFFFFF"; ctx.roundRect(40, 40, 1120, 770, 16); ctx.fill();

  const grad = ctx.createLinearGradient(40, 40, 1160, 40);
  grad.addColorStop(0, "#0A4D8C"); grad.addColorStop(1, "#0087DB");
  ctx.fillStyle = grad; ctx.fillRect(40, 40, 1120, 8);
  ctx.fillStyle = "#D4A843"; ctx.fillRect(500, 130, 200, 3);

  ctx.fillStyle = "#0A4D8C"; ctx.font = "bold 16px system-ui"; ctx.textAlign = "center";
  ctx.fillText("SHE LEADS AFRICA — LMS", 600, 100);
  ctx.fillStyle = "#D4A843"; ctx.font = "bold 32px Georgia, serif";
  ctx.fillText("Certificate of Completion", 600, 180);
  ctx.fillStyle = "#666666"; ctx.font = "16px system-ui";
  ctx.fillText("This is to certify that", 600, 240);
  ctx.fillStyle = "#0A4D8C"; ctx.font = "bold 42px Georgia, serif";
  ctx.fillText(userName, 600, 300);
  ctx.fillStyle = "#D4A843"; ctx.fillRect(400, 320, 400, 2);
  ctx.fillStyle = "#666666"; ctx.font = "16px system-ui";
  ctx.fillText("has successfully completed the course", 600, 370);
  ctx.fillStyle = "#0A4D8C"; ctx.font = "bold 26px Georgia, serif";
  const words = cert.course_title.split(" ");
  let line = "", y = 420;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > 900 && line) {
      ctx.fillText(line.trim(), 600, y); line = word + " "; y += 36;
    } else { line = test; }
  }
  ctx.fillText(line.trim(), 600, y);
  const dY = y + 70;
  const dateStr = cert.completed_at ? new Date(cert.completed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  ctx.fillStyle = "#888888"; ctx.font = "14px system-ui";
  ctx.fillText(`Instructor: ${cert.instructor || "SLA"}  ·  Duration: ${cert.duration || ""}  ·  Completed: ${dateStr}`, 600, dY);
  ctx.font = "12px monospace"; ctx.fillStyle = "#aaaaaa";
  ctx.fillText(`Credential ID: ${cert.credential_id}`, 600, dY + 30);
  ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(420, 700); ctx.lineTo(780, 700); ctx.stroke();
  ctx.fillStyle = "#0A4D8C"; ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("Executive Director, She Leads Africa", 600, 690);
  ctx.fillStyle = "#888888"; ctx.font = "12px system-ui";
  ctx.fillText("She Leads Africa", 600, 720);
  ctx.beginPath(); ctx.arc(600, 770, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#D4A843"; ctx.fill();
  ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 18px system-ui"; ctx.fillText("★", 600, 777);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    if (opts?.open) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Certificate opened.");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = `SLA-Certificate-${cert.credential_id}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded!");
  }, "image/png");
}

export default function CertificatesPage() {
  const { appUser } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  const load = useCallback(async () => {
    if (!appUser?.id) return;
    setLoading(true);
    const [certsResult, enrollmentsResult] = await Promise.all([
      api.getCertificates(appUser.id),
      api.getUserEnrollments(appUser.id),
    ]);
    const certs = (certsResult as any)?.data ?? certsResult ?? [];
    setCertificates(Array.isArray(certs) ? certs : []);

    const enrollments = Array.isArray(enrollmentsResult) ? enrollmentsResult : [];
    const inProgress = enrollments.filter((e: any) => {
      const p = Number(e.progress ?? 0);
      return p > 0 && p < 100;
    }).length;
    setInProgressCount(inProgress);
    // Estimate hours: avg 20h per course × completion ratio
    const hours = Math.round(
      enrollments.reduce((acc: number, e: any) => acc + ((Number(e.progress ?? 0) / 100) * 20), 0)
    );
    setTotalHours(hours);
    setLoading(false);
  }, [appUser?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">My Certificates</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? "Loading your achievements..." : `${certificates.length} digital credentials earned.`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          [loading ? "…" : certificates.length, "Earned"],
          [loading ? "…" : inProgressCount,      "In Progress"],
          [loading ? "…" : `${totalHours}h`,     "Hours Learned"],
        ].map(([val, label]) => (
          <div key={String(label)} className="bg-muted/20 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex flex-col items-center justify-center">
            <div className="font-display text-3xl font-bold text-foreground mb-1">{val}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && certificates.length === 0 && (
        <div className="bg-muted/10 rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-16 text-center">
          <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">No certificates yet</h3>
          <p className="text-base text-muted-foreground">Complete a course to earn your first certificate.</p>
        </div>
      )}

      {/* Certificate grid */}
      {!loading && certificates.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6">
          {certificates.map((cert: any) => (
            <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              {/* Certificate preview */}
              <div className="h-44 bg-primary/5 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden group-hover:bg-primary/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Award className="w-6 h-6" />
                </div>
                <p className="text-primary/70 text-[10px] font-bold uppercase tracking-[0.2em]">Certificate of Completion</p>
                <p className="font-bold text-foreground text-sm mt-1.5 leading-snug line-clamp-2">{cert.course_title}</p>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-secondary/50" />
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                  {cert.completed_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Completed {new Date(cert.completed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  )}
                  {cert.instructor && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {cert.duration && <>{cert.duration} · </>}{cert.instructor}
                    </div>
                  )}
                  <div className="font-mono text-[10px] bg-muted px-2 py-1 rounded-md mt-1">
                    ID: {cert.credential_id}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => generateCertificatePDF(cert, appUser?.name ?? "Student")}
                    className="flex-1 rounded-xl text-xs flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs"
                    onClick={() => { navigator.clipboard.writeText(`https://lms.sheleadsafrica.org/certificates/${cert.id}`); toast.success("Link copied!"); }}>
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs"
                    onClick={() => generateCertificatePDF(cert, appUser?.name ?? "Student", { open: true })}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* LinkedIn tip */}
      <div className="bg-accent rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex items-center gap-4">
        <Award className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">Add certificates to your LinkedIn profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">Share your achievements. Each certificate has a unique shareable URL.</p>
        </div>
      </div>
    </div>
  );
}
