"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      <CardHeader className="px-3 pb-3 pt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="pl-3 font-semibold text-navy">
              Products Details
              <span className="ml-1.5 text-sm font-semibold text-navy">
                ({groupedProducts.length})
              </span>
            </CardTitle>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-0">
                {/* pl matches search icon: CardHeader px-3 + icon left-3 */}
                <TableHead className="h-14 pl-6 text-base font-semibold text-navy">
                  Product Name
                </TableHead>
                <TableHead className="h-14 text-base font-semibold text-navy">Category</TableHead>
                <TableHead className="h-14 text-base font-semibold text-navy">No. of units</TableHead>
                <TableHead className="h-14 text-base font-semibold text-navy">Unit Weight</TableHead>
                <TableHead className="h-14 text-base font-semibold text-navy">Unit Price</TableHead>
                <TableHead className="h-14 text-base font-semibold text-navy">Actions</TableHead>
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
                    <TableCell className="pl-6">
                      <p
                        className="cursor-pointer font-semibold text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
                        onClick={() => onProductClick(selectedVariant)}
                      >
                        {toTitleCase(group.name)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p
                        className="cursor-pointer font-normal text-navy underline-offset-4 transition-colors hover:underline hover:text-navy/80"
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
                          title="View"
                          className="text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => onEdit(selectedVariant)}
                          title="Edit"
                          className="text-muted-foreground transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:border-amber-500 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="neutralOutline"
                          onClick={() => onDelete(selectedVariant)}
                          title="Delete"
                          className="text-muted-foreground transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
          className="!pl-6 !pr-3"
        />
      </CardContent>
    </Card>
  )
}
