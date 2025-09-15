import React from 'react'
import { usePaginatedApi } from '@/hooks/usePaginatedApi'
import { useEntityApi } from '@/hooks/useEntityApi'

interface Partner {
  id: string
  name: string
  phone: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Example 1: Using usePaginatedApi for list with pagination
export function PartnersListWithPagination() {
  const {
    data: partners,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    setSearch,
    setLimit,
    refresh,
    clearCache
  } = usePaginatedApi<Partner>('/api/partners', {
    ttl: 60000, // 1 minute cache
    initialLimit: 10
  })

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMore()
    }
  }

  if (loading) return <div>Loading partners...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search partners..."
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <button onClick={refresh} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
          Refresh
        </button>
        <button onClick={clearCache} className="ml-2 px-4 py-2 bg-red-500 text-white rounded">
          Clear Cache
        </button>
      </div>

      <div className="space-y-2">
        {partners.map((partner) => (
          <div key={partner.id} className="border p-3 rounded">
            <h3 className="font-bold">{partner.name}</h3>
            <p className="text-gray-600">{partner.phone}</p>
            {partner.notes && <p className="text-sm text-gray-500">{partner.notes}</p>}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          {isLoadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}

// Example 2: Using useEntityApi for CRUD operations
export function PartnersCRUD() {
  const {
    data: partners,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
    isCreating,
    isUpdating,
    isDeleting
  } = useEntityApi<Partner>('partners', {
    ttl: 60000,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  })

  const handleCreate = async () => {
    const newPartner = {
      name: 'New Partner',
      phone: '1234567890',
      notes: 'Created via API'
    }

    try {
      const result = await create(newPartner)
      if (result.success) {
        console.log('Partner created successfully!')
      }
    } catch (error) {
      console.error('Error creating partner:', error)
    }
  }

  const handleUpdate = async (id: string) => {
    const updatedData = {
      name: 'Updated Partner Name',
      phone: '0987654321'
    }

    try {
      const result = await update(id, updatedData)
      if (result.success) {
        console.log('Partner updated successfully!')
      }
    } catch (error) {
      console.error('Error updating partner:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this partner?')) {
      try {
        const result = await remove(id)
        if (result.success) {
          console.log('Partner deleted successfully!')
        }
      } catch (error) {
        console.error('Error deleting partner:', error)
      }
    }
  }

  if (loading) return <div>Loading partners...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Partner'}
        </button>
        <button
          onClick={refresh}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {partners.map((partner) => (
          <div key={partner.id} className="border p-3 rounded flex justify-between items-center">
            <div>
              <h3 className="font-bold">{partner.name}</h3>
              <p className="text-gray-600">{partner.phone}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleUpdate(partner.id)}
                disabled={isUpdating}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Edit'}
              </button>
              <button
                onClick={() => handleDelete(partner.id)}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Example 3: Dashboard with auto-refresh
export function DashboardExample() {
  const { kpis, loading, error, refresh, isRefreshing } = useDashboard({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    ttl: 300000
  })

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div>Error: {error}</div>
  if (!kpis) return <div>No data available</div>

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold text-blue-800">Total Contracts</h3>
          <p className="text-2xl font-bold text-blue-600">{kpis.totalContracts}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-bold text-green-800">Total Units</h3>
          <p className="text-2xl font-bold text-green-600">{kpis.totalUnits}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-bold text-yellow-800">Total Customers</h3>
          <p className="text-2xl font-bold text-yellow-600">{kpis.totalCustomers}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-bold text-purple-800">Total Value</h3>
          <p className="text-2xl font-bold text-purple-600">{kpis.totalContractValue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

