/**
 * MOBILE UI KIT — small, native-feeling primitives shared by every screen.
 * Composes Tailwind classes; no external component library so the bundle stays lean.
 */
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn, initials } from "@kit";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-primary", className)} />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Spinner className="h-6 w-6" />
      {label}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "violet";
  size?: "md" | "lg";
  loading?: boolean;
};

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-primary/90 active:bg-primary/80",
    violet: "bg-secondary text-white hover:bg-secondary/90",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-destructive text-white hover:bg-destructive/90",
  };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-11 px-4 text-sm" : "h-13 px-6 text-base",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4 text-current" />}
      {children}
    </button>
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-input bg-card px-4 py-3 text-[15px] outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  );
});

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border/70 bg-card shadow-sm",
        onClick && "cursor-pointer transition-transform active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Tag({ color = "blue", className, children }: { color?: "blue" | "violet" | "green" | "amber" | "gray"; className?: string; children: ReactNode }) {
  const colors: Record<string, string> = {
    blue: "bg-accent text-accent-foreground",
    violet: "bg-secondary/10 text-[#5b46c9]",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    gray: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", colors[color], className)}>
      {children}
    </span>
  );
}

export function Avatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  if (src) return <img src={src} alt="" className={cn("h-10 w-10 rounded-full object-cover", className)} />;
  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-sm font-bold text-[#4a3db3]", className)}>
      {initials(name ?? undefined)}
    </div>
  );
}

export function Empty({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="font-semibold">{title}</p>
      {sub && <p className="max-w-xs text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Haptic-style tap feedback wrapper for list rows/cards. */
export function Tappable({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} onClick={onClick} className={cn("cursor-pointer", className)}>
      {children}
    </motion.div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-primary to-[#5b8def]"
      />
    </div>
  );
}
