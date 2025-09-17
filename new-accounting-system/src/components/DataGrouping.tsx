'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDownIcon, ChevronRightIcon, BarChart3Icon, FilterIcon, SortAscIcon, SortDescIcon, ChevronDown, ChevronRight, BarChart3, Filter, SortAsc, SortDesc } from './icons'
import { Button } from './ui/Button'

export interface GroupingOption {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'status'
}

export interface SortingOption {
  key: string
  label: string
  direction: 'asc' | 'desc'
}

export interface DataGroupingProps<T> {
  data: T[]
  groupingOptions: GroupingOption[]
  onGroupedDataChange: (groupedData: Record<string, T[]>) => void
  onSortingChange: (sorting: SortingOption[]) => void
  className?: string
}

export const DataGrouping = <T,>({
  data,
  groupingOptions,
  onGroupedDataChange,
  onSortingChange,
  className = '',
}: DataGroupingProps<T>) => {
  const [groupBy, setGroupBy] = useState<string>('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [sorting, setSorting] = useState<SortingOption[]>([])

  const groupedData = useMemo(() => {
    if (!groupBy) {
      return { 'all': data }
    }

    const groups: Record<string, T[]> = {}
    
    data.forEach(item => {
      const value = (item as Record<string, unknown>)[groupBy]
      const groupKey = value ? String(value) : 'غير محدد'
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
    })

    return groups
  }, [data, groupBy])

  const sortedGroupedData = useMemo(() => {
    const sorted: Record<string, T[]> = {}
    
    Object.entries(groupedData).forEach(([groupKey, items]) => {
      const sortedItems = [...items]
      
      sorting.forEach(sort => {
        sortedItems.sort((a, b) => {
          const aValue = (a as Record<string, unknown>)[sort.key]
          const bValue = (b as Record<string, unknown>)[sort.key]
          
          if (aValue === bValue) return 0
          
          const comparison = (aValue as string | number) < (bValue as string | number) ? -1 : 1
          return sort.direction === 'asc' ? comparison : -comparison
        })
      })
      
      sorted[groupKey] = sortedItems
    })

    return sorted
  }, [groupedData, sorting])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const toggleSorting = (key: string) => {
    setSorting(prev => {
      const existing = prev.find(s => s.key === key)
      if (existing) {
        if (existing.direction === 'asc') {
          return prev.map(s => s.key === key ? { ...s, direction: 'desc' as const } : s)
        } else {
          return prev.filter(s => s.key !== key)
        }
      } else {
        return [...prev, { key, label: groupingOptions.find(o => o.key === key)?.label || key, direction: 'asc' as const }]
      }
    })
  }

  const getSortingIcon = (key: string) => {
    const sort = sorting.find(s => s.key === key)
    if (!sort) return <SortAsc className="w-4 h-4 text-gray-400" />
    return sort.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-600" /> : 
      <SortDesc className="w-4 h-4 text-blue-600" />
  }

  const getGroupIcon = (groupKey: string) => {
    return expandedGroups.has(groupKey) ? 
      <ChevronDown className="w-4 h-4" /> : 
      <ChevronRight className="w-4 h-4" />
  }

  const getGroupStatusColor = (groupKey: string) => {
    const statusColors: Record<string, string> = {
      'مدفوع': 'bg-green-100 text-green-800',
      'معلق': 'bg-yellow-100 text-yellow-800',
      'متأخر': 'bg-red-100 text-red-800',
      'نشط': 'bg-blue-100 text-blue-800',
      'غير نشط': 'bg-gray-100 text-gray-800',
    }
    
    return statusColors[groupKey] || 'bg-gray-100 text-gray-800'
  }

  React.useEffect(() => {
    onGroupedDataChange(sortedGroupedData)
  }, [sortedGroupedData, onGroupedDataChange])

  React.useEffect(() => {
    onSortingChange(sorting)
  }, [sorting, onSortingChange])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grouping Controls */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="flex items-center space-x-2 space-x-reverse">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">التجميع:</span>
        </div>
        
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">بدون تجميع</option>
          {groupingOptions.map(option => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sorting Controls */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">الترتيب:</span>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          {groupingOptions.map(option => (
            <Button
              key={option.key}
              variant="outline"
              size="sm"
              onClick={() => toggleSorting(option.key)}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <span>{option.label}</span>
              {getSortingIcon(option.key)}
            </Button>
          ))}
        </div>
      </div>

      {/* Grouped Data Display */}
      <div className="space-y-2">
        {Object.entries(sortedGroupedData).map(([groupKey, items]) => (
          <div key={groupKey} className="border border-gray-200 rounded-lg">
            <div
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                {getGroupIcon(groupKey)}
                <span className="font-medium text-gray-900">
                  {groupKey}
                </span>
                <span className="text-sm text-gray-500">
                  ({items.length} عنصر)
                </span>
              </div>
              
              {groupingOptions.find(o => o.key === groupBy)?.type === 'status' && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGroupStatusColor(groupKey)}`}>
                  {groupKey}
                </span>
              )}
            </div>
            
            <div>
              {expandedGroups.has(groupKey) && (
                <div
                  className="border-t border-gray-200"
                >
                  <div className="p-3">
                    {/* Render items here - this would be passed as a render prop or children */}
                    <div className="text-sm text-gray-600">
                      {items.length} عنصر في هذه المجموعة
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <span className="font-medium">إجمالي العناصر:</span> {data.length}
          </div>
          <div className="text-sm text-blue-800">
            <span className="font-medium">عدد المجموعات:</span> {Object.keys(sortedGroupedData).length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataGrouping