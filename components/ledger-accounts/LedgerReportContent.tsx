"use client"

import LedgerEntryTableHeader from "@/components/ledger-accounts/LedgerEntryTableHeader"
import {
  formatRs,
  getAccountTypeLabel,
  getLedgerFooterTotals,
  type LedgerReport,
} from "@/components/ledger-accounts/utils"
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
  const columnCount = 8
  const rows = report?.rows ?? []
  const hasOpening = account.openingBalance > 0
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

  const showLedgerBody = hasOpening || rows.length > 0
  const footerTotals =
    report && showLedgerBody
      ? getLedgerFooterTotals(
          account.openingBalance,
          account.openingBalanceType,
          report.totalDebit,
          report.totalCredit,
          report.closingBalance,
          report.closingSide,
        )
      : null

  const isFirstPage = page === 1
  const isLastPage = page === totalPages || totalPages === 0

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
            {!showLedgerBody && (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center text-muted-foreground">
                  No entries found.
                </TableCell>
              </TableRow>
            )}
            {isFirstPage && hasOpening && (
              <TableRow>
                <TableCell />
                <TableCell>Opening</TableCell>
                <TableCell />
                <TableCell />
                <TableCell>Opening Balance</TableCell>
                <TableCell className="text-right">
                  {account.openingBalanceType === "Dr" ? formatRs(account.openingBalance) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {account.openingBalanceType === "Cr" ? formatRs(account.openingBalance) : ""}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
            {paginatedItems.map((row) => (
              <TableRow key={row.id}>
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
            {footerTotals && isLastPage && (
              <>
                <TableRow className="border-t-2">
                  <TableCell colSpan={5} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRs(footerTotals.periodDebit)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRs(footerTotals.periodCredit)}
                  </TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5} className="text-right text-muted-foreground">
                    Closing Balance
                  </TableCell>
                  <TableCell className="text-right">
                    {footerTotals.balancingDebit > 0
                      ? formatRs(footerTotals.balancingDebit)
                      : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {footerTotals.balancingCredit > 0
                      ? formatRs(footerTotals.balancingCredit)
                      : ""}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRs(report!.closingBalance)} {report!.closingSide}
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold border-t-2 border-b-4 border-double">
                  <TableCell colSpan={5} className="text-right">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right">
                    {formatRs(footerTotals.equalizedDebit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatRs(footerTotals.equalizedCredit)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </>
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
            Rs. {formatRs(footerTotals?.periodDebit ?? report?.totalDebit ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Credit</p>
          <p className="font-semibold text-red-700 dark:text-red-400">
            Rs. {formatRs(footerTotals?.periodCredit ?? report?.totalCredit ?? 0)}
          </p>
        </div>
        {report && showLedgerBody && (
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Closing Balance</p>
            <p className="font-semibold text-green-700 dark:text-green-400">
              Rs. {formatRs(report.closingBalance)} {report.closingSide}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
