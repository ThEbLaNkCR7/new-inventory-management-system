import type { Product } from "@/contexts/InventoryContext"

export type WeightUnit = "kg" | "liter"

export type ProductFormData = {
  name: string
  description: string
  category: string
  stockQuantity: number
  unitPrice: number
  netWeight: number
  weightUnit: WeightUnit
  supplier: string
  stockType: "new" | "old"
  lowStockThreshold: number
}

export type ProductGroup = {
  name: string
  variants: Product[]
  totalStock: number
  category: string
  supplier: string
  unitPrice: number
  latestCreatedAt: number
}

export type PendingProductAction = {
  type: "create" | "update" | "delete"
  data: Record<string, unknown>
  productId?: string
}

export const initialProductFormData: ProductFormData = {
  name: "",
  description: "",
  category: "",
  stockQuantity: 0,
  unitPrice: 0,
  netWeight: 0,
  weightUnit: "kg",
  supplier: "",
  stockType: "new",
  lowStockThreshold: 5,
}
