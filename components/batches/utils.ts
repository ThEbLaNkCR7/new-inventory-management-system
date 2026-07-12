import type { Sale } from "@/contexts/InventoryContext"

export function normalizeId(value: unknown): string {
  if (!value) return ""
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id)
  }
  return String(value)
}

export type BatchTrackingContext = {
  batchId: string
  batchNumber?: string
  batchProductIds: Set<string>
  productBatchId?: string
  productBatchNumber?: string
}

export function createBatchTrackingContext(
  batchId: string,
  batchNumber: string | undefined,
  batchItems: Array<{ productId: string }>,
  product?: { batchId?: string; batchNumber?: string },
): BatchTrackingContext {
  return {
    batchId,
    batchNumber,
    batchProductIds: new Set(batchItems.map((item) => normalizeId(item.productId))),
    productBatchId: product?.batchId,
    productBatchNumber: product?.batchNumber,
  }
}

function saleItemCountsForBatch(
  sale: Sale,
  productId: string,
  context: BatchTrackingContext,
): boolean {
  const normalizedProductId = normalizeId(productId)
  const normalizedBatchId = normalizeId(context.batchId)
  const saleBatchId = normalizeId(sale.batchId)

  const hasProduct = (sale.items || []).some(
    (item) => normalizeId(item.productId) === normalizedProductId,
  )
  if (!hasProduct) return false

  if (saleBatchId) {
    return (
      saleBatchId === normalizedBatchId ||
      (!!context.batchNumber && !!sale.batchNumber && sale.batchNumber === context.batchNumber)
    )
  }

  const productBatchId = normalizeId(context.productBatchId)
  if (productBatchId) {
    return productBatchId === normalizedBatchId
  }

  if (
    context.batchNumber &&
    context.productBatchNumber &&
    context.productBatchNumber === context.batchNumber
  ) {
    return true
  }

  return context.batchProductIds.has(normalizedProductId)
}

export function getSoldQuantityForBatchItem(
  sales: Sale[],
  productId: string,
  context: BatchTrackingContext,
): number {
  const normalizedProductId = normalizeId(productId)

  return sales
    .filter((sale) => saleItemCountsForBatch(sale, productId, context))
    .flatMap((sale) => sale.items || [])
    .filter((item) => normalizeId(item.productId) === normalizedProductId)
    .reduce((sum, item) => sum + (item.quantitySold || 0), 0)
}

export function getBatchItemRemaining(
  sales: Sale[],
  productId: string,
  originalQuantity: number,
  context: BatchTrackingContext,
): number {
  const sold = getSoldQuantityForBatchItem(sales, productId, context)
  return Math.max(0, originalQuantity - sold)
}

export type BatchSoldEntry = {
  saleId: string
  productId: string
  productName: string
  quantitySold: number
  salePrice: number
  client: string
  saleDate: string
}

export function getSoldItemsForBatch(
  sales: Sale[],
  batchId: string,
  batchNumber: string | undefined,
  batchItems: Array<{ productId: string }>,
  products: Array<{ id: string; batchId?: string; batchNumber?: string }>,
): BatchSoldEntry[] {
  return sales.flatMap((sale) =>
    (sale.items || [])
      .filter((item) => {
        const product = products.find((p) => normalizeId(p.id) === normalizeId(item.productId))
        const context = createBatchTrackingContext(batchId, batchNumber, batchItems, product)
        return saleItemCountsForBatch(sale, item.productId, context)
      })
      .map((item) => ({
        saleId: normalizeId(sale.id),
        productId: normalizeId(item.productId),
        productName: item.productName,
        quantitySold: item.quantitySold || 0,
        salePrice: item.salePrice || 0,
        client: sale.client,
        saleDate: sale.saleDate,
      })),
  )
}
