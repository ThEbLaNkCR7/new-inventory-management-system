"use client"

import {
  computeDraftRowBalances,
  createEmptyEntryDraft,
  formatNepaliDateDisplay,
  formatRs,
  isEntryDraftEmpty,
  type EntryDraft,
  validateLedgerEntryForm,
} from "@/components/ledger-accounts/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import type { LedgerAccount } from "@/contexts/LedgerContext"
import { useLedger } from "@/contexts/LedgerContext"
import { englishToNepali, formatNepaliDate } from "@/lib/nepaliDateUtils"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { MaterialDatePicker } from "@/components/ui/MaterialDatePicker"

const inputClass =
  "h-8 px-2 py-1 text-xs border border-border bg-background focus:border-navy/50 focus-visible:ring-1 focus-visible:ring-navy/20"
const selectClass = `${inputClass} min-h-8`
const errorTextClass = "text-[11px] leading-tight text-navy mt-0.5"
const columns = [
  { label: "Date", width: "10%" },
  { label: "Type", width: "7%" },
  { label: "Bill No.", width: "10%" },
  { label: "Account", width: "12%" },
  { label: "Narration", width: "24%" },
  { label: "Debit", width: "9%" },
  { label: "Credit", width: "9%" },
  { label: "Bal.", width: "12%" },
  { label: "", width: "7%" },
] as const

const TRANSACTION_TYPES = ["Sale", "Rcpt", "Payment", "Journal"] as const

interface AddLedgerEntriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: LedgerAccount | null
}

export default function AddLedgerEntriesDialog({
  open,
  onOpenChange,
  account,
}: AddLedgerEntriesDialogProps) {
  const { addLedgerEntry, getEntriesForAccount } = useLedger()
  const { toast } = useToast()
  const [drafts, setDrafts] = useState<EntryDraft[]>([createEmptyEntryDraft()])
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const existingEntries = useMemo(
    () => (account ? getEntriesForAccount(account.id) : []),
    [account, getEntriesForAccount],
  )

  const rowBalances = useMemo(() => {
    if (!account) return []
    return computeDraftRowBalances(
      account.openingBalance,
      account.openingBalanceType,
      existingEntries,
      drafts,
      account.accountType,
    )
  }, [account, existingEntries, drafts])

  const resetDrafts = () => {
    setDrafts([createEmptyEntryDraft()])
    setFieldErrors({})
  }

  const updateDraft = (id: string, updates: Partial<EntryDraft>) => {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...updates } : draft)))
  }

  const handleDraftDateChange = (id: string, date: Date | undefined) => {
    if (!date) {
      updateDraft(id, { englishDateIso: "", nepaliDate: "" })
      return
    }
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
    const nepali = englishToNepali(normalized)
    updateDraft(id, {
      englishDateIso: normalized.toISOString(),
      nepaliDate: formatNepaliDate(nepali, "YYYY/MM/DD"),
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`${id}-englishDate`]
      delete next[`${id}-amount`]
      delete next[`${id}-account`]
      return next
    })
  }

  const addRow = () => {
    setDrafts((prev) => [...prev, createEmptyEntryDraft()])
  }

  const removeRow = (id: string) => {
    setDrafts((prev) => {
      if (prev.length === 1) return [createEmptyEntryDraft()]
      return prev.filter((draft) => draft.id !== id)
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${id}-`)) delete next[key]
      })
      return next
    })
  }

  const handleSubmit = async () => {
    if (!account) return

    const rowsToSave = drafts.filter((draft) => !isEntryDraftEmpty(draft))
    if (rowsToSave.length === 0) {
      toast({
        title: "Validation Error",
        description: "Add at least one entry row with data.",
        variant: "destructive",
      })
      return
    }

    const errors: Record<string, string> = {}
    rowsToSave.forEach((draft, index) => {
      const rowErrors = validateLedgerEntryForm({
        englishDate: draft.englishDateIso,
        type: draft.type,
        account: draft.account,
        debit: draft.debit,
        credit: draft.credit,
      })
      Object.entries(rowErrors).forEach(([field, message]) => {
        errors[`${draft.id}-${field}`] = `Row ${index + 1}: ${message}`
      })
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast({
        title: "Validation Error",
        description: Object.values(errors)[0],
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      for (const draft of rowsToSave) {
        await addLedgerEntry({
          ledgerAccountId: account.id,
          nepaliDate: formatNepaliDateDisplay(draft.nepaliDate),
          englishDate: draft.englishDateIso,
          type: draft.type,
          voucherBillNo: draft.billNo.trim(),
          contraAccount: draft.account.trim(),
          narration: draft.narration.trim(),
          debit: Number(draft.debit || 0),
          credit: Number(draft.credit || 0),
        })
      }
      toast({
        title: "Success",
        description: `${rowsToSave.length} ledger ${rowsToSave.length === 1 ? "entry" : "entries"} added successfully`,
      })
      resetDrafts()
      onOpenChange(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add ledger entries",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRowError = (id: string, field: string) => fieldErrors[`${id}-${field}`]

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetDrafts()
        onOpenChange(value)
      }}
    >
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[90vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>Add Ledger Entries</DialogTitle>
          <DialogDescription>
            {account
              ? `Add one or more entries for ${account.name}`
              : "Add manual ledger entries"}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <Table className="table-fixed w-full text-xs [&>div]:overflow-visible">
            <colgroup>
              {columns.map(({ label, width }) => (
                <col key={label || "action"} style={{ width }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="text-xs">
                {columns.map(({ label }) => (
                  <TableHead
                    key={label || "action"}
                    className="h-auto px-1.5 py-1.5 text-left align-bottom font-medium"
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft, index) => (
                <TableRow key={draft.id}>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <MaterialDatePicker
                      className="h-8 px-2 py-1 text-xs truncate"
                      dateFormat="dd/MM/yyyy"
                      placeholder="Date"
                      value={draft.englishDateIso ? new Date(draft.englishDateIso) : undefined}
                      onChange={(date) => handleDraftDateChange(draft.id, date)}
                    />
                    {getRowError(draft.id, "englishDate") && (
                      <p className={errorTextClass}>{getRowError(draft.id, "englishDate")}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <Select
                      value={draft.type}
                      onValueChange={(value: EntryDraft["type"]) =>
                        updateDraft(draft.id, { type: value })
                      }
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <Input
                      className={inputClass}
                      value={draft.billNo}
                      onChange={(e) => updateDraft(draft.id, { billNo: e.target.value })}
                      placeholder="Bill"
                    />
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <Input
                      className={inputClass}
                      value={draft.account}
                      onChange={(e) => updateDraft(draft.id, { account: e.target.value })}
                      placeholder="Account"
                    />
                    {getRowError(draft.id, "account") && (
                      <p className={errorTextClass}>{getRowError(draft.id, "account")}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <Input
                      className={inputClass}
                      value={draft.narration}
                      onChange={(e) => updateDraft(draft.id, { narration: e.target.value })}
                      placeholder="Remarks"
                    />
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${inputClass} text-right`}
                      value={draft.debit}
                      onChange={(e) =>
                        updateDraft(draft.id, {
                          debit: e.target.value,
                          credit: e.target.value ? "" : draft.credit,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${inputClass} text-right`}
                      value={draft.credit}
                      onChange={(e) =>
                        updateDraft(draft.id, {
                          credit: e.target.value,
                          debit: e.target.value ? "" : draft.debit,
                        })
                      }
                    />
                    {getRowError(draft.id, "amount") && (
                      <p className={errorTextClass}>{getRowError(draft.id, "amount")}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top px-1.5 py-1.5">
                    <div className="h-8 flex items-center justify-end px-1.5 rounded-md border bg-muted/50 text-[11px] font-medium truncate">
                      {rowBalances[index]
                        ? `${formatRs(rowBalances[index]!.value)} ${rowBalances[index]!.side}`
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell className="align-top px-1 py-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeRow(draft.id)}
                      disabled={drafts.length === 1}
                      title="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={addRow} className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !account}
            className="flex-1"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save All Entries
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
