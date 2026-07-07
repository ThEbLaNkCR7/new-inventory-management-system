"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useApproval } from "@/contexts/ApprovalContext"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  History,
  Info,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCircle,
  XCircle
} from "lucide-react"
import { useMemo, useState } from "react"

const APPROVAL_TYPES = ["product", "sale", "purchase", "client", "supplier"] as const
type ApprovalType = (typeof APPROVAL_TYPES)[number]

const normalizeApprovalType = (type: string | undefined): ApprovalType | "other" => {
  const normalized = (type || "").toLowerCase().trim()
  if (APPROVAL_TYPES.includes(normalized as ApprovalType)) {
    return normalized as ApprovalType
  }
  return "other"
}

const APPROVAL_SECTIONS: {
  type: ApprovalType
  title: string
  icon: React.ReactNode
  theme: {
    iconBg: string
    iconColor: string
    borderAccent: string
    headerBg: string
  }
}[] = [
  {
    type: "product",
    title: "Product Changes",
    icon: <Package className="h-5 w-5" />,
    theme: {
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderAccent: "border-blue-200 dark:border-blue-800",
      headerBg: "bg-blue-50/60 dark:bg-blue-900/15",
    },
  },
  {
    type: "sale",
    title: "Sales Changes",
    icon: <ShoppingCart className="h-5 w-5" />,
    theme: {
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderAccent: "border-emerald-200 dark:border-emerald-800",
      headerBg: "bg-emerald-50/60 dark:bg-emerald-900/15",
    },
  },
  {
    type: "purchase",
    title: "Purchase Changes",
    icon: <Truck className="h-5 w-5" />,
    theme: {
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderAccent: "border-violet-200 dark:border-violet-800",
      headerBg: "bg-violet-50/60 dark:bg-violet-900/15",
    },
  },
  {
    type: "client",
    title: "Client Changes",
    icon: <UserCircle className="h-5 w-5" />,
    theme: {
      iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      borderAccent: "border-cyan-200 dark:border-cyan-800",
      headerBg: "bg-cyan-50/60 dark:bg-cyan-900/15",
    },
  },
  {
    type: "supplier",
    title: "Supplier Changes",
    icon: <Building2 className="h-5 w-5" />,
    theme: {
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderAccent: "border-orange-200 dark:border-orange-800",
      headerBg: "bg-orange-50/60 dark:bg-orange-900/15",
    },
  },
]

export default function ApprovalsPage() {
  const { approveChange, rejectChange, getPendingChanges, getChangeHistory, isLoading } = useApproval()
  const [selectedChange, setSelectedChange] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isHistoryView, setIsHistoryView] = useState(false)

  const pendingList = getPendingChanges()
  const historyList = getChangeHistory()

  const pendingByType = useMemo(() => {
    const grouped: Record<ApprovalType | "other", any[]> = {
      product: [],
      sale: [],
      purchase: [],
      client: [],
      supplier: [],
      other: [],
    }

    pendingList.forEach((change) => {
      const type = normalizeApprovalType(change.type)
      grouped[type].push(change)
    })

    return grouped
  }, [pendingList])

  const pendingOther = pendingByType.other

  const handleApprove = () => {
    if (selectedChange) {
      approveChange(selectedChange.id, reviewNotes)
      setIsReviewDialogOpen(false)
      setReviewNotes("")
      setSelectedChange(null)
    }
  }

  const handleReject = () => {
    if (selectedChange) {
      rejectChange(selectedChange.id, reviewNotes)
      setIsReviewDialogOpen(false)
      setReviewNotes("")
      setSelectedChange(null)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700"
      case "update":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-700"
      case "delete":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-700"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/25 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getActionAccent = (action: string) => {
    switch (action) {
      case "create":
        return "border-l-emerald-500"
      case "update":
        return "border-l-blue-500"
      case "delete":
        return "border-l-red-500"
      default:
        return "border-l-slate-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700"
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-700"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/25 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500"
      case "approved":
        return "bg-emerald-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-slate-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "approved":
        return <CheckCircle2 className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const renderStatusBadge = (status: string) => (
    <Badge className={`${getStatusColor(status)} border capitalize font-medium px-2.5 py-0.5 gap-1.5 inline-flex items-center`}>
      <span className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(status)} ${status === "pending" ? "animate-pulse" : ""}`} />
      {getStatusIcon(status)}
      {status}
    </Badge>
  )

  const renderActionBadge = (action: string) => (
    <Badge className={`${getActionColor(action)} border capitalize font-medium px-2.5 py-0.5 gap-1.5 inline-flex items-center`}>
      {getActionIcon(action)}
      {action}
    </Badge>
  )

  const approvedCount = historyList.filter((c) => c.status === "approved").length
  const rejectedCount = historyList.filter((c) => c.status === "rejected").length

  const getTypeIcon = (type: string) => {
    switch (normalizeApprovalType(type)) {
      case "product":
        return <Package className="h-4 w-4" />
      case "sale":
        return <ShoppingCart className="h-4 w-4" />
      case "purchase":
        return <Truck className="h-4 w-4" />
      case "client":
        return <UserCircle className="h-4 w-4" />
      case "supplier":
        return <Building2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Plus className="h-4 w-4" />
      case "update":
        return <FileText className="h-4 w-4" />
      case "delete":
        return <Minus className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatValue = (key: string, value: any) => {
    if (value == null) return "—"
    if (typeof value === "object") {
      if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : "—"
      return JSON.stringify(value)
    }
    if (key.toLowerCase().includes("price") || key.toLowerCase().includes("cost")) {
      return `Rs ${Number(value).toFixed(2)}`
    }
    if (key.toLowerCase().includes("date")) {
      return new Date(value).toLocaleDateString("en-IN")
    }
    return String(value)
  }

  const getFieldDisplayName = (key: string) => {
    const fieldNames: { [key: string]: string } = {
      productName: "Product Name",
      productId: "Product ID",
      quantitySold: "Quantity Sold",
      quantityPurchased: "Quantity Purchased",
      salePrice: "Sale Price",
      purchasePrice: "Purchase Price",
      saleDate: "Sale Date",
      purchaseDate: "Purchase Date",
      client: "Client",
      supplier: "Supplier",
      stockQuantity: "Stock Quantity",
      unitPrice: "Unit Price",
      category: "Category",
      description: "Description",
      sku: "SKU",
    }
    return fieldNames[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  }

  const GRID_HIDDEN_FIELDS = new Set(["imageUrl", "image_url", "image", "version", "__v"])

  const shouldShowInGrid = (key: string, compact: boolean) => {
    if (!compact) return true
    return !GRID_HIDDEN_FIELDS.has(key)
  }

  const renderLineItems = (items: unknown) => {
    if (!Array.isArray(items) || items.length === 0) return null

    return (
      <div className="md:col-span-2 bg-white dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Line Items</div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="rounded-md border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-2 text-sm">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {item.productName || item.name || `Item ${index + 1}`}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                {item.quantitySold != null && <span>Qty sold: {item.quantitySold}</span>}
                {item.quantityPurchased != null && <span>Qty purchased: {item.quantityPurchased}</span>}
                {item.salePrice != null && <span>Sale price: Rs {Number(item.salePrice).toFixed(2)}</span>}
                {item.purchasePrice != null && <span>Purchase price: Rs {Number(item.purchasePrice).toFixed(2)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDataFields = (data: any, compact: boolean, accentClass: string) => (
    <>
      {Object.entries(data || {})
        .filter(([key]) => shouldShowInGrid(key, compact) && key !== "items")
        .map(([key, value]) => (
          <div key={key} className={`bg-white dark:bg-slate-800/80 rounded-lg p-3 border shadow-sm ${accentClass}`}>
            <div className="text-xs font-medium uppercase tracking-wide opacity-80">{getFieldDisplayName(key)}</div>
            <div className="text-slate-900 dark:text-slate-100 font-semibold mt-1">{formatValue(key, value)}</div>
          </div>
        ))}
      {renderLineItems(data?.items)}
    </>
  )

  const renderDataComparison = (originalData: any, proposedData: any, action: string, compact = false) => {
    if (action === "create") {
      return (
        <div className="space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 dark:bg-emerald-900/15 dark:border-emerald-800">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <Label className="text-base font-semibold text-emerald-900 dark:text-emerald-100">New Record Details</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderDataFields(proposedData, compact, "border-emerald-100 dark:border-emerald-900/50")}
            </div>
          </div>
        </div>
      )
    }

    if (action === "delete") {
      return (
        <div className="space-y-4">
          <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 dark:bg-red-900/15 dark:border-red-800">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <Label className="text-base font-semibold text-red-900 dark:text-red-100">Record to be Deleted</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderDataFields(originalData, compact, "border-red-100 dark:border-red-900/50")}
            </div>
          </div>
        </div>
      )
    }

    // Update action - show comparison
    const changedFields = Object.keys(proposedData).filter(
      (key) => shouldShowInGrid(key, compact) && originalData[key] !== proposedData[key],
    )

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Current Data */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 dark:bg-slate-900/30 dark:border-slate-700">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800">
                <Minus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">Current Data</Label>
            </div>
            <div className="space-y-3">
              {Object.entries(originalData)
                .filter(([key]) => shouldShowInGrid(key, compact))
                .map(([key, value]) => (
                <div
                  key={key}
                  className={`bg-white dark:bg-slate-800/80 rounded-lg p-3 border shadow-sm ${
                    changedFields.includes(key) ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10" : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{getFieldDisplayName(key)}</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold mt-1">{formatValue(key, value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Proposed Data */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 dark:bg-blue-900/15 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <Label className="text-base font-semibold text-blue-900 dark:text-blue-100">Proposed Changes</Label>
            </div>
            <div className="space-y-3">
              {Object.entries(proposedData)
                .filter(([key]) => shouldShowInGrid(key, compact))
                .map(([key, value]) => (
                <div
                  key={key}
                  className={`bg-white dark:bg-slate-800/80 rounded-lg p-3 border shadow-sm ${
                    changedFields.includes(key) ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10" : "border-blue-100 dark:border-blue-900/50"
                  }`}
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">{getFieldDisplayName(key)}</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold mt-1">{formatValue(key, value)}</div>
                  {changedFields.includes(key) && (
                    <div className="flex items-center mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
                      <ArrowRight className="h-3 w-3 mr-1 shrink-0" />
                      Changed from: {formatValue(key, originalData[key])}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary of Changes */}
        {changedFields.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 dark:bg-amber-900/15 dark:border-amber-800">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">Summary of Changes</Label>
            </div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              {changedFields.length} field{changedFields.length > 1 ? "s" : ""} will be updated:{" "}
              <span className="font-medium">{changedFields.map((field) => getFieldDisplayName(field)).join(", ")}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const openReviewDialog = (change: any) => {
    setSelectedChange(change)
    setIsHistoryView(false)
    setReviewNotes("")
    setIsReviewDialogOpen(true)
  }

  const openHistoryView = (change: any) => {
    setSelectedChange(change)
    setIsHistoryView(true)
    setIsReviewDialogOpen(true)
  }

  const renderHistoryTable = () => (
    <Card className="shadow-lg border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <History className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Approval History</CardTitle>
            <CardDescription>Previously reviewed changes and audit trail</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {historyList.length === 0 ? (
          <div className="text-center py-16 px-6">
            <History className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No approval history available</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Reviewed requests will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <TableHead className="table-header">Type</TableHead>
                  <TableHead className="table-header">Action</TableHead>
                  <TableHead className="table-header">Summary</TableHead>
                  <TableHead className="table-header">Requested By</TableHead>
                  <TableHead className="table-header">Reason</TableHead>
                  <TableHead className="table-header">Status</TableHead>
                  <TableHead className="table-header">Reviewed By</TableHead>
                  <TableHead className="table-header">Review Date</TableHead>
                  <TableHead className="table-header text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyList.map((change) => (
                  <TableRow key={change.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {getTypeIcon(change.type)}
                        </div>
                        <Badge variant="outline" className="capitalize font-medium">
                          {change.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderActionBadge(change.action)}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {change.changeSummary || change.entityLabel || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{change.requestedBy}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {change.reason || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(change.status)}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{change.reviewedBy || "N/A"}</TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{change.reviewedAt ? formatDate(change.reviewedAt) : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="neutralOutline" size="sm" onClick={() => openHistoryView(change)} className="shadow-sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderApprovalSection = (section: (typeof APPROVAL_SECTIONS)[number], changes: any[]) => {
    const { title, icon, theme } = section
    if (changes.length === 0) return null

    return (
    <Card key={section.type} className={`mb-6 shadow-lg border ${theme.borderAccent} dark:bg-slate-900/50 overflow-hidden`}>
      <CardHeader className={`${theme.headerBg} border-b ${theme.borderAccent}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.iconBg}`}>
              <span className={theme.iconColor}>{icon}</span>
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{title}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Review and approve {title.toLowerCase()}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700 border font-semibold px-3 py-1">
            {changes.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {changes.map((change) => (
              <div
                key={change.id}
                className={`p-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-200 border-l-4 ${getActionAccent(change.action)}`}
              >
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${getActionColor(change.action)}`}>
                      {getActionIcon(change.action)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {change.action.charAt(0).toUpperCase() + change.action.slice(1)} {change.type}
                        </h3>
                        {renderActionBadge(change.action)}
                        {(change.changeSummary || change.entityLabel) && (
                          <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            — {change.changeSummary || change.entityLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Requested by <span className="font-medium text-slate-700 dark:text-slate-300">{change.requestedBy}</span> on {formatDate(change.requestedAt)}
                      </p>
                    </div>
                  </div>
                  {renderStatusBadge(change.status)}
                </div>

                {change.reason && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 mb-4 dark:bg-amber-900/15 dark:border-amber-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <Label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Reason for Request</Label>
                    </div>
                    <p className="text-amber-900 dark:text-amber-100 text-sm leading-relaxed">{change.reason}</p>
                  </div>
                )}

                {(change.proposedData || change.originalData) ? (
                  renderDataComparison(change.originalData, change.proposedData, change.action, true)
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 dark:bg-slate-900/30 dark:border-slate-700">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {change.changeSummary || change.entityLabel || "No detailed data stored for this record."}
                    </p>
                  </div>
                )}

                {change.status === "pending" && (
                  <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button onClick={() => openReviewDialog(change)} variant="neutral" size="sm" className="shadow-md hover:shadow-lg transition-all">
                      <Eye className="h-4 w-4 mr-1.5" />
                      Review & Decide
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
      </CardContent>
    </Card>
  )}

  return (
    <div className="space-y-8 p-6 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {isLoading ? (
        <Card className="shadow-lg border-slate-200 dark:bg-slate-900/50 dark:border-slate-700">
          <CardContent className="text-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading approvals...</p>
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="section-title mb-0">
              Approvals
            </h1>
            <p className="text-slate-600 dark:text-slate-300">Review and approve system changes with full audit trail</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-md border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/10 dark:to-slate-900/50 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Pending</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{pendingList.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/70" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/10 dark:to-slate-900/50 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Approved</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{approvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-red-200 dark:border-red-800/50 bg-gradient-to-br from-red-50/80 to-white dark:from-red-900/10 dark:to-slate-900/50 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">Rejected</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={pendingList.length > 0 ? "pending" : "history"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl h-14">
          <TabsTrigger
            value="pending"
            className="flex items-center justify-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:font-semibold transition-all duration-300 rounded-lg px-3 py-2.5 h-full"
          >
            <Clock className="h-4 w-4" />
            <span>Pending Approvals</span>
            <Badge className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-1.5 py-0.5 border-0">
              {pendingList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center justify-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:font-semibold transition-all duration-300 rounded-lg px-3 py-2.5 h-full"
          >
            <History className="h-4 w-4" />
            <span>History</span>
            <Badge className="ml-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs px-1.5 py-0.5 border-0">
              {historyList.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300">
          {pendingList.length === 0 ? (
            <Card className="shadow-lg border-emerald-200 dark:border-emerald-800/50 dark:bg-slate-900/50">
              <CardContent className="text-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">All Caught Up!</h3>
                <p className="text-slate-500 dark:text-slate-400">No pending approvals at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {APPROVAL_SECTIONS.map((section) =>
                renderApprovalSection(section, pendingByType[section.type]),
              )}
              {pendingOther.length > 0 &&
                renderApprovalSection(
                  {
                    type: "client",
                    title: "Other Changes",
                    icon: <FileText className="h-5 w-5" />,
                    theme: {
                      iconBg: "bg-slate-100 dark:bg-slate-800",
                      iconColor: "text-slate-600 dark:text-slate-400",
                      borderAccent: "border-slate-200 dark:border-slate-700",
                      headerBg: "bg-slate-50/60 dark:bg-slate-900/15",
                    },
                  },
                  pendingOther,
                )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300">
          {renderHistoryTable()}
        </TabsContent>
      </Tabs>

      {/* Enhanced Review Dialog */}
      <Dialog
        open={isReviewDialogOpen}
        onOpenChange={(open) => {
          setIsReviewDialogOpen(open)
          if (!open) {
            setIsHistoryView(false)
            setSelectedChange(null)
            setReviewNotes("")
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                {selectedChange && getTypeIcon(selectedChange.type)}
              </div>
              <span>{isHistoryView ? "Approval History Details" : "Review Change Request"}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {isHistoryView
                ? "View the details of this previously reviewed change request"
                : "Carefully review the proposed changes and provide your decision with optional notes"}
            </DialogDescription>
          </DialogHeader>

          {selectedChange && (
            <ScrollArea className="max-h-[55vh] px-6 py-4">
              <div className="space-y-6">
                {/* Request Header */}
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 rounded-xl p-5 dark:from-slate-900/50 dark:to-indigo-900/10 dark:border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {getTypeIcon(selectedChange.type)}
                        </div>
                        <Badge variant="outline" className="capitalize font-medium">
                          {selectedChange.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action</Label>
                      <div className="mt-2">
                        {renderActionBadge(selectedChange.action)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Requested By
                      </Label>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 mt-2">{selectedChange.requestedBy}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</Label>
                      <p className="font-medium text-slate-900 dark:text-slate-100 mt-2 text-sm">
                        {formatDate(selectedChange.requestedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Review outcome for history */}
                {isHistoryView && (
                  <div className={`border rounded-xl p-5 ${selectedChange.status === "approved" ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-900/15 dark:border-emerald-800" : selectedChange.status === "rejected" ? "bg-red-50/80 border-red-200 dark:bg-red-900/15 dark:border-red-800" : "bg-amber-50/80 border-amber-200 dark:bg-amber-900/15 dark:border-amber-800"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</Label>
                        <div className="mt-2">
                          {renderStatusBadge(selectedChange.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reviewed By</Label>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 mt-2">{selectedChange.reviewedBy || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Review Date</Label>
                        <p className="font-medium text-slate-900 dark:text-slate-100 mt-2 text-sm">
                          {selectedChange.reviewedAt ? formatDate(selectedChange.reviewedAt) : "N/A"}
                        </p>
                      </div>
                    </div>
                    {selectedChange.reviewNotes && (
                      <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Review Notes</Label>
                        <p className="mt-2 text-sm bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">{selectedChange.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                {(selectedChange.reason || !isHistoryView) && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 dark:bg-amber-900/15 dark:border-amber-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <Label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Reason for Request</Label>
                    </div>
                    <p className="text-amber-900 dark:text-amber-100 bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50 text-sm leading-relaxed">
                      {selectedChange.reason || "No reason provided"}
                    </p>
                  </div>
                )}

                {/* Data Comparison */}
                <div>
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Data Review
                  </Label>
                  {selectedChange.proposedData || selectedChange.originalData ? (
                    renderDataComparison(
                      selectedChange.originalData,
                      selectedChange.proposedData,
                      selectedChange.action,
                    )
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 dark:bg-slate-900/30 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {selectedChange.changeSummary || selectedChange.entityLabel || "No detailed data stored for this record."}
                      </p>
                      {selectedChange.changedFields && selectedChange.changedFields.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Changed fields: {selectedChange.changedFields.map((field: string) => getFieldDisplayName(field)).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          {!isHistoryView && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
              <Label htmlFor="reviewNotes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Review Notes (Optional)
              </Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision, feedback, or instructions..."
                rows={3}
                className="resize-none bg-white dark:bg-slate-800"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Button
              variant="neutralOutline"
              onClick={() => setIsReviewDialogOpen(false)}
              className="px-6"
            >
              {isHistoryView ? "Close" : "Cancel"}
            </Button>
            {!isHistoryView && (
              <>
                <Button variant="destructive" onClick={handleReject} className="px-6 bg-red-600 hover:bg-red-700 shadow-md">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove} className="px-6 bg-emerald-600 hover:bg-emerald-700 shadow-md">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
