import { Loader2 } from "lucide-react";

/** Lightweight fallback for lazy-loaded media (e.g. lesson iframe). */
export function LoadingSpinner() {
  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-black/80">
      <Loader2 className="h-10 w-10 animate-spin text-white" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
