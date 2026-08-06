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
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
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

  const VAT_RATE = 0.13; // 13% VAT

  const total =
    sale.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.quantitySold || 0) * (item.salePrice || 0),
      0
    ) || 0;

  const vat = sale.isVat ? total * VAT_RATE : 0;
  const grandTotal = total + vat;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-navy" />
            </div>
            <span>Sale Details</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete information about the selected sale transaction
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-xl p-6">
          <h3 className="form-section-title">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Sale Information</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                Client
              </Label>
              <p className="text-sm font-normal text-navy">
                {sale.client}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                Client Type
              </Label>
              <p className="text-sm font-normal text-navy">
                {sale.clientType || "Company"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                Sale Type
              </Label>
              <p className="text-sm font-normal text-navy">
                {sale.saleType === "site" ? "Site" : "Client"}
              </p>
            </div>
            {sale.saleType === "site" && sale.projectName && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                  Project Name
                </Label>
                <p className="text-sm font-normal text-navy">
                  {sale.projectName}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                Payment Status
              </Label>
              <p className="text-sm font-normal text-navy">
                {sale.paymentStatus || "Pending"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                Sale Date
              </Label>
              <p className="text-sm font-normal text-navy">
                {formatNepaliDateForTable(sale.saleDate)}
              </p>
            </div>
            {sale.batchNumber && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                  Batch
                </Label>
                <p className="text-sm font-normal text-navy">
                  {sale.batchNumber}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                Updated Date
              </Label>
              <p className="text-sm font-normal text-navy">
                {sale.updatedAt ? formatNepaliDateForTable(sale.updatedAt) : "N/A"}
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
                  </tr>
                </thead>

                <tbody>
                  {sale.items?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-t dark:border-border"
                    >
                      <td className="p-3 font-medium">
                        {toTitleCase(item.productName) || "Unknown Product"}
                      </td>

                      <td className="p-3">
                        {item.quantitySold}
                      </td>

                      <td className="p-3">
                        Rs {(item.salePrice || 0).toFixed(2)}
                      </td>

                      <td className="p-3 font-semibold text-navy">
                        Rs {(
                          (item.quantitySold || 0) *
                          (item.salePrice || 0)
                        ).toFixed(2)}
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

                  {/* VAT (only if isVat is true) */}
                  {sale.isVat && (
                    <tr>
                      <td colSpan={3} className="p-3 text-right">
                        VAT (13%)
                      </td>
                      <td className="p-3 text-navy">
                        + Rs {vat.toFixed(2)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  )}

                  {/* GRAND TOTAL */}
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      {sale.isVat ? "Grand Total" : "Total Amount"}
                    </td>
                    <td className="p-3 font-semibold tabular-nums text-navy">
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
                  className="font-sans text-sm font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                >
                  Open Full Image
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
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
