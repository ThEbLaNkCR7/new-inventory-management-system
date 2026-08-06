/** Shared clean UI classes for list pages — styling only */

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
  "h-10 w-full border-border bg-background sm:w-40"

export const tabsListClass =
  "mb-4 grid h-11 w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1"

/** Page tabs — monochrome; ink fills invert in dark mode */
export const tabsTriggerClass =
  "group flex h-full items-center justify-center gap-2 rounded-md px-3 font-sans text-sm font-medium text-muted-foreground shadow-none transition-colors hover:bg-card hover:text-foreground data-[state=active]:!bg-foreground data-[state=active]:!text-background data-[state=active]:shadow-sm data-[state=active]:hover:!bg-foreground data-[state=active]:hover:!text-background"

export const tabsCountBadgeClass =
  "ml-1 border-transparent bg-background/80 px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors group-hover:bg-background group-data-[state=active]:!bg-background/20 group-data-[state=active]:!text-background"

export const tableHeadRowClass = "bg-muted/50"

/** Sidebar / shell nav */
export const sidebarNavItemClass =
  "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-sans text-sm font-medium transition-colors"

export const sidebarNavItemInactiveClass =
  "text-muted-foreground hover:bg-muted hover:text-navy"

export const sidebarNavItemActiveClass =
  "bg-foreground text-background shadow-none hover:bg-foreground hover:text-background"

export const sidebarNavIconInactiveClass =
  "h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"

export const sidebarNavIconActiveClass = "h-4 w-4 shrink-0 text-background"

export const sidebarChromeHoverClass =
  "text-muted-foreground shadow-none hover:bg-muted hover:text-navy"
