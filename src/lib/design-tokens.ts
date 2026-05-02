/**
 * Design Tokens - Centralized UI/UX Constants
 * 
 * This file contains all standardized design values for consistent UI across the application.
 * Use these tokens instead of inline Tailwind classes for better maintainability.
 */

export const DESIGN_TOKENS = {
  // ============================================================================
  // SPACING & LAYOUT
  // ============================================================================
  
  /** Standard page container with responsive padding */
  pageContainer: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  
  /** Standard page vertical padding */
  pagePadding: "py-6 pb-16",
  
  /** Standard section spacing */
  sectionSpacing: "space-y-8",
  
  /** Page header with border */
  pageHeaderWrapper: "flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 mb-8",

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  
  /** Main page title */
  pageTitle: "font-display text-3xl md:text-4xl font-light text-foreground tracking-tight mb-2",
  
  /** Page subtitle/description */
  pageSubtitle: "text-sm text-muted-foreground",
  
  /** Section title */
  sectionTitle: "text-xl font-semibold text-foreground mb-4",
  
  /** Form label */
  formLabel: "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2",

  // ============================================================================
  // BUTTONS
  // ============================================================================
  
  /** Primary action button (rounded-full) */
  buttonPrimary: "rounded-full px-6 h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors",
  
  /** Secondary action button (rounded-xl) */
  buttonSecondary: "rounded-xl px-5 h-10 text-sm font-semibold border border-border hover:bg-muted transition-colors",
  
  /** Small button variant */
  buttonSmall: "h-9 px-4 text-xs",
  
  /** Large button variant */
  buttonLarge: "h-11 px-8 text-base",
  
  /** Outline button */
  buttonOutline: "rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-border hover:bg-muted transition-colors",
  
  /** Destructive button */
  buttonDestructive: "rounded-full px-5 h-9 text-xs font-semibold bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors",

  // ============================================================================
  // CARDS & CONTAINERS
  // ============================================================================
  
  /** Standard card container */
  card: "rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card overflow-hidden",
  
  /** Modal/dialog container */
  modal: "rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-card shadow-xl",
  
  /** Card with subtle background */
  cardSubtle: "rounded-2xl bg-card/20 ring-1 ring-black/5 dark:ring-white/10 border-0",

  // ============================================================================
  // INPUTS & FORMS
  // ============================================================================
  
  /** Search input (rounded-full with muted background) */
  inputSearch: "w-full px-4 py-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 border-0 bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow placeholder:text-muted-foreground/60",
  
  /** Form input (rounded-xl with background) */
  inputForm: "w-full px-4 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/60 transition-all",
  
  /** Disabled input */
  inputDisabled: "opacity-50 cursor-not-allowed bg-muted/30",

  // ============================================================================
  // TABLES
  // ============================================================================
  
  /** Table header cell */
  tableHeader: "px-6 py-4 text-left text-xs font-semibold text-muted-foreground tracking-widest uppercase",
  
  /** Table body cell */
  tableCell: "px-6 py-4",
  
  /** Table row with hover state */
  tableRow: "hover:bg-muted/10 transition-colors group",
  
  /** Table header row background */
  tableHeaderRow: "bg-muted/20 border-b border-border/40",

  // ============================================================================
  // ICONS
  // ============================================================================
  
  /** Button icon size */
  iconButton: "w-4 h-4",
  
  /** Empty state icon size */
  iconEmpty: "w-10 h-10",
  
  /** Sidebar icon size (responsive) */
  iconSidebar: "w-5 h-5 lg:w-4 lg:h-4",
  
  /** Small icon size */
  iconSmall: "w-3.5 h-3.5",

  // ============================================================================
  // COLORS & EFFECTS
  // ============================================================================
  
  /** Standard ring color */
  ring: "ring-1 ring-black/5 dark:ring-white/10 border-0",
  
  /** Primary text muted */
  textMuted: "text-muted-foreground",
  
  /** Secondary text muted */
  textMutedSecondary: "text-muted-foreground/60",

  // ============================================================================
  // ANIMATIONS & TRANSITIONS
  // ============================================================================
  
  /** Color transition only */
  transitionColors: "transition-colors",
  
  /** All properties transition */
  transitionAll: "transition-all duration-200",
  
  /** Opacity transition */
  transitionOpacity: "transition-opacity",

  // ============================================================================
  // RESPONSIVE BREAKPOINTS
  // ============================================================================
  
  /** 2-column grid */
  grid2Col: "grid sm:grid-cols-2 gap-6",
  
  /** 3-column grid */
  grid3Col: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6",
  
  /** 4-column grid */
  grid4Col: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",

  // ============================================================================
  // COMMON PATTERNS
  // ============================================================================
  
  /** Avatar circle */
  avatar: "w-9 h-9 rounded-full bg-muted/40 ring-1 ring-border/60 dark:bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0",
  
  /** Badge/pill */
  badge: "text-[11px] font-semibold px-2.5 py-1 rounded-md",
  
  /** Status indicator dot */
  statusDot: "w-1.5 h-1.5 rounded-full",
  
  /** Dropdown menu action button */
  dropdownTrigger: "p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity",
} as const;

/**
 * Role-specific badge colors
 */
export const ROLE_COLORS = {
  student: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  instructor: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  program_manager: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  admin: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
} as const;

/**
 * Status-specific colors
 */
export const STATUS_COLORS = {
  active: "bg-emerald-500",
  inactive: "bg-slate-400",
  pending: "bg-amber-500",
  completed: "bg-blue-500",
  "at-risk": "bg-destructive",
  "on-track": "bg-primary",
} as const;
