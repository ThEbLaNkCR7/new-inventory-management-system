export function getSaleTotal(
  sale: { items?: Array<{ quantitySold?: number; salePrice?: number }> },
): number {
  return Math.round(
    sale.items?.reduce(
      (sum, item) => sum + (item.quantitySold || 0) * (item.salePrice || 0),
      0,
    ) ?? 0,
  )
}

export function formatSaleTotal(
  sale: { items?: Array<{ quantitySold?: number; salePrice?: number }> },
): string {
  return getSaleTotal(sale).toLocaleString()
}

export type SaleFormItem = {
  productId: string
  quantitySold: number
  salePrice: number
}

export type SaleFormData = {
  items: SaleFormItem[]
  batchId?: string
  client: string
  clientType: string
  customClient?: string
  saleType?: "client" | "site"
  projectName?: string
  paymentStatus?: "Pending" | "Received"
  saleDate: string
  isVat?: boolean
}

export function validateSaleFormData(formData: SaleFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  const saleType = formData.saleType || "client"
  const paymentStatus = formData.paymentStatus || "Pending"

  if (!formData.items?.length) {
    errors["items.0.productId"] = "Please add at least one product"
  }

  formData.items?.forEach((item, index) => {
    if (!item.productId?.trim()) {
      errors[`items.${index}.productId`] = "Please select a product from the dropdown"
    }

    if (!item.quantitySold || item.quantitySold <= 0 || Number.isNaN(item.quantitySold)) {
      errors[`items.${index}.quantitySold`] = "Quantity is required"
    }

    if (!item.salePrice || item.salePrice <= 0 || Number.isNaN(item.salePrice)) {
      errors[`items.${index}.salePrice`] = "Unit price is required"
    }
  })

  if (saleType !== "client" && saleType !== "site") {
    errors.saleType = "Please select a sale type"
  }

  if (!formData.client?.trim()) {
    errors.client = "Please select a client from the dropdown"
  } else if (formData.client === "custom" && !formData.customClient?.trim()) {
    errors.customClient = "Please enter a custom client name"
  }

  if (!formData.clientType?.trim()) {
    errors.clientType = "Please select a client type from the dropdown"
  }

  if (saleType === "site" && !formData.projectName?.trim()) {
    errors.projectName = "Project name is required for site sales"
  }

  if (paymentStatus !== "Pending" && paymentStatus !== "Received") {
    errors.paymentStatus = "Please select a payment status"
  }

  if (!formData.saleDate?.trim()) {
    errors.saleDate = "Sale date is required"
  }

  return errors
}

export function mapSaleItemErrorsToEditFields(
  fieldErrors: Record<string, string>,
): Record<string, string> {
  const mapped: Record<string, string> = {}
  const pairs: Array<[string, string]> = [
    ["productId", "items.0.productId"],
    ["quantitySold", "items.0.quantitySold"],
    ["salePrice", "items.0.salePrice"],
    ["saleType", "saleType"],
    ["client", "client"],
    ["customClient", "customClient"],
    ["clientType", "clientType"],
    ["projectName", "projectName"],
    ["paymentStatus", "paymentStatus"],
    ["saleDate", "saleDate"],
  ]

  pairs.forEach(([editKey, sourceKey]) => {
    if (fieldErrors[sourceKey]) {
      mapped[editKey] = fieldErrors[sourceKey]
    }
  })

  return mapped
}

export type PrintExactViewOptions = {
  /** Full-width layout for tables (default dialog width is 48rem). */
  wide?: boolean
  /** Column width preset after expand/actions columns are removed. */
  tableVariant?: "sales" | "purchases"
  onAfterPrint?: () => void
}

/**
 * Print an on-screen view node (same DOM/CSS as displayed).
 * Uses a blank iframe so the browser print footer does not show localhost:...
 */
export function printSaleExactView(
  element: HTMLElement,
  options: PrintExactViewOptions = {},
) {
  const { wide = false, tableVariant = "sales", onAfterPrint } = options
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  })
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    return
  }

  const clone = element.cloneNode(true) as HTMLElement
  clone.classList.remove(
    "sale-view-print-root",
    "sales-table-print-root",
    "purchases-table-print-root",
  )
  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    node.style.maxHeight = "none"
    node.style.overflow = "visible"
  })
  // Drop interactive-only UI from the print clone
  clone
    .querySelectorAll("[data-print-hide]")
    .forEach((node) => node.remove())
  // Also strip Tailwind print:hidden nodes (class name contains a colon)
  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    if (node.classList.contains("print:hidden")) node.remove()
  })
  // Inactive tab panels stay in the DOM (display:none) — remove so print isn't duplicated/cramped
  clone
    .querySelectorAll('[hidden], [data-state="inactive"]')
    .forEach((node) => node.remove())

  if (wide) {
    // Unwrap overflow scroll containers so the table can fill the page width
    clone.querySelectorAll(".overflow-x-auto, .overflow-auto, .relative").forEach((node) => {
      if (!(node instanceof HTMLElement)) return
      node.style.overflow = "visible"
      node.style.width = "100%"
      node.style.maxWidth = "none"
    })
    clone.querySelectorAll("table").forEach((table) => {
      table.classList.remove("w-max")
      table.style.width = "100%"
      table.style.minWidth = "100%"
      table.style.tableLayout = "fixed"
      table.style.borderCollapse = "collapse"
    })
  }

  const headBits: string[] = []
  document
    .querySelectorAll('link[rel="stylesheet"], style')
    .forEach((node) => {
      headBits.push(node.outerHTML)
    })

  const printedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  // Reserve a clear bottom band so rows are never sliced under the print timestamp.
  const pageRule = wide
    ? "@page { margin: 14mm 20mm 22mm 20mm; size: A4 landscape; }"
    : "@page { margin: 12mm 14mm 20mm 14mm; }"

  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title>${headBits.join("")}
<style>
  ${pageRule}
  html, body {
    margin: 0;
    background: white !important;
    color: #0f172a !important;
  }
  .print-root {
    max-width: ${wide ? "100%" : "48rem"};
    width: 100%;
    margin: 0 auto;
    background: white;
    padding: ${wide ? "0 12mm 0" : "0"};
    box-sizing: border-box;
  }
  .print-root, .print-root * {
    max-height: none !important;
    overflow: visible !important;
    box-sizing: border-box;
  }
  .print-root .shadow-sm,
  .print-root .shadow {
    box-shadow: none !important;
  }
  .print-root .rounded-lg,
  .print-root .rounded-xl,
  .print-root .border {
    border-radius: 0 !important;
  }
  .print-root .border {
    border-color: transparent !important;
  }
  .print-root .pl-3 {
    padding-left: 0 !important;
  }
  .print-root .px-3 {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .print-root .font-semibold.pl-3,
  .print-root .pl-3.font-semibold {
    margin: 0 0 0.85rem 0 !important;
    font-size: 16px !important;
    line-height: 1.3 !important;
  }
  .print-root table {
    width: 100% !important;
    min-width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
    page-break-inside: auto;
  }
  .print-root thead {
    display: table-header-group !important;
  }
  .print-root tbody {
    display: table-row-group !important;
  }
  .print-root tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .print-root td,
  .print-root th {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .print-root thead th {
    background: #f4f4f5 !important;
    color: #3f3f46 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
    padding: 8px 10px !important;
    border-top: 1.5px solid rgba(22, 94, 108, 0.4) !important;
    border-bottom: 1.5px solid rgba(22, 94, 108, 0.4) !important;
    vertical-align: middle !important;
    white-space: nowrap !important;
    text-align: left !important;
  }
  .print-root tbody td {
    padding: 8px 10px !important;
    font-size: 12px !important;
    vertical-align: top !important;
    border-bottom: 1px solid #e4e4e7 !important;
    color: #0f172a !important;
    text-align: left !important;
  }
  .print-root th,
  .print-root td {
    max-width: none !important;
  }
  /* Sales: Client | Payment | Items | Date | Total */
  .print-root--sales thead th:nth-child(1),
  .print-root--sales tbody td:nth-child(1) { width: 18%; }
  .print-root--sales thead th:nth-child(2),
  .print-root--sales tbody td:nth-child(2) { width: 14%; }
  .print-root--sales thead th:nth-child(3),
  .print-root--sales tbody td:nth-child(3) { width: 40%; }
  .print-root--sales thead th:nth-child(4),
  .print-root--sales tbody td:nth-child(4) { width: 14%; }
  .print-root--sales thead th:nth-child(5),
  .print-root--sales tbody td:nth-child(5) {
    width: 14%;
    text-align: right !important;
    white-space: nowrap !important;
  }
  .print-root--sales tbody td:nth-child(3),
  .print-root--sales tbody td:nth-child(3) * {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    max-width: none !important;
  }
  .print-root--sales tbody td:nth-child(1),
  .print-root--sales tbody td:nth-child(1) * {
    white-space: normal !important;
  }
  /* Purchases: Supplier | Items | Date | Total — same spacing feel as sales */
  .print-root--purchases thead th:nth-child(1),
  .print-root--purchases tbody td:nth-child(1) { width: 24%; }
  .print-root--purchases thead th:nth-child(2),
  .print-root--purchases tbody td:nth-child(2) { width: 40%; }
  .print-root--purchases thead th:nth-child(3),
  .print-root--purchases tbody td:nth-child(3) { width: 18%; }
  .print-root--purchases thead th:nth-child(4),
  .print-root--purchases tbody td:nth-child(4) {
    width: 18%;
    text-align: right !important;
    white-space: nowrap !important;
  }
  .print-root--purchases tbody td:nth-child(2),
  .print-root--purchases tbody td:nth-child(2) * {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    max-width: none !important;
  }
  .print-root--purchases tbody td:nth-child(1),
  .print-root--purchases tbody td:nth-child(1) * {
    white-space: normal !important;
  }
  /* After all table content — never overlays mid-page rows */
  .print-timestamp {
    display: block;
    margin: 16px 0 0;
    padding: 10px 0 0;
    border-top: 1px solid #e4e4e7;
    text-align: center;
    font-size: 11px;
    line-height: 1.3;
    color: #52525b;
    font-family: ui-sans-serif, system-ui, sans-serif;
    break-before: avoid;
    page-break-before: avoid;
  }
</style></head><body></body></html>`)
  doc.close()
  doc.title = ""

  const wrap = doc.createElement("div")
  wrap.className = wide
    ? `print-root print-root--wide print-root--${tableVariant} font-sans bg-white text-foreground`
    : "print-root font-sans bg-white text-foreground"
  wrap.appendChild(doc.importNode(clone, true))

  // Place timestamp after content so it cannot clip rows on earlier pages.
  const timestamp = doc.createElement("p")
  timestamp.className = "print-timestamp"
  timestamp.textContent = `Printed on ${printedAt}`
  wrap.appendChild(timestamp)
  doc.body.appendChild(wrap)

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    win.removeEventListener("afterprint", cleanup)
    iframe.remove()
    onAfterPrint?.()
  }

  win.addEventListener("afterprint", cleanup)

  requestAnimationFrame(() => {
    setTimeout(() => {
      win.focus()
      win.print()
      setTimeout(cleanup, 1000)
    }, 250)
  })
}

