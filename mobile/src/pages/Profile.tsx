import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Award, LogOut, MapPin, Link2, Camera, BookOpen, Moon, Sun } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, Btn, Card, PageLoader, Tag } from "@kit";
import { errorText, fmtDate, friendlyError, getTheme, setTheme, devPreviewUser } from "@kit";
import type { Theme } from "@kit";

/**
 * PROFILE TAB — account info (avatar upload included), skills & career goal,
 * quick summary of certificates. Sign out lives here too.
 */
export default function Profile() {
  const { appUser: authUser, logout, refreshProfile } = useAuth();
  // Preview scaffold: ?role= mock feeds Profile too, matching the Gate's fallback.
  const appUser = authUser ?? devPreviewUser();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next); // applies the class + persists
    setThemeState(next);
  };

  const { data: certs } = useQuery({
    queryKey: ["certificates", "mobile", appUser?.id],
    queryFn: () => api.getCertificates(appUser!.id),
    enabled: !!appUser,
    select: (r) => (r.success ? r.data ?? [] : []),
  });

  if (!appUser) return <PageLoader />;

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const url = await api.uploadAvatar(appUser.id, file);
      if (!url) {
        toast.error("Could not upload photo — try a smaller image.");
        return;
      }
      await refreshProfile();
      toast.success("Profile photo updated ✨");
    } catch (err) {
      toast.error(friendlyError(errorText(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-full pb-8">
      <div className="bg-gradient-to-br from-primary to-[#271066] px-5 pb-16 pt-8 text-white">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <div className="mt-5 flex items-center gap-4">
          <div className="relative">
            <Avatar name={appUser.name} src={appUser.avatar} className="h-20 w-20 text-xl ring-4 ring-white/25" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-md"
              aria-label="Change profile photo"
            >
              {uploading ? <FileLoader /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold">{appUser.name}</p>
            <p className="truncate text-sm text-white/80">{appUser.email}</p>
            <Tag className="mt-1.5" color={appUser.role === "student" ? "blue" : "violet"}>
              {appUser.role.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
            </Tag>
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.target.value = ""; }} />

      <div className="-mt-10 space-y-3 px-4">
        {!appUser.onboarding?.completed && (
          <Card onClick={() => navigate("/onboarding")} className="flex items-center gap-3 border-primary/30 bg-accent p-4">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#271066]">Complete your profile</p>
              <p className="text-xs text-[#271066]/70">Headline, goals & skills — 60 seconds, mentors find you faster.</p>
            </div>
            <ChevronRight2 />
          </Card>
        )}

        {/* career snapshot */}
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Career snapshot</p>
          {appUser.headline && <p className="mt-1.5 text-sm font-semibold">{appUser.headline}</p>}
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {appUser.careerGoal && (
              <p className="flex items-start gap-2"><Award className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{appUser.careerGoal}</p>
            )}
            {appUser.location && (
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{appUser.location}</p>
            )}
            {appUser.linkedin && (
              <p className="flex items-center gap-2"><Link2 className="h-4 w-4 shrink-0 text-primary" />
                <a href={appUser.linkedin} target="_blank" rel="noreferrer" className="truncate text-primary underline">{appUser.linkedin}</a>
              </p>
            )}
            {Array.isArray(appUser.skills) && appUser.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {appUser.skills.slice(0, 8).map((s) => <Tag key={s} color="gray">{s}</Tag>)}
              </div>
            )}
            {!appUser.headline && !appUser.careerGoal && !appUser.location && (
              <p className="pt-1 text-xs text-muted-foreground">Add your headline, goal and skills on the web app to complete your profile.</p>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Member since {fmtDate(appUser.joined ?? null)}</p>
        </Card>

        {/* appearance — light is the default, dark is opt-in */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
                {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Dark mode</p>
                <p className="text-xs text-muted-foreground">Off by default — switch only if you prefer it.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ease-premium ${theme === "dark" ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ease-premium ${theme === "dark" ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
        </Card>

        {/* certificates preview */}
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Certificates</p>
          {(certs ?? []).length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" /> Finish a course to earn your first certificate.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {(certs ?? []).slice(0, 3).map((c: any) => (
                <div key={c.id ?? c.credential_id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.course_title ?? c.certificate_name ?? "Certificate"}</p>
                    <p className="text-[11px] text-muted-foreground">Issued {fmtDate(c.issued_at ?? c.created_at)}</p>
                  </div>
                  <Award className="h-5 w-5 shrink-0 text-amber-500" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Btn variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/5" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" /> Sign out
        </Btn>
        <p className="pb-4 text-center text-[11px] text-muted-foreground">She Leads Africa · Mobile · v2.8.0</p>
      </div>
    </div>
  );
}

function ChevronRight2() {
  return <ChevronRight className="h-5 w-5 shrink-0 text-[#271066]/60" />;
}

function FileLoader() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent block" />;
}
