"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Product } from "@/contexts/InventoryContext"
import { formatNepaliDateForTable } from "@/lib/utils"
import { AlertTriangle, Eye } from "lucide-react"

interface ViewProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onEdit: (product: Product) => void
}

export default function ViewProductDialog({
  isOpen,
  onOpenChange,
  product,
  onEdit,
}: ViewProductDialogProps) {
  if (!product) return null

  const lowStockThreshold = (product as Product & { lowStockThreshold?: number }).lowStockThreshold ?? 5
  const updatedAt = (product as Product & { updatedAt?: string }).updatedAt

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto border-border p-4 sm:p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-navy" />
            </div>
            <span>Product Details</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete information about the selected product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Basic Information</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Product Name</Label>
                <p className="text-sm font-normal text-navy">{product.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Category</Label>
                <p className="text-sm font-normal text-navy">{product.category}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Stock Type</Label>
                <p className={product.stockType === "new" ? "text-green-800 dark:text-green-400 py-1 text-sm font-medium" : "text-orange-800 dark:text-orange-400 py-1 text-sm font-medium"}>
                  {product.stockType === "new" ? "New Stock" : "Old Stock"}
                </p>
              </div>
            </div>
            {product.description && (
              <div className="space-y-2 mt-6">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Description</Label>
                <p className="text-sm font-normal text-navy">{product.description}</p>
              </div>
            )}
          </div>

          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Inventory Information</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Stock Quantity</Label>
                <div className="flex items-center space-x-3">
                  {product.stockQuantity <= 5 && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  <span className={`${product.stockQuantity <= 5 ? "text-navy" : "text-sm font-normal text-navy"}`}>
                    {product.stockQuantity} units
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Unit Price</Label>
                <p className="text-sm font-normal text-navy">Rs {product.unitPrice.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Total Value</Label>
                <p className="text-sm font-normal text-navy">
                  Rs {(product.stockQuantity * product.unitPrice).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Low Stock Threshold</Label>
                <p className="text-sm font-normal text-navy">{lowStockThreshold} units</p>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Supplier Information</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Supplier</Label>
                <p className="text-sm font-normal text-navy">{product.supplier}</p>
              </div>
              {product.batchNumber && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-navy uppercase tracking-wide">Batch Number</Label>
                  <p className="text-sm font-normal text-navy">{product.batchNumber}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Timestamps</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Created</Label>
                <p className="text-sm font-normal text-navy">{formatNepaliDateForTable(product.createdAt)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-navy uppercase tracking-wide">Last Updated</Label>
                <p className="text-sm font-normal text-navy">{formatNepaliDateForTable(updatedAt || product.createdAt)}</p>
              </div>
              {product.lastRestocked && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-navy uppercase tracking-wide">Last Restocked</Label>
                  <p className="text-sm font-normal text-navy">{formatNepaliDateForTable(product.lastRestocked)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <h3 className="form-section-title">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Status</span>
            </h3>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${product.isActive !== false ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-sm font-normal text-navy">
                  {product.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
              {product.stockQuantity <= 0 && (
                <Badge variant="destructive" className="px-4 py-2 text-sm font-medium">Out of Stock</Badge>
              )}
              {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 px-4 py-2 text-sm font-medium">
                  Low Stock
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button type="button" variant="neutralOutline" onClick={() => onOpenChange(false)} className="px-6 py-2">
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false)
              onEdit(product)
            }}
            className="px-6 py-2"
          >
            Edit Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
