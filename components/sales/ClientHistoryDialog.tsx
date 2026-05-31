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
import React from "react";

interface ClientHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  sales: any[];
}

export default function ClientHistoryDialog({
  isOpen,
  onOpenChange,
  clientName,
  sales,
}: ClientHistoryDialogProps) {
  const currentYear = getCurrentNepaliYear();
  const clientSales = sales
    .filter(
      (sale) =>
        sale.client === clientName &&
        getNepaliYear(sale.saleDate) === currentYear,
    )
    .sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
    );

  const totalQuantity = clientSales.reduce((sum, s) => sum + s.quantitySold, 0);
  const totalValue = clientSales.reduce(
    (sum, s) => sum + s.quantitySold * s.salePrice,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
              <svg
                className="h-6 w-6 text-teal-600 dark:text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span>Client Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            All transactions with{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {clientName}
            </span>{" "}
            in {currentYear}
          </DialogDescription>
        </DialogHeader>

        {clientName && (
          <div className="space-y-6">
            {/* Client Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Client Summary</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Client Name
                  </Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">
                    {clientName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Sales
                  </Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {clientSales.length} transactions
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
                  <p className="font-semibold text-lg text-teal-600 dark:text-teal-400">
                    Rs {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Sales Transactions */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sales Transactions ({clientSales.length})</span>
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
                    {clientSales.length > 0 ? (
                      clientSales.map((sale) => (
                        <TableRow
                          key={sale.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {formatNepaliDateForTable(sale.saleDate)}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {sale.productName}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {sale.quantitySold} units
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            Rs {sale.salePrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600 dark:text-green-400">
                            Rs{" "}
                            {(
                              sale.quantitySold * sale.salePrice
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
                          No sales transactions found for this client in{" "}
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
