"use client"

import type React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useApproval } from "@/contexts/ApprovalContext"
import { useAuth } from "@/contexts/AuthContext"
import { usePersistentForm } from "@/contexts/FormPersistenceContext"
import { useInventory } from "@/contexts/InventoryContext"
import { formatNepaliDateForTable, getCurrentNepaliYear, getNepaliYear } from "@/lib/utils"
import { Building, CheckCircle, Clock, Edit, Eye, Loader2, Mail, Phone, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { Progress } from "../ui/progress"

export default function ClientsPage() {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientTotalSpent,
    getClientOrderCount,
    getClientLastOrder,
    sales
  } = useInventory()
  const { submitChange } = useApproval()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClientHistoryDialogOpen, setIsClientHistoryDialogOpen] = useState(false)
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<string>("")
  const [editingClient, setEditingClient] = useState<any>(null)
  const [viewingClient, setViewingClient] = useState<any>(null)
  const [deletingClient, setDeletingClient] = useState<any>(null)
  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    company: "",
    customCompany: "",
    address: "",
    status: "Active",
    paymentStatus: "Received" as "Received" | "Pending",
  }

  const { formData, updateForm, resetForm } = usePersistentForm('clients-form', initialFormData)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalReason, setApprovalReason] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Received" | "Pending">("All")

  const { user } = useAuth()

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPayment =
      paymentFilter === "All" || client.paymentStatus === paymentFilter

    return matchesSearch && matchesPayment
  })

  const updateProgress = (step: string, current: number, total: number) => {
    setCurrentStep(step)
    setProgress((current / total) * 100)
    setTotalSteps(total)
  }

  // Helper function to safely format client address
  const formatClientAddress = (client: any) => {
    if (!client.address) {
      return 'Address not available'
    }

    // Handle old string address format
    if (typeof client.address === 'string') {
      return client.address || 'Address not available'
    }

    // Handle new object address format
    const addressParts = [
      client.address.street,
      client.address.city,
      client.address.state,
      client.address.zipCode,
      client.address.country
    ].filter(part => part && part.trim())

    return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available'
  }

  const clearForm = () => {
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating client data...", duration: 2000 })
      updateProgress("Validating client data...", 1, 4)
      await new Promise(resolve => setTimeout(resolve, 500))

      updateProgress("Adding client to database...", 2, 4)
      await new Promise(resolve => setTimeout(resolve, 500))

      updateProgress("Setting up client profile...", 3, 4)
      const companyName = formData.company === "custom" ? formData.customCompany : formData.company
      const { customCompany, ...clientData } = formData
      await addClient({
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
        lastOrder: new Date().toISOString().split('T')[0],
        isActive: formData.status === "Active",
        paymentStatus: formData.paymentStatus || "Pending",
      })

      updateProgress("Operation completed!", 4, 4)
      await new Promise(resolve => setTimeout(resolve, 300))

      toast({ title: "Success", description: "Client added successfully!", })
      resetForm()
      setIsAddDialogOpen(false)
      setShowSuccessAlert(true)
      setAlertMessage("Client added successfully!")
    } catch (err) {
      toast({ title: "Error", description: "Failed to add client.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const submitForApproval = () => {
    const companyName = formData.company === "custom" ? formData.customCompany : formData.company
    const { customCompany, ...clientData } = formData
    submitChange({
      type: "client",
      action: "create",
      proposedData: {
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
        lastOrder: new Date().toISOString().split('T')[0],
        isActive: formData.status === "Active"
      },
      requestedBy: "", // Removed user?.email || ""
      reason: approvalReason,
    })
    toast({ title: "Submitted", description: "Client request submitted for admin approval." })
    setShowApprovalDialog(false)
    setApprovalReason("")
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleEdit = (client: any) => {
    setEditingClient(client)
    updateForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      customCompany: "",
      address: typeof client.address === 'string' ? client.address : (client.address?.street || ""),
      status: client.isActive ? "Active" : "Inactive",
      paymentStatus: client.paymentStatus || "Pending",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating changes...", duration: 2000 })
      updateProgress("Validating changes...", 1, 4)
      await new Promise(resolve => setTimeout(resolve, 500))
      if (editingClient) {
        const companyName = formData.company === "custom" ? formData.customCompany : formData.company
        const { customCompany, ...clientData } = formData
        const updateData = {
          ...clientData,
          company: companyName,
          address: {
            street: formData.address,
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          isActive: formData.status === "Active",
          paymentStatus: formData.paymentStatus || "Pending",
        }
        await updateClient(editingClient.id, updateData)
        resetForm()
        setIsEditDialogOpen(false)
        setEditingClient(null)
        setShowSuccessAlert(true)
        setAlertMessage("Client updated successfully!")
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update client.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleDelete = (client: any) => {
    setDeletingClient(client)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (client: any) => {
    setViewingClient(client)
    setIsViewDialogOpen(true)
  }

  const handleClientClick = (client: any) => {
    setSelectedClientForHistory(client.name)
    setIsClientHistoryDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating deletion...", duration: 2000 })
      updateProgress("Validating deletion...", 1, 3)
      if (deletingClient) {
        await deleteClient(deletingClient.id)
        setDeletingClient(null)
        setShowSuccessAlert(true)
        setAlertMessage("Client deleted successfully!")
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete client.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  return (
    <div className="space-y-6 p-6 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Processing...
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Step {Math.ceil((progress / 100) * totalSteps)} of {totalSteps}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Success/Info Alert */}
      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 mb-4">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">
            Clients
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage client relationships and contact information</p>
        </div>
        <div className="absolute top-6 right-0 flex space-x-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                variant="neutral"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter client information to add to your database
                  {user?.role !== "admin" && (
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Changes require admin approval
                      </Badge>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateForm({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateForm({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Type</Label>
                  <div className="space-y-2">
                    <Select
                      value={formData.company}
                      onValueChange={(value) => updateForm({ ...formData, company: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company type or enter custom type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="custom">+ Add Custom Company Type</SelectItem>
                        {[...new Set(clients.map(client => client.company))].map((company) => (
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
                        onChange={(e) => updateForm({ ...formData, customCompany: e.target.value })}
                        className="mt-2"
                        required
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateForm({ ...formData, address: e.target.value })}
                    placeholder="Enter full address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus || "Pending"}
                    onValueChange={(value) =>
                      updateForm({ ...formData, paymentStatus: value as "Received" | "Pending" })
                    }
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateForm({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="neutralOutline" onClick={clearForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {/* Removed user?.role === "admin" ? "Add Client" : "Submit for Approval" */}
                    Add Client
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Approval Reason Dialog */}
          <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit for Approval</DialogTitle>
                <DialogDescription>Please provide a reason for this client request</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Request</Label>
                  <Textarea
                    id="reason"
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
        </div>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => updateForm({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateForm({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => updateForm({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company Type</Label>
              <div className="space-y-2">
                <Select
                  value={formData.company}
                  onValueChange={(value) => updateForm({ ...formData, company: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type or enter custom type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="custom">+ Add Custom Company Type</SelectItem>
                    {[...new Set(clients.map(client => client.company))].map((company) => (
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
                    onChange={(e) => updateForm({ ...formData, customCompany: e.target.value })}
                    className="mt-2"
                    required
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => updateForm({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateForm({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus || "Pending"}
                onValueChange={(value) =>
                  updateForm({ ...formData, paymentStatus: value as "Received" | "Pending" })
                }
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="neutralOutline" onClick={() => {
                clearForm()
                setIsEditDialogOpen(false)
              }}>
                Cancel
              </Button>
              <Button type="submit">Update Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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

          {viewingClient && (
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
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{viewingClient.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Company Type</Label>
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{viewingClient.company}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tax ID</Label>
                    <p className="text-gray-700 dark:text-gray-300 font-mono text-base">{viewingClient.taxId || "Not specified"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Client ID</Label>
                    <p className="text-gray-700 dark:text-gray-300 font-mono text-base">{viewingClient.id}</p>
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
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{viewingClient.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Phone</Label>
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{viewingClient.phone}</p>
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Address</Label>
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-base bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                      {formatClientAddress(viewingClient)}
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
                      Rs {viewingClient.creditLimit?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Balance</Label>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                      Rs {viewingClient.currentBalance?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Spent</Label>
                    <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                      Rs {getClientTotalSpent(viewingClient.name).toLocaleString()}
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
                      {getClientOrderCount(viewingClient.name)} orders
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Order</Label>
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                      {getClientLastOrder(viewingClient.name) ? formatNepaliDateForTable(getClientLastOrder(viewingClient.name)!) : 'No orders yet'}
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
                      {formatNepaliDateForTable(viewingClient.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Updated</Label>
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                      {formatNepaliDateForTable(viewingClient.updatedAt || viewingClient.createdAt)}
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
                    <div className={`w-4 h-4 rounded-full ${viewingClient.isActive !== false ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-base">
                      {viewingClient.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-4 py-2 text-sm font-medium">
                    Active Client
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {viewingClient.notes && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Notes</span>
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 leading-relaxed text-base">
                      {viewingClient.notes}
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
              onClick={() => setIsViewDialogOpen(false)}
              className="px-6 py-2"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsViewDialogOpen(false)
                handleEdit(viewingClient)
              }}
              className="px-6 py-2"
            >
              Edit Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Client Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold mb-3">Delete Client</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">{deletingClient?.name}</span>? This action cannot be undone.
            </DialogDescription>
            <div className="flex justify-center space-x-3">
              <Button
                type="button"
                variant="neutralOutline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingClient(null)
                }}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="px-6"
              >
                Delete Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 border-2 focus:border-slate-500 transition-colors h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-4">
        <Button
          variant={paymentFilter === "All" ? "default" : "neutralOutline"}
          onClick={() => setPaymentFilter("All")}
        >
          All
        </Button>

        <Button
          variant={paymentFilter === "Received" ? "default" : "neutralOutline"}
          onClick={() => setPaymentFilter("Received")}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          Payment Received
        </Button>

        <Button
          variant={paymentFilter === "Pending" ? "default" : "neutralOutline"}
          onClick={() => setPaymentFilter("Pending")}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Payment Pending
        </Button>
      </div>

      {/* Clients Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>Manage your client contacts and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700">
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Client Name</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Contact</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Payment</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Total Spent</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p
                          className="text-gray-700 dark:text-gray-100 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          onClick={() => handleClientClick(client)}
                        >
                          {client.name}
                        </p>
                        <p className="text-gray-700 dark:text-gray-400">
                          {getClientOrderCount(client.name)} orders
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{client.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{client.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium px-2 py-1 rounded-full text-sm ${client.paymentStatus === "Received"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                      >
                        {client.paymentStatus === "Received" ? "Received" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-green-600 dark:text-green-400 text-lg">
                          Rs {getClientTotalSpent(client.name).toLocaleString()}
                        </span>
                        <p className="text-gray-700 dark:text-gray-400">
                          Last: {getClientLastOrder(client.name) ? formatNepaliDateForTable(getClientLastOrder(client.name)!) : 'No orders'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => handleView(client)}
                          className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => handleEdit(client)}
                          className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => handleDelete(client)}
                          className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredClients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No clients found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Transaction History Dialog */}
      <Dialog open={isClientHistoryDialogOpen} onOpenChange={setIsClientHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span>Client Transaction History</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              All transactions with <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedClientForHistory}</span> in {getCurrentNepaliYear()}
            </DialogDescription>
          </DialogHeader>

          {selectedClientForHistory && (
            <div className="space-y-6">
              {/* Client Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>Client Summary</span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Client Name</Label>
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-base">{selectedClientForHistory}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Sales</Label>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                      {sales.filter(s => s.client === selectedClientForHistory && getNepaliYear(s.saleDate) === getCurrentNepaliYear()).length} transactions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Total Quantity
                    </Label>

                    <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                      {sales
                        .filter(
                          (s) =>
                            s.client === selectedClientForHistory &&
                            getNepaliYear(s.saleDate) === getCurrentNepaliYear()
                        )
                        .reduce(
                          (sum, s) =>
                            sum +
                            (s.items?.reduce(
                              (itemSum, item) =>
                                itemSum + (item.quantitySold || 0),
                              0
                            ) || 0),
                          0
                        )}{" "}
                      units
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Total Value
                    </Label>

                    <p className="font-semibold text-lg text-teal-600 dark:text-teal-400">
                      Rs{" "}
                      {sales
                        .filter(
                          (s) =>
                            s.client === selectedClientForHistory &&
                            getNepaliYear(s.saleDate) === getCurrentNepaliYear()
                        )
                        .reduce(
                          (sum, s) =>
                            sum +
                            (s.items?.reduce(
                              (itemSum, item) =>
                                itemSum +
                                (item.quantitySold || 0) *
                                (item.salePrice || 0),
                              0
                            ) || 0),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales Transactions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sales Transactions ({sales.filter(s => s.client === selectedClientForHistory && getNepaliYear(s.saleDate) === getCurrentNepaliYear()).length})</span>
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 dark:bg-gray-700">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Product</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Quantity</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Unit Price</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const currentYear = getCurrentNepaliYear()
                        const clientSales = sales.filter(sale =>
                          sale.client === selectedClientForHistory &&
                          getNepaliYear(sale.saleDate) === currentYear
                        ).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())

                        return clientSales.length > 0 ? (
                          clientSales.map((sale) => (
                            <TableRow key={sale.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                              <TableCell className="text-gray-700 dark:text-gray-300">
                                {formatNepaliDateForTable(sale.saleDate)}
                              </TableCell>
                              <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                {sale.items
                                  ?.map((i) => i.productName || "")
                                  .filter(Boolean)
                                  .join(", ")}
                              </TableCell>

                              <TableCell className="text-gray-700 dark:text-gray-300">
                                {sale.items?.reduce(
                                  (sum, i) => sum + (i.quantitySold || 0),
                                  0
                                )}{" "}
                                units
                              </TableCell>

                              <TableCell className="text-gray-700 dark:text-gray-300">
                                Rs{" "}
                                {(
                                  sale.items?.reduce(
                                    (sum, i) => sum + (i.salePrice || 0),
                                    0
                                  ) || 0
                                ).toLocaleString()}
                              </TableCell>

                              <TableCell className="font-semibold text-green-600 dark:text-green-400">
                                Rs{" "}
                                {(
                                  sale.items?.reduce(
                                    (sum, i) =>
                                      sum +
                                      (i.quantitySold || 0) *
                                      (i.salePrice || 0),
                                    0
                                  ) || 0
                                ).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                              No sales transactions found for this client in {currentYear}
                            </TableCell>
                          </TableRow>
                        )
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="neutralOutline"
              onClick={() => setIsClientHistoryDialogOpen(false)}
              className="px-6 py-2"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
