"use client"

import type React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type { Batch, BatchItem } from "@/contexts/BatchContext"
import { useBatch } from "@/contexts/BatchContext"
import type { Product } from "@/contexts/InventoryContext"
import { useInventory } from "@/contexts/InventoryContext"
import QuickAddProductDialog from "@/components/products/QuickAddProductDialog"
import { formatProductNetWeight } from "@/components/products/utils"
import { Separator } from "@/components/ui/separator"
import AddSupplierDialog from "@/components/suppliers/AddSupplierDialog"
import DeleteBatchDialog from "./DeleteBatchDialog"
import { createBatchTrackingContext, getBatchItemRemaining, getSoldItemsForBatch, getSoldQuantityForBatchItem } from "./utils"
import {
  Calendar,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Hash,
  IndianRupee,
  Layers,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
  Loader2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import DataPagination from "@/components/ui/data-pagination"
import { usePagination } from "@/hooks/usePagination"
import { formatNepaliDateForTable } from '../../lib/nepaliDateUtils'
import { MaterialDatePicker } from "../ui/MaterialDatePicker"

const isPortaledSelectClick = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest("[data-radix-select-content]") ||
    target.closest("[data-radix-popper-content-wrapper]")
  )
}

const shouldPreventBatchDialogClose = (
  target: EventTarget | null,
  isAddSupplierDialogOpen: boolean,
  isQuickAddProductOpen: boolean,
) => isPortaledSelectClick(target) || isAddSupplierDialogOpen || isQuickAddProductOpen

export default function BatchesPage() {
  const { batches, addBatch, deleteBatch, updateBatchStatus } = useBatch()
  const { products, suppliers, sales, refreshData } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false)
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false)
  const [addingProductItemIndex, setAddingProductItemIndex] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState({
    batchNumber: "",
    supplier: "",
    arrivalDate: new Date().toISOString().split("T")[0],
    billUrl: "",
    status: "pending" as const,
  })
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [billImage, setBillImage] = useState<File | null>(null)
  const [billUrl, setBillUrl] = useState("")

  const updateProgress = (step: string, current: number, total: number) => {
    setCurrentStep(step)
    setProgress((current / total) * 100)
    setTotalSteps(total)
  }

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  const filteredBatches = batches
    .filter(
      (batch) =>
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice()
    .sort((a, b) => {
      const aTime = new Date((a as any).createdAt || a.arrivalDate || 0).getTime()
      const bTime = new Date((b as any).createdAt || b.arrivalDate || 0).getTime()
      return bTime - aTime
    })


  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedBatches,
    startItem,
    endItem,
  } = usePagination(filteredBatches, {
    pageSize: 9,
    resetKey: searchTerm,
  })

  const handleSupplierChange = (value: string) => {
    if (value === "__new__") {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      setIsAddSupplierDialogOpen(true)
      return
    }
    setFormData({ ...formData, supplier: value })
  }

  const handleSupplierAdded = (supplierName: string, supplierId?: string) => {
    if (supplierId) {
      setFormData((prev) => ({ ...prev, supplier: supplierId }))
      return
    }
    const supplier = suppliers.find((s) => s.name === supplierName)
    if (supplier) {
      setFormData((prev) => ({ ...prev, supplier: supplier.id }))
    }
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open && (isAddSupplierDialogOpen || isQuickAddProductOpen)) return
    setIsAddDialogOpen(open)
  }

  const getBatchSupplierName = () =>
    suppliers.find((s) => s.id === formData.supplier)?.name || ""

  const openQuickAddProduct = (index: number) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setAddingProductItemIndex(index)
    setIsQuickAddProductOpen(true)
  }

  const handleQuickAddProductCreated = (product: Product) => {
    if (addingProductItemIndex === null) return

    const updatedItems = [...batchItems]
    updatedItems[addingProductItemIndex] = {
      ...updatedItems[addingProductItemIndex],
      productId: product.id,
      productName: product.name,
      unitCost: updatedItems[addingProductItemIndex].unitCost || product.unitPrice,
    }
    setBatchItems(updatedItems)
    setAddingProductItemIndex(null)
  }

  const resetForm = () => {
    setFormData({
      batchNumber: "",
      supplier: "",
      arrivalDate: new Date().toISOString().split("T")[0],
      billUrl,
      status: "pending",
    })
    setBatchItems([])
    setCollapsedItems(new Set())
    setAddingProductItemIndex(null)
    setIsQuickAddProductOpen(false)
  }

  const addBatchItem = () => {
    const newIndex = batchItems.length
    setBatchItems([
      ...batchItems,
      {
        productId: "",
        productName: "",
        quantity: 0,
        unitCost: 0,
        manufactureDate: "",
        expiryDate: "",
      },
    ])
    if (newIndex > 0) {
      setCollapsedItems(new Set(batchItems.map((_, i) => i)))
    }
  }

  const toggleItemCollapse = (index: number) => {
    setCollapsedItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const updateBatchItem = (index: number, field: keyof BatchItem, value: any) => {
    const updatedItems = [...batchItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "productId") {
      const product = products.find((p) => p.id === value)
      if (product) {
        updatedItems[index].productName = product.name
        updatedItems[index].unitCost = product.unitPrice
      }
    }

    setBatchItems(updatedItems)
  }

  const removeBatchItem = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index))
    setCollapsedItems((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const uploadBillToCloudinary = async (file: File): Promise<string> => {
    const formDataObj = new FormData()
    formDataObj.append("bill", file)

    const res = await fetch("/api/sales/upload", {
      method: "POST",
      body: formDataObj,
    })

    let data

    try {
      data = await res.json()
    } catch {
      throw new Error("Server returned invalid response")
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to upload bill")
    }

    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (batchItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one item to the batch.", variant: "destructive" })
      return
    }

    for (const item of batchItems) {
      if (!item.productId || item.productId === "__new__") {
        toast({ title: "Error", description: "Please select a product for each batch item.", variant: "destructive" })
        return
      }

      if (item.quantity <= 0) {
        toast({ title: "Error", description: "All quantities must be greater than 0.", variant: "destructive" })
        return
      }
    }

    const batchNumberExists = batches.some(
      (batch) => batch.batchNumber.toLowerCase() === formData.batchNumber.toLowerCase() && batch.id !== editingBatch?.id
    )

    if (batchNumberExists) {
      toast({ title: "Error", description: "Batch number already exists. Please use a unique batch number.", variant: "destructive" })
      return
    }

    setIsAddDialogOpen(false)
    setIsLoading(true)
    setProgress(0)

    const isEditing = !!editingBatch

    try {
      toast({
        title: "Processing...",
        description: "Validating batch data...",
        duration: 2000,
      })

      updateProgress("Validating batch data...", 1, 6)
      await new Promise((r) => setTimeout(r, 400))

      let uploadedBillUrl = ""

      if (billImage) {
        uploadedBillUrl = await uploadBillToCloudinary(billImage)
      }

      updateProgress("Checking products...", 2, 6)
      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Preparing batch items...", 3, 6)
      await new Promise((r) => setTimeout(r, 400))

      const totalItems = batchItems.length
      const totalValue = batchItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

      const batchData = {
        ...formData,
        items: batchItems,
        totalItems,
        totalValue,
        billUrl: uploadedBillUrl,
      }

      updateProgress("Processing supplier data...", 4, 6)
      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Saving batch...", 5, 6)
      await addBatch(batchData)

      updateProgress("Updating inventory...", 6, 6)
      await refreshData()

      if (editingBatch) {
        setEditingBatch(null)
      }

      await new Promise((r) => setTimeout(r, 300))

      toast({
        title: "Success",
        description: isEditing ? "Batch updated successfully!" : "Batch added successfully!",
      })
      resetForm()
      setBillImage(null)
      setBillUrl("")
      setShowSuccessAlert(true)
      setAlertMessage(isEditing ? "Batch updated successfully!" : "Batch added successfully!")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save batch."
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return { variant: "default" as const, className: "capitalize" }
      case "processed":
        return { variant: "secondary" as const, className: "capitalize border border-border" }
      case "pending":
      default:
        return { variant: "outline" as const, className: "capitalize bg-card" }
    }
  }

  const handleDelete = (batch: Batch) => {
    setDeletingBatch(batch)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBatch) return

    setIsDeleteDialogOpen(false)
    setIsDetailOpen(false)
    setSelectedBatch(null)
    setIsLoading(true)
    setProgress(0)

    try {
      toast({ title: "Processing...", description: "Validating deletion...", duration: 2000 })
      updateProgress("Validating deletion...", 1, 3)
      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Removing batch record...", 2, 3)
      await deleteBatch(deletingBatch.id)

      updateProgress("Updating inventory...", 3, 3)
      await refreshData()

      await new Promise((r) => setTimeout(r, 300))

      toast({ title: "Success", description: "Batch deleted successfully!" })
      setDeletingBatch(null)
      setShowSuccessAlert(true)
      setAlertMessage("Batch deleted successfully!")
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete batch.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  return (
    <div className="space-y-4 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3>Processing Batch...</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="text-xs text-muted-foreground text-center">
                Step {Math.ceil((progress / 100) * totalSteps)} of {totalSteps}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessAlert && (
        <Alert className="border-border bg-muted p-3 mb-0">
          <CheckCircle className="h-4 w-4 text-navy" />
          <AlertDescription className="text-navy">{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">
            Batches
          </h1>
          <p className="page-desc">Track and manage product batches and lot numbers</p>
        </div>
        <div className="absolute top-0 right-0 flex space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                variant="neutral"
               
              >
                <Plus className="h-4 w-4" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-4xl max-h-[90vh] overflow-y-auto"
              onPointerDownOutside={(event) => {
                if (shouldPreventBatchDialogClose(event.target, isAddSupplierDialogOpen, isQuickAddProductOpen)) {
                  event.preventDefault()
                }
              }}
              onInteractOutside={(event) => {
                if (shouldPreventBatchDialogClose(event.target, isAddSupplierDialogOpen, isQuickAddProductOpen)) {
                  event.preventDefault()
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>Add multiple items to a new inventory batch</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input
                      id="batchNumber"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="BATCH-2024-XXX"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select
                      value={formData.supplier || undefined}
                      onValueChange={handleSupplierChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">Add new supplier...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDate">Arrival Date</Label>
                    <MaterialDatePicker
                      value={
                        formData.arrivalDate
                          ? new Date(formData.arrivalDate)
                          : undefined
                      }
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          arrivalDate: date ? date.toISOString().split("T")[0] : ""
                        })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
                  <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="form-section-title mb-0">Batch Items</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          Add products, quantities, costs, and expiry details for this batch
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {batchItems.length > 0 && (
                        <Badge variant="secondary" className="font-normal">
                          {batchItems.length} {batchItems.length === 1 ? "line" : "lines"}
                        </Badge>
                      )}
                      <Button type="button" onClick={addBatchItem} variant="neutral" size="sm">
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {batchItems.map((item, index) => {
                      const selectedProduct = products.find((p) => p.id === item.productId)
                      const lineTotal = item.quantity * item.unitCost
                      const isCollapsed = collapsedItems.has(index)

                      return (
                        <Card
                          key={index}
                          className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div
                            className={`flex items-center justify-between gap-3 px-4 py-3 bg-muted ${
 isCollapsed ? "" : "border-b border-border"
 }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleItemCollapse(index)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left rounded-md hover:opacity-80 transition-opacity"
                            >
                              {isCollapsed ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-card shrink-0">
                                #{String(index + 1).padStart(2, "0")}
                              </Badge>
                              <div className="min-w-0">
                                <span className="block truncate text-sm font-medium text-navy">
                                  {selectedProduct
                                    ? `${selectedProduct.name} (${formatProductNetWeight(selectedProduct)})`
                                    : item.productName || "Select product..."}
                                </span>
                                {isCollapsed && (
                                  <span className="text-xs text-muted-foreground truncate block">
                                    {item.quantity > 0 ? `${item.quantity} units` : "No quantity"}
                                    {item.unitCost > 0 && ` · Rs ${item.unitCost.toFixed(2)}/unit`}
                                    {item.manufactureDate && ` · Mfg: ${formatNepaliDateForTable(item.manufactureDate)}`}
                                    {item.expiryDate && ` · Exp: ${formatNepaliDateForTable(item.expiryDate)}`}
                                  </span>
                                )}
                              </div>
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              {lineTotal > 0 && (
                                <span className="text-sm font-semibold text-navy">
                                  Rs {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                              <Button
                                type="button"
                                onClick={() => toggleItemCollapse(index)}
                                variant="neutralOutline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                {isCollapsed ? (
                                  <>
                                    <ChevronDown className="h-4 w-4" />
                                    <span className="sr-only">Expand item</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronUp className="h-4 w-4" />
                                    <span className="sr-only">Minimize item</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                onClick={() => removeBatchItem(index)}
                                variant="neutralOutline"
                                size="sm"
                                className="h-8 px-2 text-navy hover:bg-muted"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove item</span>
                              </Button>
                            </div>
                          </div>

                          {!isCollapsed && (
                          <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Product
                              </Label>
                              <Select
                                value={item.productId || undefined}
                                onValueChange={(value) => {
                                  if (value === "__new__") {
                                    openQuickAddProduct(index)
                                    return
                                  }
                                  updateBatchItem(index, "productId", value)
                                }}
                              >
                                <SelectTrigger className="h-10 bg-card">
                                  <SelectValue placeholder="Select a product from inventory">
                                    {selectedProduct
                                      ? `${selectedProduct.name} (${formatProductNetWeight(selectedProduct)}) — Stock: ${selectedProduct.stockQuantity}`
                                      : null}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__new__">+ Add New Product</SelectItem>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} ({formatProductNetWeight(product)}) — Stock: {product.stockQuantity}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedProduct && (
                                <p className="text-xs text-muted-foreground">
                                  {formatProductNetWeight(selectedProduct)} — Current stock:{" "}
                                  <span className="font-medium text-navy">{selectedProduct.stockQuantity}</span> units
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                                  <Hash className="h-3 w-3" />
                                  Quantity
                                </Label>
                                <Input
                                  type="number"
                                  min={1}
                                  className="h-10 bg-card"
                                  value={item.quantity === 0 ? "" : item.quantity}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    updateBatchItem(index, "quantity", value === "" ? 0 : Number.parseInt(value))
                                  }}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                                  <IndianRupee className="h-3 w-3" />
                                  Unit Cost
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  className="h-10 bg-card"
                                  value={item.unitCost === 0 ? "" : item.unitCost}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    updateBatchItem(index, "unitCost", value === "" ? 0 : Number.parseFloat(value))
                                  }}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <Separator className="bg-border" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  Manufacture Date
                                </Label>
                                <MaterialDatePicker
                                  value={
                                    item.manufactureDate
                                      ? new Date(item.manufactureDate)
                                      : undefined
                                  }
                                  onChange={(date) =>
                                    updateBatchItem(
                                      index,
                                      "manufactureDate",
                                      date ? date.toISOString().split("T")[0] : ""
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                                  <CalendarClock className="h-3 w-3" />
                                  Expiry Date
                                </Label>
                                <MaterialDatePicker
                                  value={
                                    item.expiryDate
                                      ? new Date(item.expiryDate)
                                      : undefined
                                  }
                                  onChange={(date) =>
                                    updateBatchItem(
                                      index,
                                      "expiryDate",
                                      date ? date.toISOString().split("T")[0] : ""
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                          )}
                        </Card>
                      )
                    })}

                    {batchItems.length === 0 && (
                      <div className="text-center py-8 px-6 border-2 border-dashed border-border rounded-xl bg-card">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Package className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-normal italic text-muted-foreground">No batch items yet</p>
                        <p className="mt-1 max-w-sm mx-auto text-xs font-normal text-muted-foreground">
                          Add line items to define products, quantities, unit costs, and shelf-life dates for this batch.
                        </p>
                        <Button type="button" onClick={addBatchItem} variant="neutralOutline" size="sm" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </div>

                  {batchItems.length > 0 && (
                    <div className="px-5 py-4 border-t border-border bg-card">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Batch Summary
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {batchItems.length} line {batchItems.length === 1 ? "item" : "items"} ·{" "}
                            {batchItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} total units
                          </p>
                        </div>
                        <div className="flex items-baseline gap-2 sm:text-right">
                          <span className="text-sm text-muted-foreground">Total Value</span>
                          <span className="text-2xl font-semibold tracking-tight tabular-nums text-navy">
                            Rs {batchItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Upload Bill Image</Label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBillImage(e.target.files?.[0] || null)}
                  />

                  {billUrl && (
                    <a
                      href={billUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                    >
                      View Current Bill
                    </a>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="neutralOutline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Batch</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AddSupplierDialog
            open={isAddSupplierDialogOpen}
            onOpenChange={setIsAddSupplierDialogOpen}
            onSupplierAdded={handleSupplierAdded}
          />
          <QuickAddProductDialog
            open={isQuickAddProductOpen}
            onOpenChange={setIsQuickAddProductOpen}
            onProductCreated={handleQuickAddProductCreated}
            defaultSupplier={getBatchSupplierName()}
            defaultUnitPrice={
              addingProductItemIndex !== null
                ? batchItems[addingProductItemIndex]?.unitCost || 0
                : 0
            }
          />
        </div>
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b border-border bg-card pb-3">
          <CardTitle>
            Batches
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">
              ({filteredBatches.length})
            </span>
          </CardTitle>
          <CardDescription className="mt-1 text-muted-foreground">
            Track incoming inventory batches and stock arrivals
          </CardDescription>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by batch number or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 border-border bg-background pl-10 focus:border-navy/40"
              />
            </div>
            {searchTerm.trim() !== "" && (
              <Button
                type="button"
                variant="neutralOutline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="h-10 shrink-0 gap-1.5 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="bg-muted pt-4">
          {filteredBatches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card py-10 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-normal italic text-muted-foreground">
                {searchTerm.trim() ? "No batches match your search" : "No batches found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedBatches.map((batch) => {
                const statusBadge = getStatusBadge(batch.status)
                return (
                <Card
                  key={batch.id}
                  onClick={() => {
                    setSelectedBatch(batch)
                    setIsDetailOpen(true)
                  }}
                  className="cursor-pointer overflow-hidden border-border bg-card shadow-sm transition-all hover:border-navy/30 hover:shadow-md"
                >
                  <CardHeader className="border-b border-border/80 bg-card pb-3">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate">{batch.batchNumber}</CardTitle>
                        <CardDescription className="mt-1 flex min-w-0 items-center">
                          <Truck className="mr-1 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {suppliers.find((s) => s.id === batch.supplier)?.name || batch.supplier}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant={statusBadge.variant} className={`${statusBadge.className} whitespace-nowrap`}>
                          {batch.status}
                        </Badge>
                        <Button
                          type="button"
                          variant="neutralOutline"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0 text-navy hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(batch)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 bg-card pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-navy">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{formatNepaliDateForTable(batch.arrivalDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{batch.items.length} items</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                      <div className="flex min-w-0 items-center">
                        <span className="truncate text-sm font-semibold tabular-nums text-navy">
                          Rs {batch.totalValue.toLocaleString()}
                        </span>
                      </div>
                      {batch.status === "pending" && (
                        <Button
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateBatchStatus(batch.id, "received")
                          }}
                        >
                          Mark Received
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-navy">Items</h4>
                      <div className="space-y-1.5">
                        {batch.items.slice(0, 3).map((item, index) => {
                          const product = products.find((p) => p.id === item.productId)
                          const context = createBatchTrackingContext(batch.id, batch.batchNumber, batch.items, product)
                          const sold = getSoldQuantityForBatchItem(sales, item.productId, context)
                          const remaining = getBatchItemRemaining(sales, item.productId, item.quantity, context)

                          return (
                            <div
                              key={index}
                              className="rounded-md border border-border bg-muted/40 px-2.5 py-2 text-xs"
                            >
                              <div className="flex justify-between gap-2 font-medium text-navy">
                                <span className="truncate">{item.productName}</span>
                                <span className="shrink-0 tabular-nums">×{item.quantity}</span>
                              </div>
                              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                <span>{sold} sold</span>
                                <span>{remaining} in stock</span>
                              </div>
                            </div>
                          )
                        })}
                        {batch.items.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{batch.items.length - 3} more items</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[9, 18, 27]}
          />
        </CardContent>
      </Card>

      {/* Batch Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open)
        if (!open) setSelectedBatch(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>Item list and quantities</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedBatch ? (
              <div>
                <div className="mb-2">
                  <h3 className="font-semibold">{selectedBatch.batchNumber} — {suppliers.find((s) => s.id === selectedBatch.supplier)?.name || selectedBatch.supplier}</h3>
                  <div className="text-sm text-muted-foreground">Arrival: {formatNepaliDateForTable(selectedBatch.arrivalDate)}</div>
                  {selectedBatch?.billUrl && (
                    <div className="mb-4">
                      <img
                        src={selectedBatch.billUrl}
                        alt="Batch Bill"
                        className="max-h-72 rounded border"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedBatch.items.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId)
                    const context = createBatchTrackingContext(
                      selectedBatch.id,
                      selectedBatch.batchNumber,
                      selectedBatch.items,
                      product,
                    )
                    const sold = getSoldQuantityForBatchItem(sales, item.productId, context)
                    const remaining = getBatchItemRemaining(sales, item.productId, item.quantity, context)

                    return (
                      <div key={idx} className="flex items-center space-x-4 rounded-lg border border-border bg-muted/40 p-3">
                        <div className="flex-1">
                          <div className="font-medium text-navy">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Original Qty: {item.quantity} • Unit Cost: Rs {item.unitCost}
                          </div>
                          <div className="mt-1.5 flex gap-2">
                            <Badge variant="outline" className="border-border bg-card capitalize">
                              {sold} sold
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {remaining} in stock
                            </Badge>
                          </div>
                          <div className="space-y-1 mt-2">
                            {item.manufactureDate && (
                              <div className="text-xs text-muted-foreground">
                                Manufactured: {formatNepaliDateForTable(item.manufactureDate)}
                              </div>
                            )}

                            {item.expiryDate && (
                              <div className="text-xs text-muted-foreground">
                                Expiry: {formatNepaliDateForTable(item.expiryDate)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">Total: Rs {(item.quantity * item.unitCost).toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>

                {(() => {
                  const soldItems = getSoldItemsForBatch(
                    sales,
                    selectedBatch.id,
                    selectedBatch.batchNumber,
                    selectedBatch.items,
                    products,
                  )
                  if (soldItems.length === 0) return null

                  return (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-semibold mb-3">Sold Items</h4>
                      <div className="space-y-2">
                        {soldItems.map((entry, index) => (
                          <div
                            key={`${entry.saleId}-${entry.productId}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm"
                          >
                            <div>
                              <div className="font-medium text-navy">{entry.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                {entry.quantitySold} units · Client: {entry.client}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatNepaliDateForTable(entry.saleDate)}
                              </div>
                            </div>
                            <div className="text-sm font-semibold tabular-nums text-navy">
                              Rs {(entry.quantitySold * entry.salePrice).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div>No batch selected</div>
            )}
            {selectedBatch && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedBatch)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Batch
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteBatchDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        batch={deletingBatch}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false)
          setDeletingBatch(null)
        }}
      />

      {filteredBatches.length === 0 && (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-normal italic text-muted-foreground">No batches found</p>
        </div>
      )}
    </div>
  )
}
