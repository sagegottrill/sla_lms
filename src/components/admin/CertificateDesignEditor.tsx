import { useRef, useState } from "react";
import { Loader2, Upload, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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

const sectionTitleCls = "text-sm font-semibold text-foreground";
const sectionHintCls = "text-xs text-muted-foreground mt-1";

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
  const backgroundRef = useRef<HTMLInputElement>(null);
  const watermarkRef = useRef<HTMLInputElement>(null);
  const sealRef = useRef<HTMLInputElement>(null);
  const signer1Ref = useRef<HTMLInputElement>(null);
  const signer2Ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<
    "logo" | "partner" | "background" | "watermark" | "seal" | "signer1" | "signer2" | null
  >(null);
  const [previewing, setPreviewing] = useState(false);

  const set = <K extends keyof CertificateConfig>(key: K, v: CertificateConfig[K]) => {
    onChange({ ...cfg, [key]: v });
  };

  const clearAsset = (key: keyof CertificateConfig) => onChange({ ...cfg, [key]: "" });

  const handleUpload = async (
    kind: "logo" | "partner" | "background" | "watermark" | "seal" | "signer1" | "signer2",
    file: File | undefined,
  ) => {
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
    else if (kind === "partner") set("partner_logo_url", url);
    else if (kind === "background") set("background_url", url);
    else if (kind === "watermark") set("watermark_url", url);
    else if (kind === "seal") set("seal_url", url);
    else if (kind === "signer1") set("signer1_signature_url", url);
    else set("signer2_signature_url", url);
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

      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            For a more premium finish, upload transparent PNG signature images for each signer. The renderer
            places the signatures above the name lines automatically.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className={sectionTitleCls}>Branding</h4>
          <p className={sectionHintCls}>
            Keep the logos modest and let the learner name stay dominant, like premium Coursera and edX certificates.
          </p>
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
              {cfg.logo_url ? (
                <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("logo_url")}>
                  Clear
                </Button>
              ) : null}
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
              {cfg.partner_logo_url ? (
                <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("partner_logo_url")}>
                  Clear
                </Button>
              ) : null}
              <input ref={partnerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("partner", e.target.files?.[0])} />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <h4 className={sectionTitleCls}>Typography & Layout</h4>
          <p className={sectionHintCls}>
            Use one strong accent and lots of whitespace. That is what makes premium certificates feel expensive.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Layout variant</label>
            <select
              className={inputCls + " mt-1"}
              value={cfg.layout_variant}
              onChange={(e) => set("layout_variant", e.target.value as CertificateConfig["layout_variant"])}
            >
              <option value="formal_luxury">Formal luxury</option>
              <option value="clean_modern">Clean modern</option>
              <option value="official_academic">Official academic</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Border style</label>
            <select
              className={inputCls + " mt-1"}
              value={cfg.border_style}
              onChange={(e) => set("border_style", e.target.value as CertificateConfig["border_style"])}
            >
              <option value="double">Double frame</option>
              <option value="minimal">Minimal frame</option>
              <option value="none">No frame</option>
            </select>
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
            <label className="text-xs font-semibold text-muted-foreground">Name color</label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={cfg.name_color}
                onChange={(e) => set("name_color", e.target.value)}
                className="h-10 w-12 rounded-lg border-0 cursor-pointer"
              />
              <input className={inputCls} value={cfg.name_color} onChange={(e) => set("name_color", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Body color</label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={cfg.body_color}
                onChange={(e) => set("body_color", e.target.value)}
                className="h-10 w-12 rounded-lg border-0 cursor-pointer"
              />
              <input className={inputCls} value={cfg.body_color} onChange={(e) => set("body_color", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Title</label>
            <input className={inputCls + " mt-1"} value={cfg.title} onChange={(e) => set("title", e.target.value)} />
          </div>
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

      <Separator />

      <div className="space-y-3">
        <div>
          <h4 className={sectionTitleCls}>Background & Decorative Assets</h4>
          <p className={sectionHintCls}>
            Default surface is premium white. Upload a graduation photo as the watermark for the faded background look — not as the main background.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Background image</label>
          <div className="mt-1 flex items-center gap-3">
            {cfg.background_url ? <img src={cfg.background_url} alt="Background" className="h-12 w-24 rounded-lg object-cover" /> : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => backgroundRef.current?.click()} disabled={uploading === "background"}>
              {uploading === "background" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload
            </Button>
            {cfg.background_url ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("background_url")}>
                Clear
              </Button>
            ) : null}
            <input ref={backgroundRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("background", e.target.files?.[0])} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Watermark image</label>
          <div className="mt-1 flex items-center gap-3">
            {cfg.watermark_url ? <img src={cfg.watermark_url} alt="Watermark" className="h-12 max-w-[90px] object-contain" /> : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => watermarkRef.current?.click()} disabled={uploading === "watermark"}>
              {uploading === "watermark" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload
            </Button>
            {cfg.watermark_url ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("watermark_url")}>
                Clear
              </Button>
            ) : null}
            <input ref={watermarkRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("watermark", e.target.files?.[0])} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Seal / badge image</label>
          <div className="mt-1 flex items-center gap-3">
            {cfg.seal_url ? <img src={cfg.seal_url} alt="Seal" className="h-12 max-w-[90px] object-contain" /> : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => sealRef.current?.click()} disabled={uploading === "seal"}>
              {uploading === "seal" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload
            </Button>
            {cfg.seal_url ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("seal_url")}>
                Clear
              </Button>
            ) : null}
            <input ref={sealRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("seal", e.target.files?.[0])} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <h4 className={sectionTitleCls}>Signatures</h4>
          <p className={sectionHintCls}>
            Real signatures plus names and titles create the strongest premium feel.
          </p>
        </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Signer 1 name</label>
          <input className={inputCls + " mt-1"} value={cfg.signer1_name} onChange={(e) => set("signer1_name", e.target.value)} />
          <label className="text-xs font-semibold text-muted-foreground mt-2 block">Signer 1 title</label>
          <input className={inputCls + " mt-1"} value={cfg.signer1_title} onChange={(e) => set("signer1_title", e.target.value)} />
          <label className="text-xs font-semibold text-muted-foreground mt-2 block">Signer 1 signature image</label>
          <div className="mt-1 flex items-center gap-3">
            {cfg.signer1_signature_url ? (
              <img
                src={cfg.signer1_signature_url}
                alt="Signer 1 signature"
                className="h-12 max-w-[140px] object-contain"
              />
            ) : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => signer1Ref.current?.click()} disabled={uploading === "signer1"}>
              {uploading === "signer1" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload signature
            </Button>
            {cfg.signer1_signature_url ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("signer1_signature_url")}>
                Clear
              </Button>
            ) : null}
            <input ref={signer1Ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("signer1", e.target.files?.[0])} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Signer 2 name</label>
          <input className={inputCls + " mt-1"} value={cfg.signer2_name} onChange={(e) => set("signer2_name", e.target.value)} />
          <label className="text-xs font-semibold text-muted-foreground mt-2 block">Signer 2 title</label>
          <input className={inputCls + " mt-1"} value={cfg.signer2_title} onChange={(e) => set("signer2_title", e.target.value)} />
          <label className="text-xs font-semibold text-muted-foreground mt-2 block">Signer 2 signature image</label>
          <div className="mt-1 flex items-center gap-3">
            {cfg.signer2_signature_url ? (
              <img
                src={cfg.signer2_signature_url}
                alt="Signer 2 signature"
                className="h-12 max-w-[140px] object-contain"
              />
            ) : null}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => signer2Ref.current?.click()} disabled={uploading === "signer2"}>
              {uploading === "signer2" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload signature
            </Button>
            {cfg.signer2_signature_url ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => clearAsset("signer2_signature_url")}>
                Clear
              </Button>
            ) : null}
            <input ref={signer2Ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("signer2", e.target.files?.[0])} />
          </div>
        </div>
      </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <h4 className={sectionTitleCls}>Verification</h4>
          <p className={sectionHintCls}>
            Premium certificates feel trustworthy when the validation area is explicit but visually restrained.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl bg-muted/30 p-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">Show QR code</span>
            <Switch checked={cfg.show_qr} onCheckedChange={(next) => set("show_qr", next)} />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">Show verification URL</span>
            <Switch checked={cfg.show_verification_url} onCheckedChange={(next) => set("show_verification_url", next)} />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">Show certificate ID</span>
            <Switch checked={cfg.show_credential_id} onCheckedChange={(next) => set("show_credential_id", next)} />
          </label>
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
