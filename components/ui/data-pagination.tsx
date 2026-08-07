"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataPaginationProps {
  page: number
  totalPages: number
  totalItems: number
  startItem: number
  endItem: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: readonly number[]
  className?: string
}

export default function DataPagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className = "",
}: DataPaginationProps) {
  if (totalItems === 0) return null

  return (
    <div
      className={`flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground/80">
        <span className="inline-flex flex-wrap items-center gap-x-1.5 whitespace-nowrap">
          <span>Showing</span>
          <span className="font-normal tabular-nums text-muted-foreground">{startItem}</span>
          <span className="text-muted-foreground/60">–</span>
          <span className="font-normal tabular-nums text-muted-foreground">{endItem}</span>
          <span>of</span>
          <span className="font-normal tabular-nums text-muted-foreground">{totalItems}</span>
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2.5 border-l border-border/70 pl-6">
            <span className="whitespace-nowrap text-xs font-normal text-muted-foreground/80">
              Rows
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[72px] border-border/70 text-muted-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="neutralOutline"
          size="sm"
          className="h-8 text-muted-foreground"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground/80">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="neutralOutline"
          size="sm"
          className="h-8 text-muted-foreground"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
