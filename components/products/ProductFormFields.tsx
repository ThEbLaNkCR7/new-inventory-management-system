"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Product, Supplier } from "@/contexts/InventoryContext"
import type { ProductFormData } from "./types"

interface ProductFormFieldsProps {
  idPrefix?: string
  formData: ProductFormData
  updateForm: (updates: Partial<ProductFormData>) => void
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
}

export default function ProductFormFields({
  idPrefix = "",
  formData,
  updateForm,
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
}: ProductFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}productName`}>Product Name</Label>
          <Select
            value={uniqueProductNames.includes(formData.name) ? formData.name : "custom"}
            onValueChange={onProductNameChange}
          >
            <SelectTrigger id={`${idPrefix}productName`}>
              <SelectValue placeholder="Select product name" />
            </SelectTrigger>
            <SelectContent>
              {uniqueProductNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {(!uniqueProductNames.includes(formData.name) || formData.name === "") && (
            <Input
              id={`${idPrefix}productName-custom`}
              type="text"
              value={formData.name}
              onChange={(e) => onCustomProductNameChange(e.target.value)}
              placeholder="Enter custom product name"
            />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${idPrefix}hsCode`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              HS Code
            </Label>
            {autoFilledFields.hsCode && (
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                Auto-filled
              </Badge>
            )}
          </div>
          <Input
            id={`${idPrefix}hsCode`}
            value={formData.hsCode}
            onChange={(e) => updateForm({ hsCode: e.target.value })}
            className={`border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 ${autoFilledFields.hsCode ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10" : ""}`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}category`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Category
          </Label>
          {autoFilledFields.category && (
            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              Auto-filled
            </Badge>
          )}
        </div>
        {isAddingNewCategory && (
          <Input
            id={`${idPrefix}category-new`}
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder="Enter new category name"
            className="border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          />
        )}
        <Select
          value={isAddingNewCategory ? "__new__" : formData.category}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger className="border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <SelectValue placeholder="Select or add category" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
            <SelectItem value="__new__">Add new category...</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${idPrefix}supplier`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Supplier
            </Label>
            {autoFilledFields.supplier && (
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                Auto-filled
              </Badge>
            )}
          </div>
          <Select
            value={formData.supplier}
            onValueChange={(value) => updateForm({ supplier: value })}
          >
            <SelectTrigger className="border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              <SelectValue placeholder="Select a supplier" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}stockType`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Stock Type
        </Label>
        <Select
          value={formData.stockType}
          onValueChange={(value: "new" | "old") => updateForm({ stockType: value })}
        >
          <SelectTrigger className="border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <SelectValue placeholder="Select stock type" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            <SelectItem value="new">New Stock</SelectItem>
            <SelectItem value="old">Old Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}stock`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Stock Quantity
          </Label>
          <Input
            id={`${idPrefix}stock`}
            type="number"
            min="0"
            step="any"
            value={formData.stockQuantity === 0 ? "" : formData.stockQuantity}
            onChange={(e) => {
              const value = e.target.value
              updateForm({
                stockQuantity: value === "" ? 0 : Number(value),
              })
            }}
            required
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}price`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Unit Price (Rs)
          </Label>
          <Input
            id={`${idPrefix}price`}
            type="number"
            step="0.01"
            min="0"
            value={formData.unitPrice === 0 ? "" : formData.unitPrice}
            onChange={(e) => {
              const value = e.target.value
              updateForm({
                unitPrice: value === "" ? 0 : Number.parseFloat(value),
              })
            }}
            placeholder="0.00"
            className="border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}netWeight`}>Net Weight (kg)</Label>
          <Select
            value={uniqueNetWeights.includes(formData.netWeight) ? String(formData.netWeight) : "custom"}
            onValueChange={onNetWeightChange}
          >
            <SelectTrigger id={`${idPrefix}netWeight`}>
              <SelectValue placeholder="Select net weight" />
            </SelectTrigger>
            <SelectContent>
              {uniqueNetWeights.map((weight) => (
                <SelectItem key={weight} value={String(weight)}>{weight} kg</SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {(!uniqueNetWeights.includes(formData.netWeight) || formData.netWeight === 0) && (
            <Input
              id={`${idPrefix}netWeight-custom`}
              type="number"
              min={0}
              step="any"
              value={formData.netWeight === 0 ? "" : formData.netWeight}
              onChange={(e) => {
                const value = e.target.value
                const num = value === "" ? 0 : Number(value)
                onCustomNetWeightChange(num)
              }}
              placeholder="Enter custom net weight"
            />
          )}
        </div>
      </div>
    </>
  )
}
