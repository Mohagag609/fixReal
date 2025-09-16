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
          data: cached.data as T,
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

    // Create new abort controller and timeout
    abortControllerRef.current = new AbortController()
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort()
    }, 1000 * 15) // 15s timeout

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Attach Authorization header automatically if token present
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Try to parse JSON safely
      let parsed: unknown = null
      try {
        parsed = await response.json()
      } catch (parseError) {
        console.warn('Failed to parse JSON from', url, parseError)
        parsed = null
      }

      if (!isMountedRef.current) return

      // Cache the data
      apiCache.set(url, {
        data: parsed,
        timestamp: Date.now(),
        ttl
      })

      setState({
        data: parsed as T,
        loading: false,
        error: null,
        lastFetch: Date.now()
      })

    } catch (error) {
      if (!isMountedRef.current) return

      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled or timed out
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))

    } finally {
      clearTimeout(timeoutId)
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

