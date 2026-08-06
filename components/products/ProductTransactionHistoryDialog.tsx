"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Product, Purchase, Sale } from "@/contexts/InventoryContext"
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils"
import DataPagination from "@/components/ui/data-pagination"
import { usePagination } from "@/hooks/usePagination"
import {
  computeTransactionStats,
  filterPurchasesByProducts,
  filterSalesByProducts,
  itemMatchesAnyProduct,
} from "./productHistoryUtils"
import TransactionStatsGrid from "./TransactionStatsGrid"

interface ProductTransactionHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  products: Product[]
  sales: Sale[]
  purchases: Purchase[]
  onClientClick: (client: string) => void
  onSupplierClick: (supplier: string) => void
  onViewProduct: (product: Product) => void
}

export default function ProductTransactionHistoryDialog({
  isOpen,
  onOpenChange,
  product,
  products,
  sales,
  purchases,
  onClientClick,
  onSupplierClick,
  onViewProduct,
}: ProductTransactionHistoryDialogProps) {
  if (!product) return null

  // Match all weight variants with the same product name (sales store productId/productName, not category).
  const relatedProducts = products
    .filter((p) => p.name.trim().toLowerCase() === product.name.trim().toLowerCase())
    .map((p) => ({ id: p.id, name: p.name }))
  const productRefs =
    relatedProducts.length > 0 ? relatedProducts : [{ id: product.id, name: product.name }]

  const productSales = filterSalesByProducts(sales, productRefs, null)
  const productPurchases = filterPurchasesByProducts(purchases, productRefs, null)
  const matchesProduct = (item: { productId?: string; productName?: string }) =>
    itemMatchesAnyProduct(item, productRefs)

  const stats = computeTransactionStats(
    productSales,
    productPurchases,
    matchesProduct,
    matchesProduct,
  )

  const sortedSales = [...productSales].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
  )
  const sortedPurchases = [...productPurchases].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
  )

  const saleRows = sortedSales.flatMap((sale) =>
    (sale.items || [])
      .filter(matchesProduct)
      .map((item, index) => ({
        key: `${sale.id}-${index}`,
        date: sale.saleDate,
        party: sale.client,
        partyType: "client" as const,
        quantity: item.quantitySold,
        unitPrice: item.salePrice || 0,
        total: (item.quantitySold || 0) * (item.salePrice || 0),
      })),
  )

  const purchaseRows = sortedPurchases.flatMap((purchase) =>
    (purchase.items || [])
      .filter(matchesProduct)
      .map((item, index) => ({
        key: `${purchase.id}-${index}`,
        date: purchase.purchaseDate,
        party: purchase.supplier,
        partyType: "supplier" as const,
        quantity: item.quantityPurchased,
        unitPrice: item.purchasePrice || 0,
        total: (item.quantityPurchased || 0) * (item.purchasePrice || 0),
      })),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto border-border p-4 sm:p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span>Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sales and purchases for{" "}
            <span className="font-semibold text-navy">{product.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Product Summary</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Product Name</Label>
                <p className="text-navy text-sm font-medium">{product.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Current Stock</Label>
                <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">{product.stockQuantity} units</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Unit Price</Label>
                <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">Rs {product.unitPrice.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Total Value</Label>
                <p className="text-lg font-semibold tracking-tight tabular-nums text-navy">
                  Rs {(product.stockQuantity * product.unitPrice).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <TransactionStatsGrid stats={stats} yearLabel="All Time" />

          <TransactionTable
            title={`Sales Transactions (${saleRows.length})`}
            dotColor="bg-green-500"
            partyLabel="Client"
            emptyMessage="No sales transactions found for this product"
            rows={saleRows}
            onPartyClick={(party, type) => {
              if (type === "client") onClientClick(party)
            }}
            totalColorClass="text-navy"
          />

          <TransactionTable
            title={`Purchase Transactions (${purchaseRows.length})`}
            dotColor="bg-blue-500"
            partyLabel="Supplier"
            emptyMessage="No purchase transactions found for this product"
            rows={purchaseRows}
            onPartyClick={(party, type) => {
              if (type === "supplier") onSupplierClick(party)
            }}
            totalColorClass="text-navy"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button type="button" variant="neutralOutline" onClick={() => onOpenChange(false)} className="px-6 py-2">
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false)
              onViewProduct(product)
            }}
            className="px-6 py-2"
          >
            View Product Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type TransactionRow = {
  key: string
  date: string
  party: string
  partyType: "client" | "supplier"
  quantity?: number
  unitPrice: number
  total: number
}

function TransactionTable({
  title,
  dotColor,
  partyLabel,
  emptyMessage,
  rows,
  onPartyClick,
  totalColorClass,
}: {
  title: string
  dotColor: string
  partyLabel: string
  emptyMessage: string
  rows: TransactionRow[]
  onPartyClick: (party: string, type: "client" | "supplier") => void
  totalColorClass: string
}) {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startItem,
    endItem,
  } = usePagination(rows, { pageSize: 10, resetKey: rows.length })

  return (
    <div className="bg-muted rounded-xl p-4">
      <h3 className="form-section-title">
        <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
        <span>{title}</span>
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Date</TableHead>
              <TableHead>{partyLabel}</TableHead>
              <TableHead>Item No.</TableHead>
              <TableHead>Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((row) => (
                <TableRow key={row.key} className="hover:bg-muted/60">
                  <TableCell className="text-navy">
                    {formatNepaliDateForTable(row.date)}
                  </TableCell>
                  <TableCell className="font-medium text-navy">
                    <span
                      className="cursor-pointer font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                      onClick={() => onPartyClick(row.party, row.partyType)}
                    >
                      {toTitleCase(row.party)}
                    </span>
                  </TableCell>
                  <TableCell className="text-navy">{row.quantity ?? 0}</TableCell>
                  <TableCell className={`font-semibold ${totalColorClass}`}>
                    Rs {row.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm font-normal italic text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        className="px-0"
      />
    </div>
  )
}
