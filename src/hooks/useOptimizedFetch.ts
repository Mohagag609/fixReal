import { useState, useCallback, useRef } from 'react'

interface UseOptimizedFetchOptions {
  cacheTime?: number // Cache time in milliseconds
  staleTime?: number // Stale time in milliseconds
  retryCount?: number
  retryDelay?: number
}

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch: number | null
}

// Simple in-memory cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number; staleTime: number }>()

export function useOptimizedFetch<T = unknown>(options: UseOptimizedFetchOptions = {}) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    staleTime = 2 * 60 * 1000, // 2 minutes default stale
    retryCount = 3,
    retryDelay = 1000
  } = options

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  })

  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (
    url: string, 
    options: RequestInit = {},
    forceRefresh = false
  ): Promise<T | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    const cacheKey = `${url}-${JSON.stringify(options)}`
    const now = Date.now()

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached && (now - cached.timestamp) < cached.staleTime) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          loading: false,
          error: null,
          lastFetch: cached.timestamp
        }))
        return cached.data as T
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Cache successful response
      cache.set(cacheKey, {
        data,
        timestamp: now,
        staleTime: cacheTime
      })

      setState({
        data,
        loading: false,
        error: null,
        lastFetch: now
      })

      retryCountRef.current = 0
      return data

    } catch (error: unknown) {
      if ((error as any)?.name === 'AbortError') {
        return null // Request was cancelled
      }

      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        setTimeout(() => {
          fetchData(url, options, forceRefresh)
        }, retryDelay * retryCountRef.current)
        return null
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as any)?.message || 'خطأ في الاتصال بالخادم'
      }))

      return null
    }
  }, [cacheTime, staleTime, retryCount, retryDelay])

  const clearCache = useCallback(() => {
    cache.clear()
  }, [])

  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of cache.keys()) {
        if (regex.test(key)) {
          cache.delete(key)
        }
      }
    } else {
      cache.clear()
    }
  }, [])

  return {
    ...state,
    fetchData,
    clearCache,
    invalidateCache,
    isStale: state.lastFetch ? (Date.now() - state.lastFetch) > staleTime : true
  }
}
