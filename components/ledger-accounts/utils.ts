import type { BalanceSide, LedgerEntry, LedgerAccountType } from "@/contexts/LedgerContext"

export function formatRs(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatNepaliDateDisplay(nepaliDate: string): string {
  const parts = nepaliDate.split(/[-/]/).map((p) => p.trim())
  if (parts.length !== 3) return nepaliDate
  const [year, month, day] = parts
  return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`
}

export function formatEnglishDateDisplay(englishDate: string): string {
  const date = new Date(englishDate)
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

export function parseNepaliDateForFilter(nepaliDate: string): number {
  const parts = nepaliDate.split(/[-/]/).map((p) => Number(p.trim()))
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0
  const [year, month, day] = parts
  return year * 10000 + month * 100 + day
}

function signedOpening(opening: number, type: BalanceSide): number {
  return type === "Dr" ? opening : -opening
}

function applyEntryBalanceDelta(
  running: number,
  debit: number,
  credit: number,
  accountType: LedgerAccountType = "customer",
): number {
  if (accountType === "supplier") {
    return running + (credit - debit)
  }
  return running + (debit - credit)
}

export function formatBalance(amount: number): { value: number; side: BalanceSide } {
  if (amount >= 0) return { value: amount, side: "Dr" }
  return { value: Math.abs(amount), side: "Cr" }
}

export function getAccountTypeLabel(accountType: LedgerAccountType = "customer"): string {
  return accountType === "supplier" ? "Supplier Ledger Account" : "Customer Ledger Account"
}

export function getAccountTypeShortLabel(accountType: LedgerAccountType = "customer"): string {
  return accountType === "supplier" ? "Supplier" : "Customer"
}

export const LEDGER_TABLE_HEADERS = [
  "English Date",
  "Type",
  "Bill No.",
  "Account",
  "Narration / Remarks",
  "Debit",
  "Credit",
  "Balance",
] as const

export const LEDGER_ENTRY_FORM_FIELDS = [
  "English Date",
  "Type",
  "Bill No.",
  "Account",
  "Narration / Remarks",
  "Debit",
  "Credit",
  "Balance",
] as const

export function computePreviewBalance(
  openingBalance: number,
  openingType: BalanceSide,
  existingEntries: LedgerEntry[],
  debit: number,
  credit: number,
  accountType: LedgerAccountType = "customer",
): { value: number; side: BalanceSide } {
  let running = signedOpening(openingBalance, openingType)
  for (const entry of existingEntries) {
    running = applyEntryBalanceDelta(running, entry.debit, entry.credit, accountType)
  }
  running = applyEntryBalanceDelta(running, debit, credit, accountType)
  return formatBalance(running)
}

export interface LedgerRow extends LedgerEntry {
  balance: number
  balanceSide: BalanceSide
  nepaliDateDisplay: string
  englishDateDisplay: string
}

export interface LedgerReport {
  rows: LedgerRow[]
  totalDebit: number
  totalCredit: number
  closingBalance: number
  closingSide: BalanceSide
}

export function getLedgerDateRange(entries: LedgerEntry[]): {
  fromNepali: string
  toNepali: string
} | null {
  if (entries.length === 0) return null

  const sorted = [...entries].sort(
    (a, b) => parseNepaliDateForFilter(a.nepaliDate) - parseNepaliDateForFilter(b.nepaliDate),
  )

  return {
    fromNepali: formatNepaliDateDisplay(sorted[0].nepaliDate),
    toNepali: formatNepaliDateDisplay(sorted[sorted.length - 1].nepaliDate),
  }
}

export function buildLedgerReport(
  openingBalance: number,
  openingType: BalanceSide,
  entries: LedgerEntry[],
  fromNepali?: string,
  toNepali?: string,
  accountType: LedgerAccountType = "customer",
): LedgerReport {
  const fromVal = fromNepali ? parseNepaliDateForFilter(fromNepali) : 0
  const toVal = toNepali ? parseNepaliDateForFilter(toNepali) : Infinity

  const filtered = entries.filter((entry) => {
    const entryVal = parseNepaliDateForFilter(entry.nepaliDate)
    if (!entryVal) return true
    if (fromVal && entryVal < fromVal) return false
    if (toVal !== Infinity && entryVal > toVal) return false
    return true
  })

  let running = signedOpening(openingBalance, openingType)
  let totalDebit = 0
  let totalCredit = 0

  const rows: LedgerRow[] = filtered.map((entry) => {
    totalDebit += entry.debit
    totalCredit += entry.credit
    running = applyEntryBalanceDelta(running, entry.debit, entry.credit, accountType)
    const bal = formatBalance(running)

    return {
      ...entry,
      nepaliDateDisplay: formatNepaliDateDisplay(entry.nepaliDate),
      englishDateDisplay: formatEnglishDateDisplay(entry.englishDate),
      balance: bal.value,
      balanceSide: bal.side,
    }
  })

  const closing = formatBalance(running)

  return {
    rows,
    totalDebit,
    totalCredit,
    closingBalance: closing.value,
    closingSide: closing.side,
  }
}

export function getAccountClosingBalance(
  account: {
    openingBalance: number
    openingBalanceType: BalanceSide
    accountType?: LedgerAccountType
  },
  entries: LedgerEntry[],
): { value: number; side: BalanceSide } {
  const report = buildLedgerReport(
    account.openingBalance,
    account.openingBalanceType,
    entries,
    undefined,
    undefined,
    account.accountType ?? "customer",
  )
  return { value: report.closingBalance, side: report.closingSide }
}

/**
 * Classic ledger footer (like Tally):
 * 1) Period totals = opening + entry debits/credits
 * 2) Closing balance as balancing figure on the opposite side
 * 3) Equalized grand totals (debit === credit)
 */
export function getLedgerFooterTotals(
  openingBalance: number,
  openingType: BalanceSide,
  totalDebit: number,
  totalCredit: number,
  closingBalance: number,
  closingSide: BalanceSide,
): {
  periodDebit: number
  periodCredit: number
  balancingDebit: number
  balancingCredit: number
  equalizedDebit: number
  equalizedCredit: number
} {
  const periodDebit = totalDebit + (openingType === "Dr" ? openingBalance : 0)
  const periodCredit = totalCredit + (openingType === "Cr" ? openingBalance : 0)
  const balancingDebit = closingSide === "Cr" ? closingBalance : 0
  const balancingCredit = closingSide === "Dr" ? closingBalance : 0

  return {
    periodDebit,
    periodCredit,
    balancingDebit,
    balancingCredit,
    equalizedDebit: periodDebit + balancingDebit,
    equalizedCredit: periodCredit + balancingCredit,
  }
}

/** Totals with opening + closing on opposite sides so debit === credit. */
export function getEqualizedTotals(
  openingBalance: number,
  openingType: BalanceSide,
  totalDebit: number,
  totalCredit: number,
  closingBalance: number,
  closingSide: BalanceSide,
): { debit: number; credit: number } {
  const footer = getLedgerFooterTotals(
    openingBalance,
    openingType,
    totalDebit,
    totalCredit,
    closingBalance,
    closingSide,
  )
  return { debit: footer.equalizedDebit, credit: footer.equalizedCredit }
}

export function validateLedgerAccountForm(data: {
  name: string
  openingBalance: string
}) {
  const errors: Record<string, string> = {}
  if (!data.name.trim()) errors.name = "Account name is required"
  const balance = Number(data.openingBalance)
  if (data.openingBalance !== "" && (Number.isNaN(balance) || balance < 0)) {
    errors.openingBalance = "Opening balance must be a valid number"
  }
  return errors
}

export function validateLedgerEntryForm(data: {
  englishDate: string
  type: string
  account: string
  debit: string
  credit: string
}) {
  const errors: Record<string, string> = {}
  if (!data.englishDate) errors.englishDate = "English date is required"
  if (!data.type) errors.type = "Type is required"
  if (!data.account.trim()) errors.account = "Account is required"

  const debit = Number(data.debit || 0)
  const credit = Number(data.credit || 0)
  if (debit <= 0 && credit <= 0) errors.amount = "Enter debit or credit amount"
  if (debit > 0 && credit > 0) errors.amount = "Enter only debit OR credit, not both"

  return errors
}

export type EntryDraft = {
  id: string
  englishDateIso: string
  nepaliDate: string
  type: "Sale" | "Rcpt" | "Payment" | "Journal"
  billNo: string
  account: string
  narration: string
  debit: string
  credit: string
}

export function createEmptyEntryDraft(): EntryDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    englishDateIso: "",
    nepaliDate: "",
    type: "Sale",
    billNo: "",
    account: "",
    narration: "",
    debit: "",
    credit: "",
  }
}

export function isEntryDraftEmpty(draft: EntryDraft): boolean {
  return (
    !draft.englishDateIso &&
    !draft.account.trim() &&
    !draft.debit &&
    !draft.credit &&
    !draft.billNo.trim() &&
    !draft.narration.trim()
  )
}

export function computeDraftRowBalances(
  openingBalance: number,
  openingType: BalanceSide,
  existingEntries: LedgerEntry[],
  drafts: EntryDraft[],
  accountType: LedgerAccountType = "customer",
): Array<{ value: number; side: BalanceSide } | null> {
  let running = signedOpening(openingBalance, openingType)
  for (const entry of existingEntries) {
    running = applyEntryBalanceDelta(running, entry.debit, entry.credit, accountType)
  }

  return drafts.map((draft) => {
    const debit = Number(draft.debit || 0)
    const credit = Number(draft.credit || 0)
    if (isEntryDraftEmpty(draft)) return null
    running = applyEntryBalanceDelta(running, debit, credit, accountType)
    return formatBalance(running)
  })
}
