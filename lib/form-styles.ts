/** Shared UI classes for transaction dialogs — styling only */

import {
  bodyClass,
  dialogDescClass,
  dialogTitleClass,
  hintClass,
  labelClass,
  sectionHeaderClass,
} from "@/lib/type-styles"

/**
 * Form type scale (IBM Plex Sans via font-sans):
 * - Title: dialog name
 * - Description: subtitle under title
 * - Section: group headers
 * - Label / body: field labels + inputs
 * - Hint / error: helper text
 */
export const formTitleClass = dialogTitleClass

export const formDescriptionClass = dialogDescClass

export const formSectionTitleClass = `flex items-center gap-2 ${sectionHeaderClass}`

export const formLabelClass = `block ${labelClass}`

export const formBodyClass = bodyClass

export const formHintClass =
  "font-sans text-xs font-normal leading-4 text-muted-foreground"

export const formErrorTextClass =
  "font-sans text-xs font-medium leading-4 text-navy"

/** Shared muted tone for empty-field placeholders across form controls */
export const formPlaceholderClass = "!text-muted-foreground/50"

export const formInputClass =
  "h-10 rounded-md border border-border bg-card font-sans text-sm font-normal leading-5 text-navy transition-colors placeholder:!text-muted-foreground/50 focus:border-navy/50 focus-visible:ring-1 focus-visible:ring-ring"

export const formSelectTriggerClass =
  `${formInputClass} data-[placeholder]:!text-muted-foreground/50`

/** Label → control gap (keep identical on every field) */
export const formFieldClass = "flex flex-col gap-1.5"

export const formSectionClass = "flex flex-col gap-3"

export const formItemCardClass = "flex flex-col gap-2"

export const formGridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2"

export const formDialogClass =
  "max-w-2xl gap-0 overflow-hidden border-border p-0 font-sans shadow-xl sm:max-w-2xl"

export const formDialogHeaderClass = "space-y-1.5 px-6 pb-3 pt-5"

export const formDialogBodyClass =
  "flex max-h-[min(70vh,640px)] flex-col gap-5 overflow-y-auto px-6 py-1"

export const formDialogFooterClass =
  "flex justify-end gap-2 px-6 py-4 text-sm font-medium"

export const formFileInputClass =
  "block w-full font-sans text-sm font-normal !text-muted-foreground/50 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:font-sans file:text-sm file:font-medium file:text-navy hover:file:bg-muted"

export const formItemLabelClass = labelClass

export const formActionLinkClass =
  "h-8 px-0 font-sans text-sm font-medium text-navy underline-offset-4 hover:underline hover:bg-transparent hover:text-navy/80"

export { hintClass, sectionHeaderClass }
