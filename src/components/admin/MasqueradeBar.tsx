import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

interface MasqueradeSession {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  target_user_name: string;
  target_user_email: string;
  started_at: string;
}

export function MasqueradeBar() {
  const [session, setSession] = useState<MasqueradeSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if there's an active masquerade session
    const checkSession = () => {
      const sessionData = sessionStorage.getItem("masquerade_session");
      if (sessionData) {
        try {
          setSession(JSON.parse(sessionData));
        } catch (e) {
          sessionStorage.removeItem("masquerade_session");
        }
      }
    };

    checkSession();
    
    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, []);

  const exitMasquerade = async () => {
    if (!session) return;
    
    setLoading(true);
    
    try {
      // End the masquerade session in database
      await supabase
        .from("masquerade_sessions")
        .update({ ended_at: new Date().toISOString(), is_active: false })
        .eq("id", session.id);
      
      // Clear session storage
      sessionStorage.removeItem("masquerade_session");
      sessionStorage.removeItem("masquerade_original_session");
      
      // Reload to restore original session
      toast.success("Exited masquerade mode");
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to exit masquerade mode");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-semibold">Masquerade Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Viewing as <strong>{session.target_user_name}</strong> ({session.target_user_email})
              </span>
            </div>
          </div>
          
          <Button
            onClick={exitMasquerade}
            disabled={loading}
            variant="outline"
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white rounded-full h-8 px-4 text-xs font-semibold"
          >
            {loading ? "Exiting..." : "Exit Masquerade"}
            <X className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
