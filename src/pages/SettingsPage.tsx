import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { usePlatformConfig, useUpdatePlatformConfigMutation } from "@/hooks/useQueries";

const baseTabs = ["Profile", "Account", "Notifications", "Privacy", "Appearance"] as const;

export default function SettingsPage() {
  const { appUser, refreshProfile } = useAuth();
  const isAdmin = appUser?.role === "admin";
  const tabs = useMemo(() => {
    const t = [...baseTabs] as string[];
    if (isAdmin) t.push("Platform");
    return t;
  }, [isAdmin]);

  const [activeTab, setActiveTab] = useState<string>("Profile");
  const [name, setName] = useState(appUser?.name ?? "");
  const [bio, setBio] = useState(appUser?.bio ?? "");
  const [careerGoal, setCareerGoal] = useState(appUser?.careerGoal ?? "");
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("English");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(appUser?.avatar ?? null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [notificationPrefsRow, setNotificationPrefsRow] = useState<any | null>(null);

  useEffect(() => {
    setAvatarUrl(appUser?.avatar ?? null);
    setName(appUser?.name ?? "");
    setBio(appUser?.bio ?? "");
    setCareerGoal(appUser?.careerGoal ?? "");
  }, [appUser?.avatar, appUser?.name, appUser?.bio, appUser?.careerGoal]);

  // --- Platform: Twilio config (admin-only) ---
  // Only query when admin; otherwise avoid touching the table (RLS).
  const { data: twilioConfig } = usePlatformConfig("twilio", { enabled: isAdmin });
  const updatePlatformConfigMutation = useUpdatePlatformConfigMutation();
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    const cfg = (twilioConfig ?? {}) as Record<string, any>;
    setTwilioAccountSid(typeof cfg.accountSid === "string" ? cfg.accountSid : "");
    setTwilioAuthToken(typeof cfg.authToken === "string" ? cfg.authToken : "");
    setTwilioPhoneNumber(typeof cfg.phoneNumber === "string" ? cfg.phoneNumber : "");
    setTwilioWhatsappNumber(typeof cfg.whatsappNumber === "string" ? cfg.whatsappNumber : "");
  }, [isAdmin, twilioConfig]);

  const saveTwilioConfig = async () => {
    if (!appUser?.id) return;
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      toast.error("Please fill TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.");
      return;
    }
    try {
      await updatePlatformConfigMutation.mutateAsync({
        id: "twilio",
        data: {
          accountSid: twilioAccountSid.trim(),
          authToken: twilioAuthToken.trim(),
          phoneNumber: twilioPhoneNumber.trim(),
          whatsappNumber: twilioWhatsappNumber.trim(),
        },
      });
      toast.success("Twilio settings saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save Twilio settings.");
    }
  };

  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    deadlineReminders: true,
    programAnnouncements: true,
    jobAlerts: false,
    marketingEmails: false,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showProgress: true,
    jobMatching: false,
  });

   // React Query — load notification prefs row
   const notificationPrefsQuery = useQuery({
     queryKey: ["notification-prefs-settings", appUser?.id ?? ""],
     queryFn: () => api.getNotificationPreferences(appUser!.id),
     enabled: !!appUser?.id,
     select: (response) => (response.success ? response.data : null),
   });

   useEffect(() => {
     const row = notificationPrefsQuery.data;
     if (!row) return;
     setNotificationPrefsRow(row);
     const p = (row?.prefs ?? {}) as Record<string, any>;
     setNotifications((prev) => ({
       ...prev,
       courseUpdates: Boolean(p.course_updates?.email ?? prev.courseUpdates),
       deadlineReminders: Boolean(p.deadlines?.email ?? prev.deadlineReminders),
       programAnnouncements: Boolean(p.program_updates?.email ?? prev.programAnnouncements),
       jobAlerts: Boolean(p.job_matches?.email ?? prev.jobAlerts),
       marketingEmails: Boolean(p.promotions?.email ?? prev.marketingEmails),
     }));
     const privacyRow = (p.privacy ?? {}) as Record<string, any>;
     setPrivacy((prev) => ({
       ...prev,
       publicProfile: Boolean(privacyRow.publicProfile ?? prev.publicProfile),
       showProgress: Boolean(privacyRow.showProgress ?? prev.showProgress),
       jobMatching: Boolean(privacyRow.jobMatching ?? prev.jobMatching),
     }));
   }, [notificationPrefsQuery.data]);

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

   const handleSave = async () => {
     if (!appUser?.id) return;
     setSaved(true);
     try {
       const response = await api.updateProfile(appUser.id, {
         name,
         bio,
         career_goal: careerGoal,
       });
       if (!response.success) {
         toast.error("Save failed — check your Supabase connection.");
         return;
       }
       await refreshProfile();
       toast.success("Profile saved successfully!");
     } catch (e: any) {
       toast.error(e?.message || "Failed to save profile.");
     } finally {
       setTimeout(() => setSaved(false), 600);
     }
   };

  const handlePasswordUpdate = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    if (passwords.newPass.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    supabase.auth
      .updateUser({ password: passwords.newPass })
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Password updated successfully!");
        setPasswords({ current: "", newPass: "", confirm: "" });
      })
      .catch((e: any) => toast.error(e?.message || "Password update failed."));
  };

  const toggleNotification = async (key: keyof typeof notifications) => {
    const prev = notifications;
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    toast.info(`${key.replace(/([A-Z])/g, " $1").trim()} ${updated[key] ? "enabled" : "disabled"}`);

    if (!appUser?.id || !notificationPrefsRow) return;
    try {
      const existingPrefs = (notificationPrefsRow?.prefs ?? {}) as Record<string, any>;
      const nextPrefs = { ...existingPrefs };

      const setEmailForCategory = (categoryKey: string, value: boolean) => {
        const current = nextPrefs[categoryKey] ?? { email: true, sms: false, push: true };
        nextPrefs[categoryKey] = { ...current, email: value };
      };

       if (key === "courseUpdates") setEmailForCategory("course_updates", updated.courseUpdates);
       if (key === "deadlineReminders") setEmailForCategory("deadlines", updated.deadlineReminders);
       if (key === "programAnnouncements") setEmailForCategory("program_updates", updated.programAnnouncements);
       if (key === "jobAlerts") setEmailForCategory("job_matches", updated.jobAlerts);
       if (key === "marketingEmails") setEmailForCategory("promotions", updated.marketingEmails);

       const response = await api.upsertNotificationPreferences({
         userId: appUser.id,
         frequency: notificationPrefsRow?.frequency ?? "instant",
         quietStart: notificationPrefsRow?.quiet_start ?? "22:00",
         quietEnd: notificationPrefsRow?.quiet_end ?? "07:00",
         prefs: nextPrefs,
       });
       if (response.success) {
         setNotificationPrefsRow(response.data);
       } else {
         throw new Error(response.error || "Upsert failed");
       }
     } catch (e: any) {
       setNotifications(prev);
       toast.error(e?.message ?? "Failed to save notification preferences.");
     }
   };

  const togglePrivacy = async (key: keyof typeof privacy) => {
    const prev = privacy;
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    toast.info(`${key.replace(/([A-Z])/g, " $1").trim()} ${updated[key] ? "enabled" : "disabled"}`);

    if (!appUser?.id || !notificationPrefsRow) return;
    try {
      const existingPrefs = (notificationPrefsRow?.prefs ?? {}) as Record<string, any>;
      const nextPrefs = { ...existingPrefs, privacy: { ...(existingPrefs.privacy ?? {}) } };
      nextPrefs.privacy = {
        ...nextPrefs.privacy,
        publicProfile: updated.publicProfile,
        showProgress: updated.showProgress,
        jobMatching: updated.jobMatching,
      };

       const response = await api.upsertNotificationPreferences({
         userId: appUser.id,
         frequency: notificationPrefsRow?.frequency ?? "instant",
         quietStart: notificationPrefsRow?.quiet_start ?? "22:00",
         quietEnd: notificationPrefsRow?.quiet_end ?? "07:00",
         prefs: nextPrefs,
       });
       if (response.success) {
         setNotificationPrefsRow(response.data);
       } else {
         throw new Error(response.error || "Upsert failed");
       }
    } catch (e: any) {
      setPrivacy(prev);
      toast.error(e?.message ?? "Failed to save privacy preferences.");
    }
  };

  const handleThemeChange = (t: string) => {
    setTheme(t);
    if (t === "Dark") {
      document.documentElement.classList.add("dark");
    } else if (t === "Light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", Boolean(prefersDark));
    }
    toast.success(`Theme set to ${t}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full min-h-[80vh]">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (e) => {
          if (!appUser?.id) return;
          const file = e.target.files?.[0];
          if (!file) return;
          setUploadingAvatar(true);
          try {
            const publicUrl = await api.uploadAvatar(appUser.id, file);
            if (publicUrl) {
              setAvatarUrl(publicUrl);
              await refreshProfile();
              toast.success("Profile photo updated!");
            } else {
              toast.error("Photo upload failed — check Supabase storage bucket 'avatars'.");
            }
          } catch (err: any) {
            toast.error(err?.message || "Photo upload failed.");
          } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = "";
          }
        }}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-foreground tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground text-sm">Profile, account security, notifications, and display preferences.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-52 shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 lg:flex-none text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "gradient-card text-primary-foreground shadow-brand-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border-0 p-6 space-y-6">

            {activeTab === "Profile" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Profile Information</h2>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl gradient-card flex items-center justify-center text-3xl font-bold text-primary-foreground overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        appUser?.name?.charAt(0)
                      )}
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center shadow-brand-sm hover:opacity-90 disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{appUser?.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{appUser?.role?.replace("_", " ")}</p>
                    <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="text-xs text-primary hover:underline mt-1 disabled:opacity-50">
                      Change photo
                    </button>
                  </div>
                </div>
                {[
                  { label: "Full Name", value: name, setter: setName, type: "text" },
                  { label: "Email Address", value: appUser?.email ?? "", setter: () => {}, type: "email", disabled: true },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{field.label}</label>
                    <input type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} disabled={"disabled" in field && field.disabled}
                      className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Career Goal</label>
                  <input value={careerGoal} onChange={e => setCareerGoal(e.target.value)} placeholder="e.g. Become a Data Analyst"
                    className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="rounded-xl gradient-card text-primary-foreground hover:opacity-90 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </>
            )}

            {activeTab === "Account" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Account Security</h2>
                <div className="space-y-4">
                  {[
                    { label: "Current Password", key: "current" as const },
                    { label: "New Password", key: "newPass" as const },
                    { label: "Confirm New Password", key: "confirm" as const },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{field.label}</label>
                      <input type="password" placeholder="••••••••" value={passwords[field.key]}
                        onChange={(e) => setPasswords((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                  <Button onClick={handlePasswordUpdate} className="rounded-xl gradient-card text-primary-foreground hover:opacity-90">Update Password</Button>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account.</p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      toast.info("2FA enrollment is not configured yet. Enable MFA in Supabase to use this feature.")
                    }
                  >
                    Enable 2FA
                  </Button>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                  <Button variant="outline" className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => toast.warning("To delete your account, please contact administrative support.")}>
                    Delete Account
                  </Button>
                </div>
              </>
            )}

            {activeTab === "Platform" && isAdmin && (
              <>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Platform Settings</h2>
                </div>

                <div className="rounded-2xl border border-border/40 bg-background p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Twilio</h3>
                    <p className="text-sm text-muted-foreground">
                      These are stored server-side and used by the `twilio-notify` Edge Function.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">TWILIO_ACCOUNT_SID</label>
                    <input
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                      placeholder="AC..."
                      className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">TWILIO_AUTH_TOKEN</label>
                    <input
                      type="password"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">TWILIO_PHONE_NUMBER</label>
                    <input
                      value={twilioPhoneNumber}
                      onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                      placeholder="+18444481077"
                      className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">TWILIO_WHATSAPP_NUMBER (optional)</label>
                    <input
                      value={twilioWhatsappNumber}
                      onChange={(e) => setTwilioWhatsappNumber(e.target.value)}
                      placeholder="whatsapp:+18444481077"
                      className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={saveTwilioConfig}
                      className="rounded-xl gradient-card text-primary-foreground hover:opacity-90 flex items-center gap-2"
                      disabled={updatePlatformConfigMutation.isPending}
                    >
                      <Save className="w-4 h-4" /> {updatePlatformConfigMutation.isPending ? "Saving..." : "Save Twilio Settings"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "Notifications" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Notification Preferences</h2>
                <div className="space-y-4">
                  {([
                    { key: "courseUpdates" as const, label: "Course updates", desc: "New lessons, module releases" },
                    { key: "deadlineReminders" as const, label: "Deadline reminders", desc: "Upcoming quizzes and assignments" },
                    { key: "programAnnouncements" as const, label: "Program announcements", desc: "Live sessions and cohort updates" },
                    { key: "jobAlerts" as const, label: "Opportunities digest", desc: "Optional updates from SLA partners (learning-first platform)" },
                    { key: "marketingEmails" as const, label: "Marketing emails", desc: "New courses and promotions" },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button onClick={() => toggleNotification(item.key)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${notifications[item.key] ? "bg-secondary" : "bg-muted"}`}>
                        <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${notifications[item.key] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "Privacy" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Privacy Settings</h2>
                <div className="space-y-4">
                  {([
                    { key: "publicProfile" as const, label: "Public profile", desc: "Let other learners view your profile" },
                    { key: "showProgress" as const, label: "Show course progress", desc: "Display completed courses on your profile" },
                    { key: "jobMatching" as const, label: "Career visibility", desc: "Optional — share skills for future opportunities (off by default)" },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button onClick={() => togglePrivacy(item.key)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${privacy[item.key] ? "bg-secondary" : "bg-muted"}`}>
                        <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${privacy[item.key] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "Appearance" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Appearance</h2>
                <p className="text-xs text-muted-foreground -mt-2 mb-2">Light/dark is a local display preference only.</p>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["Light", "Dark", "System"].map(t => (
                      <button key={t} onClick={() => handleThemeChange(t)}
                        className={`p-4 rounded-xl border text-sm font-medium transition-all ${theme === t ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Language</p>
                  <select value={language} onChange={(e) => { setLanguage(e.target.value); toast.success(`Language set to ${e.target.value}`); }}
                    className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option>English</option>
                    <option>French</option>
                    <option>Swahili</option>
                    <option>Hausa</option>
                    <option>Yoruba</option>
                    <option>Igbo</option>
                  </select>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
