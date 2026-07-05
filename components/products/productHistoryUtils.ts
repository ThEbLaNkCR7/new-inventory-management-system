import type { Product, Purchase, Sale } from "@/contexts/InventoryContext"
import { getCurrentNepaliYear, getNepaliYear } from "@/lib/utils"

export function getCurrentYear() {
  return getCurrentNepaliYear()
}

export function filterSalesByProductName(sales: Sale[], productName: string, year = getCurrentNepaliYear()) {
  return sales.filter((sale) => {
    const itemNames = sale.items?.map((i) => i.productId) || []
    return itemNames.includes(productName) && getNepaliYear(sale.saleDate) === year
  })
}

export function filterPurchasesByProductName(purchases: Purchase[], productName: string, year = getCurrentNepaliYear()) {
  return purchases.filter((purchase) => {
    const itemNames = purchase.items?.map((i) => i.productId) || []
    return itemNames.includes(productName) && getNepaliYear(purchase.purchaseDate) === year
  })
}

export function filterSalesByProductNames(sales: Sale[], productNames: string[], year = getCurrentNepaliYear()) {
  return sales.filter((sale) => {
    const itemNames = sale.items?.map((i) => i.productId) || []
    return itemNames.some((name) => productNames.includes(name)) && getNepaliYear(sale.saleDate) === year
  })
}

export function filterPurchasesByProductNames(purchases: Purchase[], productNames: string[], year = getCurrentNepaliYear()) {
  return purchases.filter((purchase) => {
    const itemNames = purchase.items?.map((i) => i.productId) || []
    return itemNames.some((name) => productNames.includes(name)) && getNepaliYear(purchase.purchaseDate) === year
  })
}

export function filterSalesByClient(sales: Sale[], clientName: string, year = getCurrentNepaliYear()) {
  return sales.filter(
    (sale) => sale.client === clientName && getNepaliYear(sale.saleDate) === year,
  )
}

export type TransactionStats = {
  totalSalesQuantity: number
  totalSalesValue: number
  totalPurchaseQuantity: number
  totalPurchaseValue: number
  netMovement: number
  profit: number
}

export function computeTransactionStats(
  sales: Sale[],
  purchases: Purchase[],
  matchSaleItem: (item: Sale["items"][number]) => boolean,
  matchPurchaseItem: (item: Purchase["items"][number]) => boolean,
): TransactionStats {
  const totalSalesQuantity = sales.reduce(
    (sum, sale) =>
      sum +
      (sale.items || []).reduce(
        (itemSum, item) => itemSum + (matchSaleItem(item) ? item.quantitySold || 0 : 0),
        0,
      ),
    0,
  )

  const totalSalesValue = sales.reduce(
    (sum, sale) =>
      sum +
      (sale.items || []).reduce(
        (itemSum, item) =>
          itemSum +
          (matchSaleItem(item)
            ? (item.quantitySold || 0) * (item.salePrice || 0)
            : 0),
        0,
      ),
    0,
  )

  const totalPurchaseQuantity = purchases.reduce(
    (sum, purchase) =>
      sum +
      (purchase.items || []).reduce(
        (itemSum, item) =>
          itemSum + (matchPurchaseItem(item) ? item.quantityPurchased || 0 : 0),
        0,
      ),
    0,
  )

  const totalPurchaseValue = purchases.reduce(
    (sum, purchase) =>
      sum +
      (purchase.items || []).reduce(
        (itemSum, item) =>
          itemSum +
          (matchPurchaseItem(item)
            ? (item.quantityPurchased || 0) * (item.purchasePrice || 0)
            : 0),
        0,
      ),
    0,
  )

  return {
    totalSalesQuantity,
    totalSalesValue,
    totalPurchaseQuantity,
    totalPurchaseValue,
    netMovement: totalPurchaseQuantity - totalSalesQuantity,
    profit: totalSalesValue - totalPurchaseValue,
  }
}

export function getCategoryProducts(products: Product[], category: string) {
  return products.filter((p) => p.category === category)
}
