"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialDatePicker } from "@/components/ui/MaterialDatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, Supplier } from "@/contexts/InventoryContext";
import { cn } from "@/lib/utils";
import { AlertTriangle, Edit } from "lucide-react";
import React from "react";

const inputClass =
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";
const selectTriggerClass = inputClass;
const errorTextClass = "text-sm text-red-600 dark:text-red-400";

export type PurchaseFormData = {
  productId?: string;
  supplier: string;
  supplierType: string;
  customSupplier: string;
  quantityPurchased?: number;
  purchasePrice?: number;
  purchaseDate: string;
  items: Array<{
    productId: string;
    quantityPurchased: number;
    purchasePrice: number;
  }>;
};

interface EditPurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PurchaseFormData;
  onFormChange: (updates: Partial<PurchaseFormData>) => void;
  editReason: string;
  onEditReasonChange: (reason: string) => void;
  billUrl: string;
  onBillImageChange: (file: File | null) => void;
  products: Product[];
  suppliers: Supplier[];
  fieldErrors?: Record<string, string>;
  userRole?: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export default function EditPurchaseDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  editReason,
  onEditReasonChange,
  billUrl,
  onBillImageChange,
  products,
  suppliers,
  fieldErrors = {},
  userRole,
  onSubmit,
  onCancel,
}: EditPurchaseDialogProps) {
  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? "border-red-500 focus:border-red-500 dark:border-red-500" : "";

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className={errorTextClass}>{fieldErrors[field]}</p> : null;

  const firstItem = formData.items?.[0] || {
    productId: formData.productId || "",
    quantityPurchased: formData.quantityPurchased || 0,
    purchasePrice: formData.purchasePrice || 0,
  };

  const updateFirstItem = (
    updates: Partial<{ productId: string; quantityPurchased: number; purchasePrice: number }>,
  ) => {
    if (formData.items?.length) {
      const updatedItems = [...formData.items];
      updatedItems[0] = { ...updatedItems[0], ...updates };
      onFormChange({ ...formData, items: updatedItems, ...updates });
      return;
    }
    onFormChange({ ...formData, ...updates });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Purchase</span>
          </DialogTitle>
          <DialogDescription>
            {userRole === "admin"
              ? "Edit purchase order"
              : "Submit purchase changes for admin approval"}
          </DialogDescription>
        </DialogHeader>
        {userRole !== "admin" && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your changes will be submitted for admin approval before being
              applied.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-product">Product *</Label>
            <Select
              value={firstItem.productId || undefined}
              onValueChange={(value) => updateFirstItem({ productId: value })}
            >
              <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("productId"))}>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.netWeight}kg (Stock:{" "}
                    {product.stockQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldError("productId")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-supplier">Supplier *</Label>
            <div className="space-y-2">
              <Select
                value={formData.supplier || undefined}
                onValueChange={(value) => onFormChange({ supplier: value })}
              >
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("supplier"))}>
                  <SelectValue placeholder="Select supplier or enter custom name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">+ Add Custom Supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.supplier === "custom" && (
                <Input
                  placeholder="Enter custom supplier name"
                  value={formData.customSupplier || ""}
                  onChange={(e) =>
                    onFormChange({ customSupplier: e.target.value })
                  }
                  className={cn("mt-2", inputClass, fieldErrorClass("customSupplier"))}
                />
              )}
              {renderFieldError("supplier")}
              {renderFieldError("customSupplier")}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-supplierType">Supplier Type *</Label>
            <Select
              value={formData.supplierType || undefined}
              onValueChange={(value) => onFormChange({ supplierType: value })}
            >
              <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("supplierType"))}>
                <SelectValue placeholder="Select supplier type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
              </SelectContent>
            </Select>
            {renderFieldError("supplierType")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity *</Label>
              <Input
                id="edit-quantity"
                type="number"
                min={1}
                value={
                  firstItem.quantityPurchased === 0
                    ? ""
                    : firstItem.quantityPurchased
                }
                onChange={(e) => {
                  const value = e.target.value;
                  updateFirstItem({
                    quantityPurchased:
                      value === "" ? 0 : Number.parseInt(value, 10),
                  });
                }}
                className={cn(inputClass, fieldErrorClass("quantityPurchased"))}
              />
              {renderFieldError("quantityPurchased")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Unit Price (Rs) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min={0}
                value={
                  firstItem.purchasePrice === 0 ? "" : firstItem.purchasePrice
                }
                onChange={(e) => {
                  const value = e.target.value;
                  updateFirstItem({
                    purchasePrice:
                      value === "" ? 0 : Number.parseFloat(value),
                  });
                }}
                className={cn(inputClass, fieldErrorClass("purchasePrice"))}
              />
              {renderFieldError("purchasePrice")}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">Purchase Date *</Label>
            <MaterialDatePicker
              value={
                formData.purchaseDate
                  ? new Date(formData.purchaseDate)
                  : undefined
              }
              onChange={(date) =>
                onFormChange({
                  purchaseDate: date ? date.toISOString().split("T")[0] : "",
                })
              }
            />
            {renderFieldError("purchaseDate")}
          </div>
          <div className="space-y-2">
            <Label>Bill Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onBillImageChange(e.target.files[0]);
                }
              }}
            />
            {billUrl && (
              <a
                href={billUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm underline"
              >
                View Existing Bill
              </a>
            )}
          </div>
          {userRole !== "admin" && (
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Reason for Changes *</Label>
              <Input
                id="edit-reason"
                value={editReason}
                onChange={(e) => onEditReasonChange(e.target.value)}
                placeholder="Explain the changes..."
                required
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="neutralOutline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {userRole === "admin" ? "Update Purchase" : "Submit Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
