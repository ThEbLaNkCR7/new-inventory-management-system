"use client"

import { useEffect, useMemo, useState } from "react"

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export function usePagination<T>(
  items: T[],
  options?: {
    pageSize?: number
    /** Change this when filters/search change to jump back to page 1 */
    resetKey?: string | number
  },
) {
  const initialSize = options?.pageSize ?? DEFAULT_PAGE_SIZE
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(initialSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / size) || 1)

  useEffect(() => {
    setPage(1)
  }, [options?.resetKey, size])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * size
    return items.slice(start, start + size)
  }, [items, page, size])

  const startItem = totalItems === 0 ? 0 : (page - 1) * size + 1
  const endItem = Math.min(page * size, totalItems)

  return {
    page,
    setPage,
    pageSize: size,
    setPageSize: setSize,
    totalItems,
    totalPages,
    paginatedItems,
    startItem,
    endItem,
    canPreviousPage: page > 1,
    canNextPage: page < totalPages,
  }
}
