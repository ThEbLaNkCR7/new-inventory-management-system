"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBatch } from "@/contexts/BatchContext"
import { useInventory } from "@/contexts/InventoryContext"
import { AlertTriangle, Clock, Package, Search } from "lucide-react"
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

  const totalRemainingQuantity = remainingItems.reduce(
    (sum, p) => sum + (p?.stockQuantity || 0),
    0
  )

  const totalSoldQuantity = soldItems.reduce(
    (sum, p) => sum + (p?.soldQuantity || 0),
    0
  )

  return (
    <div className="space-y-8 p-6 min-h-screen">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Stock Overview</h1>
        <p className="text-gray-600">Monitor inventory levels and stock movements</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
              />
            </div>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="
              px-3 py-2 rounded-md border
              bg-white text-gray-900 border-gray-300
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
            dark:focus:ring-slate-400 dark:focus:border-slate-400
              transition-colors"
            >
              <option value="all">All Batches</option>

              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber}
                </option>
              ))}
            </select>

          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card>
          <CardHeader className="flex flex-row justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Stock
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-green-600">
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
            <div className="text-2xl font-bold text-orange-600">
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
            <div className="text-2xl font-bold text-blue-600">
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
      <Tabs defaultValue="remaining">

        <TabsList>
          <TabsTrigger value="remaining">
            Remaining ({filteredRemainingItems.length})
          </TabsTrigger>
          <TabsTrigger value="sold">
            Sold ({filteredSoldItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Remaining Table */}
        <TabsContent value="remaining">

          <Card>
            <CardContent>

              <Table>

                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Product</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Category</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Units</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Unit Weight</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Price</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Batch</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Last Restocked</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>

                  {filteredRemainingItems.map((product: any) => (

                    <TableRow key={`${product.batchId}-${product.id}`}>

                      <TableCell>
                        <div>
                          <p className="text-gray-700">{product.name}</p>
                          <p className="text-gray-700">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-gray-700">
                        <Badge variant="secondary" className="text-gray-700">
                          {product.category}
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
                        {product.netWeight ?? "-"}
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
                  No remaining stock found
                </div>
              )}

            </CardContent>
          </Card>

        </TabsContent>

        {/* Sold Table */}
        <TabsContent value="sold">

          <Card>
            <CardContent>

              <Table>

                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Product</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Client</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Quantity</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Units Sold</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Total</TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Last Sold</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSoldItems.map((product: any, index) => (
                    <TableRow key={index}>

                      {/* Product */}
                      <TableCell className="text-gray-700">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="text-gray-700">{product.client}</TableCell>

                      {/* Quantity */}
                      <TableCell className="text-gray-700">{product.soldQuantity}</TableCell>

                      {/* Unit Price */}
                      <TableCell className="text-gray-700">
                        Rs {product.unitPrice?.toFixed(2)}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-gray-700">
                        Rs {product.total?.toFixed(2)}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-gray-700">
                        {product.lastSold
                          ? new Date(product.lastSold).toLocaleDateString("en-CA")
                          : "-"}
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>

              </Table>

            </CardContent>
          </Card>

        </TabsContent>

      </Tabs>

    </div>
  )
}