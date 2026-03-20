// SLA Connecta LMS - Core Design Tokens
// Automatically enforces consistent spacing and sizing across the application.

export const space = {
  1: "8px",   // p-2 / gap-2 — Tight clustering
  2: "16px",  // p-4 / gap-4 — Internal card padding (Standardized)
  3: "24px",  // p-6 / gap-6 — Section gutters / between cards
  4: "32px",  // p-8 / gap-8 — Large section spacing
} as const;

export const radius = {
  sm: "rounded-lg",     // 8px — buttons, tags
  md: "rounded-xl",     // 12px — inputs, small cards
  lg: "rounded-2xl",    // 16px — medium cards, containers
  xl: "rounded-3xl",    // 24px — hero sections, modals
} as const;
