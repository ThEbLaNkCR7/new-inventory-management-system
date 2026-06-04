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
import type { Sale } from "@/contexts/InventoryContext";
import { Users } from "lucide-react";
import React from "react";

interface ClientHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  sales: Sale[];
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
      (a, b) =>
        new Date(b.saleDate).getTime() -
        new Date(a.saleDate).getTime(),
    );

  // Flatten items (same style as supplier)
  const getClientItems = () => {
    const items: any[] = [];

    clientSales.forEach((sale) => {
      sale.items?.forEach((item: any) => {
        items.push({
          ...item,
          saleDate: sale.saleDate,
          client: sale.client,
        });
      });
    });

    return items;
  };

  const clientItems = getClientItems();

  const totalQuantity = clientItems.reduce(
    (sum, item) => sum + (item.quantitySold || 0),
    0,
  );

  const totalValue = clientItems.reduce(
    (sum, item) =>
      sum +
      (item.quantitySold || 0) * (item.salePrice || 0),
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
              <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <span>Client Transaction History</span>
          </DialogTitle>

          <DialogDescription>
            All transactions with{" "}
            <span className="font-semibold">{clientName}</span> in{" "}
            {currentYear}
          </DialogDescription>
        </DialogHeader>

        {clientName && (
          <div className="space-y-6">

            {/* SUMMARY */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Client Summary
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div>
                  <Label>Client Name</Label>
                  <p className="font-medium">{clientName}</p>
                </div>

                <div>
                  <Label>Total Sales</Label>
                  <p className="font-semibold">
                    {clientSales.length} transactions
                  </p>
                </div>

                <div>
                  <Label>Total Quantity</Label>
                  <p className="font-semibold">
                    {totalQuantity} units
                  </p>
                </div>

                <div>
                  <Label>Total Value</Label>
                  <p className="font-semibold text-teal-600">
                    Rs {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Sales Transactions ({clientItems.length})
              </h3>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {clientItems.length > 0 ? (
                      clientItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {formatNepaliDateForTable(item.saleDate)}
                          </TableCell>

                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>

                          <TableCell>
                            {item.quantitySold || 0} units
                          </TableCell>

                          <TableCell>
                            Rs {(item.salePrice || 0).toLocaleString()}
                          </TableCell>

                          <TableCell className="font-semibold text-green-600">
                            Rs{" "}
                            {(
                              (item.quantitySold || 0) *
                              (item.salePrice || 0)
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8"
                        >
                          No sales found for this client in {currentYear}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* CLOSE */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            variant="neutralOutline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}