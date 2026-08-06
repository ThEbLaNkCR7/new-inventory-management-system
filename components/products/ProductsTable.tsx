"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Product } from "@/contexts/InventoryContext"
import { toTitleCase } from "@/lib/utils"
import { AlertTriangle, Edit, Eye, Filter, Package, Search, Trash2, X } from "lucide-react"
import { useState } from "react"
import DataPagination from "@/components/ui/data-pagination"
import { usePagination } from "@/hooks/usePagination"
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
  onCategoryClick: (category: string) => void
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
  onCategoryClick,
  onView,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const hasActiveFilters = searchTerm.trim() !== "" || categoryFilter !== "all"
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startItem,
    endItem,
  } = usePagination(groupedProducts, {
    resetKey: `${searchTerm}|${categoryFilter}`,
  })

  const clearFilters = () => {
    onSearchTermChange("")
    onCategoryFilterChange("all")
  }

  return (
    <Card className="shadow-sm border border-border bg-card backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              Products Details
              <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                ({groupedProducts.length})
              </span>
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Manage your product inventory and stock levels
            </CardDescription>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, or supplier..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="h-10 pl-10 border-border focus:border-navy/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="h-10 w-full sm:w-52 border-border">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
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
        <div className="overflow-x-auto border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/80 hover:bg-muted/60">
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>No. of units</TableHead>
                <TableHead>Unit Weight</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((group) => {
                const selectedVariantId = selectedVariants[group.name] || group.variants[0]?.id
                const selectedVariant = group.variants.find((v) => v.id === selectedVariantId) || group.variants[0]

                return (
                  <TableRow
                    key={group.name}
                    className="hover:bg-muted/60 transition-colors"
                  >
                    <TableCell>
                      <p
                        className="cursor-pointer font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                        onClick={() => onProductClick(selectedVariant)}
                      >
                        {toTitleCase(group.name)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p
                        className="cursor-pointer font-medium text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                        onClick={() => onCategoryClick(group.category)}
                      >
                        {toTitleCase(group.category)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {selectedVariant.stockQuantity <= 5 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        <span className={`${selectedVariant.stockQuantity <= 5 ? "text-navy" : "text-navy dark:text-muted-foreground"}`}>
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
                          className="text-muted-foreground hover:bg-muted hover:border-navy/30 hover:text-navy dark:hover:bg-muted dark:hover:border-white/30 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => onEdit(selectedVariant)}
                          className="hover:bg-muted dark:hover:bg-muted transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => onDelete(selectedVariant)}
                          className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-navy transition-colors"
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
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <Package className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-sm font-normal italic text-muted-foreground">
                {hasActiveFilters ? "No products match your filters" : "No products found"}
              </p>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="neutralOutline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-3"
                >
                  Clear filters
                </Button>
              )}
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
  )
}
