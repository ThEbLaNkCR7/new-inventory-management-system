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
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import { formatNepaliDateForTable, getCurrentNepaliYear, getNepaliYear, toTitleCase } from "@/lib/utils"
import { usePagination } from "@/hooks/usePagination"
import { CheckCircle, Clock, Edit, Eye, Loader2, Mail, Phone, Search, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import DataPagination from "@/components/ui/data-pagination"
import AddSupplierPageDialog from "./AddSupplierPageDialog"
import SupplierTransactionHistoryDialog from "./SupplierTransactionHistoryDialog"
import UpdateSupplierDialog from "./UpdateSupplierDialog"
import ViewSupplierDialog from "./ViewSupplierDialog"
import { validateSupplierFormData } from "./utils"

export default function SuppliersPage() {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierTotalSpent,
    getSupplierOrderCount,
    getSupplierLastOrder,
    purchases
  } = useInventory()
  const { submitChange } = useApproval()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSupplierHistoryDialogOpen, setIsSupplierHistoryDialogOpen] = useState(false)
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<string>("")
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [viewingSupplier, setViewingSupplier] = useState<any>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<any>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    company: "",
    customCompany: "",
    address: "",
    status: "Active",
  }

  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalReason, setApprovalReason] = useState("")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [selectedYear, setSelectedYear] = useState(getCurrentNepaliYear())
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

  const { formData, updateForm: persistFormUpdate, resetForm } = usePersistentForm('suppliers-form', initialFormData)

  const updateForm = (updates: Partial<typeof initialFormData>) => {
    clearFieldErrors(...Object.keys(updates))
    persistFormUpdate(updates)
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

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  const filteredSuppliers = suppliers
    .filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aTime = new Date((a as any).createdAt || 0).getTime()
      const bTime = new Date((b as any).createdAt || 0).getTime()
      return bTime - aTime
    })

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedSuppliers,
    startItem,
    endItem,
  } = usePagination(filteredSuppliers, {
    resetKey: searchTerm,
  })

  const currentYear = getCurrentNepaliYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)
  const companyOptions = [...new Set(suppliers.map(supplier => supplier.company))]

  const clearForm = () => {
    resetForm()
    setDeleteReason("")
    clearFieldErrors()
    setIsAddDialogOpen(false)
  }

  const showAlert = (message: string, isSuccess = true) => {
    setAlertMessage(message)
    setShowSuccessAlert(isSuccess)
    setTimeout(() => setShowSuccessAlert(false), 5000)
  }

  const updateProgress = (step: string, current: number, total: number) => {
    setCurrentStep(step)
    setProgress((current / total) * 100)
    setTotalSteps(total)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const companyName = formData.company === "custom" ? formData.customCompany : formData.company
    const { customCompany, ...supplierData } = formData
    const newSupplierData = {
      ...supplierData,
      company: companyName,
      orders: 0,
      totalSpent: 0,
      lastOrder: new Date().toISOString().split('T')[0]
    }

    if (isAdmin) {
      // Admin: Direct add without approval
      setIsAddDialogOpen(false)
      setIsLoading(true)
      setProgress(0)
      try {
        toast({ title: "Processing...", description: "Validating supplier data...", duration: 2000 })
        updateProgress("Validating supplier data...", 1, 3)
        await addSupplier(newSupplierData)
        updateProgress("Operation completed!", 3, 3)
        toast({ title: "Success", description: "Supplier added successfully!" })
        resetForm()
        setShowSuccessAlert(true)
        setAlertMessage("Supplier added successfully!")
      } catch (err) {
        toast({ title: "Error", description: "Failed to add supplier.", variant: "destructive" })
      } finally {
        setIsLoading(false)
        setProgress(0)
        setCurrentStep("")
      }
    }
    // Non-admin will use the "Submit for Approval" button instead
  }

  const submitForApproval = () => {
    if (!validateForm()) return
    const companyName = formData.company === "custom" ? formData.customCompany : formData.company
    const { customCompany, ...supplierData } = formData
    submitChange({
      type: "supplier",
      action: "create",
      proposedData: {
        ...supplierData,
        company: companyName,
        orders: 0,
        totalSpent: 0,
        lastOrder: new Date().toISOString().split('T')[0],
      },
      requestedBy: user?.email || "",
      reason: approvalReason,
    })
    resetForm()
    setIsAddDialogOpen(false)
    setShowApprovalDialog(false)
    setApprovalReason("")
    showAlert("Supplier request submitted for approval!")
  }

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    clearFieldErrors()
    updateForm({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      company: supplier.company,
      customCompany: supplier.customCompany,
      address: supplier.address,
      status: supplier.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (!editingSupplier) {
      toast({ title: "Error", description: "No supplier selected for editing.", variant: "destructive" })
      return
    }

    const companyName = formData.company === "custom" ? formData.customCompany : formData.company
    const { customCompany, ...supplierData } = formData

    if (isAdmin) {
      // Admin: Direct update without approval
      setIsLoading(true)
      setProgress(0)
      try {
        toast({ title: "Processing...", description: "Validating changes...", duration: 2000 })
        updateProgress("Validating changes...", 1, 3)
        await updateSupplier(editingSupplier.id, { ...supplierData, company: companyName })
        updateProgress("Operation completed!", 3, 3)
        toast({ title: "Success", description: "Supplier updated successfully!" })
        resetForm()
        setEditingSupplier(null)
        setApprovalReason("")
        setShowSuccessAlert(true)
        setAlertMessage("Supplier updated successfully!")
      } catch (err) {
        toast({ title: "Error", description: "Failed to update supplier.", variant: "destructive" })
      } finally {
        setIsLoading(false)
        setProgress(0)
        setCurrentStep("")
      }
    } else {
      // Non-admin: Submit for approval
      submitChange({
        type: "supplier",
        action: "update",
        entityId: editingSupplier.id,
        originalData: editingSupplier,
        proposedData: { ...supplierData, company: companyName },
        requestedBy: user?.email || "",
        reason: approvalReason,
      })
      resetForm()
      setEditingSupplier(null)
      setApprovalReason("")
      showAlert("Supplier update submitted for approval!")
    }
  }

  const handleDelete = (supplier: any) => {
    setDeletingSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (supplier: any) => {
    setViewingSupplier(supplier)
    setIsViewDialogOpen(true)
  }

  const handleSupplierClick = (supplier: any) => {
    setSelectedSupplierForHistory(supplier.name)
    setIsSupplierHistoryDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false)

    if (!deletingSupplier) {
      toast({ title: "Error", description: "No supplier selected for deletion.", variant: "destructive" })
      return
    }

    if (isAdmin) {
      // Admin: Direct delete without approval
      setIsLoading(true)
      setProgress(0)
      try {
        toast({ title: "Processing...", description: "Validating deletion...", duration: 2000 })
        updateProgress("Validating deletion...", 1, 3)
        await deleteSupplier(deletingSupplier.id)
        updateProgress("Operation completed!", 3, 3)
        toast({ title: "Success", description: "Supplier deleted successfully!" })
        setDeletingSupplier(null)
        setShowSuccessAlert(true)
        setAlertMessage("Supplier deleted successfully!")
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete supplier.", variant: "destructive" })
      } finally {
        setIsLoading(false)
        setProgress(0)
        setCurrentStep("")
        setDeleteReason("")
      }
    } else {
      // Non-admin: Submit for approval
      submitChange({
        type: "supplier",
        action: "delete",
        entityId: deletingSupplier.id,
        originalData: deletingSupplier,
        proposedData: { id: deletingSupplier.id },
        requestedBy: user?.email || "",
        reason: deleteReason,
      })
      setDeletingSupplier(null)
      setDeleteReason("")
      showAlert("Supplier deletion submitted for approval!")
    }
  }

  return (
    <div className="space-y-4 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3>
                Processing Supplier...
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="text-xs text-muted-foreground text-center">
                Step {Math.ceil((progress / 100) * totalSteps)} of {totalSteps}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Success/Info Alert */}
      {showSuccessAlert && (
        <Alert className="border-border bg-muted p-3 mb-0">
          <CheckCircle className="h-4 w-4 text-navy" />
          <AlertDescription className="text-navy">{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">
            Suppliers
          </h1>
          <p className="page-desc">Manage supplier relationships and procurement</p>
        </div>
        <div className="absolute top-0 right-0 flex space-x-3">
          <AddSupplierPageDialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) clearFieldErrors()
            }}
            formData={formData}
            updateForm={updateForm}
            companyOptions={companyOptions}
            isAdmin={isAdmin}
            fieldErrors={fieldErrors}
            fieldErrorClass={fieldErrorClass}
            onSubmit={handleSubmit}
            onCancel={clearForm}
            onResetForm={resetForm}
            validateForm={validateForm}
            showApprovalDialog={showApprovalDialog}
            onShowApprovalDialogChange={setShowApprovalDialog}
            approvalReason={approvalReason}
            onApprovalReasonChange={setApprovalReason}
            onSubmitForApproval={submitForApproval}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>
            Suppliers
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">
              ({filteredSuppliers.length})
            </span>
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Manage your supplier contacts and information
          </CardDescription>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 border-border focus:border-navy/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger className="h-10 w-full sm:w-40 border-border">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {searchTerm.trim() !== "" && (
                <Button
                  type="button"
                  variant="neutralOutline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="h-10 shrink-0 gap-1.5 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-0">
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p
                          className="cursor-pointer font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                          onClick={() => handleSupplierClick(supplier)}
                        >
                          {toTitleCase(supplier.name)}
                        </p>
                        <p className="text-navy">
                          {getSupplierOrderCount(supplier.name)} orders
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-navy">{supplier.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-navy">{supplier.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-navy">
                          Rs {
                            (
                              selectedYear
                                ? purchases
                                  .filter(
                                    (p) =>
                                      p.supplier === supplier.name &&
                                      getNepaliYear(p.purchaseDate) === selectedYear
                                  )
                                  .reduce(
                                    (sum, p) =>
                                      sum +
                                      (p.items?.reduce(
                                        (itemSum, item) =>
                                          itemSum +
                                          (item.quantityPurchased || 0) *
                                          (item.purchasePrice || 0),
                                        0
                                      ) || 0),
                                    0
                                  )
                                : getSupplierTotalSpent(supplier.name)
                            ).toLocaleString()
                          }
                        </span>
                        <p className="text-navy">
                          Last: {getSupplierLastOrder(supplier.name) ? formatNepaliDateForTable(getSupplierLastOrder(supplier.name)!) : 'No orders'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => handleView(supplier)}
                          className="text-muted-foreground hover:bg-muted hover:border-navy/30 hover:text-navy dark:hover:bg-muted dark:hover:border-white/30 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => handleEdit(supplier)}
                          className="hover:bg-muted dark:hover:bg-muted transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => handleDelete(supplier)}
                          className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-navy transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-normal italic text-muted-foreground">
                  {searchTerm.trim() ? "No suppliers match your search" : "No suppliers found"}
                </p>
              </div>
            )}
          </div>
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <ViewSupplierDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        supplier={viewingSupplier}
        getSupplierOrderCount={getSupplierOrderCount}
        getSupplierTotalSpent={getSupplierTotalSpent}
        getSupplierLastOrder={getSupplierLastOrder}
        onEdit={handleEdit}
      />

      <UpdateSupplierDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            clearFieldErrors()
            setEditingSupplier(null)
          }
        }}
        formData={formData}
        updateForm={updateForm}
        companyOptions={companyOptions}
        isAdmin={isAdmin}
        approvalReason={approvalReason}
        onApprovalReasonChange={setApprovalReason}
        fieldErrors={fieldErrors}
        fieldErrorClass={fieldErrorClass}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearForm()
          setIsEditDialogOpen(false)
        }}
      />

      {/* Delete Supplier Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <svg className="h-8 w-8 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mb-4">
              Are you sure you want to delete <span className="font-semibold text-navy">{deletingSupplier?.name}</span>? This action cannot be undone.
              {!isAdmin && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center text-navy">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">This will be submitted for admin approval</span>
                  </div>
                </div>
              )}
            </DialogDescription>

            {!isAdmin && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="delete-reason">Reason for Deletion *</Label>
                <Textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Explain why you want to delete this supplier..."
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex justify-center space-x-3 pt-4">
              <Button
                type="button"
                variant="neutralOutline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingSupplier(null)
                  setDeleteReason("")
                }}
                className="px-6"
              >
                Cancel
              </Button>
              {isAdmin ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="px-6"
                >
                  Delete Supplier
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="px-6"
                  disabled={!deleteReason.trim()}
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SupplierTransactionHistoryDialog
        open={isSupplierHistoryDialogOpen}
        onOpenChange={setIsSupplierHistoryDialogOpen}
        supplierName={selectedSupplierForHistory}
        purchases={purchases}
      />
    </div>
  )
}
