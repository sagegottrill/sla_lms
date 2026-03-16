import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Action {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: Action[];
}

export default function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="bg-foreground text-background shadow-2xl rounded-2xl flex items-center px-4 py-3 gap-6 border border-border/50 backdrop-blur-md relative overflow-hidden">
            {/* Soft gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />

            {/* Selection Count */}
            <div className="flex items-center gap-3 relative z-10">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {selectedCount}
              </span>
              <span className="text-sm font-semibold tracking-wide hidden sm:inline-block">
                Items Selected
              </span>
            </div>

            <div className="w-px h-6 bg-border/30 relative z-10" />

            {/* Bulk Actions */}
            <div className="flex items-center gap-2 relative z-10">
              {actions.map((action, i) => {
                const isDestructive = action.variant === "destructive";
                return (
                  <button
                    key={i}
                    onClick={action.onClick}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isDestructive
                        ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        : "text-background/90 hover:bg-background/20 hover:text-background"
                    }`}
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="hidden sm:inline-block">{action.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="w-px h-6 bg-border/30 relative z-10" />

            {/* Clear Button */}
            <button
              onClick={onClear}
              className="p-1.5 rounded-full hover:bg-background/20 text-background/70 hover:text-background transition-colors relative z-10"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
