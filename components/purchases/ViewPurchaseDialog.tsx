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
import type { Purchase } from "@/contexts/InventoryContext";
import { formatNepaliDateForTable } from "@/lib/utils";
import { Eye } from "lucide-react";
import React from "react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Purchase Details</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Complete information about the selected purchase transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Purchase Information</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Product
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-medium text-base">
                  {purchase.productName}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Supplier
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-medium text-base">
                  {purchase.supplier}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Purchase Date
                </Label>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                  {formatNepaliDateForTable(purchase.purchaseDate)}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Transaction ID
                </Label>
                <p className="text-gray-700 dark:text-gray-300 font-mono text-base">
                  {purchase.id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Transaction Details</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Quantity Purchased
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  {purchase.quantityPurchased} units
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Unit Price
                </Label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  Rs {purchase.purchasePrice.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Amount
                </Label>
                <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                  Rs{" "}
                  {(
                    purchase.quantityPurchased * purchase.purchasePrice
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Timestamps</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Created
                </Label>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                  {purchase.createdAt
                    ? formatNepaliDateForTable(purchase.createdAt)
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Last Updated
                </Label>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                  {purchase.updatedAt || purchase.createdAt
                    ? formatNepaliDateForTable(
                      purchase.updatedAt || purchase.createdAt!,
                    )
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Status</span>
            </h3>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full ${purchase.isActive !== false ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium text-base">
                  {purchase.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-4 py-2 text-sm font-medium"
              >
                Completed
              </Badge>
            </div>
          </div>

          {purchase.billUrl && (
            <div className="space-y-2">
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
                className="text-blue-600 underline text-sm"
              >
                Open Full Image
              </a>
            </div>
          )}
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
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit(purchase);
            }}
            className="px-6 py-2"
          >
            Edit Purchase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}