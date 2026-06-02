"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatNepaliDateForTable,
  getCurrentNepaliYear,
  getNepaliYear,
} from "@/lib/utils";
import type { Purchase } from "@/contexts/InventoryContext";
import { Building2 } from "lucide-react";
import React from "react";

interface SupplierHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  purchases: Purchase[];
}

export default function SupplierHistoryDialog({
  isOpen,
  onOpenChange,
  supplierName,
  purchases,
}: SupplierHistoryDialogProps) {
  const currentYear = getCurrentNepaliYear();
  const supplierPurchases = purchases
    .filter(
      (purchase) =>
        purchase.supplier === supplierName &&
        getNepaliYear(purchase.purchaseDate) === currentYear,
    )
    .sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() -
        new Date(a.purchaseDate).getTime(),
    );

  const totalQuantity = supplierPurchases.reduce(
    (sum, p) => sum + p.quantityPurchased,
    0,
  );
  const totalValue = supplierPurchases.reduce(
    (sum, p) => sum + p.quantityPurchased * p.purchasePrice,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span>Supplier Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            All transactions with{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {supplierName}
            </span>{" "}
            in {currentYear}
          </DialogDescription>
        </DialogHeader>

        {supplierName && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Supplier Summary</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Supplier Name
                  </Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">
                    {supplierName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Purchases
                  </Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {supplierPurchases.length} transactions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Quantity
                  </Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {totalQuantity} units
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Value
                  </Label>
                  <p className="font-semibold text-lg text-orange-600 dark:text-orange-400">
                    Rs {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Purchase Transactions ({supplierPurchases.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Date
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Product
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Quantity
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Unit Price
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierPurchases.length > 0 ? (
                      supplierPurchases.map((purchase) => (
                        <TableRow
                          key={purchase.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {formatNepaliDateForTable(purchase.purchaseDate)}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {purchase.productName}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {purchase.quantityPurchased} units
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            Rs {purchase.purchasePrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-blue-600 dark:text-blue-400">
                            Rs{" "}
                            {(
                              purchase.quantityPurchased *
                              purchase.purchasePrice
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500 dark:text-gray-400"
                        >
                          No purchase transactions found for this supplier in{" "}
                          {currentYear}
                        </TableCell>
                      </TableRow>
                    )}
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
  );
}