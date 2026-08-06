"use client"

import { formatProductNetWeight } from "@/components/products/utils"
import QuickAddProductDialog from "@/components/products/QuickAddProductDialog"
import AddSupplierDialog from "@/components/suppliers/AddSupplierDialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { MaterialDatePicker } from "@/components/ui/MaterialDatePicker"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { usePersistentForm } from "@/contexts/FormPersistenceContext"
import type { Product, Purchase } from "@/contexts/InventoryContext"
import { useInventory } from "@/contexts/InventoryContext"
import { usePurchaseChange } from "@/hooks/usePurchaseChange"
import { cn, formatNepaliDateForTable } from "@/lib/utils"
import {
  formActionLinkClass,
  formDescriptionClass,
  formDialogBodyClass,
  formDialogClass,
  formDialogFooterClass,
  formDialogHeaderClass,
  formErrorTextClass,
  formFieldClass,
  formFileInputClass,
  formGridClass,
  formHintClass,
  formInputClass,
  formItemCardClass,
  formItemLabelClass,
  formLabelClass,
  formSectionClass,
  formSectionTitleClass,
  formSelectTriggerClass,
  formTitleClass,
} from "@/lib/form-styles"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Receipt,
  Trash2,
  Truck,
} from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import DeletePurchaseDialog from "./DeletePurchaseDialog"
import EditPurchaseDialog from "./EditPurchaseDialog"
import PurchasesTable from "./PurchasesTable"
import SupplierHistoryDialog from "./SupplierHistoryDialog"
import ViewPurchaseDialog from "./ViewPurchaseDialog"
import { mapPurchaseItemErrorsToEditFields, validatePurchaseFormData } from "./utils"

type PurchaseItem = {
  productId: string
  quantityPurchased: number
  purchasePrice: number
}

type ItemKey = keyof PurchaseItem

const isPortaledSelectClick = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest("[data-radix-select-content]") ||
    target.closest("[data-radix-popper-content-wrapper]")
  )
}

const shouldPreventPurchaseDialogClose = (
  target: EventTarget | null,
  isAddSupplierDialogOpen: boolean,
  isQuickAddProductOpen: boolean,
) =>
  isPortaledSelectClick(target) || isAddSupplierDialogOpen || isQuickAddProductOpen

const inputClass = formInputClass
const selectTriggerClass = formSelectTriggerClass
const errorTextClass = formErrorTextClass

const getEmptyPurchaseForm = () => ({
  items: [
    {
      productId: "",
      quantityPurchased: 0,
      purchasePrice: 0,
    },
  ],
  supplier: "",
  supplierType: "Company",
  customSupplier: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  isVat: false,
})

export default function PurchasesPage() {
  const { products, purchases, suppliers, addPurchase, updatePurchase, deletePurchase } = useInventory()
  const { user } = useAuth()
  const { requestPurchaseChange } = usePurchaseChange()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [billImage, setBillImage] = useState<File | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSupplierHistoryDialogOpen, setIsSupplierHistoryDialogOpen] = useState(false)
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<string>("")
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
  const [billUrl, setBillUrl] = useState<string>("");
  const [billInputKey, setBillInputKey] = useState(0)

  const [editReason, setEditReason] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false)
  const [addingProductItemIndex, setAddingProductItemIndex] = useState<number | null>(null)
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

  const { formData, updateForm: persistFormUpdate, resetForm } = usePersistentForm('purchases-form', getEmptyPurchaseForm())

  const updateForm = (updates: Partial<ReturnType<typeof getEmptyPurchaseForm>>) => {
    clearFieldErrors(...Object.keys(updates))
    persistFormUpdate(updates)
  }

  const addItem = () => {
    updateForm({
      items: [...formData.items, { productId: "", quantityPurchased: 0, purchasePrice: 0 }],
    })
  }

  const removeItem = (index: number) => {
    updateForm({
      items: formData.items.filter((_: any, i: number) => i !== index),
    })
  }

  const updateItem = (index: number, key: ItemKey, value: any) => {
    clearFieldErrors(`items.${index}.${key}`)
    const updated = [...formData.items]
    updated[index] = { ...updated[index], [key]: value }
    updateForm({ items: updated })
  }

  const openQuickAddProduct = (index: number) => {
    setAddingProductItemIndex(index)
    setIsQuickAddProductOpen(true)
  }

  const handleQuickAddProductCreated = (product: Product) => {
    if (addingProductItemIndex === null) return

    const updated = [...formData.items]
    updated[addingProductItemIndex] = {
      ...updated[addingProductItemIndex],
      productId: product.id,
      purchasePrice: updated[addingProductItemIndex].purchasePrice || product.unitPrice,
    }
    updateForm({ items: updated })
    setAddingProductItemIndex(null)
  }

  const getPurchaseSupplierName = () => formData.supplier

  const supplierOptions = useMemo(() => {
    if (!formData.supplier || formData.supplier === "custom") return suppliers
    const exists = suppliers.some((supplier) => supplier.name === formData.supplier)
    if (exists) return suppliers
    return [
      ...suppliers,
      { id: `pending-${formData.supplier}`, name: formData.supplier },
    ]
  }, [suppliers, formData.supplier])

  const handleSupplierChange = (value: string) => {
    clearFieldErrors("supplier", "customSupplier")
    if (value === "__new__") {
      setIsAddSupplierDialogOpen(true)
      return
    }
    updateForm({ supplier: value, customSupplier: "" })
  }

  const handleSupplierAdded = (supplierName: string) => {
    updateForm({ supplier: supplierName, customSupplier: "" })
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open && (isAddSupplierDialogOpen || isQuickAddProductOpen)) return
    setIsAddDialogOpen(open)
  }

  const notifyStockExceeded = (product: Product, quantity: number) => {
    toast({
      title: "Stock Warning",
      description: `${product.name}: quantity (${quantity}) exceeds current stock (${product.stockQuantity}).`,
      variant: "destructive",
    })
  }

  useEffect(() => {
    if (formData.supplier === "custom" && formData.customSupplier) {
      updateForm({ supplier: formData.customSupplier, customSupplier: "" })
    }
  }, [formData.supplier, formData.customSupplier, updateForm])

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  // Filter purchases based on search term (tab filter handled in PurchasesTable), newest created first
  const filteredPurchases = purchases
    .filter(
      (p) =>
        (p.items?.map(i => i.productName).join(" ") || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p?.supplier || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice()
    .sort((a, b) => {
      const aTime = new Date((a as any).createdAt || a.purchaseDate || 0).getTime()
      const bTime = new Date((b as any).createdAt || b.purchaseDate || 0).getTime()
      return bTime - aTime
    })

  const uploadBillToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("purchaseBill", file);

    const res = await fetch("/api/purchases/upload", {
      method: "POST",
      body: formData,
    });

    let data;

    try {
      data = await res.json();
    } catch (err) {
      throw new Error("Server returned invalid response");
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to upload purchase bill");
    }

    return data.url;
  };


  // Get counts for each tab
  const getPurchasesCounts = () => {
    const allCount = purchases.length
    const individualCount = purchases.filter(purchase => purchase.supplierType === "Individual").length
    const companyCount = purchases.filter(purchase => purchase.supplierType === "Company").length
    return { allCount, individualCount, companyCount }
  }

  const purchasesCounts = getPurchasesCounts()

  const resetPurchaseForm = () => {
    resetForm()
    updateForm(getEmptyPurchaseForm())
    setBillImage(null)
    setBillUrl("")
    setEditReason("")
    setAddingProductItemIndex(null)
    setIsQuickAddProductOpen(false)
    setBillInputKey((key) => key + 1)
    clearFieldErrors()
  }

  const clearForm = () => {
    resetPurchaseForm()
    setIsAddDialogOpen(false)
  }

  const validateForm = () => {
    const errors = validatePurchaseFormData(formData)
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

  const updateProgress = (step: string, current: number, total: number) => {
    setCurrentStep(step)
    setProgress((current / total) * 100)
    setTotalSteps(total)
  }

  const exportPurchasesToCSV = (purchasesData: any[]) => {
    if (!purchasesData || purchasesData.length === 0) {
      toast({ title: "No purchase data", description: "There are no purchases to export.", variant: "destructive" })
      return
    }

    const headers = [
      "Date",
      "Product",
      "Supplier",
      "Supplier Type",
      "Quantity Purchased",
      "Unit Price",
      "Total Value"
    ]

    const rows = purchasesData.map(purchase => [
      formatNepaliDateForTable(purchase.purchaseDate),
      purchase.productName,
      purchase.supplier,
      purchase.supplierType,
      purchase.quantityPurchased,
      purchase.purchasePrice,
      purchase.quantityPurchased * purchase.purchasePrice
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${v}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `purchases_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    for (const item of formData.items) {
      const product = products.find((p) => p.id === item.productId)
      if (product && item.quantityPurchased > product.stockQuantity) {
        notifyStockExceeded(product, item.quantityPurchased)
      }
    }

    setIsAddDialogOpen(false)
    setIsLoading(true)
    setProgress(0)

    try {
      toast({
        title: "Processing...",
        description: "Validating purchase data...",
        duration: 2000,
      })

      updateProgress("Validating purchase data...", 1, 6)
      await new Promise((r) => setTimeout(r, 400))

      // 1. Upload bill if exists
      let uploadedBillUrl = ""
      if (billImage) {
        uploadedBillUrl = await uploadBillToCloudinary(billImage)
      }

      updateProgress("Checking stock availability...", 2, 6)

      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Preparing purchase items...", 3, 6)

      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Processing supplier data...", 4, 6)

      const supplierName = formData.supplier?.trim() || ""

      const payload = {
        supplier: supplierName,
        supplierType: formData.supplierType,
        purchaseDate: formData.purchaseDate,
        billUrl: uploadedBillUrl,
        isVat: formData.isVat,
        items: formData.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)

          return {
            productId: item.productId,
            productName: product?.name || "",
            quantityPurchased: item.quantityPurchased,
            purchasePrice: item.purchasePrice,
          }
        }),
      }

      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Saving transaction...", 5, 6)

      // 4. ADMIN vs APPROVAL FLOW
      if (user?.role === "admin") {
        await addPurchase(payload)

        updateProgress("Updating inventory...", 6, 6)

        toast({
          title: "Success",
          description: "Purchase recorded successfully!",
        })
      } else {
        requestPurchaseChange(
          "create",
          payload,
          undefined,
          editReason || "New purchase request"
        )

        toast({
          title: "Submitted",
          description: "Purchase submitted for admin approval.",
        })
      }

      await new Promise((r) => setTimeout(r, 300))

      resetPurchaseForm()

      setShowSuccessAlert(true)
      setAlertMessage("Purchase added successfully!")
    } catch (err) {
      console.error(err)

      toast({
        title: "Error",
        description: "Failed to record purchase.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase)

    // Convert date to YYYY-MM-DD format for HTML date input
    const formattedDate = new Date(purchase.purchaseDate).toISOString().split('T')[0]

    // Map purchase items to form items
    const items = purchase.items.map((item: any) => ({
      productId: item.productId || "",
      quantityPurchased: item.quantityPurchased || 0,
      purchasePrice: item.purchasePrice || 0,
    }))

    updateForm({
      items,
      supplier: purchase.supplier,
      supplierType: purchase.supplierType,
      purchaseDate: formattedDate,
      isVat: formData.isVat,
    })
    setBillUrl(purchase.billUrl || "")
    setBillImage(null)
    clearFieldErrors()
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (user?.role !== "admin" && !editReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the changes.",
        variant: "destructive",
      })
      return
    }

    setIsEditDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating changes...", duration: 2000 })
      updateProgress("Validating changes...", 1, 5)
      await new Promise(resolve => setTimeout(resolve, 500))

      let uploadedBillUrl = billUrl

      // Upload new bill if selected
      if (billImage) {
        uploadedBillUrl = await uploadBillToCloudinary(billImage)
      }

      if (editingPurchase && (user?.role === "admin" || editReason.trim())) {
        updateProgress("Checking product availability...", 2, 5)
        await new Promise(resolve => setTimeout(resolve, 500))

        if (user?.role === "admin") {
          updateProgress("Updating purchase record...", 3, 5)
          await new Promise(resolve => setTimeout(resolve, 500))

          updateProgress("Adjusting inventory...", 4, 5)
          const supplierName = formData.supplier === "custom" ? formData.customSupplier : formData.supplier
          const { customSupplier, ...purchaseData } = formData

          // Build items with product names
          const itemsWithNames = purchaseData.items.map((item: any) => {
            const product = products.find((p) => p.id === item.productId)
            return {
              productId: item.productId,
              productName: product?.name || "",
              quantityPurchased: item.quantityPurchased,
              purchasePrice: item.purchasePrice,
            }
          })

          await updatePurchase(editingPurchase.id, { ...purchaseData, items: itemsWithNames, supplier: supplierName, billUrl: uploadedBillUrl })

          updateProgress("Operation completed!", 5, 5)
          await new Promise(resolve => setTimeout(resolve, 300))

          toast({ title: "Success", description: "Purchase updated successfully!", })
        } else {
          updateProgress("Preparing approval request...", 3, 4)
          await new Promise(resolve => setTimeout(resolve, 500))

          updateProgress("Submitting for approval...", 4, 4)
          const supplierName = formData.supplier === "custom" ? formData.customSupplier : formData.supplier
          const { customSupplier, ...purchaseData } = formData

          // Build items with product names
          const itemsWithNames = purchaseData.items.map((item: any) => {
            const product = products.find((p) => p.id === item.productId)
            return {
              productId: item.productId,
              productName: product?.name || "",
              quantityPurchased: item.quantityPurchased,
              purchasePrice: item.purchasePrice,
            }
          })

          requestPurchaseChange("update", { ...purchaseData, items: itemsWithNames, supplier: supplierName, billUrl: uploadedBillUrl }, editingPurchase.id, editReason)
          toast({ title: "Submitted", description: "Purchase changes submitted for admin approval." })
        }
      } else if (user?.role !== "admin" && !editReason.trim()) {
        toast({ title: "Validation Error", description: "Please provide a reason for the changes.", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update purchase.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
      resetForm()
    }
  }

  const handleDelete = (purchase: Purchase) => {
    setDeletingPurchase(purchase)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (purchase: Purchase) => {
    setViewingPurchase(purchase)
    setIsViewDialogOpen(true)
  }

  const handleSupplierClick = (supplier: string) => {
    setSelectedSupplierForHistory(supplier)
    setIsSupplierHistoryDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating deletion...", duration: 2000 })
      updateProgress("Validating deletion...", 1, 3)

      if (deletingPurchase && (user?.role === "admin" || deleteReason.trim())) {
        if (user?.role === "admin") {
          updateProgress("Removing purchase record...", 2, 3)
          await deletePurchase(deletingPurchase.id)
          updateProgress("Operation completed!", 3, 3)
          toast({ title: "Success", description: "Purchase deleted successfully!", })
          setDeletingPurchase(null)
          setShowSuccessAlert(true)
          setAlertMessage("Purchase deleted successfully!")
        } else {
          updateProgress("Submitting for approval...", 2, 3)
          requestPurchaseChange("delete", {}, deletingPurchase.id, deleteReason)
          toast({ title: "Submitted", description: "Purchase deletion submitted for admin approval." })
          setDeletingPurchase(null)
          setDeleteReason("")
        }
      } else if (user?.role !== "admin" && !deleteReason.trim()) {
        toast({ title: "Error", description: "Please provide a reason for deleting this purchase.", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete purchase.", variant: "destructive" })
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
          <div className="bg-card rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3 className="text-base font-semibold text-navy">
                Processing Purchase...
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
            Purchases
          </h1>
          <p className="page-desc">Manage purchase orders and inventory restocking</p>
          {user?.role !== "admin" && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-blue-50 text-navy border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Changes require admin approval
              </Badge>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 z-10 flex space-x-3">
          <Button
            type="button"
            onClick={() => exportPurchasesToCSV(filteredPurchases)}
            className="px-4 py-2"
          >
            Export Purchases CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  clearFieldErrors()
                  setIsAddDialogOpen(true)
                }}
                variant="neutral"
              >
                <Plus className="h-4 w-4" />
                Add Purchase
              </Button>
            </DialogTrigger>
            <DialogContent
              className={formDialogClass}
              onPointerDownOutside={(event) => {
                if (shouldPreventPurchaseDialogClose(event.target, isAddSupplierDialogOpen, isQuickAddProductOpen)) {
                  event.preventDefault()
                }
              }}
              onInteractOutside={(event) => {
                if (shouldPreventPurchaseDialogClose(event.target, isAddSupplierDialogOpen, isQuickAddProductOpen)) {
                  event.preventDefault()
                }
              }}
            >
              <DialogHeader className={formDialogHeaderClass}>
                <DialogTitle className={formTitleClass}>
                  Add New Purchase
                </DialogTitle>
                <DialogDescription className={formDescriptionClass}>
                  Record a new purchase order
                  {user?.role !== "admin" && (
                    <span className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium leading-5 text-navy">
                      <Clock className="h-4 w-4 shrink-0 text-navy" />
                      Changes require admin approval
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className={formDialogBodyClass}>
                <section className={formSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <Package className="h-4 w-4 text-navy/70" />
                    Products *
                  </h3>

                  {formData.items.map((item: any, index: number) => {
                    const selectedProduct = products.find(p => p.id === item.productId)

                    return (
                      <div key={index} className={formItemCardClass}>
                        <div className="flex justify-between items-center">
                          <span className={formItemLabelClass}>
                            Item #{index + 1}
                          </span>

                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* PRODUCT SELECT */}
                        <div className={formFieldClass}>
                          <Select
                            value={item.productId || undefined}
                            onValueChange={(value) => {
                              if (value === "__new__") {
                                updateItem(index, "productId", value)
                                return
                              }
                              updateItem(index, "productId", value)
                              const product = products.find((p) => p.id === value)
                              if (product && !item.purchasePrice) {
                                updateItem(index, "purchasePrice", product.unitPrice)
                              }
                            }}
                          >
                            <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass(`items.${index}.productId`))}>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="__new__">+ Add New Product</SelectItem>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({formatProductNetWeight(product)}) — Stock: {product.stockQuantity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.productId === "__new__" && (
                            <Button
                              type="button"
                              variant="neutralOutline"
                              size="sm"
                              className="w-full"
                              onClick={() => openQuickAddProduct(index)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add New Product
                            </Button>
                          )}
                          {renderFieldError(`items.${index}.productId`)}
                        </div>

                        {/* QUANTITY + PRICE */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className={formFieldClass}>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Quantity *"
                              value={item.quantityPurchased || ""}
                              onChange={(e) =>
                                updateItem(index, "quantityPurchased", Number(e.target.value))
                              }
                              onBlur={(e) => {
                                const quantity = Number(e.target.value)
                                if (
                                  selectedProduct &&
                                  quantity > 0 &&
                                  quantity > selectedProduct.stockQuantity
                                ) {
                                  notifyStockExceeded(selectedProduct, quantity)
                                }
                              }}
                              className={cn(inputClass, fieldErrorClass(`items.${index}.quantityPurchased`))}
                            />
                            {renderFieldError(`items.${index}.quantityPurchased`)}
                          </div>

                          <div className={formFieldClass}>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="Unit Price *"
                              value={item.purchasePrice || ""}
                              onChange={(e) =>
                                updateItem(index, "purchasePrice", Number(e.target.value))
                              }
                              className={cn(inputClass, fieldErrorClass(`items.${index}.purchasePrice`))}
                            />
                            {renderFieldError(`items.${index}.purchasePrice`)}
                          </div>
                        </div>

                        {selectedProduct &&
                          item.quantityPurchased > 0 &&
                          item.quantityPurchased > selectedProduct.stockQuantity && (
                            <Alert className="border-border bg-muted py-2">
                              <AlertTriangle className="h-4 w-4 text-navy" />
                              <AlertDescription className="text-navy text-xs">
                                Quantity ({item.quantityPurchased}) exceeds current stock (
                                {selectedProduct.stockQuantity}).
                              </AlertDescription>
                            </Alert>
                          )}

                        {selectedProduct &&
                          item.quantityPurchased > 0 &&
                          item.quantityPurchased <= selectedProduct.stockQuantity && (
                            <p className={formHintClass}>
                              Stock: {selectedProduct.stockQuantity}
                            </p>
                          )}
                      </div>
                    )
                  })}

                  <Button type="button" variant="ghost" size="sm" className={formActionLinkClass} onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add another product
                  </Button>
                </section>

                <section className={formSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <Truck className="h-4 w-4 text-navy/70" />
                    Supplier & details
                  </h3>
                  <div className={formGridClass}>
                    <div className={formFieldClass}>
                      <Label htmlFor="supplier" className={formLabelClass}>Supplier *</Label>
                      <Select
                        value={formData.supplier || undefined}
                        onValueChange={handleSupplierChange}
                      >
                        <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("supplier"))}>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierOptions.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.name}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__">Add new supplier...</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("supplier")}
                    </div>

                    <div className={formFieldClass}>
                      <Label htmlFor="supplierType" className={formLabelClass}>Supplier Type *</Label>
                      <Select
                        value={formData.supplierType || undefined}
                        onValueChange={(value) => updateForm({ supplierType: value })}
                      >
                        <SelectTrigger className={cn(selectTriggerClass, fieldErrorClass("supplierType"))}>
                          <SelectValue placeholder="Select supplier type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="Company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("supplierType")}
                    </div>
                  </div>

                  <div className={formGridClass}>
                    <div className={formFieldClass}>
                      <Label htmlFor="date" className={formLabelClass}>Purchase Date *</Label>
                      <MaterialDatePicker
                        className={inputClass}
                        value={formData.purchaseDate ? new Date(formData.purchaseDate) : undefined}
                        onChange={(date: Date | undefined) =>
                          updateForm({ purchaseDate: date ? date.toISOString().split("T")[0] : "" })
                        }
                      />
                      {renderFieldError("purchaseDate")}
                    </div>
                  </div>
                </section>

                <section className={formSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <Receipt className="h-4 w-4 text-navy/70" />
                    Options
                  </h3>
                  <div className={formGridClass}>
                    <div className={formFieldClass}>
                      <Label className={formLabelClass}>Include VAT? *</Label>
                      <div className="flex h-10 items-center gap-5">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="vatYes"
                            name="isVat"
                            value="yes"
                            checked={formData.isVat === true}
                            onChange={() => updateForm({ isVat: true })}
                            className="h-4 w-4 cursor-pointer accent-navy"
                          />
                          <label htmlFor="vatYes" className="ml-2 cursor-pointer font-sans text-sm font-normal leading-5 text-navy">
                            Yes
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="vatNo"
                            name="isVat"
                            value="no"
                            checked={formData.isVat === false}
                            onChange={() => updateForm({ isVat: false })}
                            className="h-4 w-4 cursor-pointer accent-navy"
                          />
                          <label htmlFor="vatNo" className="ml-2 cursor-pointer font-sans text-sm font-normal leading-5 text-navy">
                            No
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className={formFieldClass}>
                      <Label htmlFor="bill" className={formLabelClass}>
                        <span className="inline-flex items-center gap-1.5">
                          <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                          Upload Bill Image
                        </span>
                      </Label>
                      <input
                        key={billInputKey}
                        type="file"
                        id="bill"
                        accept="image/*"
                        onChange={(e) => setBillImage(e.target.files?.[0] || null)}
                        className={formFileInputClass}
                      />
                    </div>
                  </div>
                </section>
                </div>

                <div className={formDialogFooterClass}>
                  <Button type="button" variant="neutralOutline" onClick={clearForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {user?.role === "admin" ? "Add Purchase" : "Submit for Approval"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AddSupplierDialog
            open={isAddSupplierDialogOpen}
            onOpenChange={setIsAddSupplierDialogOpen}
            onSupplierAdded={handleSupplierAdded}
          />
        </div>
      </div>

      <PurchasesTable
        filteredPurchases={filteredPurchases}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        purchasesCounts={purchasesCounts}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSupplierClick={handleSupplierClick}
      />

      <ViewPurchaseDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        purchase={viewingPurchase}
        onEdit={handleEdit}
      />

      <EditPurchaseDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData as any}
        onFormChange={updateForm}
        editReason={editReason}
        onEditReasonChange={setEditReason}
        billUrl={billUrl}
        onBillImageChange={setBillImage}
        products={products}
        suppliers={suppliers}
        fieldErrors={mapPurchaseItemErrorsToEditFields(fieldErrors)}
        userRole={user?.role}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearFieldErrors()
          resetPurchaseForm()
          setIsEditDialogOpen(false)
        }}
      />

      <DeletePurchaseDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deleteReason={deleteReason}
        onDeleteReasonChange={setDeleteReason}
        userRole={user?.role}
        onConfirm={async (e) => {
          e.preventDefault()
          await handleDeleteConfirm()
        }}
      />

      <SupplierHistoryDialog
        isOpen={isSupplierHistoryDialogOpen}
        onOpenChange={setIsSupplierHistoryDialogOpen}
        supplierName={selectedSupplierForHistory}
        purchases={purchases}
      />

      <QuickAddProductDialog
        open={isQuickAddProductOpen}
        onOpenChange={setIsQuickAddProductOpen}
        onProductCreated={handleQuickAddProductCreated}
        defaultSupplier={getPurchaseSupplierName()}
        defaultUnitPrice={
          addingProductItemIndex !== null
            ? formData.items[addingProductItemIndex]?.purchasePrice || 0
            : 0
        }
      />
    </div>
  );
}