import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { ModernInput } from './ui/ModernInput'
import { ModernSelect } from './ui/ModernSelect'
import ModernButton from './ui/ModernButton'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  type: 'search' | 'select' | 'date' | 'number'
  label: string
  placeholder?: string
  options?: FilterOption[]
  min?: number
  max?: number
}

interface OptimizedFiltersProps {
  filters: FilterConfig[]
  onFiltersChange: (filters: Record<string, unknown>) => void
  onSearch: (query: string) => void
  searchPlaceholder?: string
  className?: string
  showSearch?: boolean
  showClearAll?: boolean
}

export function OptimizedFilters({
  filters,
  onFiltersChange,
  onSearch,
  searchPlaceholder = 'البحث...',
  className = '',
  showSearch = true,
  showClearAll = true
}: OptimizedFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({})
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedSearch)
  }, [debouncedSearch, onSearch])

  // Trigger filters change when filter values change
  useEffect(() => {
    onFiltersChange(filterValues)
  }, [filterValues, onFiltersChange])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const handleClearAll = useCallback(() => {
    setSearchQuery('')
    setFilterValues({})
  }, [])

  const activeFiltersCount = useMemo(() => {
    return Object.values(filterValues).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length + (searchQuery ? 1 : 0)
  }, [filterValues, searchQuery])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="relative">
          <ModernInput
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            
            {filter.type === 'search' && (
              <ModernInput
                type="text"
                placeholder={filter.placeholder || `البحث في ${filter.label}`}
                value={String(filterValues[filter.key] || '')}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
            )}

            {filter.type === 'select' && (
              <ModernSelect
                value={String(filterValues[filter.key] || '')}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <option value="">جميع {filter.label}</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </ModernSelect>
            )}

            {filter.type === 'date' && (
              <ModernInput
                type="date"
                value={String(filterValues[filter.key] || '')}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
            )}

            {filter.type === 'number' && (
              <div className="flex space-x-2 space-x-reverse">
                <ModernInput
                  type="number"
                  placeholder="من"
                  min={filter.min}
                  max={filter.max}
                  value={String(filterValues[`${filter.key}_min`] || '')}
                  onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                />
                <ModernInput
                  type="number"
                  placeholder="إلى"
                  min={filter.min}
                  max={filter.max}
                  value={String(filterValues[`${filter.key}_max`] || '')}
                  onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      {showClearAll && activeFiltersCount > 0 && (
        <div className="flex justify-end">
          <ModernButton
            variant="secondary"
            size="sm"
            onClick={handleClearAll}
          >
            مسح جميع الفلاتر ({activeFiltersCount})
          </ModernButton>
        </div>
      )}
    </div>
  )
}
