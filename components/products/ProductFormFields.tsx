"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Supplier } from "@/contexts/InventoryContext"
import type { ProductFormData } from "./types"
import { useMemo } from "react"

const labelClass = "text-sm font-semibold text-gray-700 dark:text-gray-300"
const inputClass =
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
const selectTriggerClass = inputClass

interface ProductFormFieldsProps {
  idPrefix?: string
  variant?: "default" | "quick"
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
  onSupplierChange?: (value: string) => void
  autoFilledFields: Record<string, boolean>
  onProductNameChange: (value: string) => void
  onNetWeightChange: (value: string) => void
  onCustomProductNameChange: (value: string) => void
  onCustomNetWeightChange: (value: number) => void
}

export default function ProductFormFields({
  idPrefix = "",
  variant = "default",
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
  onSupplierChange,
  autoFilledFields,
  onProductNameChange,
  onNetWeightChange,
  onCustomProductNameChange,
  onCustomNetWeightChange,
}: ProductFormFieldsProps) {
  const fieldId = (name: string) => `${idPrefix}${name}`

  const selectContentClass =
    variant === "quick"
      ? "z-[110] dark:bg-gray-800 dark:border-gray-700"
      : "dark:bg-gray-800 dark:border-gray-700"

  const supplierOptions = useMemo(() => {
    if (!formData.supplier) return suppliers
    const exists = suppliers.some((supplier) => supplier.name === formData.supplier)
    if (exists) return suppliers
    return [
      ...suppliers,
      { id: `pending-${formData.supplier}`, name: formData.supplier } as Supplier,
    ]
  }, [suppliers, formData.supplier])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={fieldId("productName")} className={labelClass}>
          Product Name *
        </Label>
        {variant === "quick" ? (
          <Input
            id={fieldId("productName")}
            type="text"
            value={formData.name}
            onChange={(e) => onCustomProductNameChange(e.target.value)}
            placeholder="Enter product name"
            className={inputClass}
            required
          />
        ) : (
          <>
            <Select
              value={isAddingNewProduct ? "__new__" : formData.name}
              onValueChange={onProductNameChange}
            >
              <SelectTrigger id={fieldId("productName")} className={selectTriggerClass}>
                <SelectValue placeholder="Select product name" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {uniqueProductNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">Add new product...</SelectItem>
              </SelectContent>
            </Select>
            {isAddingNewProduct && (
              <Input
                id={fieldId("productName-new")}
                type="text"
                value={formData.name}
                onChange={(e) => onCustomProductNameChange(e.target.value)}
                placeholder="Enter new product name"
                className={inputClass}
                required
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldId("category")} className={labelClass}>
            Category *
          </Label>
          {autoFilledFields.category && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
            >
              Auto-filled
            </Badge>
          )}
        </div>
        <Select
          value={isAddingNewCategory ? "__new__" : formData.category}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger id={fieldId("category")} className={selectTriggerClass}>
            <SelectValue placeholder="Select or add category" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
            <SelectItem value="__new__">Add new category...</SelectItem>
          </SelectContent>
        </Select>
        {isAddingNewCategory && (
          <Input
            id={fieldId("category-new")}
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder="Enter new category name"
            className={inputClass}
            required
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={fieldId("supplier")} className={labelClass}>
              Supplier *
            </Label>
            {autoFilledFields.supplier && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              >
                Auto-filled
              </Badge>
            )}
          </div>
          <Select
            value={formData.supplier || undefined}
            onValueChange={(value) => {
              if (onSupplierChange) {
                onSupplierChange(value)
              } else {
                updateForm({ supplier: value })
              }
            }}
          >
            <SelectTrigger id={fieldId("supplier")} className={selectTriggerClass}>
              <SelectValue placeholder="Select a supplier" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {supplierOptions.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </SelectItem>
              ))}
              <SelectItem value="__new__">Add new supplier...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("stockType")} className={labelClass}>
            Stock Type
          </Label>
          <Select
            value={formData.stockType}
            onValueChange={(value: "new" | "old") => updateForm({ stockType: value })}
          >
            <SelectTrigger id={fieldId("stockType")} className={selectTriggerClass}>
              <SelectValue placeholder="Select stock type" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="new">New Stock</SelectItem>
              <SelectItem value="old">Old Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={fieldId("stock")} className={labelClass}>
            Stock Quantity *
          </Label>
          <Input
            id={fieldId("stock")}
            type="number"
            min="0"
            step="any"
            value={formData.stockQuantity === 0 ? "" : formData.stockQuantity}
            onChange={(e) => {
              const value = e.target.value
              updateForm({ stockQuantity: value === "" ? 0 : Number(value) })
            }}
            required
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("price")} className={labelClass}>
            Unit Price (Rs) *
          </Label>
          <Input
            id={fieldId("price")}
            type="number"
            step="0.01"
            min="0"
            value={formData.unitPrice === 0 ? "" : formData.unitPrice}
            onChange={(e) => {
              const value = e.target.value
              updateForm({ unitPrice: value === "" ? 0 : Number.parseFloat(value) })
            }}
            placeholder="0.00"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("netWeight")} className={labelClass}>
          Net Weight (kg)
        </Label>
        <Select
          value={
            isAddingCustomNetWeight
              ? "__new__"
              : uniqueNetWeights.includes(formData.netWeight)
                ? String(formData.netWeight)
                : ""
          }
          onValueChange={onNetWeightChange}
        >
          <SelectTrigger id={fieldId("netWeight")} className={selectTriggerClass}>
            <SelectValue placeholder="Select net weight" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {uniqueNetWeights.map((weight) => (
              <SelectItem key={weight} value={String(weight)}>
                {weight} kg
              </SelectItem>
            ))}
            <SelectItem value="__new__">Add new weight...</SelectItem>
          </SelectContent>
        </Select>
        {isAddingCustomNetWeight && (
          <Input
            id={fieldId("netWeight-new")}
            type="number"
            min={0}
            step="any"
            value={formData.netWeight === 0 ? "" : formData.netWeight}
            onChange={(e) => {
              const value = e.target.value
              const num = value === "" ? 0 : Number(value)
              onCustomNetWeightChange(num)
            }}
            placeholder="Enter new net weight"
            className={inputClass}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("description")} className={labelClass}>
          Description
        </Label>
        <Textarea
          id={fieldId("description")}
          value={formData.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder="Optional product description"
          rows={2}
          className={inputClass}
        />
      </div>
    </div>
  )
}
