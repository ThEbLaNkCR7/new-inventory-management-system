"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Clock } from "lucide-react"
import type { ClientFormData } from "./utils"

const inputClass =
  "border border-border bg-background focus:border-navy/50 focus-visible:ring-1 focus-visible:ring-navy/20"
const selectTriggerClass = inputClass
const errorTextClass = "text-sm text-navy"

interface UpdateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ClientFormData
  updateForm: (updates: Partial<ClientFormData>) => void
  companyOptions: string[]
  isAdmin: boolean
  approvalReason: string
  onApprovalReasonChange: (value: string) => void
  fieldErrors: Record<string, string>
  fieldErrorClass: (field: string) => string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function UpdateClientDialog({
  open,
  onOpenChange,
  formData,
  updateForm,
  companyOptions,
  isAdmin,
  approvalReason,
  onApprovalReasonChange,
  fieldErrors,
  fieldErrorClass,
  onSubmit,
  onCancel,
}: UpdateClientDialogProps) {
  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className={errorTextClass}>{fieldErrors[field]}</p> : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information
            {!isAdmin && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">Changes require admin approval</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              className={cn(inputClass, fieldErrorClass("name"))}
            />
            {renderFieldError("name")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => updateForm({ email: e.target.value })}
              className={cn(inputClass, fieldErrorClass("email"))}
            />
            {renderFieldError("email")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone *</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => updateForm({ phone: e.target.value })}
              className={cn(inputClass, fieldErrorClass("phone"))}
            />
            {renderFieldError("phone")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company">Company Type *</Label>
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
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={formData.address || ""}
              onChange={(e) => updateForm({ address: e.target.value })}
              placeholder="Enter full address"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => updateForm({ status: value })}
            >
              <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("status"))}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {renderFieldError("status")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-paymentStatus">Payment Status *</Label>
            <Select
              value={formData.paymentStatus || "Pending"}
              onValueChange={(value) =>
                updateForm({ paymentStatus: value as "Received" | "Pending" })
              }
            >
              <SelectTrigger className={cn("h-8 w-32", selectTriggerClass, fieldErrorClass("paymentStatus"))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            {renderFieldError("paymentStatus")}
          </div>
          {!isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-reason">Reason for Changes *</Label>
              <Textarea
                id="edit-reason"
                value={approvalReason}
                onChange={(e) => onApprovalReasonChange(e.target.value)}
                placeholder="Explain why you're making these changes..."
                rows={3}
                required
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="neutralOutline" onClick={onCancel}>
              Cancel
            </Button>
            {isAdmin ? (
              <Button type="submit">Update Client</Button>
            ) : (
              <Button type="submit" disabled={!approvalReason.trim()}>
                Submit for Approval
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
