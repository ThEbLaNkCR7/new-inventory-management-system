"use client"

import type React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useApproval } from "@/contexts/ApprovalContext"
import { useAuth } from "@/contexts/AuthContext"
import { usePersistentForm } from "@/contexts/FormPersistenceContext"
import { useInventory } from "@/contexts/InventoryContext"
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils"
import { CheckCircle, Edit, Eye, Filter, Loader2, Mail, Phone, Search, Trash2, X } from "lucide-react"
import { useState } from "react"
import { Progress } from "../ui/progress"
import AddClientPageDialog from "./AddClientPageDialog"
import ClientTransactionHistoryDialog from "./ClientTransactionHistoryDialog"
import UpdateClientDialog from "./UpdateClientDialog"
import ViewClientDialog from "./ViewClientDialog"
import { validateClientFormData } from "./utils"

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

  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalReason, setApprovalReason] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Received" | "Pending">("All")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { user } = useAuth()

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

  const { formData, updateForm: persistFormUpdate, resetForm } = usePersistentForm('clients-form', initialFormData)

  const updateForm = (updates: Partial<typeof initialFormData>) => {
    clearFieldErrors(...Object.keys(updates))
    persistFormUpdate(updates)
  }

  const validateForm = () => {
    const errors = validateClientFormData(formData)
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

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPayment =
      paymentFilter === "All" || client.paymentStatus === paymentFilter

    return matchesSearch && matchesPayment
  })

  const companyOptions = [...new Set(clients.map(client => client.company))]

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
    clearFieldErrors()
    setIsAddDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
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
    clearFieldErrors()
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
    if (!validateForm()) return
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
    <div className="space-y-4 min-h-screen transition-colors duration-300">
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
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-3 mb-0">
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
        <div className="absolute top-0 right-0 flex space-x-3">
          <AddClientPageDialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) clearFieldErrors()
            }}
            formData={formData}
            updateForm={updateForm}
            companyOptions={companyOptions}
            userRole={user?.role}
            fieldErrors={fieldErrors}
            fieldErrorClass={fieldErrorClass}
            onSubmit={handleSubmit}
            onCancel={clearForm}
            onResetForm={resetForm}
            showApprovalDialog={showApprovalDialog}
            onShowApprovalDialogChange={setShowApprovalDialog}
            approvalReason={approvalReason}
            onApprovalReasonChange={setApprovalReason}
            onSubmitForApproval={submitForApproval}
          />
        </div>
      </div>

      <UpdateClientDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            clearFieldErrors()
            setEditingClient(null)
          }
        }}
        formData={formData}
        updateForm={updateForm}
        companyOptions={companyOptions}
        fieldErrors={fieldErrors}
        fieldErrorClass={fieldErrorClass}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearForm()
          setIsEditDialogOpen(false)
        }}
      />

      <ViewClientDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        client={viewingClient}
        formatClientAddress={formatClientAddress}
        getClientTotalSpent={getClientTotalSpent}
        getClientOrderCount={getClientOrderCount}
        getClientLastOrder={getClientLastOrder}
        onEdit={handleEdit}
      />

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

      <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Clients
            <span className="ml-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              ({filteredClients.length})
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your client contacts and information
          </CardDescription>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 focus:border-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={paymentFilter}
                onValueChange={(value: "All" | "Received" | "Pending") => setPaymentFilter(value)}
              >
                <SelectTrigger className="h-10 w-full sm:w-52 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 shrink-0 text-gray-400" />
                    <SelectValue placeholder="Payment status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="All">All Payments</SelectItem>
                  <SelectItem value="Received">Payment Received</SelectItem>
                  <SelectItem value="Pending">Payment Pending</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm.trim() !== "" || paymentFilter !== "All") && (
                <Button
                  type="button"
                  variant="neutralOutline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setPaymentFilter("All")
                  }}
                  className="h-10 shrink-0 gap-1.5 text-gray-600 dark:text-gray-300"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-700/80">
                  <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Client Name</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Contact</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Payment</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Total Spent</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Actions</TableHead>
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
                          {toTitleCase(client.name)}
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
                <p className="text-gray-500">
                  {searchTerm.trim() || paymentFilter !== "All"
                    ? "No clients match your filters"
                    : "No clients found"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ClientTransactionHistoryDialog
        open={isClientHistoryDialogOpen}
        onOpenChange={setIsClientHistoryDialogOpen}
        clientName={selectedClientForHistory}
        sales={sales}
      />
    </div>
  )
}
