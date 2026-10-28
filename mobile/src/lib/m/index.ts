import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Capacitor } from "@capacitor/core";

/** Re-export the full widget surface so `@kit` imports never split. */
export {
  Avatar,
  Btn,
  Card,
  Empty,
  Input,
  PageLoader,
  ProgressBar,
  Spinner,
  Tag,
  Tappable,
  Textarea,
} from "../../components/kit";

/**
 * MOBILE KIT — the single seam between the shared backend layer (../src)
 * and this dedicated mobile UI. Everything mobile-specific lives here.
 */

/** True inside the Android/iOS Capacitor shell; false in the browser/PWA. */
export const isApp = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // "android" | "ios" | "web"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function errorText(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && "message" in (e as any)) return String((e as any).message);
  return String(e);
}

/** Readable Supabase/RLS errors for end users. */
export function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("failed to fetch") || m.includes("networkerror")) return "No connection. Check your internet and try again.";
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Try again in a minute.";
  if (m.includes("row-level security") || m.includes("permission denied")) return "You don't have access to this yet. Try signing out and back in.";
  if (m.includes("jwt") || m.includes("session")) return "Your session expired — please sign in again.";
  return msg.replace(/^(error|postgres error \d+:)\s*/i, "").trim() || "Something went wrong. Please try again.";
}

export function fmtDate(d: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function fmtMoney(n: number | string | null | undefined, currency = "NGN"): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (typeof v !== "number" || isNaN(v)) return "—";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

export function initials(name?: string): string {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
