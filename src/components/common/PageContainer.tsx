import { cn } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard page container with consistent padding and spacing
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        DESIGN_TOKENS.pageContainer,
        DESIGN_TOKENS.pagePadding,
        DESIGN_TOKENS.sectionSpacing,
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard page header with title, subtitle, and action buttons
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(DESIGN_TOKENS.pageHeaderWrapper, className)}>
      <div>
        <h1 className={DESIGN_TOKENS.pageTitle}>{title}</h1>
        {subtitle && <p className={DESIGN_TOKENS.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
