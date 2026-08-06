"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Supplier } from "@/contexts/InventoryContext"
import { Clock } from "lucide-react"
import type React from "react"
import ProductFormFields from "./ProductFormFields"
import type { ProductFormData, WeightUnit } from "./types"

interface EditProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: ProductFormData
  updateForm: (updates: Partial<ProductFormData>) => void
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

export default function EditProductDialog({
  isOpen,
  onOpenChange,
  formData,
  updateForm,
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
}: EditProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto border-border p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            Edit Product
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update product information
            {userRole !== "admin" && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">Changes require admin approval</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <ProductFormFields
            idPrefix="edit-"
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
              {userRole === "admin" ? "Update Product" : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
