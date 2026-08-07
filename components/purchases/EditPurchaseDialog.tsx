"use client";

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
  formItemCardClass,
  formLabelClass,
  formSectionClass,
  formSectionTitleClass,
  formSelectTriggerClass,
  formTitleClass,
} from "@/lib/form-styles";
import {
  AlertTriangle,
  Calendar,
  ImagePlus,
  Package,
  Truck,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

const inputClass = formInputClass;
const selectTriggerClass = formSelectTriggerClass;
const errorTextClass = formErrorTextClass;
const editLabelClass = cn(formLabelClass, "!text-[15px] !font-normal leading-5");
const editBodyClass = cn(formDialogBodyClass, "gap-5");
const editSectionClass = cn(formSectionClass, "gap-2.5");
const editItemClass = cn(formItemCardClass, "gap-2");
const editPairClass = formGridClass;

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
  const billInputRef = useRef<HTMLInputElement>(null);
  const [billFileName, setBillFileName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBillFileName(null);
      if (billInputRef.current) billInputRef.current.value = "";
    }
  }, [isOpen]);

  const supplierOptions = useMemo(() => {
    const seen = new Set<string>();
    const unique = suppliers.filter((supplier) => {
      const key = supplier.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!formData.supplier || formData.supplier === "custom") return unique;

    const selectedKey = formData.supplier.trim().toLowerCase();
    const exists = unique.some(
      (supplier) => supplier.name.trim().toLowerCase() === selectedKey,
    );
    if (exists) return unique;

    return [
      ...unique,
      { id: `pending-${formData.supplier}`, name: formData.supplier },
    ];
  }, [suppliers, formData.supplier]);

  const fieldErrorClass = (field: string) =>
    fieldErrors[field]
      ? "border-red-500 focus:border-red-500 dark:border-red-500"
      : "";

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? (
      <p className={errorTextClass}>{fieldErrors[field]}</p>
    ) : null;

  const firstItem = formData.items?.[0] || {
    productId: formData.productId || "",
    quantityPurchased: formData.quantityPurchased || 0,
    purchasePrice: formData.purchasePrice || 0,
  };

  const selectedProduct = products.find((p) => p.id === firstItem.productId);

  const updateFirstItem = (
    updates: Partial<{
      productId: string;
      quantityPurchased: number;
      purchasePrice: number;
    }>,
  ) => {
    if (formData.items?.length) {
      const updatedItems = [...formData.items];
      updatedItems[0] = { ...updatedItems[0], ...updates };
      onFormChange({ ...formData, items: updatedItems, ...updates });
      return;
    }
    onFormChange({ ...formData, ...updates });
  };

  const clearBillFile = () => {
    setBillFileName(null);
    onBillImageChange(null);
    if (billInputRef.current) billInputRef.current.value = "";
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setBillFileName(null);
        onOpenChange(open);
      }}
    >
      <DialogContent className={cn(formDialogClass, "max-w-4xl sm:max-w-4xl")}>
        <DialogHeader className={formDialogHeaderClass}>
          <DialogTitle
            className={cn(formTitleClass, "mb-2 border-b border-border pb-2")}
          >
            Edit Purchase
          </DialogTitle>
          {userRole !== "admin" ? (
            <DialogDescription className={formDescriptionClass}>
              <span className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium leading-5 text-navy">
                <AlertTriangle className="h-4 w-4 shrink-0 text-navy" />
                Changes require admin approval
              </span>
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Update purchase order details
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className={editBodyClass}>
            <section className={editSectionClass}>
              <h3 className={formSectionTitleClass}>
                <Truck className="h-4 w-4 text-navy/70" />
                Supplier
              </h3>
              <div className={editPairClass}>
                <div className={formFieldClass}>
                  <Label htmlFor="edit-supplier" className={editLabelClass}>
                    Supplier *
                  </Label>
                  <Select
                    value={formData.supplier || undefined}
                    onValueChange={(value) => onFormChange({ supplier: value })}
                  >
                    <SelectTrigger
                      id="edit-supplier"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("supplier"),
                      )}
                    >
                      <SelectValue placeholder="Select supplier or enter custom name">
                        {formData.supplier && formData.supplier !== "custom"
                          ? formData.supplier
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">+ Add Custom Supplier</SelectItem>
                      {supplierOptions.map((supplier) => (
                        <SelectItem
                          key={supplier.id || supplier.name}
                          value={supplier.name}
                        >
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
                      className={cn(
                        "mt-2",
                        inputClass,
                        fieldErrorClass("customSupplier"),
                      )}
                    />
                  )}
                  {renderFieldError("supplier")}
                  {renderFieldError("customSupplier")}
                </div>
                <div className={formFieldClass}>
                  <Label htmlFor="edit-supplierType" className={editLabelClass}>
                    Supplier Type *
                  </Label>
                  <Select
                    value={formData.supplierType || undefined}
                    onValueChange={(value) =>
                      onFormChange({ supplierType: value })
                    }
                  >
                    <SelectTrigger
                      id="edit-supplierType"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("supplierType"),
                      )}
                    >
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
            </section>

            <section className={editSectionClass}>
              <h3 className={formSectionTitleClass}>
                <Package className="h-4 w-4 text-navy/70" />
                Products
              </h3>
              <div className={editItemClass}>
                <div className={formFieldClass}>
                  <Label htmlFor="edit-product" className={editLabelClass}>
                    Product *
                  </Label>
                  <Select
                    value={firstItem.productId || undefined}
                    onValueChange={(value) =>
                      updateFirstItem({ productId: value })
                    }
                  >
                    <SelectTrigger
                      id="edit-product"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("productId"),
                      )}
                    >
                      <SelectValue placeholder="Select product">
                        {selectedProduct
                          ? `${selectedProduct.name} (${formatProductNetWeight(selectedProduct)}) — Stock: ${selectedProduct.stockQuantity}`
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({formatProductNetWeight(product)}) —
                          Stock: {product.stockQuantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderFieldError("productId")}
                </div>
                <div className={editPairClass}>
                  <div className={formFieldClass}>
                    <Label htmlFor="edit-quantity" className={editLabelClass}>
                      Quantity *
                    </Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      min={1}
                      placeholder="Qty"
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
                      className={cn(
                        inputClass,
                        "w-full",
                        fieldErrorClass("quantityPurchased"),
                      )}
                    />
                    {renderFieldError("quantityPurchased")}
                  </div>
                  <div className={formFieldClass}>
                    <Label htmlFor="edit-price" className={editLabelClass}>
                      Unit Price *
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Price"
                      value={
                        firstItem.purchasePrice === 0
                          ? ""
                          : firstItem.purchasePrice
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        updateFirstItem({
                          purchasePrice:
                            value === "" ? 0 : Number.parseFloat(value),
                        });
                      }}
                      className={cn(
                        inputClass,
                        "w-full",
                        fieldErrorClass("purchasePrice"),
                      )}
                    />
                    {renderFieldError("purchasePrice")}
                  </div>
                </div>
              </div>
            </section>

            <section className={editSectionClass}>
              <h3 className={formSectionTitleClass}>
                <Calendar className="h-4 w-4 text-navy/70" />
                Details
              </h3>
              <div className={editPairClass}>
                <div className={formFieldClass}>
                  <Label htmlFor="edit-date" className={editLabelClass}>
                    Purchase Date *
                  </Label>
                  <div className="relative">
                    <MaterialDatePicker
                      className={cn(
                        selectTriggerClass,
                        "w-full justify-start pr-9 shadow-sm",
                      )}
                      value={
                        formData.purchaseDate
                          ? new Date(formData.purchaseDate)
                          : undefined
                      }
                      onChange={(date) =>
                        onFormChange({
                          purchaseDate: date
                            ? date.toISOString().split("T")[0]
                            : "",
                        })
                      }
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
                  </div>
                  {renderFieldError("purchaseDate")}
                </div>

                <div className={formFieldClass}>
                  <Label htmlFor="edit-bill" className={editLabelClass}>
                    Bill Image
                  </Label>
                  <div className="flex h-10 min-w-0 items-center gap-2 overflow-hidden">
                    <Button
                      type="button"
                      variant="neutralOutline"
                      className="h-10 shrink-0 gap-2 border-primary/30 bg-primary/5 px-3 text-primary shadow-none hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                      onClick={() => billInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Choose bill image</span>
                      <span className="sm:hidden">Choose</span>
                    </Button>
                    {billFileName ? (
                      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                        <span
                          className="min-w-0 truncate text-sm text-navy"
                          title={billFileName}
                        >
                          {billFileName}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Clear file"
                          className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          onClick={clearBillFile}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="min-w-0 truncate text-sm !text-muted-foreground/50">
                        No file chosen
                      </span>
                    )}
                  </div>
                  <input
                    ref={billInputRef}
                    type="file"
                    id="edit-bill"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setBillFileName(file?.name ?? null);
                      onBillImageChange(file);
                    }}
                    className="sr-only"
                  />
                  {billUrl && (
                    <a
                      href={billUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans text-sm font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                    >
                      View Existing Bill
                    </a>
                  )}
                </div>
              </div>
            </section>

            {userRole !== "admin" && (
              <div className={formFieldClass}>
                <Label htmlFor="edit-reason" className={editLabelClass}>
                  Reason for Changes *
                </Label>
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
            <Button
              type="button"
              variant="neutralOutline"
              onClick={() => {
                setBillFileName(null);
                onCancel();
              }}
              className="hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
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
