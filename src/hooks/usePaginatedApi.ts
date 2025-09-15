import { useState, useCallback, useRef } from 'react'
import { useApiCache } from './useApiCache'

interface PaginationParams {
  limit?: number
  cursor?: string | null
  search?: string
  [key: string]: unknown
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    limit: number
    nextCursor: string | null
    hasMore: boolean
  }
}

interface UsePaginatedApiOptions {
  ttl?: number
  enabled?: boolean
  initialLimit?: number
}

export function usePaginatedApi<T>(
  baseUrl: string,
  options: UsePaginatedApiOptions = {}
) {
  const { ttl = 60000, enabled = true, initialLimit = 10 } = options
  
  const [params, setParams] = useState<PaginationParams>({
    limit: initialLimit,
    cursor: null,
    search: ''
  })
  
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const currentCursorRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Build URL with current params
  const buildUrl = useCallback((currentParams: PaginationParams) => {
    const url = new URL(baseUrl, window.location.origin)
    Object.entries(currentParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
    return url.toString()
  }, [baseUrl])

  const currentUrl = buildUrl(params)

  // Use the base API cache hook
  const { data, loading, error, refresh, clearCache } = useApiCache<PaginatedResponse<T>>(
    currentUrl,
    { ttl, enabled }
  )

  // Update local state when data changes
  const updateLocalState = useCallback((newData: PaginatedResponse<T> | null) => {
    if (!newData) return

    if (params.cursor) {
      // Loading more - append to existing data
      setAllData(prev => [...prev, ...newData.data])
    } else {
      // Fresh load - replace data
      setAllData(newData.data)
    }
    
    setHasMore(newData.pagination.hasMore)
    currentCursorRef.current = newData.pagination.nextCursor
  }, [params.cursor])

  // Update local state when data changes
  React.useEffect(() => {
    updateLocalState(data)
  }, [data, updateLocalState])

  // Load more data
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !currentCursorRef.current) return

    setIsLoadingMore(true)

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      const moreParams = { ...params, cursor: currentCursorRef.current }
      const moreUrl = buildUrl(moreParams)

      const response = await fetch(moreUrl, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newData = await response.json()

      if (newData.success) {
        setAllData(prev => [...prev, ...newData.data])
        setHasMore(newData.pagination.hasMore)
        currentCursorRef.current = newData.pagination.nextCursor
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error loading more data:', error)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, params, buildUrl])

  // Update search
  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search, cursor: null }))
    setAllData([])
    setHasMore(true)
    currentCursorRef.current = null
  }, [])

  // Update limit
  const setLimit = useCallback((limit: number) => {
    setParams(prev => ({ ...prev, limit, cursor: null }))
    setAllData([])
    setHasMore(true)
    currentCursorRef.current = null
  }, [])

  // Refresh data
  const refreshData = useCallback(() => {
    setAllData([])
    setHasMore(true)
    currentCursorRef.current = null
    setParams(prev => ({ ...prev, cursor: null }))
    refresh()
  }, [refresh])

  // Clear cache and refresh
  const clearCacheAndRefresh = useCallback(() => {
    clearCache()
    refreshData()
  }, [clearCache, refreshData])

  return {
    data: allData,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    setSearch,
    setLimit,
    refresh: refreshData,
    clearCache: clearCacheAndRefresh,
    params
  }
}

// Import React for useEffect
import React from 'react'

