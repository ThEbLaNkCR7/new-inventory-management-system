"use client"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MaterialDatePicker } from "@/components/ui/MaterialDatePicker"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { usePersistentForm } from "@/contexts/FormPersistenceContext"
import { Sale, useInventory } from "@/contexts/InventoryContext"
import { useBatch } from "@/contexts/BatchContext"
import { useSaleChange } from "@/hooks/useSaleChange"
import { cn, formatNepaliDateForTable, toTitleCase } from "@/lib/utils"
import { exportStyledTableToExcel } from "@/utils/exportUtils"
import {
  formActionLinkClass,
  formDescriptionClass,
  formDialogBodyClass,
  formDialogClass,
  formDialogFooterClass,
  formDialogHeaderClass,
  formErrorTextClass,
  formFieldClass,
  formGridClass,
  formHintClass,
  formInputClass,
  formItemCardClass,
  formLabelClass,
  formSectionClass,
  formSectionTitleClass,
  formSelectTriggerClass,
  formTitleClass,
} from "@/lib/form-styles"
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Printer,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { formatProductNetWeight } from "@/components/products/utils"
import {
  getSaleTotal,
  mapSaleItemErrorsToEditFields,
  validateSaleFormData,
} from "./utils"
import { createBatchTrackingContext, getBatchItemRemaining, getSoldQuantityForBatchItem } from "@/components/batches/utils"
import ClientHistoryDialog from "./ClientHistoryDialog"
import AddClientDialog from "@/components/clients/AddClientDialog"
import DeleteSaleDialog from "./DeleteSaleDialog"
import EditSaleDialog from "./EditSaleDialog"
import ProductHistoryDialog from "./ProductHistoryDialog"
import SalesTable, { type SalesTableHandle } from "./SalesTable"
import ViewSaleDialog from "./ViewSaleDialog"

type SaleItem = {
  productId: string
  quantitySold: number
  salePrice: number
}
type ItemKey = keyof SaleItem

const inputClass = formInputClass
const selectTriggerClass = formSelectTriggerClass
const errorTextClass = formErrorTextClass
/** Add Sale form only — labels unbold, between input (sm) and section title (base) */
const addSaleLabelClass = cn(formLabelClass, "!text-[15px] !font-normal leading-5")
const addSaleBodyClass = cn(formDialogBodyClass, "gap-5")
const addSaleSectionClass = cn(formSectionClass, "gap-2.5")
const addSaleItemClass = cn(formItemCardClass, "gap-2")
/** Equal two-column rows — keeps Sale Type/Batch, Client/Type, Qty/Price, Payment/Date consistent */
const addSalePairClass = formGridClass
const addSaleMultiGridClass =
  "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_8.5rem_2.5rem] sm:gap-x-3 sm:gap-y-2"

export default function SalesPage() {
  const { user } = useAuth()
  const { products, sales, clients, purchases, addSale, updateSale, deleteSale } = useInventory()
  const { batches } = useBatch()
  const { requestSaleChange } = useSaleChange()
  const { toast } = useToast()
  const salesTableRef = useRef<SalesTableHandle>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [saleTypeFilter, setSaleTypeFilter] = useState<"all" | "client" | "site">("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "Pending" | "Received">("all")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false)
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
    batchId: "",
    items: [
      {
        productId: "",
        quantitySold: 0,
        salePrice: 0,
      },
    ],
    saleType: "client" as "client" | "site",
    client: "",
    clientType: "Company",
    customClient: "",
    projectName: "",
    paymentStatus: "Pending" as "Pending" | "Received",
    saleDate: new Date().toISOString().split("T")[0],
    isVat: false,
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
    clearFieldErrors(`items.${index}.${key}`)
    const updated = [...formData.items]
    updated[index] = {
      ...updated[index],
      [key]: value,
    }
    updateForm({ items: updated })
  }

  const { formData, updateForm: persistFormUpdate, resetForm } = usePersistentForm("sales-form", initialFormData)

  const updateForm = (updates: Partial<typeof initialFormData>) => {
    clearFieldErrors(...Object.keys(updates))
    persistFormUpdate(updates)
  }
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

  const filteredProducts = React.useMemo(() => {
    if (!formData.batchId) return products

    const batch = batches.find((b) => b.id === formData.batchId)
    if (!batch) return products

    const batchProductIds = new Set(batch.items.map((item) => item.productId))
    return products.filter((product) => batchProductIds.has(product.id))
  }, [products, batches, formData.batchId])

  const selectedBatch = React.useMemo(
    () => batches.find((batch) => batch.id === formData.batchId),
    [batches, formData.batchId],
  )

  const clientOptions = React.useMemo(() => {
    // Deduplicate by name so Radix Select never gets duplicate values
    // (duplicate values portal the label into SelectValue more than once).
    const uniqueByName = Array.from(
      new Map(clients.map((client) => [client.name, client])).values(),
    )
    if (!formData.client) return uniqueByName
    const exists = uniqueByName.some((client) => client.name === formData.client)
    if (exists) return uniqueByName
    return [
      ...uniqueByName,
      { id: `pending-${formData.client}`, name: formData.client },
    ]
  }, [clients, formData.client])

  const selectedClientId = React.useMemo(() => {
    if (!formData.client) return undefined
    const match = clientOptions.find((client) => client.name === formData.client)
    return match ? String(match.id) : `pending-${formData.client}`
  }, [clientOptions, formData.client])

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  // Filter sales based on search term, sale type, payment status; newest created first
  const filteredSales = sales
    .filter((sale) => {
      const matchesSearch =
        ((sale.items?.map((i) => i.productName).join(" ") || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) || "") ||
        (sale?.client || "").toLowerCase().includes(searchTerm.toLowerCase())

      const saleType = sale.saleType || "client"
      const matchesSaleType = saleTypeFilter === "all" || saleType === saleTypeFilter

      const paymentStatus = sale.paymentStatus || "Pending"
      const matchesPayment =
        paymentStatusFilter === "all" || paymentStatus === paymentStatusFilter

      return matchesSearch && matchesSaleType && matchesPayment
    })
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || a.saleDate || 0).getTime()
      const bTime = new Date(b.createdAt || b.saleDate || 0).getTime()
      return bTime - aTime
    })

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
    clearFieldErrors()
    setIsAddDialogOpen(false)
  }

  const validateForm = () => {
    const errors = validateSaleFormData(formData)
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

  const handleClientChange = (value: string) => {
    clearFieldErrors("client", "customClient")
    if (value === "__new__") {
      setIsAddClientDialogOpen(true)
      return
    }
    const selected = clientOptions.find(
      (client) => String(client.id) === String(value),
    )
    if (!selected?.name) return
    updateForm({ client: selected.name, customClient: "" })
  }

  const handleBatchChange = (value: string) => {
    clearFieldErrors("batchId")
    if (value === "__none__") {
      updateForm({ batchId: "" })
      return
    }

    const batch = batches.find((b) => b.id === value)
    const batchProductIds = new Set(batch?.items.map((item) => item.productId) || [])

    const clearedItems = formData.items.map((item) =>
      item.productId && !batchProductIds.has(item.productId)
        ? { ...item, productId: "", quantitySold: 0, salePrice: 0 }
        : item,
    )

    updateForm({ batchId: value, items: clearedItems })
  }

  const handleClientAdded = (clientName: string) => {
    updateForm({ client: clientName, customClient: "" })
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

  const buildSalesExportRows = (salesData: any[]) =>
    salesData.flatMap((sale) => {
      const items =
        Array.isArray(sale.items) && sale.items.length > 0
          ? sale.items
          : [
              {
                productName: sale.productName || "",
                quantitySold: sale.quantitySold || 0,
                salePrice: sale.salePrice || 0,
              },
            ]

      const saleType =
        sale.saleType === "site"
          ? "Site"
          : sale.saleType === "client"
            ? "Client"
            : sale.saleType || "Client"

      return items.map((item: any) => {
        const quantity = Number(item.quantitySold) || 0
        const unitPrice = Number(item.salePrice) || 0
        return {
          date: formatNepaliDateForTable(sale.saleDate) || sale.saleDate || "",
          product: item.productName || "",
          client: sale.client || "",
          clientType: sale.clientType || "",
          saleType,
          project: sale.projectName || "",
          paymentStatus: sale.paymentStatus || "Pending",
          quantitySold: quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
          vatIncluded: sale.isVat ? "Yes" : "No",
          billUrl: sale.billUrl || "",
        }
      })
    })

  const salesExportColumns = [
    { key: "date", header: "Date", width: 18 },
    { key: "product", header: "Product", width: 28 },
    { key: "client", header: "Client", width: 22 },
    { key: "clientType", header: "Client Type", width: 14 },
    { key: "saleType", header: "Sale Type", width: 12 },
    { key: "project", header: "Project", width: 18 },
    { key: "paymentStatus", header: "Payment Status", width: 14 },
    { key: "quantitySold", header: "Quantity Sold", width: 14 },
    { key: "unitPrice", header: "Unit Price", width: 12 },
    { key: "lineTotal", header: "Line Total", width: 12 },
    { key: "vatIncluded", header: "VAT Included", width: 12 },
    { key: "billUrl", header: "Bill URL", width: 28 },
  ]

  const exportSalesToCSV = (salesData: any[]) => {
    if (!salesData || salesData.length === 0) {
      toast({
        title: "No sales data",
        description: "There are no sales to export.",
        variant: "destructive",
      })
      return
    }

    const rows = buildSalesExportRows(salesData)
    const escapeCsv = (value: unknown) => {
      const text = value == null ? "" : String(value)
      return `"${text.replace(/"/g, '""')}"`
    }

    const csvContent = [
      salesExportColumns.map((col) => col.header),
      ...rows.map((row) =>
        salesExportColumns.map((col) => row[col.key as keyof typeof row]),
      ),
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `sales_${new Date().toISOString().split("T")[0]}.csv`
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportSalesToExcel = async (salesData: any[]) => {
    if (!salesData || salesData.length === 0) {
      toast({
        title: "No sales data",
        description: "There are no sales to export.",
        variant: "destructive",
      })
      return
    }

    // Match Sales table display: SN | Client | Payment Status | Items | Date | Total
    const rows = salesData.map((sale, index) => {
      const productNames = (sale.items || [])
        .map((item: any) => item.productName)
        .filter(Boolean)
        .map((name: string) => toTitleCase(name))

      const items =
        productNames.length > 0
          ? productNames.join(", ")
          : sale.productName
            ? toTitleCase(sale.productName)
            : "—"

      const itemCount =
        Array.isArray(sale.items) && sale.items.length > 0
          ? sale.items.length
          : sale.productName
            ? 1
            : 0

      return {
        sn: index + 1,
        client: {
          richText: [
            {
              text: `${toTitleCase(sale.client)}\n`,
              font: { name: "Calibri", size: 11, bold: true, color: { argb: "FF171717" } },
            },
            {
              text: `${itemCount} ${itemCount === 1 ? "item" : "items"}`,
              font: { name: "Calibri", size: 9, color: { argb: "FF71717A" } },
            },
          ],
        },
        paymentStatus: sale.paymentStatus || "Pending",
        items,
        date: formatNepaliDateForTable(sale.saleDate) || sale.saleDate || "",
        total: getSaleTotal(sale),
      }
    })

    const grandTotal = rows.reduce(
      (sum, row) => sum + (typeof row.total === "number" ? row.total : 0),
      0,
    )

    const filename = `sales_${new Date().toISOString().split("T")[0]}`
    try {
      await exportStyledTableToExcel(rows, filename, {
        sheetName: "Sales",
        title: "Sales Transactions",
        sideMargin: 4,
        columns: [
          { key: "sn", header: "SN", width: 6, align: "center" },
          { key: "client", header: "Client", width: 24, wrap: true },
          { key: "paymentStatus", header: "Payment Status", width: 16 },
          { key: "items", header: "Items", width: 40, wrap: true },
          { key: "date", header: "Date", width: 16 },
          { key: "total", header: "Total (Rs)", width: 14, align: "right", bold: true },
        ],
        totalsRow: {
          sn: "",
          client: "Grand Total",
          paymentStatus: "",
          items: "",
          date: "",
          total: grandTotal,
        },
      })
      toast({
        title: "Exported",
        description: "Sales downloaded as Excel file.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Export failed",
        description: "Could not create the Excel file.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

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

        if (formData.batchId && selectedBatch) {
          const batchItem = selectedBatch.items.find((batchEntry) => batchEntry.productId === item.productId)
          if (!batchItem) {
            toast({
              title: "Invalid Batch Item",
              description: `${product.name} is not part of the selected batch.`,
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }

          const batchContext = createBatchTrackingContext(
            formData.batchId,
            selectedBatch.batchNumber,
            selectedBatch.items,
            product,
          )
          const remainingInBatch = getBatchItemRemaining(
            sales,
            item.productId,
            batchItem.quantity,
            batchContext,
          )

          if (item.quantitySold > remainingInBatch) {
            toast({
              title: "Insufficient Batch Stock",
              description: `${product.name} only has ${remainingInBatch} units remaining in this batch.`,
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }
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

      const clientName = formData.client

      const payload: Omit<Sale, "id"> = {
        client: clientName,
        clientType: formData.clientType,
        saleType: formData.saleType || "client",
        paymentStatus: formData.paymentStatus || "Pending",
        ...(formData.saleType === "site" && formData.projectName
          ? { projectName: formData.projectName.trim() }
          : {}),
        saleDate: formData.saleDate,
        billUrl: uploadedBillUrl,
        ...(formData.batchId
          ? { batchId: formData.batchId, batchNumber: selectedBatch?.batchNumber || "" }
          : {}),
        isVat: formData.isVat,
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

    const formattedDate = sale.saleDate
      ? new Date(sale.saleDate).toISOString().split("T")[0]
      : ""

    const items =
      Array.isArray(sale.items) && sale.items.length > 0
        ? sale.items.map((item: any) => {
            const productId = String(item.productId?._id || item.productId || "")
            const product =
              products.find((p) => p.id === productId) ||
              products.find((p) => p.name === item.productName)

            return {
              productId: product?.id || productId,
              quantitySold: Number(item.quantitySold) || 0,
              salePrice: Number(item.salePrice) || 0,
            }
          })
        : [
            {
              productId:
                products.find((p) => p.name === sale.productName)?.id || "",
              quantitySold: Number(sale.quantitySold) || 0,
              salePrice: Number(sale.salePrice) || 0,
            },
          ]

    updateForm({
      batchId: sale.batchId ? String(sale.batchId) : "",
      items,
      saleType: sale.saleType || "client",
      client: sale.client || "",
      clientType: sale.clientType || "Company",
      customClient: "",
      projectName: sale.projectName || "",
      paymentStatus: sale.paymentStatus || "Pending",
      saleDate: formattedDate,
      isVat: sale.isVat ?? false,
    })
    setBillUrl(sale.billUrl || "")
    setBillImage(null)
    setEditReason("")
    clearFieldErrors()
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
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
          title: "Validation Error",
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
    <div className="space-y-4 min-h-screen transition-colors duration-300">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <h3 className="text-base font-semibold text-navy">Processing Sale...</h3>
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

      {/* add sale */}
      <div className="relative">
        <div className="space-y-2">
          <h1 className="section-title">Sales</h1>
          {user?.role !== "admin" && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-blue-50 text-navy border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Changes require admin approval
              </Badge>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 flex space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="neutralOutline" className="gap-1.5 px-4 py-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => exportSalesToCSV(filteredSales)}
              >
                <FileText className="h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => exportSalesToExcel(filteredSales)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => salesTableRef.current?.print()}
              >
                <Printer className="h-4 w-4" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  clearFieldErrors()
                  updateForm({
                    saleType: formData.saleType || "client",
                    paymentStatus: formData.paymentStatus || "Pending",
                  })
                  setIsAddDialogOpen(true)
                }}
                variant="neutral"
              >
                <Plus className="h-4 w-4" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn(formDialogClass, "max-w-4xl sm:max-w-4xl")}
            >
              <DialogHeader className={formDialogHeaderClass}>
                <DialogTitle
                  className={cn(
                    formTitleClass,
                    "mb-2 border-b border-border pb-2",
                  )}
                >
                  Add New Sale Transaction
                </DialogTitle>
                {user?.role !== "admin" ? (
                  <DialogDescription className={formDescriptionClass}>
                    <span className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium leading-5 text-navy">
                      <Clock className="h-4 w-4 shrink-0 text-navy" />
                      Changes require admin approval
                    </span>
                  </DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">
                    Add a new sale transaction
                  </DialogDescription>
                )}
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className={addSaleBodyClass}>
                <section className={addSaleSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <Tags className="h-4 w-4 text-navy/70" />
                    Sale details
                  </h3>
                <div className={addSalePairClass}>
                  <div className={formFieldClass}>
                    <Label htmlFor="saleType" className={addSaleLabelClass}>Sale Type *</Label>
                    <Select
                      value={formData.saleType || "client"}
                      onValueChange={(value) =>
                        updateForm({
                          saleType: value as "client" | "site",
                          ...(value === "client" ? { projectName: "" } : {}),
                        })
                      }
                    >
                      <SelectTrigger className={cn(selectTriggerClass, "w-full", fieldErrorClass("saleType"))}>
                        <SelectValue placeholder="Select sale type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderFieldError("saleType")}
                  </div>

                  <div className={formFieldClass}>
                    <Label htmlFor="batch" className={addSaleLabelClass}>Batch (optional)</Label>
                    <Select
                      value={formData.batchId || "__none__"}
                      onValueChange={handleBatchChange}
                    >
                      <SelectTrigger className={cn(selectTriggerClass, "w-full", fieldErrorClass("batchId"))}>
                        <SelectValue placeholder="No batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No batch</SelectItem>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batchNumber} — {batch.items.length} items
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBatch && (
                      <p className={formHintClass}>
                        Products filtered to batch {selectedBatch.batchNumber}
                      </p>
                    )}
                  </div>
                </div>
                </section>

                <section className={addSaleSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <Users className="h-4 w-4 text-navy/70" />
                    Client
                  </h3>
                  <div className={addSalePairClass}>
                    <div className={formFieldClass}>
                      <Label htmlFor="client" className={addSaleLabelClass}>Client *</Label>
                      <Select
                        value={selectedClientId}
                        onValueChange={handleClientChange}
                      >
                        <SelectTrigger className={cn(selectTriggerClass, "w-full", fieldErrorClass("client"))}>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientOptions.map((client) => (
                            <SelectItem key={client.id} value={String(client.id)}>
                              {client.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__">Add new client...</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("client")}
                    </div>

                    <div className={formFieldClass}>
                      <Label htmlFor="clientType" className={addSaleLabelClass}>Client Type *</Label>
                      <Select
                        value={formData.clientType || undefined}
                        onValueChange={(value) => updateForm({ clientType: value })}
                      >
                        <SelectTrigger className={cn(selectTriggerClass, "w-full", fieldErrorClass("clientType"))}>
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="Company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("clientType")}
                    </div>
                  </div>

                  {formData.saleType === "site" && (
                    <div className={formFieldClass}>
                      <Label htmlFor="projectName" className={addSaleLabelClass}>Project Name *</Label>
                      <Input
                        id="projectName"
                        placeholder="Enter project name"
                        value={formData.projectName || ""}
                        onChange={(e) => updateForm({ projectName: e.target.value })}
                        className={cn(inputClass, fieldErrorClass("projectName"))}
                      />
                      {renderFieldError("projectName")}
                    </div>
                  )}
                </section>

                <section className={addSaleSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <Package className="h-4 w-4 text-navy/70" />
                    Products
                  </h3>

                  {formData.items.length === 1 ? (
                    <div className={addSaleItemClass}>
                      {(() => {
                        const index = 0
                        const item = formData.items[0]
                        const selectedProduct = products.find((p) => p.id === item.productId)
                        return (
                          <>
                            <div className={formFieldClass}>
                              <Label
                                htmlFor={`add-sale-product-${index}`}
                                className={addSaleLabelClass}
                              >
                                Product *
                              </Label>
                              <Select
                                value={item.productId || undefined}
                                onValueChange={(value) =>
                                  updateItem(index, "productId", value)
                                }
                              >
                                <SelectTrigger
                                  id={`add-sale-product-${index}`}
                                  className={cn(
                                    selectTriggerClass,
                                    "w-full",
                                    fieldErrorClass(`items.${index}.productId`),
                                  )}
                                >
                                  <SelectValue placeholder="Select product">
                                    {selectedProduct
                                      ? `${selectedProduct.name} (${formatProductNetWeight(selectedProduct)}) — Stock: ${selectedProduct.stockQuantity}`
                                      : null}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredProducts.map((product) => {
                                    const batchItem = selectedBatch?.items.find(
                                      (entry) => entry.productId === product.id,
                                    )
                                    const batchContext =
                                      formData.batchId && selectedBatch && batchItem
                                        ? createBatchTrackingContext(
                                            formData.batchId,
                                            selectedBatch.batchNumber,
                                            selectedBatch.items,
                                            product,
                                          )
                                        : null
                                    const remainingInBatch =
                                      batchContext && batchItem
                                        ? getBatchItemRemaining(
                                            sales,
                                            product.id,
                                            batchItem.quantity,
                                            batchContext,
                                          )
                                        : product.stockQuantity
                                    return (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} ({formatProductNetWeight(product)}) — Stock:{" "}
                                        {product.stockQuantity}
                                        {formData.batchId
                                          ? ` · Batch left: ${remainingInBatch}`
                                          : ""}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                              {renderFieldError(`items.${index}.productId`)}
                            </div>
                            <div className={addSalePairClass}>
                              <div className={formFieldClass}>
                                <Label
                                  htmlFor={`add-sale-qty-${index}`}
                                  className={addSaleLabelClass}
                                >
                                  Quantity *
                                </Label>
                                <Input
                                  id={`add-sale-qty-${index}`}
                                  type="number"
                                  min={1}
                                  placeholder="Qty"
                                  value={item.quantitySold || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "quantitySold",
                                      Number(e.target.value),
                                    )
                                  }
                                  className={cn(
                                    inputClass,
                                    "w-full",
                                    fieldErrorClass(`items.${index}.quantitySold`),
                                  )}
                                />
                                {renderFieldError(`items.${index}.quantitySold`)}
                              </div>
                              <div className={formFieldClass}>
                                <Label
                                  htmlFor={`add-sale-price-${index}`}
                                  className={addSaleLabelClass}
                                >
                                  Unit Price *
                                </Label>
                                <Input
                                  id={`add-sale-price-${index}`}
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="Price"
                                  value={item.salePrice || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "salePrice",
                                      Number(e.target.value),
                                    )
                                  }
                                  className={cn(
                                    inputClass,
                                    "w-full",
                                    fieldErrorClass(`items.${index}.salePrice`),
                                  )}
                                />
                                {renderFieldError(`items.${index}.salePrice`)}
                              </div>
                            </div>
                            {selectedProduct &&
                              formData.batchId &&
                              selectedBatch &&
                              (() => {
                                const batchItem = selectedBatch.items.find(
                                  (entry) => entry.productId === selectedProduct.id,
                                )
                                if (!batchItem) return null
                                const batchContext = createBatchTrackingContext(
                                  formData.batchId,
                                  selectedBatch.batchNumber,
                                  selectedBatch.items,
                                  selectedProduct,
                                )
                                const sold = getSoldQuantityForBatchItem(
                                  sales,
                                  selectedProduct.id,
                                  batchContext,
                                )
                                const remaining = getBatchItemRemaining(
                                  sales,
                                  selectedProduct.id,
                                  batchItem.quantity,
                                  batchContext,
                                )
                                return (
                                  <p className={formHintClass}>
                                    Batch: {sold} sold, {remaining} in stock
                                  </p>
                                )
                              })()}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className={addSaleMultiGridClass}>
                      <span className={cn(addSaleLabelClass, "hidden sm:block")}>
                        Product *
                      </span>
                      <span className={cn(addSaleLabelClass, "hidden sm:block")}>
                        Quantity *
                      </span>
                      <span className={cn(addSaleLabelClass, "hidden sm:block")}>
                        Unit Price *
                      </span>
                      <span className="hidden sm:block" aria-hidden />

                      {formData.items.map((item: any, index: number) => {
                        const selectedProduct = products.find(
                          (p) => p.id === item.productId,
                        )
                        return (
                          <React.Fragment key={index}>
                            <div className="min-w-0">
                              <Label
                                htmlFor={`add-sale-product-${index}`}
                                className={cn(addSaleLabelClass, "mb-1.5 sm:hidden")}
                              >
                                Product {index + 1} *
                              </Label>
                              <Select
                                value={item.productId || undefined}
                                onValueChange={(value) =>
                                  updateItem(index, "productId", value)
                                }
                              >
                                <SelectTrigger
                                  id={`add-sale-product-${index}`}
                                  className={cn(
                                    selectTriggerClass,
                                    "w-full",
                                    fieldErrorClass(`items.${index}.productId`),
                                  )}
                                >
                                  <SelectValue placeholder="Select product">
                                    {selectedProduct
                                      ? `${selectedProduct.name} (${formatProductNetWeight(selectedProduct)}) — Stock: ${selectedProduct.stockQuantity}`
                                      : null}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredProducts.map((product) => {
                                    const batchItem = selectedBatch?.items.find(
                                      (entry) => entry.productId === product.id,
                                    )
                                    const batchContext =
                                      formData.batchId && selectedBatch && batchItem
                                        ? createBatchTrackingContext(
                                            formData.batchId,
                                            selectedBatch.batchNumber,
                                            selectedBatch.items,
                                            product,
                                          )
                                        : null
                                    const remainingInBatch =
                                      batchContext && batchItem
                                        ? getBatchItemRemaining(
                                            sales,
                                            product.id,
                                            batchItem.quantity,
                                            batchContext,
                                          )
                                        : product.stockQuantity
                                    return (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} ({formatProductNetWeight(product)}) —
                                        Stock: {product.stockQuantity}
                                        {formData.batchId
                                          ? ` · Batch left: ${remainingInBatch}`
                                          : ""}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                              {renderFieldError(`items.${index}.productId`)}
                            </div>

                            <div className="min-w-0">
                              <Label
                                htmlFor={`add-sale-qty-${index}`}
                                className={cn(addSaleLabelClass, "mb-1.5 sm:hidden")}
                              >
                                Quantity *
                              </Label>
                              <Input
                                id={`add-sale-qty-${index}`}
                                type="number"
                                min={1}
                                placeholder="Qty"
                                value={item.quantitySold || ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "quantitySold",
                                    Number(e.target.value),
                                  )
                                }
                                className={cn(
                                  inputClass,
                                  "w-full",
                                  fieldErrorClass(`items.${index}.quantitySold`),
                                )}
                              />
                              {renderFieldError(`items.${index}.quantitySold`)}
                            </div>

                            <div className="min-w-0">
                              <Label
                                htmlFor={`add-sale-price-${index}`}
                                className={cn(addSaleLabelClass, "mb-1.5 sm:hidden")}
                              >
                                Unit Price *
                              </Label>
                              <Input
                                id={`add-sale-price-${index}`}
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Price"
                                value={item.salePrice || ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "salePrice",
                                    Number(e.target.value),
                                  )
                                }
                                className={cn(
                                  inputClass,
                                  "w-full",
                                  fieldErrorClass(`items.${index}.salePrice`),
                                )}
                              />
                              {renderFieldError(`items.${index}.salePrice`)}
                            </div>

                            <div className="flex h-10 items-center justify-end sm:justify-center">
                              <Button
                                type="button"
                                variant="neutralOutline"
                                size="sm"
                                title={`Remove product ${index + 1}`}
                                aria-label={`Remove product ${index + 1}`}
                                className="h-9 w-9 shrink-0 border-red-200 bg-red-50 p-0 text-red-600 shadow-none hover:border-red-300 hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      formActionLinkClass,
                      "self-start justify-start !font-normal italic",
                    )}
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add another product
                  </Button>
                </section>

                {formData.items?.[0]?.productId &&
                  selectedProductWeights.length > 1 && (
                    <div className={formFieldClass}>
                      <Label htmlFor="netWeight" className={addSaleLabelClass}>Net Weight (kg) *</Label>

                      <Select
                        value={String(selectedProductWeights[0] || "")}
                        onValueChange={() => { }}
                        disabled
                      >
                        <SelectTrigger className={selectTriggerClass}>
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

                <section className={addSaleSectionClass}>
                  <h3 className={formSectionTitleClass}>
                    <CheckCircle className="h-4 w-4 text-navy/70" />
                    Payment
                  </h3>
                <div className={addSalePairClass}>
                  <div className={formFieldClass}>
                    <Label htmlFor="paymentStatus" className={addSaleLabelClass}>Payment Status *</Label>
                    <Select
                      value={formData.paymentStatus || "Pending"}
                      onValueChange={(value) =>
                        updateForm({ paymentStatus: value as "Pending" | "Received" })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          selectTriggerClass,
                          "w-full",
                          fieldErrorClass("paymentStatus"),
                        )}
                      >
                        <SelectValue placeholder="Select payment status">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2",
                              (formData.paymentStatus || "Pending") === "Received"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-amber-700 dark:text-amber-400",
                            )}
                          >
                            {(formData.paymentStatus || "Pending") === "Received" ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            )}
                            {formData.paymentStatus || "Pending"}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="Pending"
                          className="text-amber-700 focus:bg-amber-50 focus:text-amber-900 dark:text-amber-400 dark:focus:bg-amber-900/25 dark:focus:text-amber-200"
                        >
                          <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Pending
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="Received"
                          className="text-emerald-700 focus:bg-emerald-50 focus:text-emerald-900 dark:text-emerald-400 dark:focus:bg-emerald-900/25 dark:focus:text-emerald-200"
                        >
                          <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Received
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {renderFieldError("paymentStatus")}
                  </div>

                  <div className={formFieldClass}>
                    <Label htmlFor="date" className={addSaleLabelClass}>Sale Date *</Label>
                    <div className="relative">
                      <MaterialDatePicker
                        className={cn(
                          selectTriggerClass,
                          "w-full justify-start pr-9 shadow-sm",
                        )}
                        value={formData.saleDate ? new Date(formData.saleDate) : undefined}
                        onChange={(date) =>
                          updateForm({
                            saleDate: date ? date.toISOString().split("T")[0] : "",
                          })
                        }
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
                    </div>
                    {renderFieldError("saleDate")}
                  </div>
                </div>

                <div className={cn(formGridClass, "sm:items-end")}>
                  <div className={formFieldClass}>
                    <Label className={addSaleLabelClass}>Include VAT? *</Label>
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
                    <Label htmlFor="bill" className={addSaleLabelClass}>
                      Upload Bill Image
                    </Label>
                    <div className="flex h-10 min-w-0 items-center gap-2 overflow-hidden">
                      <Button
                        type="button"
                        variant="neutralOutline"
                        className="h-10 shrink-0 gap-2 border-primary/30 bg-primary/5 px-3 text-primary shadow-none hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                        onClick={() => document.getElementById("bill")?.click()}
                      >
                        <ImagePlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Choose bill image</span>
                        <span className="sm:hidden">Choose</span>
                      </Button>
                      {billImage ? (
                        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                          <span
                            className="min-w-0 truncate text-sm text-navy"
                            title={billImage.name}
                          >
                            {billImage.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Clear file"
                            className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              setBillImage(null)
                              const input = document.getElementById(
                                "bill",
                              ) as HTMLInputElement | null
                              if (input) input.value = ""
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="min-w-0 truncate text-sm !text-muted-foreground/50">
                          No file chosen
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      id="bill"
                      accept="image/*"
                      onChange={(e) => setBillImage(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </div>
                </div>
                </section>
                </div>

                <div className={formDialogFooterClass}>
                  <Button
                    type="button"
                    variant="neutralOutline"
                    onClick={clearForm}
                    className="hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {user?.role === "admin" ? "Add Sale" : "Submit for Approval"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <AddClientDialog
            open={isAddClientDialogOpen}
            onOpenChange={setIsAddClientDialogOpen}
            onClientAdded={handleClientAdded}
          />
        </div>
      </div>

      {/* Sales Table Component */}
      <SalesTable
        ref={salesTableRef}
        filteredSales={filteredSales}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        salesCounts={salesCounts}
        products={products}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        saleTypeFilter={saleTypeFilter}
        onSaleTypeFilterChange={setSaleTypeFilter}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusFilterChange={setPaymentStatusFilter}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onProductClick={handleProductClick}
        onClientClick={handleClientClick}
      />

      {/* View Sale Dialog */}
      <ViewSaleDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        sale={viewingSale}
        onEdit={handleEdit}
      />

      {/* Edit Sale Dialog */}
      <EditSaleDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={(data) => {
          const { productId, quantitySold, salePrice, ...rest } = data
          updateForm(rest)
        }}
        editReason={editReason}
        onEditReasonChange={setEditReason}
        billUrl={billUrl}
        onBillImageChange={setBillImage}
        filteredProducts={products}
        selectedProductWeights={selectedProductWeights}
        clients={clientOptions}
        fieldErrors={mapSaleItemErrorsToEditFields(fieldErrors)}
        userRole={user?.role}
        onSubmit={handleEditSubmit}
        onCancel={() => {
          clearFieldErrors()
          resetForm()
          setEditingSale(null)
          setIsEditDialogOpen(false)
        }}
      />

      {/* Delete Sale Dialog */}
      <DeleteSaleDialog
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

      {/* Product History Dialog */}
      <ProductHistoryDialog
        isOpen={isProductHistoryDialogOpen}
        onOpenChange={setIsProductHistoryDialogOpen}
        product={selectedProduct}
        sales={sales}
        purchases={purchases}
      />

      {/* Client History Dialog */}
      <ClientHistoryDialog
        isOpen={isClientHistoryDialogOpen}
        onOpenChange={setIsClientHistoryDialogOpen}
        clientName={selectedClientForHistory}
        sales={sales}
      />
    </div>
  )
}
