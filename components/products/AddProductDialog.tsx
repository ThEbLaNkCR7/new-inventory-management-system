"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Supplier } from "@/contexts/InventoryContext"
import { Clock, Plus } from "lucide-react"
import type React from "react"
import ProductFormFields from "./ProductFormFields"
import type { ProductFormData, WeightUnit } from "./types"

interface AddProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: ProductFormData
  updateForm: (updates: Partial<ProductFormData>) => void
  onResetForm: () => void
  categories: string[]
  suppliers: Supplier[]
  uniqueProductNames: string[]
  uniqueNetWeights: number[]
  isAddingNewProduct: boolean
  isAddingNewCategory: boolean
  isAddingCustomNetWeight: boolean
  newCategoryName: string
  onNewCategoryNameChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSupplierChange?: (value: string) => void
  autoFilledFields: Record<string, boolean>
  onProductNameChange: (value: string) => void
  onNetWeightChange: (value: string) => void
  onCustomProductNameChange: (value: string) => void
  onCustomNetWeightChange: (value: number) => void
  onWeightUnitChange?: (unit: WeightUnit) => void
  fieldErrors?: Record<string, string>
  userRole?: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function AddProductDialog({
  isOpen,
  onOpenChange,
  formData,
  updateForm,
  onResetForm,
  categories,
  suppliers,
  uniqueProductNames,
  uniqueNetWeights,
  isAddingNewProduct,
  isAddingNewCategory,
  isAddingCustomNetWeight,
  newCategoryName,
  onNewCategoryNameChange,
  onCategoryChange,
  onSupplierChange,
  autoFilledFields,
  onProductNameChange,
  onNetWeightChange,
  onCustomProductNameChange,
  onCustomNetWeightChange,
  onWeightUnitChange,
  fieldErrors,
  userRole,
  onSubmit,
  onCancel,
}: AddProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={onResetForm}
          variant="neutral"
         
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto border-border p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            Add New Product
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter product details to add to inventory
            {userRole !== "admin" && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">Changes require admin approval</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <ProductFormFields
            formData={formData}
            updateForm={updateForm}
            categories={categories}
            suppliers={suppliers}
            uniqueProductNames={uniqueProductNames}
            uniqueNetWeights={uniqueNetWeights}
            isAddingNewProduct={isAddingNewProduct}
            isAddingNewCategory={isAddingNewCategory}
            isAddingCustomNetWeight={isAddingCustomNetWeight}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={onNewCategoryNameChange}
            onCategoryChange={onCategoryChange}
            onSupplierChange={onSupplierChange}
            autoFilledFields={autoFilledFields}
            onProductNameChange={onProductNameChange}
            onNetWeightChange={onNetWeightChange}
            onCustomProductNameChange={onCustomProductNameChange}
            onCustomNetWeightChange={onCustomNetWeightChange}
            onWeightUnitChange={onWeightUnitChange}
            showWeightUnitSelector
            fieldErrors={fieldErrors}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="neutralOutline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {userRole === "admin" ? "Add Product" : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
