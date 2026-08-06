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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <svg className="h-6 w-6 text-navy dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span>Supplier Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            All transactions with <span className="font-semibold text-navy">{toTitleCase(supplierName)}</span>
          </DialogDescription>
        </DialogHeader>

        {supplierName && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <h3 className="form-section-title">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Supplier Summary</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Supplier Name</Label>
                  <p className="text-navy font-medium">{toTitleCase(supplierName)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Total Purchases</Label>
                  <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
                    {supplierPurchases.length} transactions
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Total Quantity</Label>
                  <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">{totalQuantity} units</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Total Value</Label>
                  <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
                    Rs {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4">
              <h3 className="form-section-title">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Purchase Transactions ({supplierPurchases.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Date</TableHead>
                      <TableHead>Item No.</TableHead>
                      <TableHead>Total Value</TableHead>
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
                          <TableRow key={purchase.id} className="hover:bg-muted/60">
                            <TableCell className="text-navy">
                              {formatNepaliDateForTable(purchase.purchaseDate)}
                            </TableCell>
                            <TableCell className="font-medium text-navy">
                              {itemNo}
                            </TableCell>
                            <TableCell className="font-semibold text-navy">
                              Rs {purchaseTotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-sm font-normal italic text-muted-foreground">
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

        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
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
