"use client"

import SupplierHistoryDialog from "@/components/purchases/SupplierHistoryDialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { usePersistentForm } from "@/contexts/FormPersistenceContext"
import type { Product } from "@/contexts/InventoryContext"
import { useInventory } from "@/contexts/InventoryContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { useProductChange } from "@/hooks/useProductChange"
import { CheckCircle } from "lucide-react"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import AddProductDialog from "./AddProductDialog"
import AddSupplierDialog from "@/components/suppliers/AddSupplierDialog"
import CategoryHistoryDialog from "./CategoryHistoryDialog"
import ClientHistoryDialog from "./ClientHistoryDialog"
import DeleteProductDialog from "./DeleteProductDialog"
import EditProductDialog from "./EditProductDialog"
import ProcessingOverlay from "./ProcessingOverlay"
import ProductApprovalDialog from "./ProductApprovalDialog"
import ProductTransactionHistoryDialog from "./ProductTransactionHistoryDialog"
import ProductsTable from "./ProductsTable"
import { initialProductFormData, type PendingProductAction, type ProductFormData } from "./types"
import { exportAllProductsToCSV, filterProducts, groupProductsByName } from "./utils"
import ViewProductDialog from "./ViewProductDialog"

export default function ProductsPage() {
  const { user } = useAuth()
  const { products, addProduct, updateProduct, deleteProduct, refreshData, suppliers, sales, purchases } = useInventory()
  const { requestProductChange } = useProductChange()
  const { addNotification } = useNotifications()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [pendingAction, setPendingAction] = useState<PendingProductAction | null>(null)
  const { formData, updateForm, resetForm } = usePersistentForm<ProductFormData>("products-form", initialProductFormData)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [approvalReason, setApprovalReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false)
  const [isAddingCustomNetWeight, setIsAddingCustomNetWeight] = useState(false)
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false)
  const [isCategoryHistoryOpen, setIsCategoryHistoryOpen] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null)
  const [selectedCategoryForHistory, setSelectedCategoryForHistory] = useState("")
  const [isSupplierHistoryOpen, setIsSupplierHistoryOpen] = useState(false)
  const [isClientHistoryOpen, setIsClientHistoryOpen] = useState(false)
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState("")
  const [selectedClientForHistory, setSelectedClientForHistory] = useState("")
  const [customNetWeight, setCustomNetWeight] = useState(0)
  const [customProductName, setCustomProductName] = useState("")
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, boolean>>({})

  const uniqueNetWeights = useMemo(() => {
    const weights = products.map((p) => p.netWeight).filter((w) => typeof w === "number" && !isNaN(w))
    return Array.from(new Set(weights)).sort((a, b) => (a as number) - (b as number)) as number[]
  }, [products])

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products])
  const uniqueProductNames = useMemo(
    () => Array.from(new Set(products.map((p) => p.name).filter(Boolean))).sort(),
    [products],
  )

  const filteredProducts = useMemo(
    () => filterProducts(products, searchTerm, categoryFilter),
    [products, searchTerm, categoryFilter],
  )

  const groupedProducts = useMemo(
    () => groupProductsByName(filteredProducts),
    [filteredProducts],
  )

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  const updateProgress = (step: string, current: number, total: number) => {
    setCurrentStep(step)
    setProgress((current / total) * 100)
    setTotalSteps(total)
  }

  const clearForm = () => {
    resetForm()
    setEditingProduct(null)
    setApprovalReason("")
    setIsAddingNewCategory(false)
    setIsAddingNewProduct(false)
    setIsAddingCustomNetWeight(false)
    setNewCategoryName("")
    setAutoFilledFields({})
    setIsAddDialogOpen(false)
  }

  const handleNetWeightChange = (value: string) => {
    if (value === "__new__") {
      setIsAddingCustomNetWeight(true)
      setCustomNetWeight(0)
      updateForm({ netWeight: 0 })
    } else {
      setIsAddingCustomNetWeight(false)
      updateForm({ netWeight: Number(value) })
    }
  }

  const handleProductNameChange = (value: string) => {
    if (value === "__new__") {
      setIsAddingNewProduct(true)
      setIsAddingNewCategory(false)
      setIsAddingCustomNetWeight(false)
      setNewCategoryName("")
      setCustomProductName("")
      updateForm({
        name: "",
        category: "",
        supplier: "",
        stockQuantity: 0,
        unitPrice: 0,
        netWeight: 0,
        stockType: "new",
        description: "",
      })
      setAutoFilledFields({})
      return
    }

    setIsAddingNewProduct(false)
    const existingProduct = products.find((p) => p.name === value)
    if (existingProduct) {
      const newAutoFilledFields: Record<string, boolean> = {}
      const updatedFormData: ProductFormData = {
        ...formData,
        name: value,
        category: existingProduct.category && existingProduct.category.trim() !== "" ? existingProduct.category : formData.category,
        supplier: existingProduct.supplier && existingProduct.supplier.trim() !== "" ? existingProduct.supplier : formData.supplier,
      }

      if (existingProduct.category && existingProduct.category.trim() !== "" && existingProduct.category !== formData.category) {
        newAutoFilledFields.category = true
      }
      if (existingProduct.supplier && existingProduct.supplier.trim() !== "" && existingProduct.supplier !== formData.supplier) {
        newAutoFilledFields.supplier = true
      }

      updateForm(updatedFormData)
      setAutoFilledFields(newAutoFilledFields)
      setTimeout(() => setAutoFilledFields({}), 3000)
    } else {
      updateForm({ name: value })
      setAutoFilledFields({})
    }
  }

  const handleCategoryChange = (value: string) => {
    if (value === "__new__") {
      setIsAddingNewCategory(true)
      setNewCategoryName("")
      updateForm({ category: "" })
    } else {
      setIsAddingNewCategory(false)
      setNewCategoryName("")
      updateForm({ category: value })
    }
  }

  const handleSupplierChange = (value: string) => {
    if (value === "__new__") {
      setIsAddSupplierDialogOpen(true)
      return
    }
    updateForm({ supplier: value })
  }

  const handleSupplierAdded = (supplierName: string) => {
    updateForm({ supplier: supplierName })
    setAutoFilledFields((prev) => ({ ...prev, supplier: true }))
    setTimeout(() => setAutoFilledFields({}), 3000)
  }

  const getSubmitData = (): ProductFormData => ({
    ...formData,
    category: isAddingNewCategory ? newCategoryName : formData.category,
  })

  const validateSubmitData = (submitData: ProductFormData) => {
    if (!submitData.name || submitData.name.trim() === "") {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" })
      return false
    }
    if (!submitData.supplier || submitData.supplier.trim() === "") {
      toast({ title: "Error", description: "Supplier is required", variant: "destructive" })
      return false
    }
    if (!submitData.category || submitData.category.trim() === "") {
      toast({ title: "Error", description: "Category is required", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = getSubmitData()
    if (!validateSubmitData(submitData)) return

    setIsAddDialogOpen(false)
    setIsLoading(true)
    setProgress(0)

    try {
      if (user?.role === "admin") {
        updateProgress("Validating product data...", 1, 3)
        await new Promise((r) => setTimeout(r, 300))
        await addProduct(submitData)
        resetForm()
        toast({ title: "Success", description: "Product added successfully!" })
        setShowSuccessAlert(true)
        setAlertMessage("Product added successfully!")
        addNotification({
          type: "success",
          title: "Product Added",
          message: `Product "${submitData.name}" has been successfully added to inventory.`,
          action: "product_added",
          entityId: submitData.name,
          entityType: "product",
        })
        refreshData().catch(console.error)
      } else {
        setPendingAction({ type: "create", data: submitData })
        setShowApprovalDialog(true)
        addNotification({
          type: "info",
          title: "Approval Request",
          message: `Product "${submitData.name}" has been submitted for admin approval.`,
          action: "approval_requested",
          entityId: submitData.name,
          entityType: "product",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add product."
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      addNotification({
        type: "error",
        title: "Product Addition Failed",
        message: errorMessage,
        action: "product_add_failed",
        entityType: "product",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = getSubmitData()
    if (!validateSubmitData(submitData)) return

    setIsEditDialogOpen(false)
    setIsLoading(true)
    setProgress(0)

    try {
      if (editingProduct) {
        if (user?.role === "admin") {
          await updateProduct(editingProduct.id, submitData)
          resetForm()
          setEditingProduct(null)
          toast({ title: "Success", description: "Product updated successfully!" })
          setShowSuccessAlert(true)
          setAlertMessage("Product updated successfully!")
          addNotification({
            type: "success",
            title: "Product Updated",
            message: `Product "${submitData.name}" has been successfully updated.`,
            action: "product_updated",
            entityId: editingProduct.id,
            entityType: "product",
          })
          refreshData().catch(console.error)
        } else {
          setPendingAction({ type: "update", data: submitData, productId: editingProduct.id })
          setShowApprovalDialog(true)
          addNotification({
            type: "info",
            title: "Update Approval Request",
            message: `Update for product "${submitData.name}" has been submitted for admin approval.`,
            action: "update_approval_requested",
            entityId: editingProduct.id,
            entityType: "product",
          })
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update product."
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      addNotification({
        type: "error",
        title: "Product Update Failed",
        message: errorMessage,
        action: "product_update_failed",
        entityType: "product",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const submitForApproval = () => {
    if (!pendingAction) return

    requestProductChange(
      pendingAction.type,
      pendingAction.data,
      pendingAction.productId,
      approvalReason,
    )

    resetForm()
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setShowApprovalDialog(false)
    setPendingAction(null)
    setShowSuccessAlert(true)
    setAlertMessage("Product request submitted for approval!")
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    const nameInList = uniqueProductNames.includes(product.name)
    const netWeight = product.netWeight || 0
    setIsAddingNewProduct(!nameInList)
    setIsAddingNewCategory(false)
    setNewCategoryName("")
    setIsAddingCustomNetWeight(netWeight > 0 && !uniqueNetWeights.includes(netWeight))
    updateForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      stockQuantity: product.stockQuantity,
      unitPrice: product.unitPrice,
      netWeight: product.netWeight || 0,
      supplier: product.supplier,
      stockType: product.stockType,
      lowStockThreshold: (product as Product & { lowStockThreshold?: number }).lowStockThreshold ?? 5,
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (product: Product) => {
    setDeletingProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (product: Product) => {
    setViewingProduct(product)
    setIsViewDialogOpen(true)
  }

  const handleProductClick = (product: Product) => {
    setSelectedProductForHistory(product)
    setIsTransactionHistoryOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return

    setIsDeleteDialogOpen(false)
    setIsLoading(true)
    setProgress(0)

    try {
      if (user?.role === "admin") {
        await deleteProduct(deletingProduct.id)
        toast({ title: "Success", description: "Product deleted successfully!" })
        setDeletingProduct(null)
        addNotification({
          type: "warning",
          title: "Product Deleted",
          message: `Product "${deletingProduct.name}" has been permanently deleted from inventory.`,
          action: "product_deleted",
          entityId: deletingProduct.id,
          entityType: "product",
        })
        await refreshData()
      } else {
        setPendingAction({
          type: "delete",
          data: { deleted: true },
          productId: deletingProduct.id,
        })
        setShowApprovalDialog(true)
        addNotification({
          type: "info",
          title: "Deletion Approval Request",
          message: `Deletion request for product "${deletingProduct.name}" has been submitted for admin approval.`,
          action: "deletion_approval_requested",
          entityId: deletingProduct.id,
          entityType: "product",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product."
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      addNotification({
        type: "error",
        title: "Product Deletion Failed",
        message: errorMessage,
        action: "product_deletion_failed",
        entityType: "product",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleSupplierClick = (supplier: string) => {
    setSelectedSupplierForHistory(supplier)
    setIsSupplierHistoryOpen(true)
  }

  const handleClientClick = (client: string) => {
    setSelectedClientForHistory(client)
    setIsClientHistoryOpen(true)
  }

  const sharedFormProps = {
    formData,
    updateForm,
    categories,
    suppliers,
    uniqueProductNames,
    uniqueNetWeights,
    isAddingNewProduct,
    isAddingNewCategory,
    isAddingCustomNetWeight,
    newCategoryName,
    onNewCategoryNameChange: setNewCategoryName,
    onCategoryChange: handleCategoryChange,
    onSupplierChange: handleSupplierChange,
    autoFilledFields,
    onProductNameChange: handleProductNameChange,
    onNetWeightChange: handleNetWeightChange,
    onCustomProductNameChange: (value: string) => {
      setCustomProductName(value)
      updateForm({ name: value })
    },
    onCustomNetWeightChange: (value: number) => {
      setCustomNetWeight(value)
      updateForm({ netWeight: value })
    },
    userRole: user?.role,
  }

  return (
    <div className="space-y-8 p-6 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <ProcessingOverlay
        isLoading={isLoading}
        currentStep={currentStep}
        progress={progress}
        totalSteps={totalSteps}
      />

      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 mb-4">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{alertMessage}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">Products</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Manage your product inventory with ease</p>
        </div>
        <div className="absolute top-6 right-0 flex space-x-3">
          <Button onClick={() => exportAllProductsToCSV(products)}>Export All Products</Button>
          <AddProductDialog
            {...sharedFormProps}
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onResetForm={() => {
              resetForm()
              setIsAddingNewProduct(false)
              setIsAddingNewCategory(false)
              setIsAddingCustomNetWeight(false)
              setNewCategoryName("")
              setAutoFilledFields({})
            }}
            onSubmit={handleSubmit}
            onCancel={clearForm}
          />
          <AddSupplierDialog
            open={isAddSupplierDialogOpen}
            onOpenChange={setIsAddSupplierDialogOpen}
            onSupplierAdded={handleSupplierAdded}
          />
          <ProductApprovalDialog
            isOpen={showApprovalDialog}
            onOpenChange={setShowApprovalDialog}
            approvalReason={approvalReason}
            onApprovalReasonChange={setApprovalReason}
            onSubmit={submitForApproval}
          />
        </div>
      </div>

      <EditProductDialog
        {...sharedFormProps}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearForm()
          setIsEditDialogOpen(false)
        }}
      />

      <ProductsTable
        groupedProducts={groupedProducts}
        categories={categories}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onProductClick={handleProductClick}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ViewProductDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        product={viewingProduct}
        onEdit={handleEdit}
      />

      <DeleteProductDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        product={deletingProduct}
        userRole={user?.role}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteDialogOpen(false)
          setDeletingProduct(null)
        }}
      />

      <ProductTransactionHistoryDialog
        isOpen={isTransactionHistoryOpen}
        onOpenChange={setIsTransactionHistoryOpen}
        product={selectedProductForHistory}
        sales={sales}
        purchases={purchases}
        onClientClick={handleClientClick}
        onSupplierClick={handleSupplierClick}
        onViewProduct={handleView}
      />

      <CategoryHistoryDialog
        isOpen={isCategoryHistoryOpen}
        onOpenChange={setIsCategoryHistoryOpen}
        category={selectedCategoryForHistory}
        products={products}
        sales={sales}
        purchases={purchases}
        onClientClick={handleClientClick}
        onSupplierClick={handleSupplierClick}
      />

      <SupplierHistoryDialog
        isOpen={isSupplierHistoryOpen}
        onOpenChange={setIsSupplierHistoryOpen}
        supplierName={selectedSupplierForHistory}
        purchases={purchases}
      />

      <ClientHistoryDialog
        isOpen={isClientHistoryOpen}
        onOpenChange={setIsClientHistoryOpen}
        clientName={selectedClientForHistory}
        sales={sales}
      />
    </div>
  )
}
