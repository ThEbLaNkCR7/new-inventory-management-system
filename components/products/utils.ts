import type { Product } from "@/contexts/InventoryContext"
import type { ProductFormData, ProductGroup, WeightUnit } from "./types"

export function getWeightUnitLabel(unit?: WeightUnit | string): string {
  const normalized = String(unit || "kg").toLowerCase()
  if (normalized === "liter" || normalized === "l" || normalized === "litre") return "Liter"
  return "kg"
}

export function normalizeWeightUnit(unit?: WeightUnit | string): WeightUnit {
  const normalized = String(unit || "kg").toLowerCase()
  if (normalized === "liter" || normalized === "l" || normalized === "litre") return "liter"
  return "kg"
}

export function formatNetWeight(
  netWeight?: number | null,
  weightUnit?: WeightUnit,
): string {
  if (netWeight == null || Number.isNaN(netWeight)) {
    return "-"
  }
  return `${netWeight} ${getWeightUnitLabel(weightUnit)}`
}

export function formatProductNetWeight(product: Pick<Product, "netWeight" | "weightUnit">): string {
  return formatNetWeight(product.netWeight, normalizeWeightUnit(product.weightUnit))
}

export type ProductFormValidationOptions = {
  category?: string
  variant?: "default" | "quick"
  isAddingNewProduct?: boolean
  isAddingNewCategory?: boolean
  isAddingCustomNetWeight?: boolean
}

export function validateProductFormData(
  data: ProductFormData,
  options: ProductFormValidationOptions = {},
): Record<string, string> {
  const errors: Record<string, string> = {}
  const variant = options.variant ?? "default"
  const isAddingNewProduct = options.isAddingNewProduct ?? false
  const isAddingNewCategory = options.isAddingNewCategory ?? false
  const isAddingCustomNetWeight = options.isAddingCustomNetWeight ?? false
  const category = options.category ?? data.category
  const weightUnitLabel = getWeightUnitLabel(data.weightUnit)

  if (variant === "quick" || isAddingNewProduct) {
    if (!data.name?.trim()) {
      errors.name = "Product name is required"
    }
  } else if (!data.name?.trim()) {
    errors.name = "Please select a product name from the dropdown"
  }

  if (isAddingNewCategory) {
    if (!category?.trim()) {
      errors.category = "Please enter a new category name"
    }
  } else if (!category?.trim()) {
    errors.category = "Please select a category from the dropdown"
  }

  if (!data.supplier?.trim()) {
    errors.supplier = "Please select a supplier from the dropdown"
  }

  if (!data.weightUnit) {
    errors.weightUnit = "Please select a weight unit from the dropdown"
  }

  if (isAddingCustomNetWeight) {
    if (!data.netWeight || data.netWeight <= 0 || Number.isNaN(data.netWeight)) {
      errors.netWeight = `Please enter net weight (${weightUnitLabel})`
    }
  } else if (!data.netWeight || data.netWeight <= 0 || Number.isNaN(data.netWeight)) {
    errors.netWeight = `Please select net weight (${weightUnitLabel}) from the dropdown`
  }

  if (
    data.unitPrice === undefined ||
    data.unitPrice === null ||
    data.unitPrice <= 0 ||
    Number.isNaN(data.unitPrice)
  ) {
    errors.unitPrice = "Unit price is required"
  }

  if (
    data.stockQuantity === undefined ||
    data.stockQuantity === null ||
    data.stockQuantity < 0 ||
    Number.isNaN(data.stockQuantity)
  ) {
    errors.stockQuantity = "Stock quantity is required"
  }

  return errors
}

export function filterProducts(
  products: Product[],
  searchTerm: string,
  categoryFilter: string,
): Product[] {
  const search = searchTerm.toLowerCase()

  return products.filter((product) => {
    const matchesSearch = (product.name ?? "").toLowerCase().includes(search)
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })
}

export function groupProductsByName(filteredProducts: Product[]): ProductGroup[] {
  const groups: Record<string, Product[]> = {}

  filteredProducts.forEach((product) => {
    if (!groups[product.name]) {
      groups[product.name] = []
    }
    groups[product.name].push(product)
  })

  return Object.entries(groups)
    .map(([name, variants]) => ({
      name,
      variants: variants.sort((a, b) => (a.netWeight || 0) - (b.netWeight || 0)),
      totalStock: variants.reduce((sum, p) => sum + p.stockQuantity, 0),
      category: variants[0].category,
      supplier: variants[0].supplier,
      unitPrice: variants[0].unitPrice,
      latestCreatedAt: Math.max(
        ...variants.map((v) => new Date(v.createdAt || 0).getTime()),
      ),
    }))
    .sort((a, b) => b.latestCreatedAt - a.latestCreatedAt)
}

export function exportAllProductsToCSV(products: Product[]): void {
  const headers = [
    "Product Name",
    "Category",
    "Stock",
    "Unit Price",
    "Total Value",
    "Supplier",
  ]

  const rows = products.map((p) => [
    p.name,
    p.category,
    p.stockQuantity,
    p.unitPrice,
    p.stockQuantity * p.unitPrice,
    p.supplier,
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "all_products.csv"
  link.click()

  URL.revokeObjectURL(url)
}
