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
import DataPagination from "@/components/ui/data-pagination"
import type { Purchase } from "@/contexts/InventoryContext"
import { usePagination } from "@/hooks/usePagination"
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils"
import { useMemo } from "react"

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
  // Match main table order count: all active purchases for this supplier (all years)
  const supplierPurchases = useMemo(
    () =>
      purchases
        .filter(
          (purchase) =>
            purchase.supplier === supplierName &&
            purchase.isActive !== false,
        )
        .sort(
          (a, b) =>
            new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
        ),
    [purchases, supplierName],
  )

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
  } = usePagination(supplierPurchases, {
    resetKey: `${supplierName}|${supplierPurchases.length}`,
  })

  const totalQuantity = supplierPurchases.reduce(
    (sum, p) =>
      sum + (p.items?.reduce((itemSum, item) => itemSum + (item.quantityPurchased || 0), 0) || 0),
    0,
  )
  const totalValue = supplierPurchases.reduce(
    (sum, p) =>
      sum +
      (p.items?.reduce(
        (itemSum, item) =>
          itemSum + (item.quantityPurchased || 0) * (item.purchasePrice || 0),
        0,
      ) || 0),
    0,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span>Supplier Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            All transactions with <span className="font-semibold text-gray-800 dark:text-gray-200">{toTitleCase(supplierName)}</span>
          </DialogDescription>
        </DialogHeader>

        {supplierName && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Supplier Summary</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier Name</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{toTitleCase(supplierName)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {supplierPurchases.length} transactions
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quantity</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">{totalQuantity} units</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    Rs {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Purchase Transactions ({supplierPurchases.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Item No.</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((purchase) => {
                        const itemNo =
                          purchase.items?.reduce(
                            (sum, i) => sum + (i.quantityPurchased || 0),
                            0,
                          ) || 0
                        const purchaseTotal =
                          purchase.items?.reduce(
                            (sum, i) =>
                              sum + (i.quantityPurchased || 0) * (i.purchasePrice || 0),
                            0,
                          ) || 0

                        return (
                          <TableRow key={purchase.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {formatNepaliDateForTable(purchase.purchaseDate)}
                            </TableCell>
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                              {itemNo}
                            </TableCell>
                            <TableCell className="font-semibold text-blue-600 dark:text-blue-400">
                              Rs {purchaseTotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No purchase transactions found for this supplier
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
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
