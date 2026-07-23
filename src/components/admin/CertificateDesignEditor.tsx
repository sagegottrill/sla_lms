import { useRef, useState } from "react";
import { Loader2, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_CERTIFICATE_CONFIG,
  mergeCertificateConfig,
  type CertificateConfig,
} from "@/lib/certificateConfig";
import { downloadOrOpenCertificate } from "@/lib/certificateRenderer";

type Props = {
  value: CertificateConfig;
  onChange: (next: CertificateConfig) => void;
  /** Used for storage path when uploading logos */
  assetOwnerId?: number | null;
  previewCourseTitle?: string;
};

const inputCls =
  "w-full rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

async function uploadCertAsset(
  file: File,
  folder: string,
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "png";
  const path = `certificate-assets/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("courses").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) {
    console.error(error);
    toast.error("Could not upload image. Try again.");
    return null;
  }
  const { data } = supabase.storage.from("courses").getPublicUrl(path);
  return data.publicUrl || null;
}

export default function CertificateDesignEditor({
  value,
  onChange,
  assetOwnerId,
  previewCourseTitle = "Sample Course Title",
}: Props) {
  const cfg = mergeCertificateConfig(value);
  const logoRef = useRef<HTMLInputElement>(null);
  const partnerRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "partner" | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const set = <K extends keyof CertificateConfig>(key: K, v: CertificateConfig[K]) => {
    onChange({ ...cfg, [key]: v });
  };

  const handleUpload = async (kind: "logo" | "partner", file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setUploading(kind);
    const url = await uploadCertAsset(file, String(assetOwnerId || "draft"));
    setUploading(null);
    if (!url) return;
    if (kind === "logo") set("logo_url", url);
    else set("partner_logo_url", url);
    toast.success("Image uploaded.");
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      await downloadOrOpenCertificate({
        studentName: "Aisha Salihu",
        courseTitle: previewCourseTitle,
        credentialId: "PREVIEW-DEMO",
        completedAt: new Date().toISOString(),
        config: cfg,
        open: true,
      });
      toast.success("Preview opened.");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate preview.");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Certificate Design</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Customize logos, signers, and wording for this offering. Use partner logos for JABAMan, CFY, AfriLab, etc.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl shrink-0"
          onClick={handlePreview}
          disabled={previewing}
        >
          {previewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          Preview
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Organization name</label>
          <input className={inputCls + " mt-1"} value={cfg.org_name} onChange={(e) => set("org_name", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Program / partner label</label>
          <input
            className={inputCls + " mt-1"}
            value={cfg.program_label}
            onChange={(e) => set("program_label", e.target.value)}
            placeholder="e.g. Young Nigeria Works, JABAMan"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Accent color</label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={cfg.accent_color}
              onChange={(e) => set("accent_color", e.target.value)}
              className="h-10 w-12 rounded-lg border-0 cursor-pointer"
            />
            <input className={inputCls} value={cfg.accent_color} onChange={(e) => set("accent_color", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <input className={inputCls + " mt-1"} value={cfg.title} onChange={(e) => set("title", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          Body text (use {"{{course_title}}"} and {"{{program_label}}"})
        </label>
        <textarea
          className={inputCls + " mt-1 resize-none"}
          rows={3}
          value={cfg.body_template}
          onChange={(e) => set("body_template", e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Primary logo</label>
          <div className="flex items-center gap-3 mt-1">
            {cfg.logo_url ? (
              <img src={cfg.logo_url} alt="Logo" className="h-10 object-contain max-w-[120px]" />
            ) : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}>
              {uploading === "logo" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload
            </Button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("logo", e.target.files?.[0])} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Partner logo (optional)</label>
          <div className="flex items-center gap-3 mt-1">
            {cfg.partner_logo_url ? (
              <img src={cfg.partner_logo_url} alt="Partner" className="h-10 object-contain max-w-[120px]" />
            ) : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => partnerRef.current?.click()} disabled={uploading === "partner"}>
              {uploading === "partner" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload
            </Button>
            <input ref={partnerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("partner", e.target.files?.[0])} />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Signer 1 name</label>
          <input className={inputCls + " mt-1"} value={cfg.signer1_name} onChange={(e) => set("signer1_name", e.target.value)} />
          <label className="text-xs font-semibold text-muted-foreground mt-2 block">Signer 1 title</label>
          <input className={inputCls + " mt-1"} value={cfg.signer1_title} onChange={(e) => set("signer1_title", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Signer 2 name</label>
          <input className={inputCls + " mt-1"} value={cfg.signer2_name} onChange={(e) => set("signer2_name", e.target.value)} />
          <label className="text-xs font-semibold text-muted-foreground mt-2 block">Signer 2 title</label>
          <input className={inputCls + " mt-1"} value={cfg.signer2_title} onChange={(e) => set("signer2_title", e.target.value)} />
        </div>
      </div>

      <button
        type="button"
        className="text-xs text-primary font-medium hover:underline"
        onClick={() => onChange({ ...DEFAULT_CERTIFICATE_CONFIG })}
      >
        Reset to SLA sample defaults
      </button>
    </div>
  );
}
