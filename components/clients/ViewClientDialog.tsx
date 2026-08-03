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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Client Details</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Complete information about the selected client
          </DialogDescription>
        </DialogHeader>

        {client && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Basic Information</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Client Name</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{client.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Company Type</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{client.company}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tax ID</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-base">{client.taxId || "Not specified"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Client ID</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-base">{client.id}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Email</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{client.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Phone</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{client.phone}</p>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Address</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-base bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    {formatClientAddress(client)}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Financial Information</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Credit Limit</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    Rs {client.creditLimit?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Balance</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    Rs {client.currentBalance?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Spent</Label>
                  <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                    Rs {getClientTotalSpent(client.name).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Order Information</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Orders</Label>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    {getClientOrderCount(client.name)} orders
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Order</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                    {getClientLastOrder(client.name) ? formatNepaliDateForTable(getClientLastOrder(client.name)!) : 'No orders yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Timestamps</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Created</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                    {formatNepaliDateForTable(client.createdAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Updated</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                    {formatNepaliDateForTable(client.updatedAt || client.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Status</span>
              </h3>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${client.isActive !== false ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-base">
                    {client.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-4 py-2 text-sm font-medium">
                  Active Client
                </Badge>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Notes</span>
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 leading-relaxed text-base">
                    {client.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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
