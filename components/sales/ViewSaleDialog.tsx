"use client";

import { Badge } from "@/components/ui/badge";
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
  formDialogClass,
  formDialogFooterClass,
  formDialogHeaderClass,
  formTitleClass,
} from "@/lib/form-styles";
import {
  amountClass,
  amountTotalClass,
  bodyClass,
  hintClass,
  sectionHeaderClass,
  textLinkClass,
} from "@/lib/type-styles";
import { cn, formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import { Printer } from "lucide-react";
import { useRef } from "react";
import { printSaleExactView } from "./utils";

interface ViewSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any | null;
  onEdit: (sale: any) => void;
}

/** Shared label under every field — same size & weight everywhere */
const viewLabelClass = hintClass;
/** Shared value text — same size & weight everywhere */
const viewValueClass = cn(bodyClass, "text-navy");
/** Table headers — same size as cell data, medium weight only */
const viewTableHeadClass = cn(bodyClass, "font-medium text-muted-foreground");
/** Only totals use this weight */
const viewTotalClass = cn(amountTotalClass, "text-navy");

function formatRs(amount: number) {
  return `Rs ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ViewSaleDialog({
  isOpen,
  onOpenChange,
  sale,
  onEdit,
}: ViewSaleDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    printSaleExactView(printRef.current);
  };

  if (!sale) return null;

  const VAT_RATE = 0.13;

  const total =
    sale.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.quantitySold || 0) * (item.salePrice || 0),
      0,
    ) || 0;

  const vat = sale.isVat ? total * VAT_RATE : 0;
  const grandTotal = total + vat;
  const paymentStatus = sale.paymentStatus || "Pending";
  const isReceived = paymentStatus === "Received";
  const isSite = sale.saleType === "site" && sale.projectName;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          formDialogClass,
          "max-h-[90vh] max-w-3xl gap-0 overflow-hidden font-sans sm:max-w-3xl",
        )}
      >
        <div ref={printRef} className="sale-view-print-root font-sans">
          <DialogHeader className={formDialogHeaderClass}>
            <DialogTitle
              className={cn(formTitleClass, "mb-2 border-b border-border pb-2")}
            >
              Sale Details
            </DialogTitle>
            <DialogDescription className="sr-only">
              Essential information about the selected sale
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[min(70vh,640px)] flex-col gap-5 overflow-y-auto px-6 py-1">
            {/* Essential summary */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className={viewLabelClass}>Client</p>
                  <p className={cn(sectionHeaderClass, "truncate text-navy")}>
                    {toTitleCase(sale.client)}
                  </p>
                  {isSite ? (
                    <p className={cn(viewValueClass, "text-modern-italic")}>
                      Material for : {sale.projectName}
                    </p>
                  ) : (
                    <p
                      className={cn(
                        bodyClass,
                        "text-modern-italic text-muted-foreground",
                      )}
                    >
                      Client sale
                    </p>
                  )}
                </div>

                <div className="shrink-0 space-y-1 text-left sm:text-right">
                  <p className={viewLabelClass}>
                    {sale.isVat ? "Grand Total" : "Total"}
                  </p>
                  <p className={cn(sectionHeaderClass, "tabular-nums text-navy")}>
                    {formatRs(grandTotal)}
                  </p>
                  {sale.isVat && (
                    <p className={viewLabelClass}>Incl. VAT {formatRs(vat)}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <span className={viewLabelClass}>Payment</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border font-sans text-xs font-medium",
                      isReceived
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
                    )}
                  >
                    {paymentStatus}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className={viewLabelClass}>Date</span>
                  <span className={viewValueClass}>
                    {formatNepaliDateForTable(sale.saleDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="overflow-hidden rounded-lg border border-border bg-white dark:bg-card">
              <table className="w-full border-collapse bg-white font-sans dark:bg-card">
                <thead className="border-y-[1.5px] border-primary/40 bg-background">
                  <tr>
                    <th
                      className={cn(
                        viewTableHeadClass,
                        "bg-background p-3 text-left",
                      )}
                    >
                      Product Name
                    </th>
                    <th
                      className={cn(
                        viewTableHeadClass,
                        "bg-background p-3 text-left",
                      )}
                    >
                      Quantity
                    </th>
                    <th
                      className={cn(
                        viewTableHeadClass,
                        "bg-background p-3 text-left",
                      )}
                    >
                      Unit Price
                    </th>
                    <th
                      className={cn(
                        viewTableHeadClass,
                        "bg-background p-3 text-right",
                      )}
                    >
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="bg-white dark:bg-card"
                    >
                      <td
                        className={cn(
                          viewValueClass,
                          "border border-border/70 p-3",
                        )}
                      >
                        {toTitleCase(item.productName) || "Unknown Product"}
                      </td>
                      <td
                        className={cn(
                          amountClass,
                          "border border-border/70 p-3 text-navy",
                        )}
                      >
                        {item.quantitySold}
                      </td>
                      <td
                        className={cn(
                          amountClass,
                          "border border-border/70 p-3 text-navy",
                        )}
                      >
                        {formatRs(item.salePrice || 0)}
                      </td>
                      <td
                        className={cn(
                          amountClass,
                          "border border-border/70 p-3 text-right text-navy",
                        )}
                      >
                        {formatRs(
                          (item.quantitySold || 0) * (item.salePrice || 0),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white dark:bg-card">
                  <tr>
                    <td
                      colSpan={3}
                      className={cn(
                        viewLabelClass,
                        "border border-border/70 p-3 text-right",
                      )}
                    >
                      Subtotal
                    </td>
                    <td
                      className={cn(
                        amountClass,
                        "border border-border/70 p-3 text-right text-navy",
                      )}
                    >
                      {formatRs(total)}
                    </td>
                  </tr>
                  {sale.isVat && (
                    <tr>
                      <td
                        colSpan={3}
                        className={cn(
                          viewLabelClass,
                          "border border-border/70 p-3 text-right",
                        )}
                      >
                        VAT (13%)
                      </td>
                      <td
                        className={cn(
                          amountClass,
                          "border border-border/70 p-3 text-right text-navy",
                        )}
                      >
                        + {formatRs(vat)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td
                      colSpan={3}
                      className={cn(
                        viewValueClass,
                        "border border-border/70 p-3 text-right font-medium",
                      )}
                    >
                      {sale.isVat ? "Grand Total" : "Total"}
                    </td>
                    <td
                      className={cn(
                        viewTotalClass,
                        "border border-border/70 p-3 text-right",
                      )}
                    >
                      {formatRs(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Secondary details */}
            <div className="rounded-lg border border-border px-4 py-3">
              <p className={cn(viewLabelClass, "mb-3")}>Other details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                <div className="space-y-0.5">
                  <p className={viewLabelClass}>Client type</p>
                  <p className={viewValueClass}>
                    {sale.clientType || "Company"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className={viewLabelClass}>Sale type</p>
                  <p className={viewValueClass}>
                    {sale.saleType === "site" ? "Site" : "Client"}
                  </p>
                </div>
                {sale.batchNumber && (
                  <div className="space-y-0.5">
                    <p className={viewLabelClass}>Batch</p>
                    <p className={viewValueClass}>{sale.batchNumber}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className={viewLabelClass}>Updated</p>
                  <p className={viewValueClass}>
                    {sale.updatedAt
                      ? formatNepaliDateForTable(sale.updatedAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {sale.billUrl && (
              <div className="space-y-2 print:hidden">
                <Label className={viewLabelClass}>Bill Image</Label>
                <img
                  src={sale.billUrl}
                  alt="Bill"
                  className="max-h-[320px] rounded-lg border border-border object-contain"
                />
                <a
                  href={sale.billUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(textLinkClass, "text-navy hover:text-navy/80")}
                >
                  Open Full Image
                </a>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(formDialogFooterClass, "justify-between print:hidden")}
        >
          <Button
            type="button"
            variant="neutralOutline"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="neutralOutline"
              onClick={() => onOpenChange(false)}
              className="hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(sale);
              }}
            >
              Edit Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
