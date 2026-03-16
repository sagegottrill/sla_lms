import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Download, Share2, ExternalLink, Calendar, BookOpen, Upload, Image, PenTool, X, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function generateCertificatePDF(cert: { course: string; credentialId: string; instructor: string; completedDate: string; duration: string }, userName: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0A4D8C";
  ctx.fillRect(0, 0, 1200, 850);

  // Inner white area
  ctx.fillStyle = "#FFFFFF";
  ctx.roundRect(40, 40, 1120, 770, 16);
  ctx.fill();

  // Top accent bar
  const grad = ctx.createLinearGradient(40, 40, 1160, 40);
  grad.addColorStop(0, "#0A4D8C");
  grad.addColorStop(1, "#0087DB");
  ctx.fillStyle = grad;
  ctx.fillRect(40, 40, 1120, 8);

  // Gold accent line
  ctx.fillStyle = "#D4A843";
  ctx.fillRect(500, 130, 200, 3);

  // Title
  ctx.fillStyle = "#0A4D8C";
  ctx.font = "bold 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SHE LEADS AFRICA — CONNECTA", 600, 100);

  ctx.fillStyle = "#D4A843";
  ctx.font = "bold 32px Georgia, serif";
  ctx.fillText("Certificate of Completion", 600, 180);

  // Subtitle
  ctx.fillStyle = "#666666";
  ctx.font = "16px system-ui";
  ctx.fillText("This is to certify that", 600, 240);

  // Name
  ctx.fillStyle = "#0A4D8C";
  ctx.font = "bold 42px Georgia, serif";
  ctx.fillText(userName, 600, 300);

  // Gold line under name
  ctx.fillStyle = "#D4A843";
  ctx.fillRect(400, 320, 400, 2);

  // Achievement text
  ctx.fillStyle = "#666666";
  ctx.font = "16px system-ui";
  ctx.fillText("has successfully completed the course", 600, 370);

  // Course name
  ctx.fillStyle = "#0A4D8C";
  ctx.font = "bold 26px Georgia, serif";
  const words = cert.course.split(" ");
  let line = "";
  let y = 420;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > 900 && line) {
      ctx.fillText(line.trim(), 600, y);
      line = word + " ";
      y += 36;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), 600, y);

  // Details
  const detailY = y + 70;
  ctx.fillStyle = "#888888";
  ctx.font = "14px system-ui";
  ctx.fillText(`Instructor: ${cert.instructor}  ·  Duration: ${cert.duration}  ·  Completed: ${cert.completedDate}`, 600, detailY);

  // Credential ID
  ctx.font = "12px monospace";
  ctx.fillStyle = "#aaaaaa";
  ctx.fillText(`Credential ID: ${cert.credentialId}`, 600, detailY + 30);

  // Signature line
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(420, 700);
  ctx.lineTo(780, 700);
  ctx.stroke();

  ctx.fillStyle = "#0A4D8C";
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("Dr. Yasmin Saleh", 600, 690);

  ctx.fillStyle = "#888888";
  ctx.font = "12px system-ui";
  ctx.fillText("Executive Director, She Leads Africa", 600, 720);

  // Award icon (circle)
  ctx.beginPath();
  ctx.arc(600, 770, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#D4A843";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px system-ui";
  ctx.fillText("★", 600, 777);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SLA-Certificate-${cert.credentialId}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Certificate downloaded as image!`);
  }, "image/png");
}

const certificates = [
  {
    id: 1, course: "Women in Leadership: From Manager to CEO", category: "Leadership", completedDate: "Feb 15, 2026",
    credentialId: "SLA-2026-LDR-00847", instructor: "CEO Ngozi Williams", duration: "18 hours",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=220&fit=crop",
  },
  {
    id: 2, course: "Entrepreneurship & Business Modeling", category: "Business", completedDate: "Jan 28, 2026",
    credentialId: "SLA-2026-BUS-00312", instructor: "Zara Mensah", duration: "28 hours",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=220&fit=crop",
  },
  {
    id: 3, course: "Digital Marketing Essentials", category: "Marketing", completedDate: "Dec 10, 2025",
    credentialId: "SLA-2025-MKT-01200", instructor: "Aisha Kamara", duration: "15 hours",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=220&fit=crop",
  },
];

function CertCard({ cert, userName }: { cert: typeof certificates[0]; userName: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-brand-sm transition-shadow">
      <div className="relative h-44 overflow-hidden">
        <img src={cert.image} alt={cert.course} className="w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-primary-foreground/80 text-xs uppercase tracking-widest">Certificate of Completion</p>
          <p className="font-display font-bold text-primary-foreground text-sm mt-1 leading-tight">{cert.course}</p>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <span className="text-xs text-primary font-medium">{cert.category}</span>
          <h3 className="font-semibold text-foreground text-sm leading-snug mt-0.5">{cert.course}</h3>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />Completed {cert.completedDate}</div>
          <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" />{cert.duration} · {cert.instructor}</div>
          <div className="font-mono text-[10px] bg-muted px-2 py-1 rounded-md mt-2">ID: {cert.credentialId}</div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => generateCertificatePDF(cert, userName)} className="flex-1 rounded-xl gradient-card text-primary-foreground text-xs hover:opacity-90 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { navigator.clipboard.writeText(`https://connecta.sla.africa/certificates/${cert.id}`); toast.success("Certificate link copied to clipboard!"); }}><Share2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => toast.info(`Viewing certificate for "${cert.course}"`)}><ExternalLink className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CertificatesPage() {
  const { appUser } = useAuth();
  const [showCustomize, setShowCustomize] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [signatureUploaded, setSignatureUploaded] = useState(false);
  const [signerName, setSignerName] = useState("Dr. Yasmin Saleh");
  const [signerTitle, setSignerTitle] = useState("Executive Director, She Leads Africa");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowCustomize(false); }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Certificates</h1>
          <p className="text-muted-foreground text-sm mt-1">{certificates.length} certificates earned</p>
        </div>
        {appUser?.role === "admin" && (
          <Button variant="outline" onClick={() => setShowCustomize(!showCustomize)} className="rounded-xl flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" /> Customize Template
          </Button>
        )}
      </div>

      {/* Certificate template customizer (admin only) */}
      <AnimatePresence>
        {showCustomize && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Certificate Template Settings</h3>
              <button onClick={() => setShowCustomize(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>

            {/* Preview */}
            <div className="bg-muted/40 rounded-2xl border border-dashed border-border p-5">
              <div className="gradient-hero rounded-xl p-6 text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-4 left-4 w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                  {logoUploaded ? <Image className="w-6 h-6 text-primary-foreground/80" /> : <span className="text-[8px] text-primary-foreground/50 font-medium">LOGO</span>}
                </div>
                <p className="text-primary-foreground/70 text-xs uppercase tracking-widest mt-4">She Leads Africa — Connecta</p>
                <p className="text-primary-foreground/90 text-xs">This certifies that</p>
                <p className="font-display text-lg font-bold text-primary-foreground">Participant Name</p>
                <p className="text-primary-foreground/80 text-xs">has successfully completed</p>
                <p className="font-display font-semibold text-primary-foreground text-sm">Course / Program Title</p>
                <div className="mt-4 pt-4 border-t border-primary-foreground/20 flex justify-center">
                  <div className="text-center">
                    {signatureUploaded ? (
                      <div className="h-8 flex items-center justify-center mb-1">
                        <PenTool className="w-6 h-6 text-primary-foreground/60" />
                      </div>
                    ) : (
                      <div className="font-display text-primary-foreground/80 italic text-sm mb-1">{signerName}</div>
                    )}
                    <p className="text-primary-foreground/60 text-[10px]">{signerName}</p>
                    <p className="text-primary-foreground/50 text-[9px]">{signerTitle}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Live preview of certificate template</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Logo upload */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  <Image className="w-3.5 h-3.5 inline mr-1" />Organization Logo
                </label>
                <div onClick={() => setLogoUploaded(true)}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${logoUploaded ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
                  {logoUploaded ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg gradient-card flex items-center justify-center">
                        <Image className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <p className="text-xs text-primary font-medium">Logo uploaded ✓</p>
                      <button onClick={(e) => { e.stopPropagation(); setLogoUploaded(false); }} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Click to upload logo</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">PNG, SVG · Recommended 200×200px</p>
                    </>
                  )}
                </div>
              </div>

              {/* Signature upload */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  <PenTool className="w-3.5 h-3.5 inline mr-1" />Authorizing Signature
                </label>
                <div onClick={() => setSignatureUploaded(true)}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${signatureUploaded ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
                  {signatureUploaded ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                        <PenTool className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <p className="text-xs text-primary font-medium">Signature uploaded ✓</p>
                      <button onClick={(e) => { e.stopPropagation(); setSignatureUploaded(false); }} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  ) : (
                    <>
                      <PenTool className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Click to upload signature</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">PNG with transparent background</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Signer details */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Signer Name</label>
                <input value={signerName} onChange={e => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Signer Title</label>
                <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="rounded-xl gradient-card text-primary-foreground text-sm">
                {saved ? "Saved!" : "Save Template"}
              </Button>
              <Button variant="outline" className="rounded-xl text-sm flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Preview PDF
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[["3", "Earned"], ["2", "In Progress"], ["1,200+", "Hours Learned"]].map(([val, label]) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <div className="font-display text-2xl font-bold text-primary">{val}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {certificates.map(cert => <CertCard key={cert.id} cert={cert} userName={appUser?.name ?? "Student"} />)}
      </div>

      {/* LinkedIn tip */}
      <div className="bg-accent rounded-2xl border border-border p-5 flex items-center gap-4">
        <Award className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">Add certificates to your LinkedIn profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">Boost your professional visibility by sharing your achievements. Each certificate has a unique shareable URL.</p>
        </div>
      </div>
    </div>
  );
}
