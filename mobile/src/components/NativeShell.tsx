/**
 * NATIVE SHELL — the invisible layer that makes the WebView feel like a real app:
 *   • themed Android status bar (brand blue, light icons)
 *   • hardware/gesture BACK button: navigate the in-app stack, exit only from Home
 *   • offline banner whenever the device loses connectivity (Capacitor Network)
 */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapApp } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { isApp } from "@kit";

/** Theme the native status bar once at startup. */
export function initStatusBar() {
  if (!isApp) return;
  void (async () => {
    try {
      await StatusBar.setStyle({ style: Style.Dark }); // light icons on the brand-blue bar
      await StatusBar.setBackgroundColor({ color: "#0056D2" });
    } catch { /* plugin unavailable — the -mt spacer keeps layout safe */ }
  })();
}

/**
 * Android BACK button mapping:
 *  - /tabs/home  → minimize the app (default Capacitor behaviour)
 *  - anywhere else in-app → navigate back one screen
 */
export function useAndroidBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isApp) return;
    let busy = false;
    const handler = CapApp.addListener("backButton", () => {
      if (busy) return;
      if (pathname === "/tabs/home") return; // let the system minimize/exit
      const depth = (window.history.state as { idx?: number } | null)?.idx ?? 0;
      if (depth > 0) { busy = true; navigate(-1); setTimeout(() => (busy = false), 300); }
      else navigate("/tabs/home", { replace: true });
    });
    return () => { void handler.then((p) => p.remove()); };
  }, [navigate, pathname]);
}

/** Full-width offline ribbon shown under the top bar whenever the network drops. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!isApp) return;
    void Network.getStatus().then((s) => setOffline(!s.connected));
    const h = Network.addListener("networkStatusChange", (s) => setOffline(!s.connected));
    return () => { void h.then((p) => p.remove()); };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 py-1.5 text-white"
        >
          <WifiOff className="h-4 w-4" />
          <span className="text-xs font-semibold">You're offline — some content may be stale</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
