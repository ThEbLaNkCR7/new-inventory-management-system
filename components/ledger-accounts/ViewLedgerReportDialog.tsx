"use client"

import LedgerReportContent from "@/components/ledger-accounts/LedgerReportContent"
import {
  buildLedgerPrintHtml,
  exportLedgerReportToExcel,
  printLedgerReport,
} from "@/components/ledger-accounts/ledgerExportUtils"
import { buildLedgerReport, getLedgerDateRange } from "@/components/ledger-accounts/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import type { LedgerAccount } from "@/contexts/LedgerContext"
import { useLedger } from "@/contexts/LedgerContext"
import { FileSpreadsheet, Printer } from "lucide-react"
import { useMemo } from "react"

interface ViewLedgerReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: LedgerAccount | null
}

export default function ViewLedgerReportDialog({
  open,
  onOpenChange,
  account,
}: ViewLedgerReportDialogProps) {
  const { getEntriesForAccount } = useLedger()
  const { toast } = useToast()

  const report = useMemo(() => {
    if (!account) return null
    const entries = getEntriesForAccount(account.id)
    return buildLedgerReport(account.openingBalance, account.openingBalanceType, entries)
  }, [account, getEntriesForAccount])

  const dateRange = useMemo(() => {
    if (!account) return null
    return getLedgerDateRange(getEntriesForAccount(account.id))
  }, [account, getEntriesForAccount])

  if (!account) return null

  const dateRangeLabel = dateRange
    ? `From ${dateRange.fromNepali} to ${dateRange.toNepali}`
    : "No transactions yet"

  const handlePrint = () => {
    try {
      const html = buildLedgerPrintHtml(account, report, dateRangeLabel)
      printLedgerReport(html, `Account Ledger - ${account.name}`)
    } catch {
      toast({
        title: "Print failed",
        description: "Could not open print preview.",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = () => {
    try {
      exportLedgerReportToExcel(account, report, dateRangeLabel)
      toast({ title: "Exported", description: "Ledger downloaded as Excel file." })
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export ledger to Excel.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <DialogTitle>Account Ledger</DialogTitle>
              <DialogDescription>Ledger report for {account.name}</DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2 mr-4">
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </DialogHeader>

        <LedgerReportContent
          account={account}
          report={report}
          dateRangeLabel={dateRangeLabel}
        />

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
