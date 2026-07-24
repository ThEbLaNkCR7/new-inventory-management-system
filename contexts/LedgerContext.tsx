"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type BalanceSide = "Dr" | "Cr"

export interface LedgerAccount {
  id: string
  name: string
  address?: string
  openingBalance: number
  openingBalanceType: BalanceSide
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LedgerEntry {
  id: string
  ledgerAccountId: string
  nepaliDate: string
  englishDate: string
  type: "Sale" | "Rcpt" | "Payment" | "Journal"
  voucherBillNo: string
  contraAccount: string
  debit: number
  credit: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

interface LedgerContextType {
  ledgerAccounts: LedgerAccount[]
  ledgerEntries: LedgerEntry[]
  isRefreshing: boolean
  refreshData: () => Promise<void>
  addLedgerAccount: (account: Omit<LedgerAccount, "id">) => Promise<LedgerAccount>
  updateLedgerAccount: (id: string, account: Partial<LedgerAccount>) => Promise<void>
  deleteLedgerAccount: (id: string) => Promise<void>
  addLedgerEntry: (entry: Omit<LedgerEntry, "id">) => Promise<LedgerEntry>
  updateLedgerEntry: (id: string, entry: Partial<LedgerEntry>) => Promise<void>
  deleteLedgerEntry: (id: string) => Promise<void>
  getEntriesForAccount: (accountId: string) => LedgerEntry[]
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined)

function normalizeAccount(raw: any): LedgerAccount {
  return {
    ...raw,
    id: String(raw._id || raw.id),
    openingBalance: Number(raw.openingBalance || 0),
    openingBalanceType: raw.openingBalanceType === "Cr" ? "Cr" : "Dr",
  }
}

function normalizeEntry(raw: any): LedgerEntry {
  return {
    ...raw,
    id: String(raw._id || raw.id),
    ledgerAccountId: String(raw.ledgerAccountId?._id || raw.ledgerAccountId),
    englishDate:
      typeof raw.englishDate === "string"
        ? raw.englishDate
        : new Date(raw.englishDate).toISOString(),
    debit: Number(raw.debit || 0),
    credit: Number(raw.credit || 0),
  }
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsRefreshing(true)
    try {
      const [accountsRes, entriesRes] = await Promise.all([
        fetch("/api/ledger-accounts"),
        fetch("/api/ledger-entries"),
      ])
      const accountsData = await accountsRes.json()
      const entriesData = await entriesRes.json()

      setLedgerAccounts(
        (accountsData.accounts || [])
          .map(normalizeAccount)
          .filter((a: LedgerAccount) => a.isActive !== false),
      )
      setLedgerEntries(
        (entriesData.entries || [])
          .map(normalizeEntry)
          .filter((e: LedgerEntry) => e.isActive !== false),
      )
    } catch (error) {
      console.error("Failed to fetch ledger data:", error)
    } finally {
      if (showLoading) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData(false)
  }, [fetchAllData])

  const refreshData = useCallback(async () => {
    await fetchAllData(true)
  }, [fetchAllData])

  const addLedgerAccount = async (account: Omit<LedgerAccount, "id">) => {
    const res = await fetch("/api/ledger-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    })
    if (!res.ok) throw new Error("Failed to add ledger account")
    const newAccount = normalizeAccount(await res.json())
    setLedgerAccounts((prev) => [...prev, newAccount])
    return newAccount
  }

  const updateLedgerAccount = async (id: string, updated: Partial<LedgerAccount>) => {
    const res = await fetch(`/api/ledger-accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
    if (!res.ok) throw new Error("Failed to update ledger account")
    const account = normalizeAccount(await res.json())
    setLedgerAccounts((prev) => prev.map((a) => (a.id === id ? account : a)))
  }

  const deleteLedgerAccount = async (id: string) => {
    const res = await fetch(`/api/ledger-accounts/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete ledger account")
    setLedgerAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  const addLedgerEntry = async (entry: Omit<LedgerEntry, "id">) => {
    const res = await fetch("/api/ledger-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
    if (!res.ok) throw new Error("Failed to add ledger entry")
    const newEntry = normalizeEntry(await res.json())
    setLedgerEntries((prev) => [...prev, newEntry])
    return newEntry
  }

  const updateLedgerEntry = async (id: string, updated: Partial<LedgerEntry>) => {
    const res = await fetch(`/api/ledger-entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
    if (!res.ok) throw new Error("Failed to update ledger entry")
    const entry = normalizeEntry(await res.json())
    setLedgerEntries((prev) => prev.map((e) => (e.id === id ? entry : e)))
  }

  const deleteLedgerEntry = async (id: string) => {
    const res = await fetch(`/api/ledger-entries/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete ledger entry")
    setLedgerEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const getEntriesForAccount = (accountId: string) =>
    ledgerEntries
      .filter((e) => e.ledgerAccountId === accountId)
      .sort(
        (a, b) =>
          new Date(a.englishDate).getTime() - new Date(b.englishDate).getTime(),
      )

  return (
    <LedgerContext.Provider
      value={{
        ledgerAccounts,
        ledgerEntries,
        isRefreshing,
        refreshData,
        addLedgerAccount,
        updateLedgerAccount,
        deleteLedgerAccount,
        addLedgerEntry,
        updateLedgerEntry,
        deleteLedgerEntry,
        getEntriesForAccount,
      }}
    >
      {children}
    </LedgerContext.Provider>
  )
}

export function useLedger() {
  const context = useContext(LedgerContext)
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider")
  }
  return context
}
