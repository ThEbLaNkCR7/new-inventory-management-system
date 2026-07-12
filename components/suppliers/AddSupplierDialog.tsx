"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import { useToast } from "@/components/ui/use-toast"
import { useApproval } from "@/contexts/ApprovalContext"
import { useAuth } from "@/contexts/AuthContext"
import { useInventory } from "@/contexts/InventoryContext"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { validateSupplierFormData } from "./utils"

const inputClass =
  "border-2 focus:border-slate-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
const selectTriggerClass = inputClass
const errorTextClass = "text-sm text-red-600 dark:text-red-400"

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  customCompany: "",
  address: "",
  status: "Active",
}

const isPortaledSelectClick = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest("[data-radix-select-content]") ||
    target.closest("[data-radix-popper-content-wrapper]")
  )
}

interface AddSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSupplierAdded: (supplierName: string, supplierId?: string) => void
}

export default function AddSupplierDialog({
  open,
  onOpenChange,
  onSupplierAdded,
}: AddSupplierDialogProps) {
  const { suppliers, addSupplier } = useInventory()
  const { submitChange } = useApproval()
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === "admin"

  const [formData, setFormData] = useState(initialFormData)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalReason, setApprovalReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const clearFieldErrors = (...fields: string[]) => {
    setFieldErrors((prev) => {
      if (fields.length === 0) return {}
      const next = { ...prev }
      fields.forEach((field) => delete next[field])
      return next
    })
  }

  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? "border-red-500 focus:border-red-500 dark:border-red-500" : ""

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <p className={errorTextClass}>{fieldErrors[field]}</p> : null

  const updateForm = (updates: Partial<typeof initialFormData>) => {
    clearFieldErrors(...Object.keys(updates))
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const validateForm = () => {
    const errors = validateSupplierFormData(formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast({
        title: "Validation Error",
        description: Object.values(errors)[0],
        variant: "destructive",
      })
      return false
    }
    clearFieldErrors()
    return true
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setApprovalReason("")
    setShowApprovalDialog(false)
    clearFieldErrors()
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const buildSupplierData = () => {
    const companyName = formData.company === "custom" ? formData.customCompany : formData.company
    const { customCompany, ...supplierData } = formData
    return {
      ...supplierData,
      company: companyName,
      orders: 0,
      totalSpent: 0,
      lastOrder: new Date().toISOString().split("T")[0],
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    const newSupplierData = buildSupplierData()

    setIsSubmitting(true)
    try {
      const addedSupplier = await addSupplier(newSupplierData)
      toast({ title: "Success", description: "Supplier added successfully!" })
      onSupplierAdded(addedSupplier.name || newSupplierData.name, addedSupplier.id)
      onOpenChange(false)
      resetForm()
    } catch {
      toast({ title: "Error", description: "Failed to add supplier.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitForApproval = () => {
    if (!validateForm()) return
    submitChange({
      type: "supplier",
      action: "create",
      proposedData: buildSupplierData(),
      requestedBy: user?.email || "",
      reason: approvalReason,
    })
    toast({
      title: "Submitted",
      description: "Supplier request submitted for approval.",
    })
    onOpenChange(false)
    resetForm()
  }

  const companyOptions = [...new Set(suppliers.map((supplier) => supplier.company).filter(Boolean))]

  const keepDialogOpenOnSelect = (event: Event) => {
    if (isPortaledSelectClick(event.target)) {
      event.preventDefault()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) clearFieldErrors()
      }}>
        <DialogContent
          className="max-w-md z-[101]"
          overlayClassName="z-[100]"
          onPointerDownOutside={keepDialogOpenOnSelect}
          onInteractOutside={keepDialogOpenOnSelect}
        >
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-supplier-name">Full Name *</Label>
              <Input
                id="add-supplier-name"
                value={formData.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                className={cn(inputClass, fieldErrorClass("name"))}
              />
              {renderFieldError("name")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-email">Email *</Label>
              <Input
                id="add-supplier-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                className={cn(inputClass, fieldErrorClass("email"))}
              />
              {renderFieldError("email")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-phone">Phone *</Label>
              <Input
                id="add-supplier-phone"
                value={formData.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                className={cn(inputClass, fieldErrorClass("phone"))}
              />
              {renderFieldError("phone")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-company">Company Type *</Label>
              <div className="space-y-2">
                <Select
                  value={formData.company}
                  onValueChange={(value) => updateForm({ company: value })}
                >
                  <SelectTrigger id="add-supplier-company" className={cn(selectTriggerClass, fieldErrorClass("company"))}>
                    <SelectValue placeholder="Select company type or enter custom type" />
                  </SelectTrigger>
                  <SelectContent className="z-[110] max-h-60">
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
              <Label htmlFor="add-supplier-address">Address</Label>
              <Input
                id="add-supplier-address"
                value={formData.address}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Enter full address"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => updateForm({ status: value })}>
                <SelectTrigger id="add-supplier-status" className={cn(selectTriggerClass, fieldErrorClass("status"))}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {renderFieldError("status")}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="neutralOutline"
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              {isAdmin ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Supplier"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    if (!validateForm()) return
                    setShowApprovalDialog(true)
                  }}
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md z-[101]" overlayClassName="z-[100]">
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>Please provide a reason for this supplier request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-supplier-reason">Reason for Request</Label>
              <Textarea
                id="add-supplier-reason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Explain why this supplier should be added..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="neutralOutline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitForApproval} disabled={!approvalReason.trim()}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
