"use client"

import AddLedgerEntriesDialog from "@/components/ledger-accounts/AddLedgerEntriesDialog"
import ViewLedgerReportDialog from "@/components/ledger-accounts/ViewLedgerReportDialog"
import {
  formatRs,
  getAccountClosingBalance,
  getAccountTypeShortLabel,
  validateLedgerAccountForm,
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
import { useToast } from "@/components/ui/use-toast"
import type { LedgerAccount, LedgerAccountType } from "@/contexts/LedgerContext"
import { useLedger } from "@/contexts/LedgerContext"
import { cn, formatNepaliDateForTable, toTitleCase } from "@/lib/utils"
import { BookOpen, ChevronDown, ChevronRight, Eye, Filter, Loader2, Plus, Search, Trash2, X } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import DataPagination from "@/components/ui/data-pagination"
import { usePagination } from "@/hooks/usePagination"

const inputClass =
  "border border-border bg-background focus:border-navy/50 focus-visible:ring-1 focus-visible:ring-navy/20"
const errorTextClass = "text-sm text-navy"

type LedgerNameGroup = {
  key: string
  name: string
  accountType: LedgerAccountType
  accounts: LedgerAccount[]
}

function accountGroupKey(account: LedgerAccount) {
  return `${account.accountType}|${account.name.trim().toLowerCase()}`
}

export default function LedgerAccountsPage() {
  const {
    ledgerAccounts,
    addLedgerAccount,
    deleteLedgerAccount,
    getEntriesForAccount,
    isRefreshing,
  } = useLedger()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | LedgerAccountType>("all")
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [accountForm, setAccountForm] = useState({
    name: "",
    address: "",
    existingAccountId: "none",
    accountType: "customer" as LedgerAccountType,
    openingBalance: "0",
    openingBalanceType: "Dr" as "Dr" | "Cr",
  })

  const carryForwardSource = useMemo(() => {
    if (accountForm.existingAccountId === "none") return null
    return ledgerAccounts.find((a) => a.id === accountForm.existingAccountId) ?? null
  }, [accountForm.existingAccountId, ledgerAccounts])

  const carryForwardClosing = useMemo(() => {
    if (!carryForwardSource) return null
    const entries = getEntriesForAccount(carryForwardSource.id)
    return getAccountClosingBalance(carryForwardSource, entries)
  }, [carryForwardSource, getEntriesForAccount])

  const isCarryForward = accountForm.existingAccountId !== "none"

  const filteredAccounts = useMemo(
    () =>
      ledgerAccounts
        .filter((account) => {
          const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesType = typeFilter === "all" || account.accountType === typeFilter
          return matchesSearch && matchesType
        })
        .slice()
        .sort((a, b) => {
          const aTime = new Date((a as any).createdAt || 0).getTime()
          const bTime = new Date((b as any).createdAt || 0).getTime()
          return bTime - aTime
        }),
    [ledgerAccounts, searchTerm, typeFilter]
  )

  /** Same name + type collapse into one row (carry-forward ledgers), like sales/purchases. */
  const groupedAccounts = useMemo(() => {
    const groups = new Map<string, LedgerNameGroup>()

    filteredAccounts.forEach((account) => {
      const key = accountGroupKey(account)
      const existing = groups.get(key)
      if (existing) {
        existing.accounts.push(account)
        return
      }
      groups.set(key, {
        key,
        name: account.name,
        accountType: account.accountType,
        accounts: [account],
      })
    })

    return Array.from(groups.values()).sort((a, b) => {
      const aTime = Math.max(
        ...a.accounts.map((acc) => new Date((acc as any).createdAt || 0).getTime())
      )
      const bTime = Math.max(
        ...b.accounts.map((acc) => new Date((acc as any).createdAt || 0).getTime())
      )
      return bTime - aTime
    })
  }, [filteredAccounts])

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedGroups,
    startItem,
    endItem,
  } = usePagination(groupedAccounts, {
    resetKey: `${searchTerm}|${typeFilter}`,
  })

  const toggleExpanded = (key: string) => {
    setExpandedNames((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderExpandCell = (content?: ReactNode) => (
    <TableCell className="w-10 min-w-10 max-w-10 py-2 pl-6 pr-2 align-middle">
      {content ?? null}
    </TableCell>
  )

  const renderAccountActions = (account: LedgerAccount) => (
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
  )

  const renderAccountRow = (account: LedgerAccount, options?: { nested?: boolean }) => {
    const closing = getAccountClosingBalance(account, getEntriesForAccount(account.id))
    const createdLabel = (account as any).createdAt
      ? formatNepaliDateForTable((account as any).createdAt)
      : null

    return (
      <TableRow
        key={account.id}
        className={cn(
          "bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card",
          options?.nested && "bg-muted/20 dark:bg-muted/10"
        )}
      >
        {renderExpandCell()}
        <TableCell>
          <div className="min-w-[120px]">
            {options?.nested ? (
              <>
                <p className="text-sm font-normal text-navy">
                  {createdLabel ? `Opened ${createdLabel}` : "Ledger period"}
                </p>
                <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                  Opening Rs.{" "}
                  {account.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}{" "}
                  {account.openingBalanceType}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-navy">{toTitleCase(account.name)}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={account.accountType === "supplier" ? "secondary" : "default"}>
            {getAccountTypeShortLabel(account.accountType)}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-navy">{account.address || "-"}</TableCell>
        <TableCell>
          <Badge variant="outline">
            Rs. {account.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}{" "}
            {account.openingBalanceType}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            Rs. {closing.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })} {closing.side}
          </Badge>
        </TableCell>
        <TableCell className="text-right">{renderAccountActions(account)}</TableCell>
      </TableRow>
    )
  }

  const renderAccountRows = () =>
    paginatedGroups.flatMap((group) => {
      if (group.accounts.length === 1) {
        return [renderAccountRow(group.accounts[0])]
      }

      const isExpanded = expandedNames.has(group.key)
      const latest = group.accounts[0]
      const latestClosing = getAccountClosingBalance(
        latest,
        getEntriesForAccount(latest.id)
      )

      const headerRow = (
        <TableRow
          key={`group-${group.key}`}
          className="cursor-pointer bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/60"
          onClick={() => toggleExpanded(group.key)}
        >
          {renderExpandCell(
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-muted hover:text-navy"
              aria-label={isExpanded ? "Collapse ledgers" : "Expand ledgers"}
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(group.key)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          <TableCell>
            <div className="min-w-[140px]">
              <p className="text-sm font-semibold text-navy">{toTitleCase(group.name)}</p>
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                {group.accounts.length} ledgers
              </p>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={group.accountType === "supplier" ? "secondary" : "default"}>
              {getAccountTypeShortLabel(group.accountType)}
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {latest.address || "-"}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">—</TableCell>
          <TableCell>
            <Badge variant="outline" className="font-normal">
              Latest Rs.{" "}
              {latestClosing.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}{" "}
              {latestClosing.side}
            </Badge>
          </TableCell>
          <TableCell />
        </TableRow>
      )

      if (!isExpanded) return [headerRow]

      return [headerRow, ...group.accounts.map((account) => renderAccountRow(account, { nested: true }))]
    })

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
      existingAccountId: "none",
      accountType: "customer",
      openingBalance: "0",
      openingBalanceType: "Dr",
    })
    clearFieldErrors()
  }

  const handleExistingAccountChange = (accountId: string) => {
    if (accountId === "none") {
      setAccountForm((prev) => ({
        ...prev,
        existingAccountId: "none",
        name: "",
        address: "",
        accountType: "customer",
        openingBalance: "0",
        openingBalanceType: "Dr",
      }))
      return
    }

    const source = ledgerAccounts.find((a) => a.id === accountId)
    if (!source) return

    const closing = getAccountClosingBalance(source, getEntriesForAccount(source.id))
    setAccountForm((prev) => ({
      ...prev,
      existingAccountId: accountId,
      name: source.name,
      address: source.address || "",
      accountType: source.accountType,
      openingBalance: String(closing.value),
      openingBalanceType: closing.side,
    }))
  }

  const handleAddAccount = async () => {
    const name = isCarryForward && carryForwardSource ? carryForwardSource.name : accountForm.name
    const address =
      isCarryForward && carryForwardSource ? carryForwardSource.address || "" : accountForm.address

    const errors = validateLedgerAccountForm({
      name,
      openingBalance: accountForm.openingBalance,
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
      await addLedgerAccount({
        name: name.trim(),
        address: address.trim(),
        accountType: accountForm.accountType,
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
    setIsAddEntryOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title mb-0 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
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
              <DialogDescription>
                {isCarryForward
                  ? "Closing balance of the selected account becomes the new opening balance automatically."
                  : "Create a new account for manual ledger entries."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Account Type *</Label>
                <Select
                  value={accountForm.accountType}
                  onValueChange={(value: LedgerAccountType) =>
                    setAccountForm((prev) => ({ ...prev, accountType: value }))
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer Ledger Account</SelectItem>
                    <SelectItem value="supplier">Supplier Ledger Account</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer: balance = prev + (debit − credit). Supplier: balance = prev + (credit − debit).
                </p>
              </div>

              <div>
                <Label>Existing Account (optional)</Label>
                <Select
                  value={accountForm.existingAccountId}
                  onValueChange={handleExistingAccountChange}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select existing account (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">select existing account</SelectItem>
                    {ledgerAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isCarryForward && carryForwardSource ? (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <p className="text-sm font-medium">{carryForwardSource.name}</p>
                  {carryForwardSource.address && (
                    <p className="text-sm text-muted-foreground">{carryForwardSource.address}</p>
                  )}
                  {carryForwardClosing && (
                    <p className="text-sm font-semibold pt-2">
                      Opening Balance: Rs. {formatRs(carryForwardClosing.value)}{" "}
                      {carryForwardClosing.side}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from the selected account&apos;s closing balance.
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}

              {!isCarryForward && (
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
                      placeholder="0.00"
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
              )}
              <Button onClick={handleAddAccount} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>
            Ledger Accounts
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Manage accounts and record manual ledger transactions.
          </CardDescription>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                className={`h-10 pl-10 ${inputClass}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value: "all" | LedgerAccountType) => setTypeFilter(value)}
              >
                <SelectTrigger className={`h-10 w-full sm:w-[220px] ${inputClass}`}>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Account Types</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm.trim() !== "" || typeFilter !== "all") && (
                <Button
                  type="button"
                  variant="neutralOutline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setTypeFilter("all")
                  }}
                  className="h-10 shrink-0 gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="border-t border-border pt-4">
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
                  <TableHead className="w-10 min-w-10 max-w-10 py-2 pl-6 pr-2" />
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm font-normal italic text-muted-foreground"
                    >
                      {ledgerAccounts.length === 0
                        ? 'No ledger accounts yet. Click "Add Ledger Account" to get started.'
                        : "No accounts match your search or filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  renderAccountRows()
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
          />
        </CardContent>
      </Card>

      <AddLedgerEntriesDialog
        open={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        account={selectedAccount}
      />

      <ViewLedgerReportDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        account={selectedAccount}
      />
    </div>
  )
}
