"use client"

import LedgerEntryTableHeader from "@/components/ledger-accounts/LedgerEntryTableHeader"
import { formatRs, getAccountTypeLabel, type LedgerReport } from "@/components/ledger-accounts/utils"
import DataPagination from "@/components/ui/data-pagination"
import type { LedgerAccount } from "@/contexts/LedgerContext"
import { usePagination } from "@/hooks/usePagination"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

interface LedgerReportContentProps {
  account: LedgerAccount
  report: LedgerReport | null
  dateRangeLabel: string
}

export default function LedgerReportContent({
  account,
  report,
  dateRangeLabel,
}: LedgerReportContentProps) {
  const columnCount = 9
  const rows = report?.rows ?? []
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startItem,
    endItem,
  } = usePagination(rows, {
    pageSize: 15,
    resetKey: `${account.id}|${rows.length}`,
  })

  return (
    <div className="ledger-report-content border rounded-lg p-4 bg-white dark:bg-gray-900 text-sm space-y-2">
      <div className="text-center">
        <p className="font-bold text-base">Sheel Waterproofing</p>
        {account.address && <p className="text-muted-foreground">{account.address}</p>}
      </div>
      <div className="text-center font-semibold text-base pt-2">Account Ledger</div>
      <div className="flex flex-wrap justify-between gap-2 pt-2">
        <div className="space-y-1">
          <p>
            <span className="font-medium">Account :</span> {account.name}
          </p>
          <p>
            <span className="font-medium">Account Type :</span>{" "}
            {getAccountTypeLabel(account.accountType)}
          </p>
        </div>
        <p>{dateRangeLabel}</p>
      </div>

      <div className="overflow-x-auto pt-2">
        <Table>
          <LedgerEntryTableHeader />
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center text-muted-foreground">
                  No entries found.
                </TableCell>
              </TableRow>
            )}
            {paginatedItems.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.nepaliDateDisplay}</TableCell>
                <TableCell>{row.englishDateDisplay}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.voucherBillNo || "-"}</TableCell>
                <TableCell>{row.contraAccount}</TableCell>
                <TableCell className="max-w-[200px]">{row.narration || "-"}</TableCell>
                <TableCell className="text-right">
                  {row.debit > 0 ? formatRs(row.debit) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {row.credit > 0 ? formatRs(row.credit) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {formatRs(row.balance)} {row.balanceSide}
                </TableCell>
              </TableRow>
            ))}
            {report && rows.length > 0 && (
              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={6}>Grand Total</TableCell>
                <TableCell className="text-right">{formatRs(report.totalDebit)}</TableCell>
                <TableCell className="text-right">{formatRs(report.totalCredit)}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[15, 25, 50]}
        className="px-0 print:hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t summary-grid">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Opening Balance</p>
          <p className="font-semibold">
            Rs. {formatRs(account.openingBalance)} {account.openingBalanceType}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Debit</p>
          <p className="font-semibold text-green-700 dark:text-green-400">
            Rs. {formatRs(report?.totalDebit ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Credit</p>
          <p className="font-semibold text-red-700 dark:text-red-400">
            Rs. {formatRs(report?.totalCredit ?? 0)}
          </p>
        </div>
        {report && report.rows.length > 0 && (
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Closing Balance</p>
            <p className="font-semibold text-green-700 dark:text-green-400">
              Rs. {formatRs(report.closingBalance)} {report.closingSide}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        Note: Dr = Debit Balance, Cr = Credit Balance
      </p>
    </div>
  )
}
