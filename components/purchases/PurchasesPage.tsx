"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatNepaliDateForTable } from "@/lib/utils"
import { CheckCircle, Clock, Loader2, Plus, Search } from "lucide-react"
import React, { useEffect, useState } from "react"
import DeletePurchaseDialog from "./DeletePurchaseDialog"
import EditPurchaseDialog from "./EditPurchaseDialog"
import ProductHistoryDialog from "./ProductHistoryDialog"
import PurchasesTable from "./PurchasesTable"
import SupplierHistoryDialog from "./SupplierHistoryDialog"
import ViewPurchaseDialog from "./ViewPurchaseDialog"

export default function PurchasesPage() {
  const { products, purchases, suppliers, sales, addPurchase, updatePurchase, deletePurchase } = useInventory()
  const { user } = useAuth()
  const { requestPurchaseChange } = usePurchaseChange()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [billImage, setBillImage] = useState<File | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isProductHistoryDialogOpen, setIsProductHistoryDialogOpen] = useState(false)
  const [isSupplierHistoryDialogOpen, setIsSupplierHistoryDialogOpen] = useState(false)
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<string>("")
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productFilter, setProductFilter] = useState("all")
  const [billUrl, setBillUrl] = useState<string>("");
  const initialFormData = {
    productId: "",
    customProductName: "",
    supplier: "",
    supplierType: "Company",
    customSupplier: "",
    quantityPurchased: 0,
    purchasePrice: 0,
    category: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    netWeight: 0,
  }

  const { formData, updateForm, resetForm } = usePersistentForm('purchases-form', initialFormData)
  const [editReason, setEditReason] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const isCustomProductSelected = productFilter === "custom"
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  // Filter purchases based on search term (tab filter handled in PurchasesTable)
  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const uploadBillToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("purchaseBill", file);

    const res = await fetch("/api/purchases/upload", {
      method: "POST",
      body: formData,
    });

    console.log("Upload Response Status:", res.status);
    console.log("Upload Response OK:", res.ok);

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

  const uniqueProductNames = React.useMemo(() => {
    return Array.from(new Set(products.map(p => p.name)))
  }, [products])

  const clearForm = () => {
    resetForm()
    setEditReason("")
    setIsAddDialogOpen(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Close form instantly
    setIsAddDialogOpen(false)
    if (isLoading) return
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating purchase data...", duration: 2000 })
      updateProgress("Validating purchase data...", 1, 5)
      await new Promise(resolve => setTimeout(resolve, 500))

      let uploadedBillUrl = "";
      if (billImage) {
        uploadedBillUrl = await uploadBillToCloudinary(billImage);
      }

      const isCustomProduct = productFilter === "custom"
      const product = products.find((p) => p.id === formData.productId)
      const productName = isCustomProduct ? formData.customProductName : product?.name
      if (!productName) {
        toast({
          title: "Error",
          description: "Please select or enter a product name.",
          variant: "destructive",
        })

        return
      }
      if (productName) {
        updateProgress("Checking product availability...", 2, 5)
        await new Promise(resolve => setTimeout(resolve, 500))

        if (user?.role === "admin") {
          updateProgress("Recording purchase transaction...", 3, 5)
          await new Promise(resolve => setTimeout(resolve, 500))

          updateProgress("Updating inventory levels...", 4, 5)
          const supplierName = formData.supplier === "custom" ? formData.customSupplier : formData.supplier
          const { customSupplier, ...purchaseData } = formData
          await addPurchase({
            ...purchaseData, productName, supplier: supplierName, billUrl: uploadedBillUrl, category: isAddingNewCategory ? newCategoryName : formData.category,
          })

          updateProgress("Operation completed!", 5, 5)
          await new Promise(resolve => setTimeout(resolve, 300))
          resetForm()
          toast({ title: "Success", description: "Purchase recorded successfully!", })
        } else {
          updateProgress("Preparing approval request...", 3, 4)
          await new Promise(resolve => setTimeout(resolve, 500))

          updateProgress("Submitting for approval...", 4, 4)
          const supplierName = formData.supplier === "custom" ? formData.customSupplier : formData.supplier
          const { customSupplier, ...purchaseData } = formData
          requestPurchaseChange(
            "create",
            {
              ...purchaseData,
              productName,
              supplier: supplierName,
            },
            undefined,
            editReason || "New purchase record"
          )
          toast({ title: "Submitted", description: "Purchase submitted for admin approval." })
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to record purchase.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    const product = products.find((p) => p.name === purchase.productName)

    // Convert date to YYYY-MM-DD format for HTML date input
    const formattedDate = new Date(purchase.purchaseDate).toISOString().split('T')[0]

    updateForm({
      productId: product?.id || "",
      supplier: purchase.supplier,
      supplierType: purchase.supplierType,
      customSupplier: "",
      quantityPurchased: purchase.quantityPurchased,
      purchasePrice: purchase.purchasePrice,
      purchaseDate: formattedDate,
      netWeight: product?.netWeight ?? 0,
    })
    setBillUrl(purchase.billUrl || "")
    setBillImage(null)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Close form instantly
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

      const product = products.find((p) => p.id === formData.productId)
      if (product && editingPurchase && (user?.role === "admin" || editReason.trim())) {
        updateProgress("Checking product availability...", 2, 5)
        await new Promise(resolve => setTimeout(resolve, 500))

        if (user?.role === "admin") {
          updateProgress("Updating purchase record...", 3, 5)
          await new Promise(resolve => setTimeout(resolve, 500))

          updateProgress("Adjusting inventory...", 4, 5)
          const supplierName = formData.supplier === "custom" ? formData.customSupplier : formData.supplier
          const { customSupplier, ...purchaseData } = formData
          await updatePurchase(editingPurchase.id, { ...purchaseData, productName: product.name, supplier: supplierName, billUrl: uploadedBillUrl })

          updateProgress("Operation completed!", 5, 5)
          await new Promise(resolve => setTimeout(resolve, 300))

          toast({ title: "Success", description: "Purchase updated successfully!", })
        } else {
          updateProgress("Preparing approval request...", 3, 4)
          await new Promise(resolve => setTimeout(resolve, 500))

          updateProgress("Submitting for approval...", 4, 4)
          const supplierName = formData.supplier === "custom" ? formData.customSupplier : formData.supplier
          const { customSupplier, ...purchaseData } = formData
          requestPurchaseChange("update", { ...purchaseData, productName: product.name, supplier: supplierName, billUrl: uploadedBillUrl }, editingPurchase.id, editReason)
          toast({ title: "Submitted", description: "Purchase changes submitted for admin approval." })
        }
      } else if (user?.role !== "admin" && !editReason.trim()) {
        toast({ title: "Error", description: "Please provide a reason for the changes.", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update purchase.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsProductHistoryDialogOpen(true)
  }

  useEffect(() => {
    console.log("All Purchases:", purchases);

    purchases.forEach((purchase) => {
      console.log("Product Name:", purchase.productName);
    });
  }, [purchases]);

  // Get all products for selection
  const filteredProducts = React.useMemo(() => {
    return products
  }, [products])

  const categories = React.useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort()
  }, [products])

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

  React.useEffect(() => {
    if (formData.productId) {
      const product = products.find((p) => p.id === formData.productId)
      if (product && typeof product.netWeight === "number") {
        updateForm({ netWeight: product.netWeight ?? 0 })
      }
    }
  }, [formData.productId, products])

  return (
    <div className="space-y-6 p-6 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Processing Purchase...
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
            Purchases
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage purchase orders and inventory restocking</p>
          {user?.role !== "admin" && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Changes require admin approval
              </Badge>
            </div>
          )}
        </div>
        <div className="absolute top-6 right-0 flex space-x-3">
          <Button
            type="button"
            onClick={() => exportPurchasesToCSV(filteredPurchases)}
            className="px-6 py-2 mb-4"
          >
            Export Purchases CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="neutral"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Purchase</DialogTitle>
                <DialogDescription>
                  Enter purchase information to record a new purchase
                  {user?.role !== "admin" && (
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
                  <Label htmlFor="product">Product *</Label>
                  <Select
                    value={productFilter}
                    onValueChange={(value) => {
                      setProductFilter(value)
                      if (value === "custom") {
                        updateForm({
                          ...formData,
                          productId: "custom",
                          customProductName: "",
                          netWeight: 0,
                        })

                        return
                      }
                      updateForm({
                        ...formData,
                        productId: "",
                        customProductName: "",
                        netWeight: 0,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Product
                      </SelectItem>
                      {uniqueProductNames.map((name) => (
                        <SelectItem
                          key={name}
                          value={name}
                        >
                          {name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        + Add Custom Product
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* main product Dropdown */}
                  {isCustomProductSelected ? (
                    <Input
                      placeholder="Enter custom product name"
                      value={formData.customProductName}
                      onChange={(e) =>
                        updateForm({
                          ...formData,
                          customProductName: e.target.value,
                        })
                      }
                      required
                    />
                  ) : (
                    <Select
                      value={formData.productId}
                      onValueChange={(value) => {
                        const selectedProduct =
                          products.find(
                            (p) => p.id === value
                          )
                        updateForm({
                          ...formData,
                          productId: value,
                          netWeight:
                            selectedProduct?.netWeight || 0,
                        })
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product">
                          {
                            filteredProducts.find(
                              (p) => p.id === formData.productId
                            )?.name
                          }
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        {filteredProducts
                          .filter(
                            (product) =>
                              (categoryFilter === "all" ||
                                product.category === categoryFilter) &&
                              (productFilter === "all" ||
                                product.name === productFilter)
                          )
                          .map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {product.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Stock:
                                  {product.stockQuantity}
                                </span>
                                <span className="text-sm text-gray-500">
                                  netWeight:
                                  {product.netWeight}kg
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>

                  {isAddingNewCategory && (
                    <Input
                      id="category-new"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter new category name"
                      required
                    />
                  )}

                  <Select
                    value={isAddingNewCategory ? "__new__" : formData.category}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setIsAddingNewCategory(true)
                        setNewCategoryName("")

                        updateForm({
                          ...formData,
                          category: "",
                        })
                      } else {
                        setIsAddingNewCategory(false)

                        updateForm({
                          ...formData,
                          category: value,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or add category" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>

                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}

                      <SelectItem value="__new__">
                        Add new category...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <div className="space-y-2">
                    <Select
                      value={formData.supplier}
                      onValueChange={(value) => updateForm({ ...formData, supplier: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier or enter custom name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">+ Add Custom Supplier</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.supplier === "custom" && (
                      <Input
                        placeholder="Enter custom supplier name"
                        value={formData.customSupplier || ""}
                        onChange={(e) => updateForm({ ...formData, customSupplier: e.target.value })}
                        className="mt-2"
                        required
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierType">Supplier Type *</Label>
                  <Select
                    value={formData.supplierType}
                    onValueChange={(value) => updateForm({ ...formData, supplierType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={formData.quantityPurchased === 0 ? "" : formData.quantityPurchased}
                      onChange={(e) => {
                        const value = e.target.value
                        updateForm({ ...formData, quantityPurchased: value === "" ? 0 : Number.parseInt(value) })
                      }}
                      placeholder="Enter the quantity"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Unit Price (Rs) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min={0}
                      value={formData.purchasePrice === 0 ? "" : formData.purchasePrice}
                      onChange={(e) => {
                        const value = e.target.value
                        updateForm({ ...formData, purchasePrice: value === "" ? 0 : Number.parseFloat(value) })
                      }}
                      placeholder="Enter the unit price"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date *</Label>
                  <MaterialDatePicker
                    value={formData.purchaseDate ? new Date(formData.purchaseDate) : undefined}
                    onChange={(date: Date | undefined) => updateForm({ ...formData, purchaseDate: date ? date.toISOString().split("T")[0] : "" })}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="bill">Upload Bill Image</label>
                  <input
                    type="file"
                    id="bill"
                    accept="image/*"
                    onChange={(e) => setBillImage(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
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
        </div>
      </div>

      {/* Search */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <Input
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 border-2 focus:border-slate-500 transition-colors h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      <PurchasesTable
        filteredPurchases={filteredPurchases}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        purchasesCounts={purchasesCounts}
        products={products}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onProductClick={handleProductClick}
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
        formData={formData}
        onFormChange={updateForm}
        editReason={editReason}
        onEditReasonChange={setEditReason}
        billUrl={billUrl}
        onBillImageChange={setBillImage}
        products={products}
        suppliers={suppliers}
        userRole={user?.role}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearForm()
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

      <ProductHistoryDialog
        isOpen={isProductHistoryDialogOpen}
        onOpenChange={setIsProductHistoryDialogOpen}
        product={selectedProduct}
        sales={sales}
        purchases={purchases}
      />

      <SupplierHistoryDialog
        isOpen={isSupplierHistoryDialogOpen}
        onOpenChange={setIsSupplierHistoryDialogOpen}
        supplierName={selectedSupplierForHistory}
        purchases={purchases}
      />
    </div>
  );
}