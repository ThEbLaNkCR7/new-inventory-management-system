"use client"

import { Badge } from "@/components/ui/badge"
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
  filterPurchasesByProductNames,
  filterSalesByProductNames,
  getCategoryProducts,
  getCurrentYear,
} from "./productHistoryUtils"
import TransactionStatsGrid from "./TransactionStatsGrid"

interface CategoryHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  category: string
  products: Product[]
  sales: Sale[]
  purchases: Purchase[]
  onClientClick: (client: string) => void
  onSupplierClick: (supplier: string) => void
}

export default function CategoryHistoryDialog({
  isOpen,
  onOpenChange,
  category,
  products,
  sales,
  purchases,
  onClientClick,
  onSupplierClick,
}: CategoryHistoryDialogProps) {
  if (!category) return null

  const currentYear = getCurrentYear()
  const categoryProducts = getCategoryProducts(products, category)
  const categoryProductNames = categoryProducts.map((p) => p.name)
  const categorySales = filterSalesByProductNames(sales, categoryProductNames, currentYear)
  const categoryPurchases = filterPurchasesByProductNames(purchases, categoryProductNames, currentYear)

  const stats = computeTransactionStats(
    categorySales,
    categoryPurchases,
    () => true,
    () => true,
  )

  const sortedSales = [...categorySales].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
  )
  const sortedPurchases = [...categoryPurchases].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 sm:p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span>Category Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Sales and purchases for{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{category}</span> category in {new Date().getFullYear()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Category Summary</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Category Name</Label>
                <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{category}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Total Products</Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">{categoryProducts.length} products</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Total Stock</Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  {categoryProducts.reduce((sum, p) => sum + p.stockQuantity, 0)} units
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">Total Value</Label>
                <p className="font-semibold text-lg text-purple-600 dark:text-purple-400">
                  Rs {categoryProducts.reduce((sum, p) => sum + p.stockQuantity * p.unitPrice, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <TransactionStatsGrid stats={stats} year={new Date().getFullYear()} />

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Products in {category} ({categoryProducts.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Product Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Unit Price</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total Value</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProducts.map((product) => {
                    const threshold = (product as Product & { lowStockThreshold?: number }).lowStockThreshold ?? 5
                    return (
                      <TableRow key={product.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">{product.stockQuantity} units</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">Rs {product.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold text-purple-600 dark:text-purple-400">
                          Rs {(product.stockQuantity * product.unitPrice).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`px-2 py-1 text-xs font-medium ${product.stockQuantity > threshold ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}
                          >
                            {product.stockQuantity > threshold ? "In Stock" : "Low Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <CategoryTransactionTable
            title={`Sales Transactions (${categorySales.length})`}
            dotColor="bg-green-500"
            type="sales"
            transactions={sortedSales}
            onClientClick={onClientClick}
            onSupplierClick={onSupplierClick}
            emptyMessage={`No sales transactions found for this category in ${currentYear}`}
          />

          <CategoryTransactionTable
            title={`Purchase Transactions (${categoryPurchases.length})`}
            dotColor="bg-blue-500"
            type="purchases"
            transactions={sortedPurchases}
            onClientClick={onClientClick}
            onSupplierClick={onSupplierClick}
            emptyMessage={`No purchase transactions found for this category in ${currentYear}`}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="neutralOutline" onClick={() => onOpenChange(false)} className="px-6 py-2">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CategoryTransactionTable({
  title,
  dotColor,
  type,
  transactions,
  onClientClick,
  onSupplierClick,
  emptyMessage,
}: {
  title: string
  dotColor: string
  type: "sales" | "purchases"
  transactions: Sale[] | Purchase[]
  onClientClick: (client: string) => void
  onSupplierClick: (supplier: string) => void
  emptyMessage: string
}) {
  const rows =
    type === "sales"
      ? (transactions as Sale[]).flatMap((sale) =>
          (sale.items || []).map((item, index) => {
            const total = (item.quantitySold || 0) * (item.salePrice || 0)
            return (
              <TableRow key={`${sale.id}-${index}`} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {formatNepaliDateForTable(sale.saleDate)}
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.productId}</TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  <span className="cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors" onClick={() => onClientClick(sale.client)}>
                    {sale.client}
                  </span>
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{item.quantitySold} units</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">Rs {Number(item.salePrice || 0).toLocaleString()}</TableCell>
                <TableCell className="font-semibold text-green-600 dark:text-green-400">Rs {total.toLocaleString()}</TableCell>
              </TableRow>
            )
          }),
        )
      : (transactions as Purchase[]).flatMap((purchase) =>
          (purchase.items || []).map((item, index) => {
            const total = (item.quantityPurchased || 0) * (item.purchasePrice || 0)
            return (
              <TableRow key={`${purchase.id}-${index}`} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {formatNepaliDateForTable(purchase.purchaseDate)}
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.productId}</TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  <span className="cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors" onClick={() => onSupplierClick(purchase.supplier)}>
                    {purchase.supplier}
                  </span>
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">{item.quantityPurchased} units</TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">Rs {Number(item.purchasePrice || 0).toLocaleString()}</TableCell>
                <TableCell className="font-semibold text-blue-600 dark:text-blue-400">Rs {total.toLocaleString()}</TableCell>
              </TableRow>
            )
          }),
        )

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
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Product</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">{type === "sales" ? "Client" : "Supplier"}</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Quantity</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Unit Price</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
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
