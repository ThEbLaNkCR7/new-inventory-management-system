"use client"

import ViewLedgerReportDialog from "@/components/ledger-accounts/ViewLedgerReportDialog"
import {
  computePreviewBalance,
  formatEnglishDateDisplay,
  formatNepaliDateDisplay,
  formatRs,
  validateLedgerAccountForm,
  validateLedgerEntryForm,
} from "@/components/ledger-accounts/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { MaterialDatePicker } from "@/components/ui/MaterialDatePicker"
import { useToast } from "@/components/ui/use-toast"
import type { LedgerAccount } from "@/contexts/LedgerContext"
import { useLedger } from "@/contexts/LedgerContext"
import {
  englishToNepali,
  formatNepaliDate,
} from "@/lib/nepaliDateUtils"
import { BookOpen, Eye, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

const inputClass =
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
const errorTextClass = "text-sm text-red-600 dark:text-red-400"

const TRANSACTION_TYPES = ["Sale", "Rcpt", "Payment", "Journal"] as const

export default function LedgerAccountsPage() {
  const {
    ledgerAccounts,
    addLedgerAccount,
    deleteLedgerAccount,
    addLedgerEntry,
    getEntriesForAccount,
    isRefreshing,
  } = useLedger()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [accountForm, setAccountForm] = useState({
    name: "",
    address: "",
    openingBalance: "0",
    openingBalanceType: "Dr" as "Dr" | "Cr",
  })

  const [entryForm, setEntryForm] = useState({
    nepaliDate: "",
    englishDateIso: "",
    type: "Sale" as (typeof TRANSACTION_TYPES)[number],
    billNo: "",
    account: "",
    debit: "",
    credit: "",
  })

  const activeEntryAccount = selectedAccount

  const previewBalance = useMemo(() => {
    if (!activeEntryAccount) return null
    const entries = getEntriesForAccount(activeEntryAccount.id)
    return computePreviewBalance(
      activeEntryAccount.openingBalance,
      activeEntryAccount.openingBalanceType,
      entries,
      Number(entryForm.debit || 0),
      Number(entryForm.credit || 0),
    )
  }, [activeEntryAccount, entryForm.debit, entryForm.credit, getEntriesForAccount])

  const filteredAccounts = ledgerAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const clearFieldErrors = (...fields: string[]) => {
    setFieldErrors((prev) => {
      if (fields.length === 0) return {}
      const next = { ...prev }
      fields.forEach((field) => delete next[field])
      return next
    })
  }

  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? "border-red-500 focus:border-red-500 dark:border-red-500" : ""

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className={errorTextClass}>{fieldErrors[field]}</p> : null

  const resetAccountForm = () => {
    setAccountForm({
      name: "",
      address: "",
      openingBalance: "0",
      openingBalanceType: "Dr",
    })
    clearFieldErrors()
  }

  const resetEntryForm = () => {
    setEntryForm({
      nepaliDate: "",
      englishDateIso: "",
      type: "Sale",
      billNo: "",
      account: "",
      debit: "",
      credit: "",
    })
    clearFieldErrors()
  }

  const handleEnglishDateChange = (date: Date | undefined) => {
    clearFieldErrors("englishDate")
    if (!date) {
      setEntryForm((prev) => ({ ...prev, englishDateIso: "", nepaliDate: "" }))
      return
    }
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
    const nepali = englishToNepali(normalized)
    setEntryForm((prev) => ({
      ...prev,
      englishDateIso: normalized.toISOString(),
      nepaliDate: formatNepaliDate(nepali, "YYYY/MM/DD"),
    }))
  }

  const handleAddAccount = async () => {
    const errors = validateLedgerAccountForm(accountForm)
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
      await addLedgerAccount({
        name: accountForm.name.trim(),
        address: accountForm.address.trim(),
        openingBalance: Number(accountForm.openingBalance || 0),
        openingBalanceType: accountForm.openingBalanceType,
      })
      toast({ title: "Success", description: "Ledger account created successfully" })
      resetAccountForm()
      setIsAddAccountOpen(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to create ledger account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!selectedAccount) return

    const englishIso = entryForm.englishDateIso

    const errors = validateLedgerEntryForm({
      englishDate: englishIso,
      type: entryForm.type,
      account: entryForm.account,
      debit: entryForm.debit,
      credit: entryForm.credit,
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
      await addLedgerEntry({
        ledgerAccountId: selectedAccount.id,
        nepaliDate: formatNepaliDateDisplay(entryForm.nepaliDate),
        englishDate: englishIso,
        type: entryForm.type,
        voucherBillNo: entryForm.billNo.trim(),
        contraAccount: entryForm.account.trim(),
        debit: Number(entryForm.debit || 0),
        credit: Number(entryForm.credit || 0),
      })
      toast({ title: "Success", description: "Ledger entry added successfully" })
      resetEntryForm()
      setIsAddEntryOpen(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add ledger entry",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async (account: LedgerAccount) => {
    if (!confirm(`Delete ledger account "${account.name}"?`)) return
    try {
      await deleteLedgerAccount(account.id)
      toast({ title: "Deleted", description: "Ledger account removed" })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete ledger account",
        variant: "destructive",
      })
    }
  }

  const openViewReport = (account: LedgerAccount) => {
    setSelectedAccount(account)
    setIsViewOpen(true)
  }

  const openAddEntry = (account: LedgerAccount) => {
    setSelectedAccount(account)
    resetEntryForm()
    setIsAddEntryOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7" />
            Ledger Account
          </h1>
          <p className="text-muted-foreground mt-1">
            Standalone manual ledger.
          </p>
        </div>

        <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAccountForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Ledger Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ledger Account</DialogTitle>
              <DialogDescription>Create a new account for manual ledger entries.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  className={`${inputClass} ${fieldErrorClass("name")}`}
                  value={accountForm.name}
                  onChange={(e) => {
                    clearFieldErrors("name")
                    setAccountForm((prev) => ({ ...prev, name: e.target.value }))
                  }}
                  placeholder="Yuki Enterprises Pvt. Ltd."
                />
                {renderFieldError("name")}
              </div>
              <div>
                <Label htmlFor="accountAddress">Address</Label>
                <Textarea
                  id="accountAddress"
                  className={inputClass}
                  value={accountForm.address}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Dhobighat, Lalitpur"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openingBalance">Opening Balance (Rs.)</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} ${fieldErrorClass("openingBalance")}`}
                    value={accountForm.openingBalance}
                    onChange={(e) => {
                      clearFieldErrors("openingBalance")
                      setAccountForm((prev) => ({ ...prev, openingBalance: e.target.value }))
                    }}
                  />
                  {renderFieldError("openingBalance")}
                </div>
                <div>
                  <Label>Balance Type</Label>
                  <Select
                    value={accountForm.openingBalanceType}
                    onValueChange={(value: "Dr" | "Cr") =>
                      setAccountForm((prev) => ({ ...prev, openingBalanceType: value }))
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr">Dr (Debit)</SelectItem>
                      <SelectItem value="Cr">Cr (Credit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddAccount} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Accounts</CardTitle>
          <CardDescription>
            Manage accounts and record manual ledger transactions.
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              className={`pl-10 ${inputClass}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isRefreshing && (
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No ledger accounts yet. Click &quot;Add Ledger Account&quot; to get started.
                    </TableCell>
                  </TableRow>
                )}
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.address || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Rs. {account.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}{" "}
                        {account.openingBalanceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddEntry(account)}
                          title="Add Entry"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewReport(account)}
                          title="View Ledger"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccount(account)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <DialogDescription>
              {selectedAccount ? `Entry for ${selectedAccount.name}` : "Add a manual ledger entry"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="englishDate">English Date *</Label>
              <MaterialDatePicker
                value={entryForm.englishDateIso ? new Date(entryForm.englishDateIso) : undefined}
                onChange={handleEnglishDateChange}
              />
              {entryForm.
              englishDateIso && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatEnglishDateDisplay(entryForm.englishDateIso)}
                </p>
              )}
              {renderFieldError("englishDate")}
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={entryForm.type}
                onValueChange={(value: (typeof TRANSACTION_TYPES)[number]) =>
                  setEntryForm((prev) => ({ ...prev, type: value }))
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
            </div>

            <div>
              <Label htmlFor="billNo">Bill No.</Label>
              <Input
                id="billNo"
                className={inputClass}
                value={entryForm.billNo}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, billNo: e.target.value }))}
                placeholder="ATAS-1/82-83"
              />
            </div>

            <div>
              <Label htmlFor="account">Account *</Label>
              <Input
                id="account"
                className={`${inputClass} ${fieldErrorClass("account")}`}
                value={entryForm.account}
                onChange={(e) => {
                  clearFieldErrors("account")
                  setEntryForm((prev) => ({ ...prev, account: e.target.value }))
                }}
                placeholder="Sales"
              />
              {renderFieldError("account")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debit">Debit</Label>
                <Input
                  id="debit"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputClass} ${fieldErrorClass("amount")}`}
                  value={entryForm.debit}
                  onChange={(e) => {
                    clearFieldErrors("amount")
                    setEntryForm((prev) => ({
                      ...prev,
                      debit: e.target.value,
                      credit: e.target.value ? "" : prev.credit,
                    }))
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="credit">Credit</Label>
                <Input
                  id="credit"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputClass} ${fieldErrorClass("amount")}`}
                  value={entryForm.credit}
                  onChange={(e) => {
                    clearFieldErrors("amount")
                    setEntryForm((prev) => ({
                      ...prev,
                      credit: e.target.value,
                      debit: e.target.value ? "" : prev.debit,
                    }))
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            {renderFieldError("amount")}

            <div>
              <Label>Balance</Label>
              <div className="h-10 flex items-center px-3 rounded-md border-2 bg-muted/50 font-medium">
                {previewBalance
                  ? `${formatRs(previewBalance.value)} ${previewBalance.side}`
                  : "-"}
              </div>
            </div>

            <Button onClick={handleAddEntry} disabled={isLoading || !selectedAccount} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ViewLedgerReportDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        account={selectedAccount}
      />
    </div>
  )
}
