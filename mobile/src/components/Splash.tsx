import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Splash screen — logo + animated fluid backdrop, shown while auth state
 * is being restored (real Supabase session read from Capacitor storage).
 */
export default function Splash({ minMs = 1300, ready }: { minMs?: number; ready: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(t);
  }, []);

  const show = elapsed < minMs || !ready;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-primary">
      {/* fluid aurora blobs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1.05 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.9, scale: 1.2, x: -40, y: 60 }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#271066]/40 blur-3xl"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 1.15, opacity: 0.35 }}
        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />

      {show && (
        <div className="relative flex h-full flex-col items-center justify-center gap-2 px-10 text-center">
          <motion.img
            src="/sla_logo_transparent.png"
            alt="She Leads Africa"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 }}
            className="max-w-[62%]"
          />
          <motion.p
            initial={{ letterSpacing: "0.05em" }}
            animate="in"
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="mt-3 block text-sm font-medium tracking-[0.45em] text-white/85 uppercase">
              She Leads Africa
            </span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 h-1 w-28 overflow-hidden rounded-full bg-white/25"
          >
            <motion.div
              className="h-full w-1/3 rounded-full bg-white"
              animate={{ x: ["-100%", "320%"] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      )}

      {/* fade-out overlay when ready */}
      {!show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          onAnimationComplete={() => (document.body.style.background = "")}
          className="pointer-events-none absolute inset-0 bg-[#0056D2]"
        />
      )}
    </div>
  );
}
