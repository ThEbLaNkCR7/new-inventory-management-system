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
import { AlertTriangle, CheckCircle, Clock, ImagePlus, Package, Tags } from "lucide-react";
import React from "react";
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

const inputClass = formInputClass;
const selectTriggerClass = formSelectTriggerClass;
const errorTextClass = formErrorTextClass;

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
  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? "border-red-500 focus:border-red-500 dark:border-red-500" : "";

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className={errorTextClass}>{fieldErrors[field]}</p> : null;

  const firstItem = formData.items?.[0] || formData;

  const updateFirstItem = (updates: Partial<{ productId: string; quantitySold: number; salePrice: number }>) => {
    if (formData.items?.length) {
      const updatedItems = [...formData.items];
      updatedItems[0] = { ...updatedItems[0], ...updates };
      onFormChange({ ...formData, items: updatedItems });
      return;
    }
    onFormChange({ ...formData, ...updates });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={formDialogClass}>
        <DialogHeader className={formDialogHeaderClass}>
          <DialogTitle className={formTitleClass}>
            Edit Sale
          </DialogTitle>
          <DialogDescription className={formDescriptionClass}>
            {userRole === "admin"
              ? "Update sale transaction details"
              : "Submit sale changes for admin approval"}
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
              <Tags className="h-4 w-4 text-navy/70" />
              Sale details
            </h3>
          <div className={formGridClass}>
            <div className={formFieldClass}>
              <Label htmlFor="edit-saleType" className={formLabelClass}>Sale Type *</Label>
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
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("saleType"))}>
                  <SelectValue placeholder="Select sale type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
              {renderFieldError("saleType")}
            </div>

            <div className={formFieldClass}>
              <Label htmlFor="edit-product" className={formLabelClass}>Product *</Label>
              <Select
                value={firstItem.productId || undefined}
                onValueChange={(value) => {
                  updateFirstItem({ productId: value });
                }}
              >
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("productId"))}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {product.name} ({formatProductNetWeight(product)})
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Stock: {product.stockQuantity}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderFieldError("productId")}
            </div>
          </div>

          {firstItem.productId && selectedProductWeights.length > 1 && (
            <div className={formFieldClass}>
              <Label htmlFor="edit-netWeight">Net Weight (kg) *</Label>
              <Select
                value={String(formData.netWeight)}
                onValueChange={(value) =>
                  onFormChange({ ...formData, netWeight: Number(value) })
                }
                required
              >
                <SelectTrigger>
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

          <div className={formGridClass}>
            <div className={formFieldClass}>
              <Label htmlFor="edit-client" className={formLabelClass}>Client *</Label>
              <Select
                value={formData.client || undefined}
                onValueChange={(value) =>
                  onFormChange({ ...formData, client: value })
                }
              >
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("client"))}>
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
                    onFormChange({ ...formData, customClient: e.target.value })
                  }
                  className={cn("mt-2", inputClass, fieldErrorClass("customClient"))}
                />
              )}
              {renderFieldError("client")}
              {renderFieldError("customClient")}
            </div>

            <div className={formFieldClass}>
              <Label htmlFor="edit-clientType">Client Type *</Label>
              <Select
                value={formData.clientType || undefined}
                onValueChange={(value) =>
                  onFormChange({ ...formData, clientType: value })
                }
              >
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("clientType"))}>
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
              <Label htmlFor="edit-projectName">Project Name *</Label>
              <Input
                id="edit-projectName"
                placeholder="Enter project name"
                value={formData.projectName || ""}
                onChange={(e) =>
                  onFormChange({ ...formData, projectName: e.target.value })
                }
                className={cn(inputClass, fieldErrorClass("projectName"))}
              />
              {renderFieldError("projectName")}
            </div>
          )}

          <div className={formGridClass}>
            <div className={formFieldClass}>
              <Label htmlFor="edit-paymentStatus" className={formLabelClass}>Payment Status *</Label>
              <Select
                value={formData.paymentStatus || "Pending"}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    paymentStatus: value as "Pending" | "Received",
                  })
                }
              >
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("paymentStatus"))}>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-navy" />
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value="Received">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-brand" />
                      Received
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {renderFieldError("paymentStatus")}
            </div>

            <div className={formFieldClass}>
              <Label htmlFor="date" className={formLabelClass}>Sale Date *</Label>
              <MaterialDatePicker
                className={inputClass}
                value={
                  formData.saleDate ? new Date(formData.saleDate) : undefined
                }
                onChange={(date) =>
                  onFormChange({
                    ...formData,
                    saleDate: date ? date.toISOString().split("T")[0] : "",
                  })
                }
              />
              {renderFieldError("saleDate")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={formFieldClass}>
              <Label htmlFor="edit-quantity" className={formLabelClass}>Quantity *</Label>
              <Input
                id="edit-quantity"
                type="number"
                min={1}
                value={firstItem.quantitySold === 0 ? "" : firstItem.quantitySold}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFirstItem({
                    quantitySold: value === "" ? 0 : Number.parseInt(value),
                  });
                }}
                className={cn(inputClass, fieldErrorClass("quantitySold"))}
              />
              {renderFieldError("quantitySold")}
            </div>
            <div className={formFieldClass}>
              <Label htmlFor="edit-price" className={formLabelClass}>Unit Price (Rs) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min={0}
                value={firstItem.salePrice === 0 ? "" : firstItem.salePrice}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFirstItem({
                    salePrice: value === "" ? 0 : Number.parseFloat(value),
                  });
                }}
                className={cn(inputClass, fieldErrorClass("salePrice"))}
              />
              {renderFieldError("salePrice")}
            </div>
          </div>
          </section>

          <section className={formSectionClass}>
            <h3 className={formSectionTitleClass}>
              <ImagePlus className="h-4 w-4 text-navy/70" />
              Bill
            </h3>
            <div className={formFieldClass}>
              <Label className={formLabelClass}>Bill Image</Label>
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
              {userRole === "admin" ? "Update Sale" : "Submit Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
