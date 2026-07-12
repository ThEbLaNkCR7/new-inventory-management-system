"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Product } from "@/contexts/InventoryContext"
import { AlertTriangle, Edit, Eye, Package, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import type { ProductGroup } from "./types"
import { formatProductNetWeight } from "./utils"

interface ProductsTableProps {
  groupedProducts: ProductGroup[]
  categories: string[]
  searchTerm: string
  onSearchTermChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  onProductClick: (product: Product) => void
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export default function ProductsTable({
  groupedProducts,
  categories,
  searchTerm,
  onSearchTermChange,
  categoryFilter,
  onCategoryFilterChange,
  onProductClick,
  onView,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="pl-12 border-2 focus:border-slate-500 transition-colors h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="w-full sm:w-48 border-2 focus:border-slate-500 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Products Details ({groupedProducts.length})
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Manage your product inventory and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700">
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Product Name</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Category</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">No. of units</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Unit Weight</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Unit Price</TableHead>
                  <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedProducts.map((group) => {
                  const selectedVariantId = selectedVariants[group.name] || group.variants[0]?.id
                  const selectedVariant = group.variants.find((v) => v.id === selectedVariantId) || group.variants[0]

                  return (
                    <TableRow
                      key={group.name}
                      className="hover:bg-slate-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <TableCell>
                        <p
                          className="text-gray-900 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => onProductClick(selectedVariant)}
                        >
                          {group.name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p
                          className="text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => onProductClick(selectedVariant)}
                        >
                          {group.category}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {selectedVariant.stockQuantity <= 5 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          <span className={`${selectedVariant.stockQuantity <= 5 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-slate-400"}`}>
                            {selectedVariant.stockQuantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.variants.length > 1 ? (
                          <Select
                            value={selectedVariantId}
                            onValueChange={(value) => setSelectedVariants((prev) => ({ ...prev, [group.name]: value }))}
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue placeholder="Select weight">
                                {formatProductNetWeight(selectedVariant)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {group.variants.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {formatProductNetWeight(variant)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span>{formatProductNetWeight(selectedVariant)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedVariant.unitPrice ? `Rs ${selectedVariant.unitPrice.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onView(selectedVariant)}
                            className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onEdit(selectedVariant)}
                            className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onDelete(selectedVariant)}
                            className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {groupedProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No products found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
