import { formatProductNetWeight } from "@/components/products/utils";
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
import { AlertTriangle, Edit } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";
const selectTriggerClass = inputClass;
const errorTextClass = "text-sm text-red-600 dark:text-red-400";

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
            <span>Edit Sale</span>
          </DialogTitle>
          <DialogDescription>
            {userRole === "admin"
              ? "Edit sale transaction"
              : "Submit sale changes for admin approval"}
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
                      <span className="text-sm text-gray-500">
                        Stock: {product.stockQuantity}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFieldError("productId")}
          </div>

          {firstItem.productId && selectedProductWeights.length > 1 && (
            <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="edit-client">Client *</Label>
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

          <div className="space-y-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="edit-price">Unit Price (Rs) *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="date">Sale Date *</Label>
            <MaterialDatePicker
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
              {userRole === "admin" ? "Update Sale" : "Submit Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
