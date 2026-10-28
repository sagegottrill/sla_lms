import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn, isApp } from "@kit";

/** Screen header with back button. Adds an offset bar on native to mimic a status bar. */
export function TopBar({ title, right, onBack, className }: { title: ReactNode; right?: ReactNode; onBack?: () => void; className?: string }) {
  const navigate = useNavigate();
  const back = () => (onBack ? onBack() : navigate(-1));
  return (
    <header className={cn("sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80", isApp && "top-safe", className)}>
      {isApp && <div className="h-5" />}
      <div className="flex h-14 items-center gap-2 px-3">
        <button onClick={back} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted" aria-label="Back">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="minimal-case truncate flex-1 font-display text-lg font-bold">{title}</h1>
        {right}
      </div>
    </header>
  );
}
