import type { Product } from "@/contexts/InventoryContext"
import type { ProductGroup } from "./types"

export function filterProducts(
  products: Product[],
  searchTerm: string,
  categoryFilter: string,
): Product[] {
  const search = searchTerm.toLowerCase()

  return products.filter((product) => {
    const matchesSearch =
      (product.name ?? "").toLowerCase().includes(search) ||
      (product.hsCode ?? "").toLowerCase().includes(search)
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
      hsCode: variants[0].hsCode,
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
