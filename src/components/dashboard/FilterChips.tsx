import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterChipsProps {
  options: { label: string; value: string }[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  allLabel?: string;
  resetAriaLabel?: string;
}

export function FilterChips({
  options,
  selectedValues,
  onToggle,
  onClear,
  allLabel = "All",
  resetAriaLabel = "Clear filters",
}: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge
        variant={selectedValues.length === 0 ? "default" : "secondary"}
        className={cn(
          "cursor-pointer px-3 py-1 transition-all duration-200",
          selectedValues.length === 0
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
        )}
        onClick={onClear}
        role="button"
        tabIndex={0}
        aria-label={resetAriaLabel}
      >
        {allLabel}
      </Badge>

      {options.map((option) => {
        const isActive = selectedValues.includes(option.value);

        return (
          <Badge
            key={option.value}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "cursor-pointer px-3 py-1 transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground border-border hover:border-primary hover:bg-primary/5",
            )}
            onClick={() => onToggle(option.value)}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
          >
            {option.label}
          </Badge>
        );
      })}
    </div>
  );
}

