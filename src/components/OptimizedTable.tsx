import React, { useMemo, useCallback, useState } from 'react'
import { ReactNode } from 'react';
import ModernCard from './ModernCard';

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: unknown, item: T) => React.ReactNode
  width?: string
}

interface OptimizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void
  sortBy?: keyof T
  sortOrder?: 'asc' | 'desc'
  onRowClick?: (item: T) => void
  className?: string
  emptyMessage?: string
}

export function OptimizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  onSort,
  sortBy,
  sortOrder = 'asc',
  onRowClick,
  className = '',
  emptyMessage = 'لا توجد بيانات'
}: OptimizedTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortBy || !onSort) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal, 'ar')
          : bVal.localeCompare(aVal, 'ar')
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })
  }, [data, sortBy, sortOrder, onSort])

  const handleSort = useCallback((key: keyof T) => {
    if (!onSort) return

    const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(key, newOrder)
  }, [onSort, sortBy, sortOrder])

  const handleRowClick = useCallback((item: T) => {
    if (onRowClick) {
      onRowClick(item)
    }
  }, [onRowClick])

  if (loading) {
    return (
      <ModernCard className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </ModernCard>
    )
  }

  if (data.length === 0) {
    return (
      <ModernCard className={`p-6 text-center ${className}`}>
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </ModernCard>
    )
  }

  return (
    <ModernCard className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortBy === column.key && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}>
                          ▲
                        </span>
                        <span className={`text-xs ${sortBy === column.key && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}>
                          ▼
                        </span>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${hoveredRow === index ? 'bg-blue-50' : ''}`}
                onClick={() => handleRowClick(item)}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(item[column.key] as ReactNode, item) : (typeof item[column.key] === 'string' || typeof item[column.key] === 'number' ? item[column.key] as ReactNode : null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModernCard>
  )
}
