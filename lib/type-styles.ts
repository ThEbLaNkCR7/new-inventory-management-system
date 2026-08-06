/**
 * App-wide type + interaction scale.
 * Font: IBM Plex Sans via font-sans.
 * Colors use theme tokens — navy ink flips in dark mode.
 *
 * Weights:
 * - normal (400): body, hints, empty states
 * - medium (500): labels, buttons, table amounts
 * - semibold (600): titles, section headers, totals
 * - Never use font-bold (700)
 *
 * Italic: empty / soft secondary notes only
 * Underline: interactive text links on hover only (underline-offset-4)
 */

/** Page H1 — also `.section-title` / `.page-title` */
export const pageTitleClass =
  "font-sans text-2xl font-semibold leading-8 tracking-tight text-foreground"

/** Page subtitle — also `.page-desc` */
export const pageDescClass =
  "font-sans text-sm font-normal leading-5 text-muted-foreground"

/** Dialog / modal title — also DialogTitle default */
export const dialogTitleClass =
  "font-sans text-xl font-semibold leading-7 tracking-tight text-foreground"

/** Dialog subtitle — also DialogDescription default */
export const dialogDescClass =
  "font-sans text-sm font-normal leading-5 text-muted-foreground"

/** Section header inside cards, forms, view dialogs — also `.form-section-title` / CardTitle */
export const sectionHeaderClass =
  "font-sans text-base font-semibold leading-6 tracking-tight text-foreground"

/** Field / UI label */
export const labelClass =
  "font-sans text-sm font-medium leading-5 text-foreground"

/** Primary body / table cell text */
export const bodyClass =
  "font-sans text-sm font-normal leading-5 text-foreground"

/** Secondary / meta / hint */
export const hintClass =
  "font-sans text-xs font-normal leading-4 text-muted-foreground"

/** Table column header — same size as body, semibold uppercase */
export const tableHeadClass =
  "font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground"

/** Italic secondary note (empty states, soft asides) */
export const emphasisItalicClass =
  "font-sans text-sm font-normal italic leading-5 text-muted-foreground"

/** Empty-state block (centered) */
export const emptyStateClass =
  "py-8 text-center font-sans text-sm font-normal italic text-muted-foreground"

/** Compact KPI / metric card label */
export const kpiLabelClass =
  "font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground"

/** Decorative section icon (not a status color) */
export const sectionIconClass = "h-4 w-4 shrink-0 text-foreground/70"

/** Interactive text link — underline on hover */
export const textLinkClass =
  "cursor-pointer font-sans text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline hover:text-foreground/80"

/** Clickable table name (same link rules, inherit cell size) */
export const tableNameLinkClass =
  "cursor-pointer font-medium text-foreground underline-offset-4 transition-colors hover:underline hover:text-foreground/80"

/** Generic surface hover (rows, chips, ghost controls) */
export const hoverSurfaceClass = "hover:bg-muted/60"

/** Focus ring for inputs */
export const focusRingClass =
  "focus:border-navy/50 focus-visible:ring-1 focus-visible:ring-ring"

/**
 * Number styles — always tabular-nums.
 */
export const valueClass =
  "font-sans text-2xl font-semibold tracking-tight tabular-nums text-foreground"

export const valueCompactClass =
  "font-sans text-lg font-semibold tracking-tight tabular-nums text-foreground"

export const amountClass =
  "font-sans text-sm font-medium tabular-nums text-foreground"

export const amountTotalClass =
  "font-sans text-sm font-semibold tabular-nums text-foreground"

export const amountMetaClass =
  "font-sans text-xs font-normal tabular-nums text-muted-foreground"
