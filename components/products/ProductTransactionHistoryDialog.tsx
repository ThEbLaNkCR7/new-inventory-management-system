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
import { formatNepaliDateForTable } from "@/lib/utils"
import {
  computeTransactionStats,
  filterPurchasesByProductName,
  filterSalesByProductName,
  getCurrentYear,
} from "./productHistoryUtils"
import TransactionStatsGrid from "./TransactionStatsGrid"

interface ProductTransactionHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
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
  sales,
  purchases,
  onClientClick,
  onSupplierClick,
  onViewProduct,
}: ProductTransactionHistoryDialogProps) {
  if (!product) return null

  const currentYear = getCurrentYear()
  const productSales = filterSalesByProductName(sales, product.name, currentYear)
  const productPurchases = filterPurchasesByProductName(purchases, product.name, currentYear)
  const stats = computeTransactionStats(
    productSales,
    productPurchases,
    (item) => item.productId === product.name,
    (item) => item.productId === product.name,
  )

  const sortedSales = [...productSales].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
  )
  const sortedPurchases = [...productPurchases].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
  )

  const saleRows = sortedSales.flatMap((sale) =>
    (sale.items || [])
      .filter((item) => item.productId === product.name)
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
      .filter((item) => item.productId === product.name)
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
      <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 sm:p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span>Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Sales and purchases for{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{product.name}</span> in {new Date().getFullYear()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Product Summary</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Product Name</Label>
                <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{product.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Current Stock</Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">{product.stockQuantity} units</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Unit Price</Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">Rs {product.unitPrice.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Total Value</Label>
                <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                  Rs {(product.stockQuantity * product.unitPrice).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <TransactionStatsGrid stats={stats} year={new Date().getFullYear()} />

          <TransactionTable
            title={`Sales Transactions (${productSales.length})`}
            dotColor="bg-green-500"
            partyLabel="Client"
            emptyMessage={`No sales transactions found for this product in ${currentYear}`}
            rows={saleRows}
            onPartyClick={(party, type) => {
              if (type === "client") onClientClick(party)
            }}
            totalColorClass="text-green-600 dark:text-green-400"
          />

          <TransactionTable
            title={`Purchase Transactions (${productPurchases.length})`}
            dotColor="bg-blue-500"
            partyLabel="Supplier"
            emptyMessage={`No purchase transactions found for this product in ${currentYear}`}
            rows={purchaseRows}
            onPartyClick={(party, type) => {
              if (type === "supplier") onSupplierClick(party)
            }}
            totalColorClass="text-blue-600 dark:text-blue-400"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
        <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
        <span>{title}</span>
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-700">
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">{partyLabel}</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Quantity</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Unit Price</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.key} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {formatNepaliDateForTable(row.date)}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    <span
                      className="cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      onClick={() => onPartyClick(row.party, row.partyType)}
                    >
                      {row.party}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">{row.quantity} units</TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    Rs {Number(row.unitPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className={`font-semibold ${totalColorClass}`}>
                    Rs {row.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
