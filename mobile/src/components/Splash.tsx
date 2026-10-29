import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * SPLASH OVERLAY — SLA logo + fluid aurora backdrop.
 *
 * This is an OVERLAY layered on top of the app: when the auth gate finishes
 * (`ready`) and the minimum display time has passed, the whole layer
 * cross-fades/scales out while the REAL app is already painted underneath —
 * a proper handoff with no hard cut, no stray full-screen color flash, and
 * no mutating document.body hacks (the old glitch sources).
 *
 * Mount/unmount is owned by the caller inside <AnimatePresence>; `onDone`
 * fires when the exit completes so the caller can unmount exactly then.
 */
export default function Splash({
  ready,
  minMs = 1600,
  onDone,
}: {
  ready: boolean;
  minMs?: number;
  onDone?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started), 80);
    return () => clearInterval(t);
  }, []);

  const minUp = elapsed >= minMs;
  useEffect(() => {
    if (ready && minUp) setLeaving(true);
  }, [ready, minUp]);

  return (
    <motion.div
      key="splash-layer"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.04 : 1 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        if (leaving) onDone?.();
      }}
      className="fixed inset-0 z-[70] overflow-hidden bg-primary"
    >
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

      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
        <motion.img
          src="/sla_logo_transparent.png"
          alt="She Leads Africa"
          initial={{ scale: 0.75, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.1 }}
          className="w-[68%] max-w-[300px] invert brightness-0"
        />
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.05em" }}
          animate={{ opacity: 1, letterSpacing: "0.45em" }}
          transition={{ delay: 0.55, duration: 0.7, ease: "easeOut" }}
          className="mt-2 text-[11px] font-semibold uppercase text-white/85"
          style={{ letterSpacing: "0.45em", marginLeft: "0.45em" }}
        >
          She.Leads.Africa
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 h-1 w-28 overflow-hidden rounded-full bg-white/25"
        >
          <motion.div
            className="h-full w-1/3 rounded-full bg-white"
            animate={{ x: ["-100%", "320%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* slow-boot reassurance + honest diagnostics */}
      {elapsed > 5000 && !leaving && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-0 bottom-12 text-center text-[11px] font-medium text-white/70"
        >
          {elapsed > 10000 ? "Slow network — still working on it…" : "Warming up your campus…"}
        </motion.p>
      )}

      {import.meta.env.DEV && (
        <p className="absolute inset-x-0 bottom-3 text-center text-[9px] font-medium uppercase tracking-widest text-white/40">
          dev splash
        </p>
      )}
    </motion.div>
  );
}
