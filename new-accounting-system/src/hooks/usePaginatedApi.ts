'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface UsePaginatedApiOptions {
  ttl?: number // Time to live in milliseconds
  initialLimit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UsePaginatedApiReturn<T> {
  data: T[] | null
  loading: boolean
  error: string | null
  pagination: PaginationResponse<T>['pagination'] | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setFilters: (filters: Record<string, unknown>) => void
  clearFilters: () => void
  hasNextPage: boolean
  hasPrevPage: boolean
}

const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

export const usePaginatedApi = <T>(
  endpoint: string,
  options: UsePaginatedApiOptions = {}
): UsePaginatedApiReturn<T> => {
  const {
    ttl = 300000, // 5 minutes default
    initialLimit = 10,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options

  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationResponse<T>['pagination'] | null>(null)
  
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: initialLimit,
    search: '',
    sortBy: '',
    sortOrder: 'asc',
    filters: {},
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const buildUrl = useCallback((baseUrl: string, params: PaginationParams) => {
    const url = new URL(baseUrl, window.location.origin)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'filters' && typeof value === 'object') {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
              url.searchParams.append(`filter[${filterKey}]`, String(filterValue))
            }
          })
        } else {
          url.searchParams.append(key, String(value))
        }
      }
    })
    
    return url.toString()
  }, [])

  const getCacheKey = useCallback((url: string) => {
    return `api:${url}`
  }, [])

  const getCachedData = useCallback((url: string) => {
    const cacheKey = getCacheKey(url)
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    if (cached) {
      cache.delete(cacheKey)
    }
    
    return null
  }, [getCacheKey])

  const setCachedData = useCallback((url: string, data: unknown) => {
    const cacheKey = getCacheKey(url)
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }, [getCacheKey, ttl])

  const fetchData = useCallback(async (params: PaginationParams, append = false) => {
    try {
      setLoading(true)
      setError(null)

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      const url = buildUrl(endpoint, params)
      const cachedData = getCachedData(url)

      if (cachedData) {
        const cachedResponse = cachedData as PaginationResponse<T>
        setData(append ? [...(data || []), ...cachedResponse.data] : cachedResponse.data)
        setPagination(cachedResponse.pagination)
        setLoading(false)
        return
      }

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: PaginationResponse<T> = await response.json()
      
      // Cache the result
      setCachedData(url, result)

      setData(append ? [...(data || []), ...result.data] : result.data)
      setPagination(result.pagination)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }
      
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [endpoint, buildUrl, getCachedData, setCachedData, data])

  const refresh = useCallback(async () => {
    // Clear cache for this endpoint
    const url = buildUrl(endpoint, params)
    const cacheKey = getCacheKey(url)
    cache.delete(cacheKey)
    
    await fetchData(params, false)
  }, [endpoint, params, buildUrl, getCacheKey, fetchData])

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext) return
    
    const nextPage = (params.page || 1) + 1
    const nextParams = { ...params, page: nextPage }
    
    await fetchData(nextParams, true)
    setParams(nextParams)
  }, [params, pagination?.hasNext, fetchData])

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setParams(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 }))
  }, [])

  const setSorting = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }, [])

  const setFilters = useCallback((filters: Record<string, unknown>) => {
    setParams(prev => ({ ...prev, filters, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setParams(prev => ({ ...prev, filters: {}, page: 1 }))
  }, [])

  // Fetch data when params change
  useEffect(() => {
    fetchData(params, false)
  }, [params, fetchData])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        refresh()
      }, refreshInterval)

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, refresh])

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    loadMore,
    setPage,
    setLimit,
    setSearch,
    setSorting,
    setFilters,
    clearFilters,
    hasNextPage: pagination?.hasNext || false,
    hasPrevPage: pagination?.hasPrev || false,
  }
}

export default usePaginatedApi