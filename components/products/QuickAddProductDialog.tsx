"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import type { Product } from "@/contexts/InventoryContext"
import { useInventory } from "@/contexts/InventoryContext"
import { useProductChange } from "@/hooks/useProductChange"
import { Clock, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import ProductFormFields from "./ProductFormFields"
import { initialProductFormData, type ProductFormData } from "./types"

type QuickAddProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductCreated: (product: Product) => void
  defaultSupplier?: string
  defaultUnitPrice?: number
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

  const [formData, setFormData] = useState<ProductFormData>({
    ...initialProductFormData,
    supplier: defaultSupplier,
    unitPrice: defaultUnitPrice,
  })
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [isAddingCustomNetWeight, setIsAddingCustomNetWeight] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [approvalReason, setApprovalReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  )

  const uniqueProductNames = useMemo(
    () => Array.from(new Set(products.map((p) => p.name).filter(Boolean))).sort(),
    [products],
  )

  const uniqueNetWeights = useMemo(() => {
    const weights = products
      .map((p) => p.netWeight)
      .filter((w): w is number => typeof w === "number" && !isNaN(w))
    return Array.from(new Set(weights)).sort((a, b) => a - b)
  }, [products])

  const resetForm = () => {
    setFormData({
      ...initialProductFormData,
      supplier: defaultSupplier,
      unitPrice: defaultUnitPrice,
    })
    setIsAddingNewCategory(false)
    setIsAddingCustomNetWeight(false)
    setNewCategoryName("")
    setApprovalReason("")
  }

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, defaultSupplier, defaultUnitPrice])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const updateForm = (updates: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleCategoryChange = (value: string) => {
    if (value === "__new__") {
      setIsAddingNewCategory(true)
      setNewCategoryName("")
      updateForm({ category: "" })
    } else {
      setIsAddingNewCategory(false)
      setNewCategoryName("")
      updateForm({ category: value })
    }
  }

  const handleNetWeightChange = (value: string) => {
    if (value === "__new__") {
      setIsAddingCustomNetWeight(true)
      updateForm({ netWeight: 0 })
    } else {
      setIsAddingCustomNetWeight(false)
      updateForm({ netWeight: Number(value) })
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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 sm:p-6 z-[60]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Add New Product
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductFormFields
            idPrefix="quick-"
            variant="quick"
            formData={formData}
            updateForm={updateForm}
            categories={categories}
            suppliers={suppliers}
            uniqueProductNames={uniqueProductNames}
            uniqueNetWeights={uniqueNetWeights}
            isAddingNewProduct
            isAddingNewCategory={isAddingNewCategory}
            isAddingCustomNetWeight={isAddingCustomNetWeight}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={setNewCategoryName}
            onCategoryChange={handleCategoryChange}
            autoFilledFields={{}}
            onProductNameChange={() => {}}
            onNetWeightChange={handleNetWeightChange}
            onCustomProductNameChange={(value) => updateForm({ name: value })}
            onCustomNetWeightChange={(value) => updateForm({ netWeight: value })}
          />

          {user?.role !== "admin" && (
            <div className="space-y-2">
              <Label htmlFor="quick-reason" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Reason for Request *
              </Label>
              <Textarea
                id="quick-reason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Explain why this product should be added..."
                rows={3}
                className="border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
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
