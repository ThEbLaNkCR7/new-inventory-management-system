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
import { Sale, useInventory } from "@/contexts/InventoryContext"
import { useSaleChange } from "@/hooks/useSaleChange"
import { CheckCircle, Clock, Loader2, Plus, Search } from "lucide-react"
import React, { useEffect, useState } from "react"
import ClientHistoryDialog from "./ClientHistoryDialog"
import DeleteSaleDialog from "./DeleteSaleDialog"
import EditSaleDialog from "./EditSaleDialog"
import ProductHistoryDialog from "./ProductHistoryDialog"
import SalesTable from "./SalesTable"
import ViewSaleDialog from "./ViewSaleDialog"

type SaleItem = {
  productId: string
  quantitySold: number
  salePrice: number
}
type ItemKey = keyof SaleItem

export default function SalesPage() {
  const { user } = useAuth()
  const { products, sales, clients, purchases, addSale, updateSale, deleteSale } = useInventory()
  const { requestSaleChange } = useSaleChange()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isProductHistoryDialogOpen, setIsProductHistoryDialogOpen] = useState(false)
  const [isClientHistoryDialogOpen, setIsClientHistoryDialogOpen] = useState(false)
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<string>("")
  const [editingSale, setEditingSale] = useState<any>(null)
  const [deletingSale, setDeletingSale] = useState<any>(null)
  const [viewingSale, setViewingSale] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const initialFormData = {
    items: [
      {
        productId: "",
        quantitySold: 0,
        salePrice: 0,
      },
    ],
    client: "",
    clientType: "Company",
    customClient: "",
    saleDate: new Date().toISOString().split("T")[0],
  }

  const addItem = () => {
    updateForm({
      items: [...formData.items, { productId: "", quantitySold: 0, salePrice: 0 }],
    })
  }

  const removeItem = (index: number) => {
    const updated = formData.items.filter((_: any, i: number) => i !== index)
    updateForm({ items: updated })
  }


  const updateItem = (
    index: number,
    key: ItemKey,
    value: SaleItem[ItemKey]
  ) => {
    const updated = [...formData.items]
    updated[index] = {
      ...updated[index],
      [key]: value,
    }
    updateForm({ items: updated })
  }

  const { formData, updateForm, resetForm } = usePersistentForm("sales-form", initialFormData)
  const [editReason, setEditReason] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [totalSteps, setTotalSteps] = useState(0)
  const [productFilter, setProductFilter] = useState("all")
  const [billImage, setBillImage] = useState<File | null>(null)
  const [billUrl, setBillUrl] = useState<string>("")

  // Get unique product names
  const uniqueProductNames = React.useMemo(() => {
    return Array.from(new Set(products.map((p) => p.name)))
  }, [products])

  const selectedProductWeights = React.useMemo(() => {
    const firstItem = formData.items?.[0]
    if (!firstItem?.productId) return []

    const selectedProduct = products.find(
      (p) => p.id === firstItem.productId
    )
    if (!selectedProduct) return []

    const productVariants = products.filter(
      (p) => p.name === selectedProduct.name
    )

    const weights = productVariants
      .map((p) => p.netWeight)
      .filter((w) => typeof w === "number" && !isNaN(w))

    return Array.from(new Set(weights)).sort(
      (a, b) => (a as number) - (b as number)
    ) as number[]
  }, [products, formData.items])

  const filteredProducts = React.useMemo(() => products, [products])

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  // Filter sales based on search term and active tab
  const filteredSales = sales.filter(
    (sale) =>
      ((sale.items?.map((i) => i.productName).join(" ") || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) || "") ||
      (sale?.client || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get counts for each tab
  const getSalesCounts = () => {
    const allCount = sales.length
    const individualCount = sales.filter((sale) => sale.clientType === "Individual").length
    const companyCount = sales.filter((sale) => sale.clientType === "Company").length
    return { allCount, individualCount, companyCount }
  }

  const uploadBillToCloudinary = async (file: File): Promise<string> => {
    const formDataObj = new FormData()
    formDataObj.append("bill", file)

    const res = await fetch("/api/sales/upload", {
      method: "POST",
      body: formDataObj,
    })

    console.log("Upload Response Status:", res.status)
    console.log("Upload Response OK:", res.ok)

    let data

    try {
      data = await res.json()
    } catch (err) {
      throw new Error("Server returned invalid response")
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to upload bill")
    }

    return data.url
  }

  const salesCounts = getSalesCounts()

  const clearForm = () => {
    resetForm()
    setEditReason("")
    setIsAddDialogOpen(false)
  }

  const showAlert = (message: string, isSuccess = true) => {
    setAlertMessage(message)
    setShowSuccessAlert(isSuccess)
  }

  const updateProgress = (step: string, current: number, total: number) => {
    setCurrentStep(step)
    setProgress((current / total) * 100)
    setTotalSteps(total)
  }

  const exportSalesToCSV = (salesData: any[]) => {
    if (!salesData || salesData.length === 0) {
      toast({
        title: "No sales data",
        description: "There are no sales to export.",
        variant: "destructive",
      })
      return
    }

    const headers = ["Date", "Product", "Client", "Client Type", "Quantity Sold", "Unit Price", "Total Value", "Bill URL"]

    const rows = salesData.map((sale) => [
      sale.saleDate,
      sale.productName,
      sale.client,
      sale.clientType,
      sale.quantitySold,
      sale.salePrice,
      sale.quantitySold * sale.salePrice,
      sale.billUrl || "",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `sales_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsAddDialogOpen(false)
    setIsLoading(true)
    setProgress(0)

    try {
      toast({
        title: "Processing...",
        description: "Validating sale data...",
        duration: 2000,
      })

      updateProgress("Validating sale data...", 1, 6)
      await new Promise((r) => setTimeout(r, 400))

      // 1. Upload bill if exists
      let uploadedBillUrl = ""
      if (billImage) {
        uploadedBillUrl = await uploadBillToCloudinary(billImage)
      }

      updateProgress("Checking stock availability...", 2, 6)

      // 2. STOCK VALIDATION FOR ALL ITEMS
      for (const item of formData.items) {
        const product = products.find((p) => p.id === item.productId)

        if (!product) {
          toast({
            title: "Error",
            description: "One or more products not found.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        if (item.quantitySold > product.stockQuantity) {
          toast({
            title: "Insufficient Stock",
            description: `${product.name} does not have enough stock.`,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Preparing sale items...", 3, 6)

      // 3. FORMAT ITEMS FOR BACKEND
      const enrichedItems = formData.items.map((item: any) => {
        const product = products.find((p) => p.id === item.productId)

        return {
          productId: item.productId,
          productName: product?.name || "",
          quantitySold: item.quantitySold,
          salePrice: item.salePrice,
        }
      })

      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Processing client data...", 4, 6)

      const clientName =
        formData.client === "custom"
          ? formData.customClient
          : formData.client

      const payload: Omit<Sale, "id"> = {
        client: clientName,
        clientType: formData.clientType,
        saleDate: formData.saleDate,
        billUrl: uploadedBillUrl,
        items: formData.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)

          return {
            productId: item.productId,
            productName: product?.name || "",
            quantitySold: item.quantitySold,
            salePrice: item.salePrice,
          }
        }),
      }

      await new Promise((r) => setTimeout(r, 400))

      updateProgress("Saving transaction...", 5, 6)

      // 4. ADMIN vs APPROVAL FLOW
      if (user?.role === "admin") {
        await addSale(payload)

        updateProgress("Updating inventory...", 6, 6)

        toast({
          title: "Success",
          description: "Sale recorded successfully!",
        })
      } else {
        requestSaleChange(
          "create",
          payload,
          undefined,
          editReason || "New sale request"
        )

        toast({
          title: "Submitted",
          description: "Sale submitted for admin approval.",
        })
      }

      await new Promise((r) => setTimeout(r, 300))

      resetForm()
      setBillImage(null)
      setBillUrl("")

      showAlert("Sale added successfully!", true)
    } catch (err) {
      console.error(err)

      toast({
        title: "Error",
        description: "Failed to record sale.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleEdit = (sale: any) => {
    setEditingSale(sale)
    const product = products.find((p) => p.name === sale.productName)

    const formattedDate = new Date(sale.saleDate).toISOString().split("T")[0]

    updateForm({
      items: [
        {
          productId: product?.id || "",
          quantitySold: sale.quantitySold ?? 0,
          salePrice: sale.salePrice ?? 0,
        },
      ],
      client: sale.client,
      clientType: sale.clientType,
      customClient: "",
      saleDate: formattedDate,
    })
    setBillUrl(sale.billUrl || "")
    setBillImage(null)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating changes...", duration: 2000 })
      updateProgress("Validating changes...", 1, 5)
      await new Promise((resolve) => setTimeout(resolve, 500))

      let uploadedBillUrl = billUrl

      if (billImage) {
        uploadedBillUrl = await uploadBillToCloudinary(billImage)
      }

      const firstItem = formData.items?.[0]
      const product = products.find((p) => p.id === firstItem?.productId)
      if (product && editingSale && (user?.role === "admin" || editReason.trim())) {
        updateProgress("Checking stock availability...", 2, 5)
        await new Promise((resolve) => setTimeout(resolve, 500))

        if (user?.role === "admin") {
          updateProgress("Updating sale record...", 3, 5)
          await new Promise((resolve) => setTimeout(resolve, 500))

          updateProgress("Adjusting inventory...", 4, 5)
          const clientName = formData.client === "custom" ? formData.customClient : formData.client
          const { customClient, ...saleData } = formData
          await updateSale(editingSale.id, {
            ...saleData,
            client: clientName,
            billUrl: uploadedBillUrl,
            items: saleData.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)

              return {
                productId: item.productId,
                productName: product?.name || "",
                quantitySold: item.quantitySold,
                salePrice: item.salePrice,
              }
            }),
          })

          updateProgress("Operation completed!", 5, 5)
          await new Promise((resolve) => setTimeout(resolve, 300))

          setBillImage(null)
          setBillUrl("")

          toast({ title: "Success", description: "Sale updated successfully!" })
        } else {
          updateProgress("Preparing approval request...", 3, 4)
          await new Promise((resolve) => setTimeout(resolve, 500))

          updateProgress("Submitting for approval...", 4, 4)
          const clientName = formData.client === "custom" ? formData.customClient : formData.client
          const { customClient, ...saleData } = formData
          requestSaleChange(
            "update",
            { ...saleData, productName: product.name, client: clientName, billUrl: uploadedBillUrl },
            editingSale.id,
            editReason
          )
          toast({ title: "Submitted", description: "Sale changes submitted for admin approval." })
        }

        resetForm()
        showAlert("Sale updated successfully!", true)
      } else if (user?.role !== "admin" && !editReason.trim()) {
        toast({
          title: "Error",
          description: "Please provide a reason for the changes.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update sale.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  const handleDelete = (sale: any) => {
    setDeletingSale(sale)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (sale: any) => {
    setViewingSale(sale)
    setIsViewDialogOpen(true)
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setIsProductHistoryDialogOpen(true)
  }

  const handleClientClick = (client: string) => {
    setSelectedClientForHistory(client)
    setIsClientHistoryDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false)
    setIsLoading(true)
    setProgress(0)
    try {
      toast({ title: "Processing...", description: "Validating deletion...", duration: 2000 })
      updateProgress("Validating deletion...", 1, 3)

      if (deletingSale && (user?.role === "admin" || deleteReason.trim())) {
        if (user?.role === "admin") {
          updateProgress("Removing sale record...", 2, 3)
          await deleteSale(deletingSale.id)
          updateProgress("Operation completed!", 3, 3)
          toast({ title: "Success", description: "Sale deleted successfully!" })
          setDeletingSale(null)
          showAlert("Sale deleted successfully!", true)
        } else {
          updateProgress("Submitting for approval...", 2, 3)
          requestSaleChange("delete", {}, deletingSale.id, deleteReason)
          toast({ title: "Submitted", description: "Sale deletion submitted for admin approval." })
          setDeletingSale(null)
          setDeleteReason("")
        }
      } else if (user?.role !== "admin" && !deleteReason.trim()) {
        toast({
          title: "Error",
          description: "Please provide a reason for deleting this sale.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete sale.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  useEffect(() => {
    const firstItem = formData.items?.[0]
    if (!firstItem?.productId) return

    const product = products.find((p) => p.id === firstItem.productId)
  }, [formData.items, products])

  return (
    <div className="space-y-6 p-6 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Processing Sale...</h3>
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

      {/* add sale */}
      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">Sales</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage sales transactions and revenue tracking</p>
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
            onClick={() => exportSalesToCSV(filteredSales)}
            className="px-6 py-2 mb-4"
          >
            Export Sales CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="neutral"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Sale</DialogTitle>
                <DialogDescription>
                  Enter sale information to record a new sale
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
                <div className="space-y-3">
                  <Label>Products *</Label>

                  {formData.items.map((item: any, index: number) => {
                    const selectedProduct = products.find(p => p.id === item.productId)

                    return (
                      <Card key={index} className="p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Item #{index + 1}</span>

                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="neutralOutline"
                              onClick={() => removeItem(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* PRODUCT SELECT */}
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            updateItem(index, "productId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>

                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (Stock: {product.stockQuantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* QUANTITY + PRICE */}
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantitySold || ""}
                            onChange={(e) =>
                              updateItem(index, "quantitySold", Number(e.target.value))
                            }
                          />

                          <Input
                            type="number"
                            placeholder="Unit Price"
                            value={item.salePrice || ""}
                            onChange={(e) =>
                              updateItem(index, "salePrice", Number(e.target.value))
                            }
                          />
                        </div>

                        {selectedProduct && (
                          <p className="text-xs text-gray-500">
                            Stock: {selectedProduct.stockQuantity}
                          </p>
                        )}
                      </Card>
                    )
                  })}

                  <Button type="button" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Product
                  </Button>
                </div>

                {formData.items?.[0]?.productId &&
                  selectedProductWeights.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="netWeight">Net Weight (kg) *</Label>

                      <Select
                        value={String(selectedProductWeights[0] || "")}
                        onValueChange={() => { }}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select net weight" />
                        </SelectTrigger>

                        <SelectContent>
                          {selectedProductWeights.map((weight) => (
                            <SelectItem key={weight} value={String(weight)}>
                              {weight} kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <div className="space-y-2">
                    <Select
                      value={formData.client}
                      onValueChange={(value) => updateForm({ ...formData, client: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client or enter custom name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">+ Add Custom Client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.name}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.client === "custom" && (
                      <Input
                        placeholder="Enter custom client name"
                        value={formData.customClient || ""}
                        onChange={(e) => updateForm({ ...formData, customClient: e.target.value })}
                        className="mt-2"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientType">Client Type *</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(value) => updateForm({ ...formData, clientType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Sale Date *</Label>
                  <MaterialDatePicker
                    value={formData.saleDate ? new Date(formData.saleDate) : undefined}
                    onChange={(date) =>
                      updateForm({
                        ...formData,
                        saleDate: date ? date.toISOString().split("T")[0] : "",
                      })
                    }
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
                    {user?.role === "admin" ? "Add Sale" : "Submit for Approval"}
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
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 border-2 focus:border-slate-500 transition-colors h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table Component */}
      {/* <SalesTable
        filteredSales={filteredSales}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        salesCounts={salesCounts}
        products={products}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onProductClick={handleProductClick}
        onClientClick={handleClientClick}
      /> */}

      {/* View Sale Dialog */}
      {/* <ViewSaleDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        sale={viewingSale}
        onEdit={handleEdit}
      /> */}

      {/* Edit Sale Dialog */}
      {/* <EditSaleDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={updateForm}
        editReason={editReason}
        onEditReasonChange={setEditReason}
        billUrl={billUrl}
        onBillImageChange={setBillImage}
        filteredProducts={filteredProducts}
        selectedProductWeights={selectedProductWeights}
        clients={clients}
        userRole={user?.role}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearForm()
          setIsEditDialogOpen(false)
        }}
      /> */}

      {/* Delete Sale Dialog */}
      {/* <DeleteSaleDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deleteReason={deleteReason}
        onDeleteReasonChange={setDeleteReason}
        userRole={user?.role}
        onConfirm={async (e) => {
          e.preventDefault()
          await handleDeleteConfirm()
        }}
      /> */}

      {/* Product History Dialog */}
      {/* <ProductHistoryDialog
        isOpen={isProductHistoryDialogOpen}
        onOpenChange={setIsProductHistoryDialogOpen}
        product={selectedProduct}
        sales={sales}
        purchases={purchases}
      /> */}

      {/* Client History Dialog */}
      {/* <ClientHistoryDialog
        isOpen={isClientHistoryDialogOpen}
        onOpenChange={setIsClientHistoryDialogOpen}
        clientName={selectedClientForHistory}
        sales={sales}
      /> */}
    </div>
  )
}
