import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const tabs = ["Profile", "Account", "Notifications", "Privacy", "Appearance"];

export default function SettingsPage() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");
  const [name, setName] = useState(appUser?.name ?? "");
  const [bio, setBio] = useState("Passionate about data analytics and building businesses across Africa.");
  const [careerGoal, setCareerGoal] = useState(appUser?.careerGoal ?? "");
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("English");
  const [twoFA, setTwoFA] = useState(false);

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

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const handleSave = () => {
    setSaved(true);
    toast.success("Profile saved successfully!");
    setTimeout(() => setSaved(false), 2000);
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
    toast.success("Password updated successfully!");
    setPasswords({ current: "", newPass: "", confirm: "" });
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.info(`${key.replace(/([A-Z])/g, " $1").trim()} ${updated[key] ? "enabled" : "disabled"}`);
      return updated;
    });
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.info(`${key.replace(/([A-Z])/g, " $1").trim()} ${updated[key] ? "enabled" : "disabled"}`);
      return updated;
    });
  };

  const handleThemeChange = (t: string) => {
    setTheme(t);
    if (t === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(`Theme set to ${t}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
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
            className="bg-card rounded-2xl border border-border p-6 space-y-6">

            {activeTab === "Profile" && (
              <>
                <h2 className="font-display text-lg font-bold text-foreground">Profile Information</h2>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl gradient-card flex items-center justify-center text-3xl font-bold text-primary-foreground">
                      {appUser?.name?.charAt(0)}
                    </div>
                    <button onClick={() => toast.info("Photo upload coming soon!")} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center shadow-brand-sm hover:opacity-90">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{appUser?.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{appUser?.role?.replace("_", " ")}</p>
                    <button onClick={() => toast.info("Photo upload coming soon!")} className="text-xs text-primary hover:underline mt-1">Change photo</button>
                  </div>
                </div>
                {[
                  { label: "Full Name", value: name, setter: setName, type: "text" },
                  { label: "Email Address", value: appUser?.email ?? "", setter: () => {}, type: "email", disabled: true },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{field.label}</label>
                    <input type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} disabled={"disabled" in field && field.disabled}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Career Goal</label>
                  <input value={careerGoal} onChange={e => setCareerGoal(e.target.value)} placeholder="e.g. Become a Data Analyst"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
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
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                  <Button onClick={handlePasswordUpdate} className="rounded-xl gradient-card text-primary-foreground hover:opacity-90">Update Password</Button>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account.</p>
                  <Button variant="outline" className="rounded-xl" onClick={() => { setTwoFA(!twoFA); toast.success(twoFA ? "2FA disabled" : "2FA enabled! (simulated)"); }}>
                    {twoFA ? "Disable 2FA" : "Enable 2FA"}
                  </Button>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                  <Button variant="outline" className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => toast.error("Account deletion is disabled in demo mode.")}>
                    Delete Account
                  </Button>
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
                    { key: "jobAlerts" as const, label: "Job alerts", desc: "New jobs matching your skills" },
                    { key: "marketingEmails" as const, label: "Marketing emails", desc: "New courses and promotions" },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border">
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
                    { key: "publicProfile" as const, label: "Public profile", desc: "Let employers and other learners view your profile" },
                    { key: "showProgress" as const, label: "Show course progress", desc: "Display completed courses on your profile" },
                    { key: "jobMatching" as const, label: "Job matching", desc: "Allow employers to find you based on your skills" },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border">
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
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
