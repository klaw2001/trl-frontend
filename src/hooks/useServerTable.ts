'use client'

// React Imports
import { useState } from 'react'

// Hook Imports
import { useApi } from './useApi'

// Type Imports
import type { Paged } from '@/types/apiTypes'

// Paging + filters for list endpoints that accept limit/offset and return { total, rows }
export const useServerTable = <T = any>(
  path: string,
  initialFilters: Record<string, any> = {},
  initialPageSize = 10
) => {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [filters, setFiltersState] = useState<Record<string, any>>(initialFilters)

  const { data, loading, reload, error } = useApi<Paged<T>>(path, {
    ...filters,
    limit: pageSize,
    offset: page * pageSize
  })

  const setFilter = (key: string, value: any) => {
    setFiltersState(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }

  return {
    rows: data?.rows || [],
    total: data?.total || 0,
    loading,
    error,
    reload,
    filters,
    setFilter,
    tableProps: {
      page,
      pageSize,
      total: data?.total || 0,
      loading,
      onPageChange: setPage,
      onPageSizeChange: (size: number) => {
        setPageSize(size)
        setPage(0)
      }
    }
  }
}
