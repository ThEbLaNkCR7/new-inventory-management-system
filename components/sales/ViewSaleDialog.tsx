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
import { Eye } from "lucide-react";

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

  const total =
    sale.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.quantitySold || 0) * (item.salePrice || 0),
      0
    ) || 0;

  const vat = sale.vatAmount || 0;
  const grandTotal = total + vat;

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

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Sale Information</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Client
              </Label>
              <p className="text-gray-900 dark:text-gray-100 font-medium text-base">
                {sale.client}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Client Type
              </Label>
              <p className="text-gray-900 dark:text-gray-100 font-medium text-base">
                {sale.clientType || "Company"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Sale Date
              </Label>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                {formatNepaliDateForTable(sale.saleDate)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Transaction ID
              </Label>
              <p className="text-gray-700 dark:text-gray-300 font-mono text-base">
                {sale.id}
              </p>
            </div>
          </div>
        </div>

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
                  {/* TOTAL */}
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      Total
                    </td>
                    <td className="p-3">
                      Rs {total.toFixed(2)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>

                  {/* VAT (manual value) */}
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      VAT
                    </td>
                    <td className="p-3">
                      Rs {vat.toFixed(2)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>

                  {/* GRAND TOTAL */}
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      Grand Total
                    </td>
                    <td className="p-3 text-green-600">
                      Rs {grandTotal.toFixed(2)}
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
