import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Globe, Megaphone, Layout, Check, AlertCircle, Plus, Trash2, BookOpen, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSiteConfig, useUpdateSiteConfigMutation, useCourses, usePrograms } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";

export default function LandingPageCMS() {
  const { data: config, isLoading } = useSiteConfig();
  const { data: courses } = useCourses();
  const { data: programs } = usePrograms();
  const updateMutation = useUpdateSiteConfigMutation();

  const [localConfig, setLocalConfig] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [config]);

  if (isLoading || !localConfig) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <Globe className="w-10 h-10 animate-pulse mx-auto mb-4 opacity-20" />
        Loading site configuration...
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: 'landing_page', data: localConfig });
      toast.success("Landing page updated successfully!");
    } catch (err) {
      toast.error("Failed to update landing page.");
    }
  };

  const updateNested = (path: string, value: any) => {
    const keys = path.split(".");
    const newData = { ...localConfig };
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Landing Page Manager
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Control your primary storefront in real-time</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gradient-card text-primary-foreground gap-2 rounded-xl h-10 px-6">
          <Save className="w-4 h-4" /> {updateMutation.isPending ? "Saving..." : "Publish Changes"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        {/* Promo Section Control (Important for active campaigns) */}
        <div className={cn(
          "bg-card rounded-2xl border transition-all duration-300 p-6 space-y-4",
          localConfig.promo?.enabled ? "border-secondary/30 shadow-md shadow-secondary/5" : "border-border/50 opacity-70"
        )}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Megaphone className="w-4 h-4 text-secondary" /> Promotional Banner
            </h3>
            <button 
              onClick={() => updateNested("promo.enabled", !localConfig.promo?.enabled)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors flex items-center px-0.5",
                localConfig.promo?.enabled ? "bg-secondary" : "bg-muted"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                localConfig.promo?.enabled ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Campaign Name / Headline</label>
              <input 
                value={localConfig.promo?.title}
                onChange={e => updateNested("promo.title", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Deadline (Countdown)</label>
              <input 
                type="datetime-local"
                value={localConfig.promo?.deadline?.split('Z')[0]}
                onChange={e => updateNested("promo.deadline", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Featured Courses Selection */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <BookOpen className="w-4 h-4 text-primary" /> Featured Courses
          </h3>
          <p className="text-[10px] text-muted-foreground italic">Select courses to showcase on the landing page</p>
          <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-2">
            {(courses || []).map(course => (
              <button 
                key={course.id}
                onClick={() => {
                  const current = localConfig.featured_course_ids || [];
                  const next = current.includes(course.id) 
                    ? current.filter((id: number) => id !== course.id)
                    : [...current, course.id];
                  updateNested("featured_course_ids", next);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                  localConfig.featured_course_ids?.includes(course.id)
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border hover:border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0">
                    <img src={course.image} alt="" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight line-clamp-1">{course.title}</p>
                    <p className="text-[10px] text-muted-foreground">{course.category}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                  localConfig.featured_course_ids?.includes(course.id) ? "bg-primary border-primary" : "border-border"
                )}>
                  {localConfig.featured_course_ids?.includes(course.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Programs Selection */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <FolderOpen className="w-4 h-4 text-primary" /> Featured Programs
          </h3>
          <p className="text-[10px] text-muted-foreground italic">Select programs to feature on the homepage</p>
          <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-2">
            {(programs || []).map(prog => (
              <button 
                key={prog.id}
                onClick={() => {
                  const current = localConfig.featured_program_ids || [];
                  const next = current.includes(prog.id) 
                    ? current.filter((id: number) => id !== prog.id)
                    : [...current, prog.id];
                  updateNested("featured_program_ids", next);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                  localConfig.featured_program_ids?.includes(prog.id)
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border hover:border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0">
                    <img src={prog.image} alt="" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight line-clamp-1">{prog.title}</p>
                    <p className="text-[10px] text-muted-foreground">{prog.category}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                  localConfig.featured_program_ids?.includes(prog.id) ? "bg-primary border-primary" : "border-border"
                )}>
                  {localConfig.featured_program_ids?.includes(prog.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
