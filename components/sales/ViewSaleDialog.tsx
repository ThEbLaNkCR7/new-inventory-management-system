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
import { formatNepaliDateForTable } from "@/lib/utils";
import { Badge, Eye } from "lucide-react";
import React from "react";

interface ViewSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any | null;
  onEdit: (sale: any) => void;
}

export default function ViewSaleDialog({
  isOpen,
  onOpenChange,
  sale,
  onEdit,
}: ViewSaleDialogProps) {
  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Sale Details</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Complete information about the selected sale transaction
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="space-y-6">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Product Name</th>
                    <th className="text-left p-3">Quantity</th>
                    <th className="text-left p-3">Unit Price</th>
                    <th className="text-left p-3">Total Price</th>
                    <th className="text-left p-3">Created Date</th>
                    <th className="text-left p-3">Updated Date</th>
                  </tr>
                </thead>

                <tbody>
                  {sale.items?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-t dark:border-gray-700"
                    >
                      <td className="p-3 font-medium">
                        {item.productName || "Unknown Product"}
                      </td>

                      <td className="p-3">
                        {item.quantitySold}
                      </td>

                      <td className="p-3">
                        Rs {(item.salePrice || 0).toFixed(2)}
                      </td>

                      <td className="p-3 font-semibold text-green-600">
                        Rs {(
                          (item.quantitySold || 0) *
                          (item.salePrice || 0)
                        ).toFixed(2)}
                      </td>

                      <td className="p-3">
                        {sale.createdAt
                          ? formatNepaliDateForTable(sale.createdAt)
                          : "N/A"}
                      </td>

                      <td className="p-3">
                        {sale.updatedAt
                          ? formatNepaliDateForTable(sale.updatedAt)
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-muted font-semibold">
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      Grand Total
                    </td>

                    <td className="p-3 text-green-600">
                      Rs {sale.items
                        ?.reduce(
                          (sum: number, item: any) =>
                            sum +
                            (item.quantitySold || 0) *
                            (item.salePrice || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>

                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {sale.billUrl && (
              <div className="space-y-2">
                <Label>Bill Image</Label>

                <img
                  src={sale.billUrl}
                  alt="Bill"
                  className="rounded-lg border object-contain max-h-[500px]"
                />

                <a
                  href={sale.billUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Open Full Image
                </a>
              </div>
            )}
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

          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit(sale);
            }}
            className="px-6 py-2"
          >
            Edit Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
