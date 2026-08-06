import type { LedgerAccount } from "@/contexts/LedgerContext"
import {
  LEDGER_TABLE_HEADERS,
  formatRs,
  getAccountTypeLabel,
  getLedgerFooterTotals,
  type LedgerReport,
} from "@/components/ledger-accounts/utils"
import * as XLSX from "xlsx"

const COMPANY_NAME = "Sheel Waterproofing"

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_")
}

function buildFooterTotals(account: LedgerAccount, report: LedgerReport | null) {
  if (!report) return null
  const hasOpening = account.openingBalance > 0
  if (!hasOpening && report.rows.length === 0) return null
  return getLedgerFooterTotals(
    account.openingBalance,
    account.openingBalanceType,
    report.totalDebit,
    report.totalCredit,
    report.closingBalance,
    report.closingSide,
  )
}

export function exportLedgerReportToExcel(
  account: LedgerAccount,
  report: LedgerReport | null,
  dateRangeLabel: string,
) {
  const aoa: (string | number)[][] = []
  const hasOpening = account.openingBalance > 0
  const footer = buildFooterTotals(account, report)

  aoa.push([COMPANY_NAME])
  if (account.address) aoa.push([account.address])
  aoa.push([])
  aoa.push(["Account Ledger"])
  aoa.push([`Account : ${account.name}`, dateRangeLabel])
  aoa.push([`Account Type : ${getAccountTypeLabel(account.accountType)}`])
  aoa.push([])
  aoa.push([...LEDGER_TABLE_HEADERS])

  if (hasOpening) {
    aoa.push([
      "",
      "Opening",
      "",
      "",
      "Opening Balance",
      account.openingBalanceType === "Dr" ? account.openingBalance : "",
      account.openingBalanceType === "Cr" ? account.openingBalance : "",
      "",
    ])
  }

  report?.rows.forEach((row) => {
    aoa.push([
      row.englishDateDisplay,
      row.type,
      row.voucherBillNo || "-",
      row.contraAccount,
      row.narration || "-",
      row.debit > 0 ? row.debit : "",
      row.credit > 0 ? row.credit : "",
      `${formatRs(row.balance)} ${row.balanceSide}`,
    ])
  })

  if (footer && report) {
    aoa.push([
      "",
      "",
      "",
      "",
      "Total",
      footer.periodDebit,
      footer.periodCredit,
      "",
    ])
    aoa.push([
      "",
      "",
      "",
      "",
      "Closing Balance",
      footer.balancingDebit > 0 ? footer.balancingDebit : "",
      footer.balancingCredit > 0 ? footer.balancingCredit : "",
      `${formatRs(report.closingBalance)} ${report.closingSide}`,
    ])
    aoa.push([
      "",
      "",
      "",
      "",
      "Grand Total",
      footer.equalizedDebit,
      footer.equalizedCredit,
      "",
    ])
  }

  aoa.push([])
  aoa.push(["Opening Balance", `Rs. ${formatRs(account.openingBalance)} ${account.openingBalanceType}`])
  aoa.push(["Total Debit", `Rs. ${formatRs(footer?.periodDebit ?? report?.totalDebit ?? 0)}`])
  aoa.push(["Total Credit", `Rs. ${formatRs(footer?.periodCredit ?? report?.totalCredit ?? 0)}`])
  if (report && (hasOpening || report.rows.length > 0)) {
    aoa.push([
      "Closing Balance",
      `Rs. ${formatRs(report.closingBalance)} ${report.closingSide}`,
    ])
  }
  aoa.push([])

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ]

  if (worksheet["!merges"]) {
    worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } })
  } else {
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Account Ledger")
  XLSX.writeFile(workbook, `${sanitizeFilename(account.name)}_ledger.xlsx`)
}

export function printLedgerReport(htmlContent: string, title: string) {
  const printWindow = window.open("", "_blank", "width=1024,height=768")
  if (!printWindow) return

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #111;
        margin: 24px;
        background: #fff;
      }
      .ledger-report-content {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }
      .text-center { text-align: center; }
      .font-semibold { font-weight: 600; }
      .font-medium { font-weight: 500; }
      .italic { font-style: italic; }
      .text-muted-foreground { color: #6b7280; }
      .pt-2 { padding-top: 8px; }
      .flex-wrap { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        font-size: 11px;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
      }
      th { background: #f3f4f6; font-weight: 600; }
      td.text-right, th.text-right { text-align: right; }
      .border-t-2 td { border-top: 2px solid #9ca3af; }
      .grand-total td {
        border-top: 2px solid #111;
        border-bottom: 3px double #111;
        font-weight: 600;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
      }
      .summary-grid > div {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        background: #f9fafb;
      }
      .summary-grid .label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
      .summary-grid .value { font-weight: 600; }
      .text-green { color: #15803d; }
      .text-red { color: #b91c1c; }
      .note { font-size: 10px; color: #6b7280; margin-top: 12px; }
      @media print {
        body { margin: 12px; }
        @page { margin: 12mm; }
      }
    </style>
  </head>
  <body>${htmlContent}</body>
</html>`)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }, 300)
}

export function buildLedgerPrintHtml(
  account: LedgerAccount,
  report: LedgerReport | null,
  dateRangeLabel: string,
): string {
  const headerCells = LEDGER_TABLE_HEADERS.map(
    (h, i) =>
      `<th class="${i >= 5 ? "text-right" : ""}">${h}</th>`,
  ).join("")

  const hasOpening = account.openingBalance > 0
  const showBody = hasOpening || (report?.rows.length ?? 0) > 0
  const footer = buildFooterTotals(account, report)

  const openingRow = hasOpening
    ? `<tr>
      <td></td>
      <td>Opening</td>
      <td></td>
      <td></td>
      <td>Opening Balance</td>
      <td class="text-right">${account.openingBalanceType === "Dr" ? formatRs(account.openingBalance) : ""}</td>
      <td class="text-right">${account.openingBalanceType === "Cr" ? formatRs(account.openingBalance) : ""}</td>
      <td></td>
    </tr>`
    : ""

  const entryRows =
    report?.rows
      .map(
        (row) => `<tr>
      <td>${row.englishDateDisplay}</td>
      <td>${row.type}</td>
      <td>${row.voucherBillNo || "-"}</td>
      <td>${row.contraAccount}</td>
      <td>${row.narration || "-"}</td>
      <td class="text-right">${row.debit > 0 ? formatRs(row.debit) : ""}</td>
      <td class="text-right">${row.credit > 0 ? formatRs(row.credit) : ""}</td>
      <td class="text-right">${formatRs(row.balance)} ${row.balanceSide}</td>
    </tr>`,
      )
      .join("") || ""

  const emptyRow = !showBody
    ? `<tr><td colspan="8" style="text-align:center;color:#6b7280;">No entries found.</td></tr>`
    : ""

  const totalRows =
    footer && report
      ? `<tr class="border-t-2">
      <td colspan="5" class="text-right font-medium">Total</td>
      <td class="text-right font-medium">${formatRs(footer.periodDebit)}</td>
      <td class="text-right font-medium">${formatRs(footer.periodCredit)}</td>
      <td></td>
    </tr>
    <tr>
      <td colspan="5" class="text-right text-muted-foreground">Closing Balance</td>
      <td class="text-right">${footer.balancingDebit > 0 ? formatRs(footer.balancingDebit) : ""}</td>
      <td class="text-right">${footer.balancingCredit > 0 ? formatRs(footer.balancingCredit) : ""}</td>
      <td class="text-right font-medium">${formatRs(report.closingBalance)} ${report.closingSide}</td>
    </tr>
    <tr class="grand-total">
      <td colspan="5" class="text-right">Grand Total</td>
      <td class="text-right">${formatRs(footer.equalizedDebit)}</td>
      <td class="text-right">${formatRs(footer.equalizedCredit)}</td>
      <td></td>
    </tr>`
      : ""

  const closingSummary =
    report && showBody
      ? `<div>
      <div class="label">Closing Balance</div>
      <div class="value text-green">Rs. ${formatRs(report.closingBalance)} ${report.closingSide}</div>
    </div>`
      : ""

  return `<div class="ledger-report-content">
    <div class="text-center">
      <p class="font-semibold" style="font-size:16px;">${COMPANY_NAME}</p>
      ${account.address ? `<p class="text-muted-foreground">${account.address}</p>` : ""}
    </div>
    <div class="text-center font-semibold pt-2" style="font-size:16px;">Account Ledger</div>
    <div class="flex-wrap pt-2">
      <div>
        <p><span class="font-medium">Account :</span> ${account.name}</p>
        <p><span class="font-medium">Account Type :</span> ${getAccountTypeLabel(account.accountType)}</p>
      </div>
      <p>${dateRangeLabel}</p>
    </div>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${emptyRow}${openingRow}${entryRows}${totalRows}</tbody>
    </table>
    <div class="summary-grid">
      <div>
        <div class="label">Opening Balance</div>
        <div class="value">Rs. ${formatRs(account.openingBalance)} ${account.openingBalanceType}</div>
      </div>
      <div>
        <div class="label">Total Debit</div>
        <div class="value text-green">Rs. ${formatRs(footer?.periodDebit ?? report?.totalDebit ?? 0)}</div>
      </div>
      <div>
        <div class="label">Total Credit</div>
        <div class="value text-red">Rs. ${formatRs(footer?.periodCredit ?? report?.totalCredit ?? 0)}</div>
      </div>
      ${closingSummary}
    </div>
  </div>`
}
