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
import { TrendingUp } from "lucide-react";
import React from "react";

interface ProductHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  sales: any[];
  purchases: any[];
}

export default function ProductHistoryDialog({
  isOpen,
  onOpenChange,
  product,
  sales,
  purchases,
}: ProductHistoryDialogProps) {
  if (!product) return null;

  const currentYear = getCurrentNepaliYear();
  const productSales = sales.filter(
    (sale) =>
      sale.productName === product.name &&
      getNepaliYear(sale.saleDate) === currentYear,
  );
  const productPurchases = purchases.filter(
    (purchase) =>
      purchase.productName === product.name &&
      getNepaliYear(purchase.purchaseDate) === currentYear,
  );

  const totalSalesQuantity = productSales.reduce(
    (sum, sale) => sum + sale.quantitySold,
    0,
  );
  const totalSalesValue = productSales.reduce(
    (sum, sale) => sum + sale.quantitySold * sale.salePrice,
    0,
  );
  const totalPurchaseQuantity = productPurchases.reduce(
    (sum, purchase) => sum + purchase.quantityPurchased,
    0,
  );
  const totalPurchaseValue = productPurchases.reduce(
    (sum, purchase) =>
      sum + purchase.quantityPurchased * purchase.purchasePrice,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Product Transaction History</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Complete transaction history for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Product Summary</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Product Name
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  {product?.name}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Current Stock
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  {product?.stockQuantity} units
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Unit Price
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  Rs {product?.unitPrice?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Year Statistics */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{currentYear} Statistics</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Sales
                </Label>
                <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                  {totalSalesQuantity} units
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Rs {totalSalesValue.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Purchases
                </Label>
                <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                  {totalPurchaseQuantity} units
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Rs {totalPurchaseValue.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Net Movement
                </Label>
                <p
                  className={`font-semibold text-lg ${totalPurchaseQuantity - totalSalesQuantity >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {totalPurchaseQuantity - totalSalesQuantity} units
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {totalPurchaseQuantity - totalSalesQuantity >= 0
                    ? "Net Inflow"
                    : "Net Outflow"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Profit Margin
                </Label>
                <p
                  className={`font-semibold text-lg ${totalSalesValue - totalPurchaseValue >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                    }`}
                >
                  Rs {(totalSalesValue - totalPurchaseValue).toLocaleString()}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {totalPurchaseValue > 0
                    ? `${(((totalSalesValue - totalPurchaseValue) / totalPurchaseValue) * 100).toFixed(1)}% margin`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Sales Transactions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sales Transactions ({productSales.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Client
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
                  {productSales.length > 0 ? (
                    productSales.map((sale) => (
                      <TableRow
                        key={sale.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      >
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {formatNepaliDateForTable(sale.saleDate)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {sale.client}
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
                        No sales transactions found for this product in{" "}
                        {currentYear}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Purchase Transactions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Purchase Transactions ({productPurchases.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Supplier
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
                  {productPurchases.length > 0 ? (
                    productPurchases.map((purchase) => (
                      <TableRow
                        key={purchase.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      >
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {formatNepaliDateForTable(purchase.purchaseDate)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {purchase.supplier}
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
                            purchase.quantityPurchased * purchase.purchasePrice
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
                        No purchase transactions found for this product in{" "}
                        {currentYear}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

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
