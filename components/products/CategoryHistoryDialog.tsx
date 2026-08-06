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
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils"
import {
 computeTransactionStats,
 filterPurchasesByProducts,
 filterSalesByProducts,
 getCategoryProducts,
 itemMatchesAnyProduct,
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

 // Sales/purchases have no category field — resolve via products in this category.
 const categoryProducts = getCategoryProducts(products, category)
 const categoryProductRefs = categoryProducts.map((p) => ({ id: p.id, name: p.name }))
 const categorySales = filterSalesByProducts(sales, categoryProductRefs, null)
 const categoryPurchases = filterPurchasesByProducts(purchases, categoryProductRefs, null)
 const matchesCategoryItem = (item: { productId?: string; productName?: string }) =>
 itemMatchesAnyProduct(item, categoryProductRefs)

 const stats = computeTransactionStats(
 categorySales,
 categoryPurchases,
 matchesCategoryItem,
 matchesCategoryItem,
 )

 const sortedSales = [...categorySales].sort(
 (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
 )
 const sortedPurchases = [...categoryPurchases].sort(
 (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
 )

 return (
 <Dialog open={isOpen} onOpenChange={onOpenChange}>
 <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto border-border p-4 sm:p-6">
 <DialogHeader className="pb-6">
 <DialogTitle className="flex items-center gap-3">
 <div className="p-2 bg-muted dark:bg-muted rounded-lg">
 <svg className="h-6 w-6 text-navy dark:text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
 </svg>
 </div>
 <span>Category Transaction History</span>
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 Sales and purchases for{" "}
 <span className="font-semibold text-navy">{category}</span> category
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-6">
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Category Summary</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-navy uppercase tracking-wide">Category Name</Label>
 <p className="text-navy text-sm font-medium">{category}</p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-navy uppercase tracking-wide">Total Products</Label>
 <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">{categoryProducts.length} products</p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-navy uppercase tracking-wide">Total Stock</Label>
 <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
 {categoryProducts.reduce((sum, p) => sum + p.stockQuantity, 0)} units
 </p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-navy uppercase tracking-wide">Total Value</Label>
 <p className="text-lg font-semibold tracking-tight tabular-nums text-navy dark:text-navy">
 Rs {categoryProducts.reduce((sum, p) => sum + p.stockQuantity * p.unitPrice, 0).toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 <TransactionStatsGrid stats={stats} yearLabel="All Time" />

 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Products in {category} ({categoryProducts.length})</span>
 </h3>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted">
 <TableHead>Product Name</TableHead>
 <TableHead>Stock</TableHead>
 <TableHead>Unit Price</TableHead>
 <TableHead>Total Value</TableHead>
 <TableHead>Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {categoryProducts.map((product) => {
 const threshold = (product as Product & { lowStockThreshold?: number }).lowStockThreshold ?? 5
 return (
 <TableRow key={product.id} className="hover:bg-muted/60">
 <TableCell className="font-medium text-navy">{toTitleCase(product.name)}</TableCell>
 <TableCell className="text-navy">{product.stockQuantity} units</TableCell>
 <TableCell className="text-navy">Rs {product.unitPrice.toLocaleString()}</TableCell>
 <TableCell className="font-semibold text-navy dark:text-navy">
 Rs {(product.stockQuantity * product.unitPrice).toLocaleString()}
 </TableCell>
 <TableCell>
 <Badge
 variant="secondary"
 className={`px-2 py-1 text-xs font-medium ${product.stockQuantity > threshold ? "bg-secondary text-navy" : "bg-secondary text-navy"}`}
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
 dotColor="bg-muted"
 type="sales"
 transactions={sortedSales}
 categoryProducts={categoryProductRefs}
 onClientClick={onClientClick}
 onSupplierClick={onSupplierClick}
 emptyMessage="No sales transactions found for this category"
 />

 <CategoryTransactionTable
 title={`Purchase Transactions (${categoryPurchases.length})`}
 dotColor="bg-muted"
 type="purchases"
 transactions={sortedPurchases}
 categoryProducts={categoryProductRefs}
 onClientClick={onClientClick}
 onSupplierClick={onSupplierClick}
 emptyMessage="No purchase transactions found for this category"
 />
 </div>

 <div className="flex justify-end space-x-3 pt-6 border-t border-border">
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
 categoryProducts,
 onClientClick,
 onSupplierClick,
 emptyMessage,
}: {
 title: string
 dotColor: string
 type: "sales" | "purchases"
 transactions: Sale[] | Purchase[]
 categoryProducts: Array<Pick<Product, "id" | "name">>
 onClientClick: (client: string) => void
 onSupplierClick: (supplier: string) => void
 emptyMessage: string
}) {
 const rows =
 type === "sales"
 ? (transactions as Sale[]).flatMap((sale) =>
 (sale.items || [])
 .filter((item) => itemMatchesAnyProduct(item, categoryProducts))
 .map((item, index) => {
 const total = (item.quantitySold || 0) * (item.salePrice || 0)
 const productLabel = item.productName || item.productId
 return (
 <TableRow key={`${sale.id}-${index}`} className="hover:bg-muted/60">
 <TableCell className="text-navy">
 {formatNepaliDateForTable(sale.saleDate)}
 </TableCell>
 <TableCell className="font-medium text-navy">{toTitleCase(productLabel)}</TableCell>
 <TableCell className="font-medium text-navy">
 <span className="cursor-pointer font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80" onClick={() => onClientClick(sale.client)}>
 {toTitleCase(sale.client)}
 </span>
 </TableCell>
 <TableCell className="text-navy">{item.quantitySold} units</TableCell>
 <TableCell className="text-navy">Rs {Number(item.salePrice || 0).toLocaleString()}</TableCell>
 <TableCell className="font-semibold tabular-nums text-navy">Rs {total.toLocaleString()}</TableCell>
 </TableRow>
 )
 }),
 )
 : (transactions as Purchase[]).flatMap((purchase) =>
 (purchase.items || [])
 .filter((item) => itemMatchesAnyProduct(item, categoryProducts))
 .map((item, index) => {
 const total = (item.quantityPurchased || 0) * (item.purchasePrice || 0)
 const productLabel = item.productName || item.productId
 return (
 <TableRow key={`${purchase.id}-${index}`} className="hover:bg-muted/60">
 <TableCell className="text-navy">
 {formatNepaliDateForTable(purchase.purchaseDate)}
 </TableCell>
 <TableCell className="font-medium text-navy">{toTitleCase(productLabel)}</TableCell>
 <TableCell className="font-medium text-navy">
 <span className="cursor-pointer font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80" onClick={() => onSupplierClick(purchase.supplier)}>
 {toTitleCase(purchase.supplier)}
 </span>
 </TableCell>
 <TableCell className="text-navy">{item.quantityPurchased} units</TableCell>
 <TableCell className="text-navy">Rs {Number(item.purchasePrice || 0).toLocaleString()}</TableCell>
 <TableCell className="font-semibold text-navy">Rs {total.toLocaleString()}</TableCell>
 </TableRow>
 )
 }),
 )

 return (
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
 <span>{title}</span>
 </h3>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted">
 <TableHead>Date</TableHead>
 <TableHead>Product</TableHead>
 <TableHead>{type === "sales" ? "Client" : "Supplier"}</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Unit Price</TableHead>
 <TableHead>Total</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {rows.length > 0 ? (
 rows
 ) : (
 <TableRow>
 <TableCell colSpan={6} className="py-8 text-center text-sm font-normal italic text-muted-foreground">
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
