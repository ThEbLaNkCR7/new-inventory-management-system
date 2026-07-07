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
  paymentStatus: "Pending" as "Received" | "Pending",
}

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientAdded: (clientName: string) => void
}

export default function AddClientDialog({
  open,
  onOpenChange,
  onClientAdded,
}: AddClientDialogProps) {
  const { clients, addClient } = useInventory()
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

  const buildClientData = () => {
    const companyName = formData.company === "custom" ? formData.customCompany : formData.company
    const { customCompany, ...clientData } = formData
    return {
      ...clientData,
      company: companyName,
      address: {
        street: formData.address,
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      taxId: "",
      creditLimit: 0,
      currentBalance: 0,
      totalSpent: 0,
      orders: 0,
      lastOrder: new Date().toISOString().split("T")[0],
      isActive: formData.status === "Active",
      paymentStatus: formData.paymentStatus || "Pending",
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newClientData = buildClientData()

    setIsSubmitting(true)
    try {
      const addedClient = await addClient(newClientData)
      toast({ title: "Success", description: "Client added successfully!" })
      onClientAdded(addedClient.name || newClientData.name)
      onOpenChange(false)
      resetForm()
    } catch {
      toast({ title: "Error", description: "Failed to add client.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitForApproval = () => {
    submitChange({
      type: "client",
      action: "create",
      proposedData: buildClientData(),
      requestedBy: user?.email || "",
      reason: approvalReason,
    })
    toast({
      title: "Submitted",
      description: "Client request submitted for approval.",
    })
    onOpenChange(false)
    resetForm()
  }

  const companyOptions = [...new Set(clients.map((client) => client.company))]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter client information to add to your database
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
              <Label htmlFor="add-client-name">Full Name</Label>
              <Input
                id="add-client-name"
                value={formData.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-client-email">Email</Label>
              <Input
                id="add-client-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-client-phone">Phone</Label>
              <Input
                id="add-client-phone"
                value={formData.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-client-company">Company Type</Label>
              <div className="space-y-2">
                <Select
                  value={formData.company}
                  onValueChange={(value) => updateForm({ company: value })}
                  required
                >
                  <SelectTrigger id="add-client-company">
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
              <Label htmlFor="add-client-address">Address</Label>
              <Input
                id="add-client-address"
                value={formData.address}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-client-paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) =>
                  updateForm({ paymentStatus: value as "Received" | "Pending" })
                }
              >
                <SelectTrigger id="add-client-paymentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-client-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateForm({ status: value })}>
                <SelectTrigger id="add-client-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
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
                  {isSubmitting ? "Adding..." : "Add Client"}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>Please provide a reason for this client request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-client-reason">Reason for Request</Label>
              <Textarea
                id="add-client-reason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Explain why this client should be added..."
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
