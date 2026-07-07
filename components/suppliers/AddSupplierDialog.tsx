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
import { Clock } from "lucide-react"

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  customCompany: "",
  address: "",
  status: "Active",
}

interface AddSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSupplierAdded: (supplierName: string) => void
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

  const updateForm = (updates: Partial<typeof initialFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setApprovalReason("")
    setShowApprovalDialog(false)
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
    const newSupplierData = buildSupplierData()

    setIsSubmitting(true)
    try {
      const addedSupplier = await addSupplier(newSupplierData)
      toast({ title: "Success", description: "Supplier added successfully!" })
      onSupplierAdded(addedSupplier.name || newSupplierData.name)
      onOpenChange(false)
      resetForm()
    } catch {
      toast({ title: "Error", description: "Failed to add supplier.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitForApproval = () => {
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

  const companyOptions = [...new Set(suppliers.map((supplier) => supplier.company))]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md z-[60]">
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
              <Label htmlFor="add-supplier-name">Full Name</Label>
              <Input
                id="add-supplier-name"
                value={formData.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-email">Email</Label>
              <Input
                id="add-supplier-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-phone">Phone</Label>
              <Input
                id="add-supplier-phone"
                value={formData.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-company">Company Type</Label>
              <div className="space-y-2">
                <Select
                  value={formData.company}
                  onValueChange={(value) => updateForm({ company: value })}
                  required
                >
                  <SelectTrigger id="add-supplier-company">
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
                {formData.company === "custom" && (
                  <Input
                    placeholder="Enter custom company type"
                    value={formData.customCompany || ""}
                    onChange={(e) => updateForm({ customCompany: e.target.value })}
                    className="mt-2"
                    required
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-address">Address</Label>
              <Input
                id="add-supplier-address"
                value={formData.address}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-supplier-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateForm({ status: value })}>
                <SelectTrigger id="add-supplier-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
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
                  onClick={() => setShowApprovalDialog(true)}
                  disabled={!formData.name.trim() || !formData.email.trim()}
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md z-[60]">
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
