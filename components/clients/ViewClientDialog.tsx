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
import { formatNepaliDateForTable } from "@/lib/utils"
import { Eye } from "lucide-react"

interface ViewClientDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 client: any
 formatClientAddress: (client: any) => string
 getClientTotalSpent: (name: string) => number
 getClientOrderCount: (name: string) => number
 getClientLastOrder: (name: string) => string | null | undefined
 onEdit: (client: any) => void
}

export default function ViewClientDialog({
 open,
 onOpenChange,
 client,
 formatClientAddress,
 getClientTotalSpent,
 getClientOrderCount,
 getClientLastOrder,
 onEdit,
}: ViewClientDialogProps) {
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border">
 <DialogHeader className="pb-6">
 <DialogTitle className="flex items-center gap-3">
 <div className="p-2 bg-muted dark:bg-muted rounded-lg">
 <Eye className="h-6 w-6 text-navy" />
 </div>
 <span>Client Details</span>
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 Complete information about the selected client
 </DialogDescription>
 </DialogHeader>

 {client && (
 <div className="space-y-6">
 {/* Basic Information */}
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Basic Information</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Client Name</Label>
 <p className="text-navy text-sm font-medium">{client.name}</p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Company Type</Label>
 <p className="text-navy text-sm font-medium">{client.company}</p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tax ID</Label>
 <p className="text-navy font-mono text-base">{client.taxId || "Not specified"}</p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Client ID</Label>
 <p className="text-navy font-mono text-base">{client.id}</p>
 </div>
 </div>
 </div>

 {/* Contact Information */}
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Contact Information</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
 <p className="text-navy text-sm font-medium">{client.email}</p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Phone</Label>
 <p className="text-navy text-sm font-medium">{client.phone}</p>
 </div>
 <div className="space-y-2 lg:col-span-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Address</Label>
 <p className="text-navy text-sm font-medium bg-card p-3 rounded-lg border border-border">
 {formatClientAddress(client)}
 </p>
 </div>
 </div>
 </div>

 {/* Financial Information */}
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Financial Information</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Credit Limit</Label>
 <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
 Rs {client.creditLimit?.toLocaleString() || "0"}
 </p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Current Balance</Label>
 <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
 Rs {client.currentBalance?.toLocaleString() || "0"}
 </p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Spent</Label>
 <p className="text-lg font-semibold tracking-tight tabular-nums text-navy">
 Rs {getClientTotalSpent(client.name).toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 {/* Order Information */}
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Order Information</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Orders</Label>
 <p className="text-navy text-lg font-semibold tracking-tight tabular-nums">
 {getClientOrderCount(client.name)} orders
 </p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Last Order</Label>
 <p className="text-navy text-sm font-medium">
 {getClientLastOrder(client.name) ? formatNepaliDateForTable(getClientLastOrder(client.name)!) : 'No orders yet'}
 </p>
 </div>
 </div>
 </div>

 {/* Timestamps */}
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Timestamps</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Created</Label>
 <p className="text-navy text-sm font-medium">
 {formatNepaliDateForTable(client.createdAt)}
 </p>
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Last Updated</Label>
 <p className="text-navy text-sm font-medium">
 {formatNepaliDateForTable(client.updatedAt || client.createdAt)}
 </p>
 </div>
 </div>
 </div>

 {/* Status */}
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Status</span>
 </h3>
 <div className="flex items-center space-x-6">
 <div className="flex items-center space-x-3">
 <div className={`w-4 h-4 rounded-full ${client.isActive !== false ? "bg-muted" : "bg-muted"}`}></div>
 <span className="text-navy text-sm font-medium">
 {client.isActive !== false ? "Active" : "Inactive"}
 </span>
 </div>
 <Badge variant="secondary" className="bg-secondary text-navy px-4 py-2 text-sm font-medium">
 Active Client
 </Badge>
 </div>
 </div>

 {/* Notes */}
 {client.notes && (
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>Notes</span>
 </h3>
 <div className="space-y-2">
 <p className="text-navy bg-card p-4 rounded-lg border border-border leading-relaxed text-base">
 {client.notes}
 </p>
 </div>
 </div>
 )}
 </div>
 )}

 <div className="flex justify-end space-x-3 pt-6 border-t border-border">
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
 onOpenChange(false)
 onEdit(client)
 }}
 className="px-6 py-2"
 >
 Edit Client
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}
