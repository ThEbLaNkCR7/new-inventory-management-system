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
import type { Purchase } from "@/contexts/InventoryContext";
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import { Eye } from "lucide-react";

interface ViewPurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
  onEdit: (purchase: Purchase) => void;
}

export default function ViewPurchaseDialog({
  isOpen,
  onOpenChange,
  purchase,
  onEdit,
}: ViewPurchaseDialogProps) {
  if (!purchase) return null;

  const VAT_RATE = 0.13; // 13% VAT

  const total =
    purchase.items?.reduce(
      (sum: number, item: any) =>
        sum +
        (item.quantityPurchased || 0) *
        (item.purchasePrice || 0),
      0
    ) || 0;

  const vat = purchase.isVat ? total * VAT_RATE : 0;
  const grandTotal = total + vat;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-navy" />
            </div>
            <span>Purchase Details</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete information about the selected purchase transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* PURCHASE INFO */}
          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Purchase Information</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                  Supplier
                </Label>
                <p className="text-sm font-normal text-navy">
                  {purchase.supplier}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                  Supplier Type
                </Label>
                <p className="text-sm font-normal text-navy">
                  {purchase.supplierType || "Company"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                  Purchase Date
                </Label>
                <p className="text-sm font-normal text-navy">
                  {formatNepaliDateForTable(purchase.purchaseDate)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">
                  Updated Date
                </Label>
                <p className="ttext-sm font-normal text-navy">
                  {purchase.updatedAt ? formatNepaliDateForTable(purchase.updatedAt) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
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
                {purchase.items?.map((item: any, index: number) => (
                  <tr key={index} className="border-t dark:border-border">
                    <td className="p-3 font-medium">
                      {toTitleCase(item.productName) || "Unknown Product"}
                    </td>

                    <td className="p-3">
                      {item.quantityPurchased || 0}
                    </td>

                    <td className="p-3">
                      Rs {(item.purchasePrice || 0).toFixed(2)}
                    </td>

                    <td className="p-3 font-semibold text-navy">
                      Rs {(
                        (item.quantityPurchased || 0) *
                        (item.purchasePrice || 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* FOOTER */}
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
                {purchase.isVat && (
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
                    {purchase.isVat ? "Grand Total" : "Total Amount"}
                  </td>
                  <td className="p-3 font-semibold tabular-nums text-navy">
                    Rs {grandTotal.toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* BILL */}
          {purchase.billUrl && (
            <div className="space-y-1.5">
              <Label>Bill Image</Label>
              <img
                src={purchase.billUrl}
                alt="Bill"
                className="rounded-lg border object-contain"
              />
              <a
                href={purchase.billUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
              >
                Open Full Image
              </a>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="neutralOutline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit(purchase);
            }}
          >
            Edit Purchase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}