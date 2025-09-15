import { useState, useEffect, useRef } from 'react'
import { useApiCache } from './useApiCache'

interface DashboardKPIs {
  totalContracts: number
  totalVouchers: number
  totalInstallments: number
  totalUnits: number
  totalCustomers: number
  totalContractValue: number
  totalVoucherAmount: number
  paidInstallments: number
  pendingInstallments: number
  activeUnits: number
  inactiveUnits: number
}

interface DashboardResponse {
  success: boolean
  data: DashboardKPIs
  message: string
}

interface UseDashboardOptions {
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  ttl?: number
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { 
    autoRefresh = true, 
    refreshInterval = 300000, // 5 minutes
    ttl = 300000 // 5 minutes
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    data: response,
    loading,
    error,
    refresh,
    clearCache
  } = useApiCache<DashboardResponse>('/api/dashboard', { ttl })

  const kpis = response?.data || null

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        setIsRefreshing(true)
        refresh().finally(() => setIsRefreshing(false))
      }, refreshInterval)

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, refresh])

  // Manual refresh with loading state
  const manualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Clear cache and refresh
  const clearCacheAndRefresh = async () => {
    clearCache()
    await manualRefresh()
  }

  return {
    kpis,
    loading: loading || isRefreshing,
    error,
    refresh: manualRefresh,
    clearCache: clearCacheAndRefresh,
    isRefreshing,
    lastUpdated: response ? new Date().toISOString() : null
  }
}

