import { useState, useEffect, useRef } from 'react'

interface ApiCacheOptions {
  ttl?: number // Time to live in milliseconds
  enabled?: boolean
}

interface ApiCacheState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch: number | null
}

// Global cache store
const apiCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

export function useApiCache<T>(
  url: string, 
  options: ApiCacheOptions = {}
) {
  const { ttl = 60000, enabled = true } = options // Default 1 minute TTL
  const [state, setState] = useState<ApiCacheState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = async (forceRefresh = false) => {
    if (!enabled) return

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = apiCache.get(url)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          loading: false,
          error: null,
          lastFetch: cached.timestamp
        }))
        return
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!isMountedRef.current) return

      // Cache the data
      apiCache.set(url, {
        data,
        timestamp: Date.now(),
        ttl
      })

      setState({
        data,
        loading: false,
        error: null,
        lastFetch: Date.now()
      })

    } catch (error) {
      if (!isMountedRef.current) return
      
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  const refresh = () => fetchData(true)
  const clearCache = () => {
    apiCache.delete(url)
    setState(prev => ({ ...prev, data: null, lastFetch: null }))
  }

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [url, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    ...state,
    refresh,
    clearCache,
    isCached: state.lastFetch ? apiCache.has(url) : false
  }
}

// Utility function to clear all cache
export const clearAllApiCache = () => {
  apiCache.clear()
}

// Utility function to clear cache by pattern
export const clearApiCacheByPattern = (pattern: string) => {
  const regex = new RegExp(pattern)
  for (const [key] of apiCache) {
    if (regex.test(key)) {
      apiCache.delete(key)
    }
  }
}

