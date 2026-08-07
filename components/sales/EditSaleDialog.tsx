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
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  ImagePlus,
  Package,
  Tags,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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

const inputClass = formInputClass;
const selectTriggerClass = formSelectTriggerClass;
const errorTextClass = formErrorTextClass;
const editLabelClass = cn(formLabelClass, "!text-[15px] !font-normal leading-5");
const editBodyClass = cn(formDialogBodyClass, "gap-5");
const editSectionClass = cn(formSectionClass, "gap-2.5");
const editItemClass = cn(formItemCardClass, "gap-2");
const editPairClass = formGridClass;

interface EditSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  onFormChange: (data: any) => void;
  editReason: string;
  onEditReasonChange: (reason: string) => void;
  billUrl: string;
  onBillImageChange: (file: File | null) => void;
  filteredProducts: any[];
  selectedProductWeights: number[];
  clients: any[];
  fieldErrors?: Record<string, string>;
  userRole?: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export default function EditSaleDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  editReason,
  onEditReasonChange,
  billUrl,
  onBillImageChange,
  filteredProducts,
  selectedProductWeights,
  clients,
  fieldErrors = {},
  userRole,
  onSubmit,
  onCancel,
}: EditSaleDialogProps) {
  const billInputRef = useRef<HTMLInputElement>(null);
  const [billFileName, setBillFileName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBillFileName(null);
      if (billInputRef.current) billInputRef.current.value = "";
    }
  }, [isOpen]);

  const fieldErrorClass = (field: string) =>
    fieldErrors[field]
      ? "border-red-500 focus:border-red-500 dark:border-red-500"
      : "";

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? (
      <p className={errorTextClass}>{fieldErrors[field]}</p>
    ) : null;

  const firstItem = formData.items?.[0] || formData;
  const selectedProduct = filteredProducts.find(
    (p) => p.id === firstItem.productId,
  );

  const updateFirstItem = (
    updates: Partial<{
      productId: string;
      quantitySold: number;
      salePrice: number;
    }>,
  ) => {
    if (formData.items?.length) {
      const updatedItems = [...formData.items];
      updatedItems[0] = { ...updatedItems[0], ...updates };
      onFormChange({ ...formData, items: updatedItems });
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
        if (!open) {
          setBillFileName(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className={cn(formDialogClass, "max-w-4xl sm:max-w-4xl")}>
        <DialogHeader className={formDialogHeaderClass}>
          <DialogTitle
            className={cn(formTitleClass, "mb-2 border-b border-border pb-2")}
          >
            Edit Sale
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
              Update sale transaction details
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className={editBodyClass}>
            <section className={editSectionClass}>
              <h3 className={formSectionTitleClass}>
                <Tags className="h-4 w-4 text-navy/70" />
                Sale details
              </h3>
              <div className={editPairClass}>
                <div className={formFieldClass}>
                  <Label htmlFor="edit-saleType" className={editLabelClass}>
                    Sale Type *
                  </Label>
                  <Select
                    value={formData.saleType || "client"}
                    onValueChange={(value) =>
                      onFormChange({
                        ...formData,
                        saleType: value as "client" | "site",
                        ...(value === "client" ? { projectName: "" } : {}),
                      })
                    }
                  >
                    <SelectTrigger
                      id="edit-saleType"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("saleType"),
                      )}
                    >
                      <SelectValue placeholder="Select sale type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderFieldError("saleType")}
                </div>
              </div>
            </section>

            <section className={editSectionClass}>
              <h3 className={formSectionTitleClass}>
                <Users className="h-4 w-4 text-navy/70" />
                Client
              </h3>

              <div className={editPairClass}>
                <div className={formFieldClass}>
                  <Label htmlFor="edit-client" className={editLabelClass}>
                    Client *
                  </Label>
                  <Select
                    value={formData.client || undefined}
                    onValueChange={(value) =>
                      onFormChange({ ...formData, client: value })
                    }
                  >
                    <SelectTrigger
                      id="edit-client"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("client"),
                      )}
                    >
                      <SelectValue placeholder="Select client or enter custom name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">+ Add Custom Client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.client === "custom" && (
                    <Input
                      placeholder="Enter custom client name"
                      value={formData.customClient || ""}
                      onChange={(e) =>
                        onFormChange({
                          ...formData,
                          customClient: e.target.value,
                        })
                      }
                      className={cn(
                        "mt-2",
                        inputClass,
                        fieldErrorClass("customClient"),
                      )}
                    />
                  )}
                  {renderFieldError("client")}
                  {renderFieldError("customClient")}
                </div>

                <div className={formFieldClass}>
                  <Label htmlFor="edit-clientType" className={editLabelClass}>
                    Client Type *
                  </Label>
                  <Select
                    value={formData.clientType || undefined}
                    onValueChange={(value) =>
                      onFormChange({ ...formData, clientType: value })
                    }
                  >
                    <SelectTrigger
                      id="edit-clientType"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("clientType"),
                      )}
                    >
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderFieldError("clientType")}
                </div>
              </div>

              {formData.saleType === "site" && (
                <div className={formFieldClass}>
                  <Label htmlFor="edit-projectName" className={editLabelClass}>
                    Project Name *
                  </Label>
                  <Input
                    id="edit-projectName"
                    placeholder="Enter project name"
                    value={formData.projectName || ""}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        projectName: e.target.value,
                      })
                    }
                    className={cn(inputClass, fieldErrorClass("projectName"))}
                  />
                  {renderFieldError("projectName")}
                </div>
              )}
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
                    onValueChange={(value) => {
                      updateFirstItem({ productId: value });
                    }}
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
                      {filteredProducts.map((product) => (
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
                        firstItem.quantitySold === 0
                          ? ""
                          : firstItem.quantitySold
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        updateFirstItem({
                          quantitySold:
                            value === "" ? 0 : Number.parseInt(value),
                        });
                      }}
                      className={cn(
                        inputClass,
                        "w-full",
                        fieldErrorClass("quantitySold"),
                      )}
                    />
                    {renderFieldError("quantitySold")}
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
                        firstItem.salePrice === 0 ? "" : firstItem.salePrice
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        updateFirstItem({
                          salePrice:
                            value === "" ? 0 : Number.parseFloat(value),
                        });
                      }}
                      className={cn(
                        inputClass,
                        "w-full",
                        fieldErrorClass("salePrice"),
                      )}
                    />
                    {renderFieldError("salePrice")}
                  </div>
                </div>
              </div>

              {firstItem.productId && selectedProductWeights.length > 1 && (
                <div className={formFieldClass}>
                  <Label htmlFor="edit-netWeight" className={editLabelClass}>
                    Net Weight (kg) *
                  </Label>
                  <Select
                    value={String(formData.netWeight)}
                    onValueChange={(value) =>
                      onFormChange({ ...formData, netWeight: Number(value) })
                    }
                    required
                  >
                    <SelectTrigger
                      id="edit-netWeight"
                      className={cn(selectTriggerClass, "w-full")}
                    >
                      <SelectValue placeholder="Select net weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProductWeights.map((weight) => (
                        <SelectItem key={weight} value={String(weight)}>
                          {weight} kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </section>

            <section className={editSectionClass}>
              <h3 className={formSectionTitleClass}>
                <CheckCircle className="h-4 w-4 text-navy/70" />
                Payment
              </h3>

              <div className={editPairClass}>
                <div className={formFieldClass}>
                  <Label
                    htmlFor="edit-paymentStatus"
                    className={editLabelClass}
                  >
                    Payment Status *
                  </Label>
                  <Select
                    value={formData.paymentStatus || "Pending"}
                    onValueChange={(value) =>
                      onFormChange({
                        ...formData,
                        paymentStatus: value as "Pending" | "Received",
                      })
                    }
                  >
                    <SelectTrigger
                      id="edit-paymentStatus"
                      className={cn(
                        selectTriggerClass,
                        "w-full",
                        fieldErrorClass("paymentStatus"),
                      )}
                    >
                      <SelectValue placeholder="Select payment status">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2",
                            (formData.paymentStatus || "Pending") === "Received"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {(formData.paymentStatus || "Pending") ===
                          "Received" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          )}
                          {formData.paymentStatus || "Pending"}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="Pending"
                        className="text-amber-700 focus:bg-amber-50 focus:text-amber-900 dark:text-amber-400 dark:focus:bg-amber-900/25 dark:focus:text-amber-200"
                      >
                        <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem
                        value="Received"
                        className="text-emerald-700 focus:bg-emerald-50 focus:text-emerald-900 dark:text-emerald-400 dark:focus:bg-emerald-900/25 dark:focus:text-emerald-200"
                      >
                        <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Received
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {renderFieldError("paymentStatus")}
                </div>

                <div className={formFieldClass}>
                  <Label htmlFor="edit-date" className={editLabelClass}>
                    Sale Date *
                  </Label>
                  <div className="relative">
                    <MaterialDatePicker
                      className={cn(
                        selectTriggerClass,
                        "w-full justify-start pr-9 shadow-sm",
                      )}
                      value={
                        formData.saleDate
                          ? new Date(formData.saleDate)
                          : undefined
                      }
                      onChange={(date) =>
                        onFormChange({
                          ...formData,
                          saleDate: date
                            ? date.toISOString().split("T")[0]
                            : "",
                        })
                      }
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
                  </div>
                  {renderFieldError("saleDate")}
                </div>
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
              {userRole === "admin" ? "Update Sale" : "Submit Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
