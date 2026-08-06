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
import type { Purchase } from "@/contexts/InventoryContext";
import {
  formatNepaliDateForTable,
  getCurrentNepaliYear,
  getNepaliYear,
  toTitleCase,
} from "@/lib/utils";
import { Building2 } from "lucide-react";

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

  // Get all items from supplier purchases
  const getSupplierItems = () => {
    const items: any[] = [];
    supplierPurchases.forEach((purchase) => {
      if (purchase.items && purchase.items.length > 0) {
        purchase.items.forEach((item: any) => {
          items.push({
            ...item,
            id: purchase.id,
            purchaseDate: purchase.purchaseDate,
          });
        });
      }
    });
    return items;
  };

  const supplierItems = getSupplierItems();

  const totalQuantity = supplierItems.reduce(
    (sum, item) => sum + (item.quantityPurchased || 0),
    0,
  );
  const totalValue = supplierItems.reduce(
    (sum, item) =>
      sum + ((item.quantityPurchased || 0) * (item.purchasePrice || 0)),
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-border">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-navy dark:text-orange-400" />
            </div>
            <span>Supplier Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            All transactions with{" "}
            <span className="font-semibold text-navy">
              {supplierName}
            </span>{" "}
            in {currentYear}
          </DialogDescription>
        </DialogHeader>

        {supplierName && (
          <div className="space-y-6">
            <div className="bg-muted rounded-xl p-6">
              <h3 className="form-section-title">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Supplier Summary</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Supplier Name
                  </Label>
                  <p className="text-navy text-sm font-medium">
                    {supplierName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Total Purchases
                  </Label>
                  <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
                    {supplierPurchases.length} transactions
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Total Quantity
                  </Label>
                  <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
                    {totalQuantity} units
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Total Value
                  </Label>
                  <p className="text-lg font-semibold tracking-tight tabular-nums text-navy dark:text-orange-400">
                    Rs {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-6">
              <h3 className="form-section-title">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Purchase Transactions ({supplierItems.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>
                        Date
                      </TableHead>
                      <TableHead>
                        Product
                      </TableHead>
                      <TableHead>
                        Quantity
                      </TableHead>
                      <TableHead>
                        Unit Price
                      </TableHead>
                      <TableHead>
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierItems.length > 0 ? (
                      supplierItems.map((item, idx) => (
                        <TableRow
                          key={idx}
                          className="hover:bg-muted/60"
                        >
                          <TableCell className="text-navy">
                            {formatNepaliDateForTable(item.purchaseDate)}
                          </TableCell>
                          <TableCell className="font-medium text-navy">
                            {toTitleCase(item.productName)}
                          </TableCell>
                          <TableCell className="text-navy">
                            {item.quantityPurchased || 0} units
                          </TableCell>
                          <TableCell className="text-navy">
                            Rs {(item.purchasePrice || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-navy">
                            Rs{" "}
                            {(
                              (item.quantityPurchased || 0) *
                              (item.purchasePrice || 0)
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm font-normal italic text-muted-foreground"
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

        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
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