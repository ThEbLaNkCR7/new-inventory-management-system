"use client"

import {
  computeDraftRowBalances,
  createEmptyEntryDraft,
  formatEnglishDateDisplay,
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
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 h-9 text-sm"
const errorTextClass = "text-xs text-red-600 dark:text-red-400"

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Ledger Entries</DialogTitle>
          <DialogDescription>
            {account
              ? `Add one or more entries for ${account.name}`
              : "Add manual ledger entries"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "English Date",
                  "Type",
                  "Bill No.",
                  "Account",
                  "Narration / Remarks",
                  "Debit",
                  "Credit",
                  "Balance",
                  "",
                ].map((header, index) => (
                  <TableHead
                    key={header || "action"}
                    className={index >= 5 && index <= 7 ? "text-right whitespace-nowrap" : "whitespace-nowrap"}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft, index) => (
                <TableRow key={draft.id}>
                  <TableCell className="align-top min-w-[150px]">
                    <MaterialDatePicker
                      value={draft.englishDateIso ? new Date(draft.englishDateIso) : undefined}
                      onChange={(date) => handleDraftDateChange(draft.id, date)}
                    />
                    {draft.englishDateIso && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatEnglishDateDisplay(draft.englishDateIso)}
                      </p>
                    )}
                    {getRowError(draft.id, "englishDate") && (
                      <p className={errorTextClass}>{getRowError(draft.id, "englishDate")}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top min-w-[110px]">
                    <Select
                      value={draft.type}
                      onValueChange={(value: EntryDraft["type"]) =>
                        updateDraft(draft.id, { type: value })
                      }
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="align-top min-w-[120px]">
                    <Input
                      className={inputClass}
                      value={draft.billNo}
                      onChange={(e) => updateDraft(draft.id, { billNo: e.target.value })}
                      placeholder="ATAS-1/82-83"
                    />
                  </TableCell>
                  <TableCell className="align-top min-w-[120px]">
                    <Input
                      className={inputClass}
                      value={draft.account}
                      onChange={(e) => updateDraft(draft.id, { account: e.target.value })}
                      placeholder="Sales"
                    />
                    {getRowError(draft.id, "account") && (
                      <p className={errorTextClass}>{getRowError(draft.id, "account")}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top min-w-[160px]">
                    <Input
                      className={inputClass}
                      value={draft.narration}
                      onChange={(e) => updateDraft(draft.id, { narration: e.target.value })}
                      placeholder="Remarks"
                    />
                  </TableCell>
                  <TableCell className="align-top min-w-[100px]">
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
                  <TableCell className="align-top min-w-[100px]">
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
                  <TableCell className="align-top min-w-[110px] text-right">
                    <div className="h-9 flex items-center justify-end px-2 rounded-md border bg-muted/50 text-sm font-medium whitespace-nowrap">
                      {rowBalances[index]
                        ? `${formatRs(rowBalances[index]!.value)} ${rowBalances[index]!.side}`
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRow(draft.id)}
                      disabled={drafts.length === 1}
                      title="Remove row"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
