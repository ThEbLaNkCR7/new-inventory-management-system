"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import type { Product, Supplier } from "@/contexts/InventoryContext"
import { useInventory } from "@/contexts/InventoryContext"
import { useProductChange } from "@/hooks/useProductChange"
import { Clock, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type QuickAddProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductCreated: (product: Product) => void
  defaultSupplier?: string
  defaultUnitPrice?: number
}

const initialFormData = {
  name: "",
  hsCode: "",
  description: "",
  category: "",
  stockQuantity: 0,
  unitPrice: 0,
  netWeight: 0,
  supplier: "",
  stockType: "new" as "new" | "old",
  lowStockThreshold: 5,
}

export default function QuickAddProductDialog({
  open,
  onOpenChange,
  onProductCreated,
  defaultSupplier = "",
  defaultUnitPrice = 0,
}: QuickAddProductDialogProps) {
  const { user } = useAuth()
  const { products, suppliers, addProduct } = useInventory()
  const { requestProductChange } = useProductChange()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    ...initialFormData,
    supplier: defaultSupplier,
    unitPrice: defaultUnitPrice,
  })
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [customNetWeight, setCustomNetWeight] = useState(0)
  const [approvalReason, setApprovalReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  )

  const uniqueNetWeights = useMemo(() => {
    const weights = products
      .map((p) => p.netWeight)
      .filter((w): w is number => typeof w === "number" && !isNaN(w))
    return Array.from(new Set(weights)).sort((a, b) => a - b)
  }, [products])

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      supplier: defaultSupplier,
      unitPrice: defaultUnitPrice,
    })
    setIsAddingNewCategory(false)
    setNewCategoryName("")
    setCustomNetWeight(0)
    setApprovalReason("")
  }

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormData,
        supplier: defaultSupplier,
        unitPrice: defaultUnitPrice,
      })
      setIsAddingNewCategory(false)
      setNewCategoryName("")
      setCustomNetWeight(0)
      setApprovalReason("")
    }
  }, [open, defaultSupplier, defaultUnitPrice])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const handleCategoryChange = (value: string) => {
    if (value === "__new__") {
      setIsAddingNewCategory(true)
      setFormData((prev) => ({ ...prev, category: "" }))
    } else {
      setIsAddingNewCategory(false)
      setNewCategoryName("")
      setFormData((prev) => ({ ...prev, category: value }))
    }
  }

  const handleNetWeightChange = (value: string) => {
    if (value === "custom") {
      setFormData((prev) => ({ ...prev, netWeight: customNetWeight }))
    } else {
      setFormData((prev) => ({ ...prev, netWeight: Number(value) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      category: isAddingNewCategory ? newCategoryName : formData.category,
    }

    if (!submitData.name.trim()) {
      toast({ title: "Error", description: "Product name is required.", variant: "destructive" })
      return
    }
    if (!submitData.supplier.trim()) {
      toast({ title: "Error", description: "Supplier is required.", variant: "destructive" })
      return
    }
    if (!submitData.category.trim()) {
      toast({ title: "Error", description: "Category is required.", variant: "destructive" })
      return
    }
    if (user?.role !== "admin" && !approvalReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for this request.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      if (user?.role === "admin") {
        const newProduct = await addProduct(submitData)
        toast({ title: "Success", description: "Product added successfully!" })
        onProductCreated(newProduct)
        handleOpenChange(false)
      } else {
        requestProductChange("create", submitData, undefined, approvalReason)
        toast({
          title: "Submitted",
          description: "Product submitted for admin approval. Select it once approved.",
        })
        handleOpenChange(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add product."
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product and use it in this purchase
            {user?.role !== "admin" && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center text-amber-800 dark:text-amber-200">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Changes require admin approval</span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-product-name">Product Name *</Label>
              <Input
                id="quick-product-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-hsCode">HS Code</Label>
              <Input
                id="quick-hsCode"
                value={formData.hsCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, hsCode: e.target.value }))}
                placeholder="Enter HS code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-category">Category *</Label>
            {isAddingNewCategory && (
              <Input
                id="quick-category-new"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                required
              />
            )}
            <Select
              value={isAddingNewCategory ? "__new__" : formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="quick-category">
                <SelectValue placeholder="Select or add category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">Add new category...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-supplier">Supplier *</Label>
            <Select
              value={formData.supplier}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier: value }))}
            >
              <SelectTrigger id="quick-supplier">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: Supplier) => (
                  <SelectItem key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-stockType">Stock Type</Label>
            <Select
              value={formData.stockType}
              onValueChange={(value: "new" | "old") =>
                setFormData((prev) => ({ ...prev, stockType: value }))
              }
            >
              <SelectTrigger id="quick-stockType">
                <SelectValue placeholder="Select stock type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Stock</SelectItem>
                <SelectItem value="old">Old Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-stock">Stock Quantity</Label>
              <Input
                id="quick-stock"
                type="number"
                min="0"
                step="any"
                value={formData.stockQuantity === 0 ? "" : formData.stockQuantity}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    stockQuantity: value === "" ? 0 : Number(value),
                  }))
                }}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-price">Unit Price (Rs)</Label>
              <Input
                id="quick-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice === 0 ? "" : formData.unitPrice}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    unitPrice: value === "" ? 0 : Number.parseFloat(value),
                  }))
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-netWeight">Net Weight (kg)</Label>
            <Select
              value={
                uniqueNetWeights.includes(formData.netWeight)
                  ? String(formData.netWeight)
                  : "custom"
              }
              onValueChange={handleNetWeightChange}
            >
              <SelectTrigger id="quick-netWeight">
                <SelectValue placeholder="Select net weight" />
              </SelectTrigger>
              <SelectContent>
                {uniqueNetWeights.map((weight) => (
                  <SelectItem key={weight} value={String(weight)}>
                    {weight} kg
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {(!uniqueNetWeights.includes(formData.netWeight) || formData.netWeight === 0) && (
              <Input
                id="quick-netWeight-custom"
                type="number"
                min={0}
                step="any"
                value={formData.netWeight === 0 ? "" : formData.netWeight}
                onChange={(e) => {
                  const value = e.target.value
                  const num = value === "" ? 0 : Number(value)
                  setCustomNetWeight(num)
                  setFormData((prev) => ({ ...prev, netWeight: num }))
                }}
                placeholder="Enter custom net weight"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-description">Description</Label>
            <Textarea
              id="quick-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional product description"
              rows={2}
            />
          </div>

          {user?.role !== "admin" && (
            <div className="space-y-2">
              <Label htmlFor="quick-reason">Reason for Request *</Label>
              <Textarea
                id="quick-reason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Explain why this product should be added..."
                rows={3}
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="neutralOutline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {user?.role === "admin" ? "Add Product" : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
