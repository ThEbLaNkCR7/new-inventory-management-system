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
import { useInventory } from "@/contexts/InventoryContext"
import { Calendar, CheckCircle, Package, Plus, Search, Trash2, Truck, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { formatNepaliDateForTable } from '../../lib/nepaliDateUtils'
import { MaterialDatePicker } from "../ui/MaterialDatePicker"

export default function BatchesPage() {
  const { batches, addBatch, updateBatchStatus } = useBatch()
  const { products, suppliers, refreshData } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
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

  const filteredBatches = batches.filter(
    (batch) =>
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const resetForm = () => {
    setFormData({
      batchNumber: "",
      supplier: "",
      arrivalDate: new Date().toISOString().split("T")[0],
      billUrl,
      status: "pending",
    })
    setBatchItems([])
  }

  const addBatchItem = () => {
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
      if (!item.productId) {
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

      const totalItems = batchItems.reduce((sum, item) => sum + item.quantity, 0)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "received":
        return "bg-green-100 text-green-800"
      case "processed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8 p-6 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Processing Batch...</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Step {Math.ceil((progress / 100) * totalSteps)} of {totalSteps}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 mb-4">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">
            Batches
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Track and manage product batches and lot numbers</p>
        </div>
        <div className="absolute top-6 right-0 flex space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                variant="neutral"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                      value={formData.supplier}
                      onValueChange={(value) => setFormData({ ...formData, supplier: value })}
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

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Batch Items</h3>
                    <Button type="button" onClick={addBatchItem} variant="neutralOutline" size="sm">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {batchItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateBatchItem(index, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (Stock: {product.stockQuantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => {
                            const value = e.target.value
                            updateBatchItem(index, "quantity", value === "" ? 0 : Number.parseInt(value))
                          }}
                          placeholder="Enter the quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Cost (Rs)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unitCost === 0 ? "" : item.unitCost}
                          onChange={(e) => {
                            const value = e.target.value
                            updateBatchItem(index, "unitCost", value === "" ? 0 : Number.parseFloat(value))
                          }}
                          placeholder="Enter the unit cost in Rs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Manufacture Date</Label>

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
                        <Label>Expiry Date</Label>

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
                      <div className="flex items-end">
                        <Button type="button" onClick={() => removeBatchItem(index)} variant="neutralOutline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {batchItems.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No items added yet. Click "Add Item" to start.</p>
                    </div>
                  )}
                </div>

                {batchItems.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Batch Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Items:</span>{" "}
                        <span className="font-medium">{batchItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Value:</span>{" "}
                        <span className="font-medium">
                          Rs {batchItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                      className="text-blue-600 text-sm underline"
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
        </div>
      </div>

      {/* Search */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 border-2 focus:border-slate-500 transition-colors h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => (
          <Card
            key={batch.id}
            onClick={() => {
              setSelectedBatch(batch)
              setIsDetailOpen(true)
            }}
            className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{batch.batchNumber}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Truck className="h-4 w-4 mr-1" />
                    {suppliers.find((s) => s.id === batch.supplier)?.name || batch.supplier}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{formatNepaliDateForTable(batch.arrivalDate)}</span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{batch.totalItems} items</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium text-green-600">Rs {batch.totalValue.toLocaleString()}</span>
                </div>
                {batch.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateBatchStatus(batch.id, "received")
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark Received
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Items:</h4>
                <div className="space-y-1">
                  {batch.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 flex justify-between">
                      <span>{item.productName}</span>
                      <span>×{item.quantity}</span>
                    </div>
                  ))}
                  {batch.items.length > 3 && (
                    <div className="text-xs text-gray-500">+{batch.items.length - 3} more items</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                    const imgSrc = (product && ((product as any).image || (product as any).imageUrl)) || "/placeholder.jpg"
                    return (
                      <div key={idx} className="flex items-center space-x-4 p-3 rounded-lg border">
                        {/* <img src={imgSrc} alt={item.productName} className="h-16 w-16 object-cover rounded" /> */}
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">Quantity: {item.quantity} • Unit Cost: Rs {item.unitCost}</div>
                          <div className="space-y-1">
                            {item.manufactureDate && (
                              <div className="text-xs text-gray-400">
                                Manufactured: {formatNepaliDateForTable(item.manufactureDate)}
                              </div>
                            )}

                            {item.expiryDate && (
                              <div className="text-xs text-gray-400">
                                Expiry: {formatNepaliDateForTable(item.expiryDate)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">Total: Rs {(item.quantity * item.unitCost).toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div>No batch selected</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No batches found</p>
        </div>
      )}
    </div>
  )
}
