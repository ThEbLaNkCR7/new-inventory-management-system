"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Clock, Plus } from "lucide-react"
import type { SupplierFormData } from "./utils"

const inputClass =
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
const selectTriggerClass = inputClass
const errorTextClass = "text-sm text-red-600 dark:text-red-400"

interface AddSupplierPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: SupplierFormData
  updateForm: (updates: Partial<SupplierFormData>) => void
  companyOptions: string[]
  isAdmin: boolean
  fieldErrors: Record<string, string>
  fieldErrorClass: (field: string) => string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  onResetForm: () => void
  validateForm: () => boolean
  showApprovalDialog: boolean
  onShowApprovalDialogChange: (open: boolean) => void
  approvalReason: string
  onApprovalReasonChange: (value: string) => void
  onSubmitForApproval: () => void
}

export default function AddSupplierPageDialog({
  open,
  onOpenChange,
  formData,
  updateForm,
  companyOptions,
  isAdmin,
  fieldErrors,
  fieldErrorClass,
  onSubmit,
  onCancel,
  onResetForm,
  validateForm,
  showApprovalDialog,
  onShowApprovalDialogChange,
  approvalReason,
  onApprovalReasonChange,
  onSubmitForApproval,
}: AddSupplierPageDialogProps) {
  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className={errorTextClass}>{fieldErrors[field]}</p> : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button
            onClick={() => { onResetForm(); onOpenChange(true); }}
            variant="neutral"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Enter supplier information to add to your database
              {!isAdmin && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center text-amber-800 dark:text-amber-200">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Changes require admin approval</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                className={cn(inputClass, fieldErrorClass("name"))}
              />
              {renderFieldError("name")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                className={cn(inputClass, fieldErrorClass("email"))}
              />
              {renderFieldError("email")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                className={cn(inputClass, fieldErrorClass("phone"))}
              />
              {renderFieldError("phone")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Type *</Label>
              <div className="space-y-2">
                <Select
                  value={formData.company}
                  onValueChange={(value) => updateForm({ company: value })}
                >
                  <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("company"))}>
                    <SelectValue placeholder="Select company type or enter custom type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="custom">+ Add Custom Company Type</SelectItem>
                    {companyOptions.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("company")}
                {formData.company === "custom" && (
                  <Input
                    placeholder="Enter custom company type"
                    value={formData.customCompany || ""}
                    onChange={(e) => updateForm({ customCompany: e.target.value })}
                    className={cn("mt-2", inputClass, fieldErrorClass("customCompany"))}
                  />
                )}
                {formData.company === "custom" && renderFieldError("customCompany")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Enter full address"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => updateForm({ status: value })}>
                <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("status"))}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {renderFieldError("status")}
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="neutralOutline" onClick={onCancel}>
                Cancel
              </Button>
              {isAdmin ? (
                <Button type="submit">
                  Add Supplier
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    if (!validateForm()) return
                    onShowApprovalDialogChange(true)
                  }}
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Reason Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={onShowApprovalDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>Please provide a reason for this supplier request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                value={approvalReason}
                onChange={(e) => onApprovalReasonChange(e.target.value)}
                placeholder="Explain why this supplier should be added..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="neutralOutline" onClick={() => onShowApprovalDialogChange(false)}>
                Cancel
              </Button>
              <Button onClick={onSubmitForApproval} disabled={!approvalReason.trim()}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
