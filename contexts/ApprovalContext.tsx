"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "./AuthContext"
import { useInventory } from "./InventoryContext"

export interface ApprovalChange {
  id: string
  type: "product" | "sale" | "purchase" | "client" | "supplier"
  action: "create" | "update" | "delete"
  entityId?: string
  entityLabel?: string
  originalData?: any
  proposedData?: any
  requestedBy: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  reason?: string
  changeSummary?: string
  changedFields?: string[]
}

interface ApprovalContextType {
  pendingChanges: ApprovalChange[]
  isLoading: boolean
  submitChange: (change: Omit<ApprovalChange, "id" | "requestedAt" | "status">) => void
  approveChange: (changeId: string, notes?: string) => void
  rejectChange: (changeId: string, notes?: string) => void
  getPendingChanges: () => ApprovalChange[]
  getChangeHistory: () => ApprovalChange[]
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined)

function normalizeApproval(doc: any): ApprovalChange {
  return {
    ...doc,
    id: doc.id || doc._id?.toString(),
    requestedAt: doc.requestedAt,
    reviewedAt: doc.reviewedAt,
  }
}

async function createApprovalRecord(payload: Record<string, unknown>) {
  const response = await fetch("/api/approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Failed to save approval")
  }

  return normalizeApproval(await response.json())
}

async function finalizeApprovalRecord(id: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/approvals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Failed to update approval")
  }

  return normalizeApproval(await response.json())
}

export function ApprovalProvider({ children }: { children: React.ReactNode }) {
  const [changes, setChanges] = useState<ApprovalChange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const {
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    updateSale,
    deleteSale,
    addPurchase,
    updatePurchase,
    deletePurchase,
    addClient,
    updateClient,
    deleteClient,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useInventory()

  const fetchApprovals = useCallback(async () => {
    try {
      const response = await fetch("/api/approvals")
      if (!response.ok) throw new Error("Failed to fetch approvals")
      const data = await response.json()
      setChanges((data.approvals || []).map(normalizeApproval))
    } catch (error) {
      console.error("Error loading approvals:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const applySaleChange = (change: ApprovalChange) => {
    switch (change.action) {
      case "create":
        addSale({
          client: change.proposedData.client,
          clientType: change.proposedData.clientType,
          saleDate: change.proposedData.saleDate,
          batchId: change.proposedData.batchId,
          batchNumber: change.proposedData.batchNumber,
          isVat: change.proposedData.isVat ?? false,
          items: change.proposedData.items || [
            {
              productId: change.proposedData.productId,
              productName: change.proposedData.productName,
              quantitySold: change.proposedData.quantitySold,
              salePrice: change.proposedData.salePrice,
            },
          ],
        })
        break
      case "update":
        if (change.entityId) {
          updateSale(change.entityId, {
            client: change.proposedData.client,
            clientType: change.proposedData.clientType,
            saleDate: change.proposedData.saleDate,
            items: [
              {
                productId: change.proposedData.productId,
                productName: change.proposedData.productName,
                quantitySold: change.proposedData.quantitySold,
                salePrice: change.proposedData.salePrice,
              },
            ],
          })
        }
        break
      case "delete":
        if (change.entityId) {
          deleteSale(change.entityId)
        }
        break
    }
  }

  const applyPurchaseChange = (change: ApprovalChange) => {
    switch (change.action) {
      case "create":
        addPurchase({
          supplier: change.proposedData.supplier,
          supplierType: change.proposedData.supplierType,
          purchaseDate: change.proposedData.purchaseDate,
          items: [
            {
              productId: change.proposedData.productId,
              productName: change.proposedData.productName,
              quantityPurchased: change.proposedData.quantityPurchased,
              purchasePrice: change.proposedData.purchasePrice,
            },
          ],
        })
        break
      case "update":
        if (change.entityId) {
          updatePurchase(change.entityId, {
            supplier: change.proposedData.supplier,
            supplierType: change.proposedData.supplierType,
            purchaseDate: change.proposedData.purchaseDate,
            items: [
              {
                productId: change.proposedData.productId,
                productName: change.proposedData.productName,
                quantityPurchased: change.proposedData.quantityPurchased,
                purchasePrice: change.proposedData.purchasePrice,
              },
            ],
          })
        }
        break
      case "delete":
        if (change.entityId) {
          deletePurchase(change.entityId)
        }
        break
    }
  }

  const applyProductChange = (change: ApprovalChange) => {
    switch (change.action) {
      case "create":
        addProduct(change.proposedData)
        break
      case "update":
        if (change.entityId) {
          updateProduct(change.entityId, change.proposedData)
        }
        break
      case "delete":
        if (change.entityId) {
          deleteProduct(change.entityId)
        }
        break
    }
  }

  const applyClientChange = (change: ApprovalChange) => {
    switch (change.action) {
      case "create":
        addClient(change.proposedData)
        break
      case "update":
        if (change.entityId) {
          updateClient(change.entityId, change.proposedData)
        }
        break
      case "delete":
        if (change.entityId) {
          deleteClient(change.entityId)
        }
        break
    }
  }

  const applySupplierChange = (change: ApprovalChange) => {
    switch (change.action) {
      case "create":
        addSupplier(change.proposedData)
        break
      case "update":
        if (change.entityId) {
          updateSupplier(change.entityId, change.proposedData)
        }
        break
      case "delete":
        if (change.entityId) {
          deleteSupplier(change.entityId)
        }
        break
    }
  }

  const applyChange = (change: ApprovalChange) => {
    switch (change.type) {
      case "product":
        applyProductChange(change)
        break
      case "sale":
        applySaleChange(change)
        break
      case "purchase":
        applyPurchaseChange(change)
        break
      case "client":
        applyClientChange(change)
        break
      case "supplier":
        applySupplierChange(change)
        break
    }
  }

  const submitChange = (change: Omit<ApprovalChange, "id" | "requestedAt" | "status">) => {
    const isAdmin = user?.role === "admin"
    const now = new Date().toISOString()

    const persist = async () => {
      try {
        const saved = await createApprovalRecord({
          ...change,
          requestedAt: now,
          status: isAdmin ? "approved" : "pending",
          ...(isAdmin && {
            reviewedBy: user?.email,
            reviewedAt: now,
          }),
        })

        setChanges((prev) => {
          const withoutTemp = prev.filter((item) => !item.id.startsWith("temp-"))
          return [saved, ...withoutTemp.filter((item) => item.id !== saved.id)]
        })
      } catch (error) {
        console.error("Error saving approval:", error)
        fetchApprovals()
      }
    }

    if (isAdmin) {
      const adminChange: ApprovalChange = {
        ...change,
        id: `temp-${Date.now()}`,
        requestedAt: now,
        status: "approved",
        reviewedBy: user?.email,
        reviewedAt: now,
      }

      try {
        applyChange(adminChange)
      } catch (error) {
        console.error("Error auto-applying admin change:", error)
      }

      setChanges((prev) => [adminChange, ...prev])
      persist()
      return
    }

    const pendingChange: ApprovalChange = {
      ...change,
      id: `temp-${Date.now()}`,
      requestedAt: now,
      status: "pending",
    }

    setChanges((prev) => [pendingChange, ...prev])
    persist()
  }

  const approveChange = (changeId: string, notes?: string) => {
    const change = changes.find((item) => item.id === changeId)
    if (!change) return

    const reviewedAt = new Date().toISOString()
    const updatedChange: ApprovalChange = {
      ...change,
      status: "approved",
      reviewedBy: user?.email,
      reviewedAt,
      reviewNotes: notes,
    }

    setChanges((prev) => prev.map((item) => (item.id === changeId ? updatedChange : item)))

    try {
      applyChange(updatedChange)
    } catch (error) {
      console.error("Error applying approved change:", error)
    }

    finalizeApprovalRecord(changeId, {
      status: "approved",
      reviewedBy: user?.email,
      reviewedAt,
      reviewNotes: notes,
    })
      .then((saved) => {
        setChanges((prev) => prev.map((item) => (item.id === changeId ? saved : item)))
      })
      .catch((error) => {
        console.error("Error saving approval history:", error)
        fetchApprovals()
      })
  }

  const rejectChange = (changeId: string, notes?: string) => {
    const reviewedAt = new Date().toISOString()

    setChanges((prev) =>
      prev.map((item) =>
        item.id === changeId
          ? {
              ...item,
              status: "rejected" as const,
              reviewedBy: user?.email,
              reviewedAt,
              reviewNotes: notes,
            }
          : item,
      ),
    )

    finalizeApprovalRecord(changeId, {
      status: "rejected",
      reviewedBy: user?.email,
      reviewedAt,
      reviewNotes: notes,
    })
      .then((saved) => {
        setChanges((prev) => prev.map((item) => (item.id === changeId ? saved : item)))
      })
      .catch((error) => {
        console.error("Error saving rejection:", error)
        fetchApprovals()
      })
  }

  const getPendingChanges = () => changes.filter((change) => change.status === "pending")

  const getChangeHistory = () =>
    changes
      .filter((change) => change.status !== "pending")
      .sort((a, b) => new Date(b.reviewedAt || "").getTime() - new Date(a.reviewedAt || "").getTime())

  return (
    <ApprovalContext.Provider
      value={{
        pendingChanges: changes,
        isLoading,
        submitChange,
        approveChange,
        rejectChange,
        getPendingChanges,
        getChangeHistory,
      }}
    >
      {children}
    </ApprovalContext.Provider>
  )
}

export function useApproval() {
  const context = useContext(ApprovalContext)
  if (context === undefined) {
    throw new Error("useApproval must be used within an ApprovalProvider")
  }
  return context
}
