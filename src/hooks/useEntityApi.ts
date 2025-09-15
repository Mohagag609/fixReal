import { useState, useCallback } from 'react'
import { useApiCache } from './useApiCache'

interface EntityApiOptions {
  ttl?: number
  enabled?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useEntityApi<T>(
  entityName: string,
  options: EntityApiOptions = {}
) {
  const { 
    ttl = 60000, 
    enabled = true,
    autoRefresh = false,
    refreshInterval = 300000
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    data: listResponse,
    loading: listLoading,
    error: listError,
    refresh: refreshList,
    clearCache
  } = useApiCache(`/api/${entityName}`, { ttl, enabled })

  // Auto refresh setup
  React.useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        setIsRefreshing(true)
        refreshList().finally(() => setIsRefreshing(false))
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refreshList])

  // Create entity
  const create = useCallback(async (data: Partial<T>) => {
    setIsCreating(true)
    try {
      const response = await fetch(`/api/${entityName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear cache to force refresh
        clearCache()
        await refreshList()
      }

      return result
    } finally {
      setIsCreating(false)
    }
  }, [entityName, clearCache, refreshList])

  // Update entity
  const update = useCallback(async (id: string, data: Partial<T>) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/${entityName}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear cache to force refresh
        clearCache()
        await refreshList()
      }

      return result
    } finally {
      setIsUpdating(false)
    }
  }, [entityName, clearCache, refreshList])

  // Delete entity
  const remove = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/${entityName}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear cache to force refresh
        clearCache()
        await refreshList()
      }

      return result
    } finally {
      setIsDeleting(false)
    }
  }, [entityName, clearCache, refreshList])

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshList()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshList])

  // Clear cache and refresh
  const clearCacheAndRefresh = useCallback(async () => {
    clearCache()
    await refresh()
  }, [clearCache, refresh])

  return {
    // Data
    data: listResponse?.data || [],
    loading: listLoading || isRefreshing,
    error: listError,
    
    // Actions
    create,
    update,
    remove,
    refresh,
    clearCache: clearCacheAndRefresh,
    
    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    isRefreshing,
    
    // Metadata
    pagination: listResponse?.pagination,
    success: listResponse?.success,
    message: listResponse?.message
  }
}

// Import React for useEffect
import React from 'react'

