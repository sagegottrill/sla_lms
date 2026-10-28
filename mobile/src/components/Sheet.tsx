/**
 * SHARED BOTTOM SHEET — the mobile-native modal every detail screen rides on.
 * Drag-look spring entrance, dimmed backdrop, close button, scrollable content.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function Sheet({ children, onClose, full }: { children: ReactNode; onClose: () => void; full?: boolean }) {
  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`absolute inset-x-0 bottom-0 overflow-y-auto rounded-t-3xl bg-card pb-10 ${full ? "max-h-full" : "max-h-[88%]"}`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
