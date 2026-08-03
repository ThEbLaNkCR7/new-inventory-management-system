"use client"

import { formatProductNetWeight } from "@/components/products/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBatch } from "@/contexts/BatchContext"
import { useInventory } from "@/contexts/InventoryContext"
import { toTitleCase } from "@/lib/utils"
import { AlertTriangle, Clock, Filter, Package, Search, X } from "lucide-react"
import { useState } from "react"

export default function StockViewPage() {
  const { products, sales } = useInventory()
  const { batches } = useBatch()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("all")
  const [categoryFilter] = useState("all")

  const productsWithBatch = batches
    .flatMap((batch) =>
      batch.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)

        if (!product) return null

        return {
          ...product,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          stockQuantity: item.quantity,
          unitPrice: item.unitCost,
          lastRestocked: batch.arrivalDate,
        }
      })
    )
    .filter(Boolean)

  const remainingItems = productsWithBatch.filter((p: any) => p.stockQuantity > 0)

  // Sold items = build from sales data
  const soldItems = sales
    .flatMap((sale) => {
      const items = sale.items || []

      return items.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        const batch = batches.find((b) => b.id === sale.batchId)

        if (!product) return null

        return {
          ...product,
          batchId: batch?.id,
          client: sale.client,
          clientType: sale.clientType,
          soldQuantity: item.quantitySold,
          unitPrice: item.salePrice,
          total: (item.quantitySold || 0) * (item.salePrice || 0),
          batchNumber: batch?.batchNumber,
          lastSold: sale.saleDate,
        }
      })
    })
    .filter(Boolean)

  /**
   * Filtering
   */
  const filterProducts = (productList: any[]) => {
    let filtered = productList.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.hsCode?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter

      return matchesSearch && matchesCategory
    })

    if (selectedBatch !== "all") {
      filtered = filtered.filter((product) => product.batchId === selectedBatch)
    }

    return filtered
  }

  const filteredRemainingItems = filterProducts(remainingItems)
  const filteredSoldItems = filterProducts(soldItems)
  const hasActiveFilters = searchTerm.trim() !== "" || selectedBatch !== "all"

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedBatch("all")
  }

  const totalRemainingQuantity = remainingItems.reduce(
    (sum, p) => sum + (p?.stockQuantity || 0),
    0
  )

  const totalSoldQuantity = soldItems.reduce(
    (sum, p) => sum + (p?.soldQuantity || 0),
    0
  )

  return (
    <div className="space-y-4 min-h-screen">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Stock Overview</h1>
        <p className="text-sm text-gray-600">Monitor inventory levels and stock movements</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Stock
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>

          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {totalRemainingQuantity}
            </div>
            <p className="text-xs text-muted-foreground">
              Total units remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sold Stock
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>

          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {totalSoldQuantity}
            </div>
            <p className="text-xs text-muted-foreground">
              Total units sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Value
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>

          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              Rs{" "}
              {remainingItems
                .filter((p): p is NonNullable<typeof p> => p !== null)
                .reduce((total, p) => total + p.stockQuantity * p.unitPrice, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Tables */}
      <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Stock Details
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Browse remaining and sold stock by product and batch
          </CardDescription>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by product name or HS code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 focus:border-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="h-10 w-full sm:w-52 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 shrink-0 text-gray-400" />
                    <SelectValue placeholder="All Batches" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="neutralOutline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 shrink-0 gap-1.5 text-gray-600 dark:text-gray-300"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <Tabs defaultValue="remaining">
            <TabsList>
              <TabsTrigger value="remaining">
                Remaining ({filteredRemainingItems.length})
              </TabsTrigger>
              <TabsTrigger value="sold">
                Sold ({filteredSoldItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="remaining" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Product</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Category</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Units</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Unit Weight</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Price</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Batch</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Last Restocked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRemainingItems.map((product: any) => (
                      <TableRow key={`${product.batchId}-${product.id}`}>
                        <TableCell>
                          <div>
                            <p className="text-gray-700">{toTitleCase(product.name)}</p>
                            <p className="text-gray-700">
                              {product.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <Badge variant="secondary" className="text-gray-700">
                            {toTitleCase(product.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <div className="flex items-center">
                            {product.stockQuantity <= 5 && (
                              <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                            )}
                            <span
                              className={
                                product.stockQuantity <= 5
                                  ? "text-orange-600 font-medium"
                                  : ""
                              }
                            >
                              {product.stockQuantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatProductNetWeight(product)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          Rs {product.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <Badge variant="outline" className="text-gray-700">
                            {product.batchNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {product.lastRestocked}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredRemainingItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No remaining stock matches your filters" : "No remaining stock found"}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sold" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Product</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Client</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Quantity</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Units Sold</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Total</TableHead>
                      <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">Last Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSoldItems.map((product: any, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-gray-700">
                          <div>
                            <p className="font-medium">{toTitleCase(product.name)}</p>
                            <p className="text-sm text-gray-500">
                              {product.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{toTitleCase(product.client)}</TableCell>
                        <TableCell className="text-gray-700">{product.soldQuantity}</TableCell>
                        <TableCell className="text-gray-700">
                          Rs {product.unitPrice?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          Rs {product.total?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {product.lastSold
                            ? new Date(product.lastSold).toLocaleDateString("en-CA")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSoldItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No sold stock matches your filters" : "No sold stock found"}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  )
}
