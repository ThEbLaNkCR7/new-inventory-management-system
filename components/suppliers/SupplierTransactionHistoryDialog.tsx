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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Purchase } from "@/contexts/InventoryContext"
import { formatNepaliDateForTable, getCurrentNepaliYear, getNepaliYear, toTitleCase } from "@/lib/utils"

interface SupplierTransactionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierName: string
  purchases: Purchase[]
}

export default function SupplierTransactionHistoryDialog({
  open,
  onOpenChange,
  supplierName,
  purchases,
}: SupplierTransactionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span>Supplier Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            All transactions with <span className="font-semibold text-gray-800 dark:text-gray-200">{supplierName}</span> in {getCurrentNepaliYear()}
          </DialogDescription>
        </DialogHeader>

        {supplierName && (
          <div className="space-y-6">
            {/* Supplier Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Supplier Summary</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Supplier Name</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{supplierName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Purchases</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {purchases.filter(p => p.supplier === supplierName && getNepaliYear(p.purchaseDate) === getCurrentNepaliYear()).length} transactions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Quantity</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {purchases
                      .filter(
                        (p) =>
                          p.supplier === supplierName &&
                          getNepaliYear(p.purchaseDate) === getCurrentNepaliYear()
                      )
                      .reduce(
                        (sum, p) =>
                          sum +
                          (p.items?.reduce(
                            (itemSum, item) =>
                              itemSum + (item.quantityPurchased || 0),
                            0
                          ) || 0),
                        0
                      )} units
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Value</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    Rs {purchases
                      .filter(
                        (p) =>
                          p.supplier === supplierName &&
                          getNepaliYear(p.purchaseDate) === getCurrentNepaliYear()
                      )
                      .reduce(
                        (sum, p) =>
                          sum +
                          (p.items?.reduce(
                            (itemSum, item) =>
                              itemSum + (item.quantityPurchased || 0) * (item.purchasePrice || 0),
                            0
                          ) || 0),
                        0
                      )
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase Transactions */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Purchase Transactions ({purchases.filter(p => p.supplier === supplierName && getNepaliYear(p.purchaseDate) === getCurrentNepaliYear()).length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Product</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Unit Price</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const currentYear = getCurrentNepaliYear()
                      const supplierPurchases = purchases.filter(purchase =>
                        purchase.supplier === supplierName &&
                        getNepaliYear(purchase.purchaseDate) === currentYear
                      ).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())

                      return supplierPurchases.length > 0 ? (
                        supplierPurchases.map((purchase) => (
                          <TableRow key={purchase.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {formatNepaliDateForTable(purchase.purchaseDate)}
                            </TableCell>
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                              {purchase.items
                                ?.map((i) => toTitleCase(i.productName || ""))
                                .filter(Boolean)
                                .join(", ")}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {purchase.items?.reduce(
                                (sum, i) => sum + (i.quantityPurchased || 0),
                                0
                              )}{" "}
                              units
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              Rs{" "}
                              {(
                                purchase.items?.reduce(
                                  (sum, i) => sum + (i.purchasePrice || 0),
                                  0
                                ) || 0
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-semibold text-blue-600 dark:text-blue-400">
                              Rs{" "}
                              {(
                                purchase.items?.reduce(
                                  (sum, i) =>
                                    sum +
                                    (i.quantityPurchased || 0) *
                                    (i.purchasePrice || 0),
                                  0
                                ) || 0
                              ).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No purchase transactions found for this supplier in {currentYear}
                          </TableCell>
                        </TableRow>
                      )
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="neutralOutline"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
