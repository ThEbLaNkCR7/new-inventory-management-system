/** Shared clean UI classes for list pages — styling only */

import { cn } from "@/lib/utils"

export {
  amountClass,
  amountMetaClass,
  amountTotalClass,
  bodyClass,
  dialogTitleClass,
  emptyStateClass,
  emphasisItalicClass,
  hoverSurfaceClass,
  kpiLabelClass,
  pageDescClass,
  pageTitleClass,
  sectionHeaderClass,
  sectionIconClass,
  tableNameLinkClass,
  textLinkClass,
  valueClass,
  valueCompactClass,
} from "@/lib/type-styles"

export const pageToolbarClass =
  "mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"

export const searchWrapClass = "relative flex-1"

export const searchIconClass =
  "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"

export const searchInputClass = "h-10 pl-10"

export const filterSelectClass =
  "h-10 w-full border-border bg-white dark:bg-card sm:w-40"

export const tabsListClass =
  "mb-4 grid h-11 w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1"

/** Page tabs — active fill uses brand accent (#165e6c), clearly distinct from muted list */
export const tabsTriggerClass =
  "group flex h-full items-center justify-center gap-2 rounded-md px-3 font-sans text-sm font-medium text-muted-foreground shadow-none transition-all hover:bg-card hover:text-foreground data-[state=active]:!bg-primary data-[state=active]:!font-semibold data-[state=active]:!text-primary-foreground data-[state=active]:shadow-md data-[state=active]:hover:!bg-primary data-[state=active]:hover:!text-primary-foreground"

/** Tab count text — no chip/padding; pass `isActive` for contrast on primary tabs */
export function tabsCountBadgeClass(isActive = false) {
  return cn(
    "ml-1 text-xs font-medium tabular-nums",
    isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground",
  )
}

/** Shared table header row — matches TableHeader (page bg, no extra row border) */
export const tableHeadRowClass = "border-0 bg-background hover:bg-background"

/** Sidebar / shell nav */
export const sidebarNavItemClass =
  "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-sans text-sm font-medium transition-colors"

export const sidebarNavItemInactiveClass =
  "text-muted-foreground hover:bg-muted hover:text-navy"

export const sidebarNavItemActiveClass =
  "bg-primary text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground"

export const sidebarNavIconInactiveClass =
  "h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"

export const sidebarNavIconActiveClass = "h-4 w-4 shrink-0 text-primary-foreground"

export const sidebarChromeHoverClass =
  "text-muted-foreground shadow-none hover:bg-muted hover:text-navy"
