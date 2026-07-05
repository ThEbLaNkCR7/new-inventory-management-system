"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface BatchItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  manufactureDate?: string
  expiryDate?: string
}

export interface Batch {
  id: string
  batchNumber: string
  supplier: string
  arrivalDate: string
  items: BatchItem[]
  totalItems: number
  totalValue: number
  billUrl?: string
  status: "pending" | "received" | "processed"
  createdAt: string
}

interface BatchContextType {
  batches: Batch[]
  addBatch: (batch: Omit<Batch, "id" | "createdAt">) => Promise<void>
  deleteBatch: (id: string) => Promise<void>
  updateBatchStatus: (id: string, status: Batch["status"]) => void
  getBatchById: (id: string) => Batch | undefined
  getRecentBatches: () => Batch[]
}

const BatchContext = createContext<BatchContextType | undefined>(undefined)



export function BatchProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<Batch[]>([])

  // load batches from API on mount
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch('/api/batches')
          if (!res.ok) return
          const data = await res.json()
          if (!mounted) return
          const loaded: Batch[] = (data.batches || []).map((b: any) => ({
            ...b,
            id: b._id || b.id,
            arrivalDate: b.arrivalDate ? new Date(b.arrivalDate).toISOString().split('T')[0] : b.arrivalDate,
            createdAt: b.createdAt || b.createdAt,
          }))
          setBatches(loaded)
        } catch (e) {
          console.error('Failed to load batches', e)
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  const addBatch = async (batchData: Omit<Batch, "id" | "createdAt">) => {
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      })
      if (!res.ok) throw new Error('Failed to create batch')
      const created = await res.json()
      const newBatch: Batch = {
        ...created,
        id: created._id || created.id,
        arrivalDate: created.arrivalDate ? new Date(created.arrivalDate).toISOString().split('T')[0] : created.arrivalDate,
        createdAt: created.createdAt || created.createdAt,
      }
      setBatches((prev) => [...prev, newBatch])
    } catch (e) {
      console.error('addBatch error', e)
      throw e
    }
  }

  const deleteBatch = async (id: string) => {
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete batch")
      setBatches((prev) => prev.filter((batch) => batch.id !== id))
    } catch (e) {
      console.error("deleteBatch error", e)
      throw e
    }
  }

  const updateBatchStatus = async (id: string, status: Batch["status"]) => {
    try {
      const res = await fetch(`/api/batches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      const updated = await res.json()
      setBatches((prev) => prev.map((batch) => (batch.id === id ? { ...batch, status: updated.status } : batch)))
    } catch (e) {
      console.error('updateBatchStatus error', e)
    }
  }

  const getBatchById = (id: string) => {
    return batches.find((batch) => batch.id === id)
  }

  const getRecentBatches = () => {
    return batches
      .filter((batch) => {
        const batchDate = new Date(batch.arrivalDate)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return batchDate >= thirtyDaysAgo
      })
      .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())
  }

  return (
    <BatchContext.Provider
      value={{
        batches,
        addBatch,
        deleteBatch,
        updateBatchStatus,
        getBatchById,
        getRecentBatches,
      }}
    >
      {children}
    </BatchContext.Provider>
  )
}

export function useBatch() {
  const context = useContext(BatchContext)
  if (context === undefined) {
    throw new Error("useBatch must be used within a BatchProvider")
  }
  return context
}
