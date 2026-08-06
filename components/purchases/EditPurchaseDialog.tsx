import { formatProductNetWeight } from "@/components/products/utils";
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
import {
  formDescriptionClass,
  formDialogBodyClass,
  formDialogClass,
  formDialogFooterClass,
  formDialogHeaderClass,
  formErrorTextClass,
  formFieldClass,
  formGridClass,
  formInputClass,
  formLabelClass,
  formSectionClass,
  formSectionTitleClass,
  formSelectTriggerClass,
  formTitleClass,
} from "@/lib/form-styles";
import { AlertTriangle, ImagePlus, Package, Receipt, Truck } from "lucide-react";
import React from "react";

const inputClass = formInputClass;
const selectTriggerClass = formSelectTriggerClass;
const errorTextClass = formErrorTextClass;

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
      <DialogContent className={formDialogClass}>
        <DialogHeader className={formDialogHeaderClass}>
          <DialogTitle className={formTitleClass}>
            Edit Purchase
          </DialogTitle>
          <DialogDescription className={formDescriptionClass}>
            {userRole === "admin"
              ? "Update purchase order details"
              : "Submit purchase changes for admin approval"}
            {userRole !== "admin" && (
              <span className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium leading-5 text-navy">
                <AlertTriangle className="h-4 w-4 shrink-0 text-navy" />
                Changes require admin approval
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className={formDialogBodyClass}>
          <section className={formSectionClass}>
            <h3 className={formSectionTitleClass}>
              <Package className="h-4 w-4 text-navy/70" />
              Products
            </h3>
          <div className={formFieldClass}>
            <Label htmlFor="edit-product" className={formLabelClass}>Product *</Label>
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
                    {product.name} ({formatProductNetWeight(product)}) — Stock:{" "}
                    {product.stockQuantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldError("productId")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={formFieldClass}>
              <Label htmlFor="edit-quantity" className={formLabelClass}>Quantity *</Label>
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
            <div className={formFieldClass}>
              <Label htmlFor="edit-price" className={formLabelClass}>Unit Price (Rs) *</Label>
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
          </section>

          <section className={formSectionClass}>
            <h3 className={formSectionTitleClass}>
              <Truck className="h-4 w-4 text-navy/70" />
              Supplier & details
            </h3>
          <div className={formGridClass}>
            <div className={formFieldClass}>
              <Label htmlFor="edit-supplier" className={formLabelClass}>Supplier *</Label>
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
            <div className={formFieldClass}>
              <Label htmlFor="edit-supplierType" className={formLabelClass}>Supplier Type *</Label>
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
          </div>
          <div className={formGridClass}>
            <div className={formFieldClass}>
              <Label htmlFor="edit-date" className={formLabelClass}>Purchase Date *</Label>
              <MaterialDatePicker
                className={inputClass}
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
          </div>
          </section>

          <section className={formSectionClass}>
            <h3 className={formSectionTitleClass}>
              <Receipt className="h-4 w-4 text-navy/70" />
              Options
            </h3>
            <div className={formFieldClass}>
              <Label className={formLabelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                  Bill Image
                </span>
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onBillImageChange(e.target.files[0]);
                  }
                }}
                className={inputClass}
              />
              {billUrl && (
                <a
                  href={billUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                >
                  View Existing Bill
                </a>
              )}
            </div>
          </section>
          {userRole !== "admin" && (
            <div className={formFieldClass}>
              <Label htmlFor="edit-reason" className={formLabelClass}>Reason for Changes *</Label>
              <Input
                id="edit-reason"
                value={editReason}
                onChange={(e) => onEditReasonChange(e.target.value)}
                placeholder="Explain the changes..."
                required
                className={inputClass}
              />
            </div>
          )}
          </div>
          <div className={formDialogFooterClass}>
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
