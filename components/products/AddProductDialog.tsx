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
import type { ProductFormData } from "./types"

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
  isAddingNewCategory: boolean
  newCategoryName: string
  onNewCategoryNameChange: (value: string) => void
  onCategoryChange: (value: string) => void
  autoFilledFields: Record<string, boolean>
  onProductNameChange: (value: string) => void
  onNetWeightChange: (value: string) => void
  onCustomProductNameChange: (value: string) => void
  onCustomNetWeightChange: (value: number) => void
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
  isAddingNewCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onCategoryChange,
  autoFilledFields,
  onProductNameChange,
  onNetWeightChange,
  onCustomProductNameChange,
  onCustomNetWeightChange,
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
          className="shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Add New Product
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Enter product details to add to inventory
            {userRole !== "admin" && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center text-amber-800 dark:text-amber-200">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Changes require admin approval</span>
                </div>
              </div>
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
            isAddingNewCategory={isAddingNewCategory}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={onNewCategoryNameChange}
            onCategoryChange={onCategoryChange}
            autoFilledFields={autoFilledFields}
            onProductNameChange={onProductNameChange}
            onNetWeightChange={onNetWeightChange}
            onCustomProductNameChange={onCustomProductNameChange}
            onCustomNetWeightChange={onCustomNetWeightChange}
          />
          <div className="flex justify-end space-x-2 pt-4">
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
