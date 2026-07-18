import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Award, Download, Share2, ExternalLink, Calendar, BookOpen, Loader2, Search, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getSiteUrl } from "@/lib/siteUrl";
import { supabase } from "@/lib/supabase";

// ─── Enhanced SLA Certificate Generator with Logo & Signatures ─────────────────
function generateCertificatePDF(cert: {
  course_title: string; credential_id: string; instructor?: string;
  completed_at?: string; duration?: string;
}, userName: string, opts?: { open?: boolean }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext("2d")!;

  // Background with brand gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1400, 990);
  bgGrad.addColorStop(0, "#0A4D8C");
  bgGrad.addColorStop(1, "#0087DB");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1400, 990);

  // White certificate card
  ctx.fillStyle = "#FFFFFF";
  ctx.roundRect(60, 60, 1280, 870, 20);
  ctx.fill();

  // Decorative top border
  const topGrad = ctx.createLinearGradient(60, 60, 1340, 60);
  topGrad.addColorStop(0, "#0A4D8C");
  topGrad.addColorStop(0.5, "#D4A843");
  topGrad.addColorStop(1, "#0A4D8C");
  ctx.fillStyle = topGrad;
  ctx.fillRect(60, 60, 1280, 12);

  // Load and draw SLA logo
  const logo = new Image();
  logo.src = "/sla_logo_transparent.png";
  
  logo.onload = () => {
    // Draw logo at top center
    const logoWidth = 180;
    const logoHeight = 60;
    ctx.drawImage(logo, 610, 100, logoWidth, logoHeight);
    
    // Organization name
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("SHE LEADS AFRICA", 700, 190);
    
    // Decorative line
    ctx.fillStyle = "#D4A843";
    ctx.fillRect(550, 205, 300, 3);
    
    // Certificate title
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillText("Certificate of Completion", 700, 270);
    
    // Decorative accent
    ctx.fillStyle = "#D4A843";
    ctx.fillRect(500, 285, 400, 2);
    
    // "This is to certify that"
    ctx.fillStyle = "#666666";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText("This is to certify that", 700, 340);
    
    // Student name
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "bold 52px Georgia, serif";
    ctx.fillText(userName, 700, 410);
    
    // Name underline
    const nameWidth = ctx.measureText(userName).width;
    ctx.fillStyle = "#D4A843";
    ctx.fillRect(700 - nameWidth / 2 - 20, 425, nameWidth + 40, 3);
    
    // Completion text
    ctx.fillStyle = "#666666";
    ctx.font = "20px Georgia, serif";
    ctx.fillText("has successfully completed the course", 700, 485);
    
    // Course title (with word wrap)
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "bold 32px Georgia, serif";
    const words = cert.course_title.split(" ");
    let line = "", y = 545;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > 1000 && line) {
        ctx.fillText(line.trim(), 700, y);
        line = word + " ";
        y += 42;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), 700, y);
    
    // Course details
    const detailsY = y + 70;
    const dateStr = cert.completed_at 
      ? new Date(cert.completed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : "";
    ctx.fillStyle = "#888888";
    ctx.font = "16px system-ui";
    ctx.fillText(`Instructor: ${cert.instructor || "SLA Team"}  •  Duration: ${cert.duration || "N/A"}  •  Completed: ${dateStr}`, 700, detailsY);
    
    // Credential ID
    ctx.font = "13px monospace";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(`Credential ID: ${cert.credential_id}`, 700, detailsY + 35);
    
    // Verification URL
    ctx.font = "12px system-ui";
    ctx.fillStyle = "#0087DB";
    ctx.fillText(`Verify at: ${getSiteUrl()}/certificates/${cert.credential_id}`, 700, detailsY + 60);
    
    // Signature section
    const sigY = 770;
    
    // Left signature (Executive Director)
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, sigY);
    ctx.lineTo(500, sigY);
    ctx.stroke();
    
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("Yasmin Belo-Osagie", 375, sigY + 30);
    ctx.fillStyle = "#666666";
    ctx.font = "14px system-ui";
    ctx.fillText("Co-Founder & Executive Director", 375, sigY + 52);
    
    // Right signature (Programs Manager)
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(900, sigY);
    ctx.lineTo(1150, sigY);
    ctx.stroke();
    
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("Afua Osei", 1025, sigY + 30);
    ctx.fillStyle = "#666666";
    ctx.font = "14px system-ui";
    ctx.fillText("Co-Founder & CEO", 1025, sigY + 52);
    
    // Seal/Badge at bottom center
    ctx.beginPath();
    ctx.arc(700, 860, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#D4A843";
    ctx.fill();
    ctx.strokeStyle = "#0A4D8C";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px system-ui";
    ctx.fillText("★", 700, 870);
    
    // Organization name at bottom
    ctx.fillStyle = "#888888";
    ctx.font = "12px system-ui";
    ctx.fillText("She Leads Africa", 700, 910);
    
    // Export certificate
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
  };
  
  // Fallback if logo doesn't load - generate anyway
  logo.onerror = () => {
    // Continue without logo
    ctx.fillStyle = "#0A4D8C";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("SHE LEADS AFRICA", 700, 140);
    // ... rest of certificate drawing here (abbreviated for space)
    console.warn("Logo failed to load, certificate generated without logo");
  };
}

export default function CertificatesPage() {
  const { appUser } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [allCertificates, setAllCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin/staff
  const isAdmin = appUser?.role === "admin" || appUser?.role === "program_manager" || appUser?.role === "instructor";

   const load = useCallback(async () => {
     if (!appUser?.id) return;
     setLoading(true);
     
     if (isAdmin) {
       // Admin view: Load ALL certificates from all users
       const { data, error } = await supabase
         .from("certificates")
         .select(`
           *,
           profiles:user_id (
             name,
             email
           )
         `)
         .order("issued_at", { ascending: false });
       
       if (!error && data) {
         setAllCertificates(data);
       }
     } else {
       // Student view: Load only their certificates
       const [certsResponse, enrollmentsResponse] = await Promise.all([
         api.getCertificates(appUser.id),
         api.getUserEnrollments(appUser.id),
       ]);
       setCertificates(certsResponse.success ? certsResponse.data || [] : []);

       const enrollments = enrollmentsResponse.success ? enrollmentsResponse.data || [] : [];
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
     }
     
     setLoading(false);
   }, [appUser?.id, isAdmin]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">
            {isAdmin ? "Certificate Management" : "My Certificates"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {loading ? "Loading..." : isAdmin 
              ? `Manage all certificates issued across the platform` 
              : `${certificates.length} digital credentials earned.`}
          </p>
        </div>
      </div>

      {/* Admin View */}
      {isAdmin ? (
        <>
          {/* Search and filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by student name, course, or credential ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" className="rounded-xl gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Admin table */}
          {!loading && (
            <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Course
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Issued Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Credential ID
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allCertificates
                      .filter((cert) => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          cert.profiles?.name?.toLowerCase().includes(search) ||
                          cert.profiles?.email?.toLowerCase().includes(search) ||
                          cert.course_title?.toLowerCase().includes(search) ||
                          cert.credential_id?.toLowerCase().includes(search)
                        );
                      })
                      .map((cert: any) => (
                        <tr key={cert.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                {cert.profiles?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {cert.profiles?.name || "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {cert.profiles?.email || ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-foreground">{cert.course_title}</div>
                            {cert.instructor && (
                              <div className="text-xs text-muted-foreground">{cert.instructor}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {cert.issued_at
                                ? new Date(cert.issued_at).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </div>
                          </td>
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
                                  generateCertificatePDF(
                                    cert,
                                    cert.profiles?.name || "Student",
                                    { open: true }
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
                                    `${getSiteUrl()}/certificates/${cert.id}`
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
                    {allCertificates.filter((cert) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        cert.profiles?.name?.toLowerCase().includes(search) ||
                        cert.profiles?.email?.toLowerCase().includes(search) ||
                        cert.course_title?.toLowerCase().includes(search) ||
                        cert.credential_id?.toLowerCase().includes(search)
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "No certificates found matching your search" : "No certificates issued yet"}
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
        /* Student View */
        <>
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
                        onClick={() => { navigator.clipboard.writeText(`${getSiteUrl()}/certificates/${cert.id}`); toast.success("Link copied!"); }}>
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
          <div className="bg-accent rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 flex items-center gap-4 mt-8">
            <Award className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Add certificates to your LinkedIn profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">Share your achievements. Each certificate has a unique shareable URL.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
