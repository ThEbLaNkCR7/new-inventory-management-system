import type { BalanceSide, LedgerEntry } from "@/contexts/LedgerContext"

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

export function formatBalance(amount: number): { value: number; side: BalanceSide } {
  if (amount >= 0) return { value: amount, side: "Dr" }
  return { value: Math.abs(amount), side: "Cr" }
}

export const LEDGER_TABLE_HEADERS = [
  "Nepali Date",
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
): { value: number; side: BalanceSide } {
  let running = signedOpening(openingBalance, openingType)
  for (const entry of existingEntries) {
    running += entry.debit - entry.credit
  }
  running += debit - credit
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
    running = running + entry.debit - entry.credit
    const bal = formatBalance(running)

    return {
      ...entry,
      nepaliDateDisplay: formatNepaliDateDisplay(entry.nepaliDate),
      englishDateDisplay: formatEnglishDateDisplay(entry.englishDate),
      balance: bal.value,
      balanceSide: bal.side,
    }
  })

  const closingSigned = signedOpening(openingBalance, openingType) + totalDebit - totalCredit
  const closing = formatBalance(closingSigned)

  return {
    rows,
    totalDebit,
    totalCredit,
    closingBalance: closing.value,
    closingSide: closing.side,
  }
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
