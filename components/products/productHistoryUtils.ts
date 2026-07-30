import type { Product, Purchase, PurchaseItem, Sale, SaleItem } from "@/contexts/InventoryContext"
import { getCurrentNepaliYear, getNepaliYear } from "@/lib/utils"

export function getCurrentYear() {
  return getCurrentNepaliYear()
}

type ProductRef = Pick<Product, "id" | "name">
type LineItem = {
  productId?: string | { _id?: string } | null
  productName?: string | null
}

function normalizeId(value: LineItem["productId"]): string {
  if (value == null) return ""
  if (typeof value === "object") return String(value._id || "")
  return String(value)
}

function normalizeName(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase()
}

/** Sales/purchases have no category — match via product id or name on line items. */
export function itemMatchesProduct(item: LineItem, product: ProductRef) {
  const itemProductId = normalizeId(item.productId)
  const itemName = normalizeName(item.productName)
  const productId = normalizeId(product.id)
  const productName = normalizeName(product.name)

  return (
    (itemProductId !== "" && (itemProductId === productId || itemProductId === product.name)) ||
    (itemName !== "" && itemName === productName) ||
    (itemProductId !== "" && normalizeName(itemProductId) === productName)
  )
}

export function itemMatchesAnyProduct(item: LineItem, products: ProductRef[]) {
  return products.some((product) => itemMatchesProduct(item, product))
}

export function filterSalesByProductName(sales: Sale[], productName: string, year?: number | null) {
  return filterSalesByProduct(sales, { id: "", name: productName }, year)
}

export function filterPurchasesByProductName(purchases: Purchase[], productName: string, year?: number | null) {
  return filterPurchasesByProduct(purchases, { id: "", name: productName }, year)
}

function matchesYear(date: string | Date | undefined, year?: number | null) {
  if (year == null) return true
  if (!date) return false
  try {
    return getNepaliYear(date) === year
  } catch {
    return false
  }
}

export function filterSalesByProduct(sales: Sale[], product: ProductRef, year?: number | null) {
  return sales.filter(
    (sale) =>
      (sale.items || []).some((item) => itemMatchesProduct(item, product)) &&
      matchesYear(sale.saleDate, year),
  )
}

export function filterPurchasesByProduct(purchases: Purchase[], product: ProductRef, year?: number | null) {
  return purchases.filter(
    (purchase) =>
      (purchase.items || []).some((item) => itemMatchesProduct(item, product)) &&
      matchesYear(purchase.purchaseDate, year),
  )
}

export function filterSalesByProductNames(sales: Sale[], productNames: string[], year?: number | null) {
  const products = productNames.map((name) => ({ id: "", name }))
  return filterSalesByProducts(sales, products, year)
}

export function filterPurchasesByProductNames(
  purchases: Purchase[],
  productNames: string[],
  year?: number | null,
) {
  const products = productNames.map((name) => ({ id: "", name }))
  return filterPurchasesByProducts(purchases, products, year)
}

export function filterSalesByProducts(sales: Sale[], products: ProductRef[], year?: number | null) {
  return sales.filter(
    (sale) =>
      (sale.items || []).some((item) => itemMatchesAnyProduct(item, products)) &&
      matchesYear(sale.saleDate, year),
  )
}

export function filterPurchasesByProducts(
  purchases: Purchase[],
  products: ProductRef[],
  year?: number | null,
) {
  return purchases.filter(
    (purchase) =>
      (purchase.items || []).some((item) => itemMatchesAnyProduct(item, products)) &&
      matchesYear(purchase.purchaseDate, year),
  )
}

export function filterSalesByClient(sales: Sale[], clientName: string, year?: number | null) {
  return sales.filter(
    (sale) => sale.client === clientName && matchesYear(sale.saleDate, year),
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
  const target = normalizeName(category)
  return products.filter((p) => normalizeName(p.category) === target)
}

export function normalizeSaleItems(items: SaleItem[] = []): SaleItem[] {
  return items.map((item: any) => ({
    ...item,
    productId: normalizeId(item.productId),
    productName: item.productName || "",
  }))
}

export function normalizePurchaseItems(items: PurchaseItem[] = []): PurchaseItem[] {
  return items.map((item: any) => ({
    ...item,
    productId: normalizeId(item.productId),
    productName: item.productName || "",
  }))
}
