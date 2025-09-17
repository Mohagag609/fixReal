'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, X, Calendar, DollarSign, User, Building } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface SearchFilter {
  field: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number
  value2?: string | number
}

export interface DateRange {
  from: string
  to: string
}

export interface AdvancedSearchProps {
  onSearch: (filters: SearchFilter[], dateRange?: DateRange) => void
  onClear: () => void
  searchFields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'select' | 'date'
    options?: Array<{ value: string; label: string }>
  }>
  dateRangeFields?: Array<{
    key: string
    label: string
  }>
  className?: string
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  searchFields,
  dateRangeFields = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilter[]>([])
  const [dateRanges, setDateRanges] = useState<Record<string, DateRange>>({})
  const [searchText, setSearchText] = useState('')

  const addFilter = () => {
    if (searchFields.length > 0) {
      setFilters(prev => [...prev, {
        field: searchFields[0].key,
        operator: 'contains',
        value: '',
      }])
    }
  }

  const updateFilter = (index: number, updates: Partial<SearchFilter>) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    ))
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  const updateDateRange = (key: string, field: 'from' | 'to', value: string) => {
    setDateRanges(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      }
    }))
  }

  const handleSearch = () => {
    const activeFilters = filters.filter(f => f.value !== '')
    const activeDateRanges = Object.entries(dateRanges).filter(([_, range]) => 
      range.from || range.to
    )
    
    onSearch(activeFilters, activeDateRanges.length > 0 ? activeDateRanges[0][1] : undefined)
  }

  const handleClear = () => {
    setFilters([])
    setDateRanges({})
    setSearchText('')
    onClear()
  }

  const handleQuickSearch = (text: string) => {
    if (text.trim()) {
      const quickFilters: SearchFilter[] = searchFields
        .filter(field => field.type === 'text')
        .map(field => ({
          field: field.key,
          operator: 'contains' as const,
          value: text,
        }))
      
      onSearch(quickFilters)
    } else {
      onClear()
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleQuickSearch(searchText)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchText])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="البحث السريع..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Advanced Search Toggle */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center"
      >
        <Filter className="w-4 h-4 ml-2" />
        البحث المتقدم
        {filters.length > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 mr-2">
            {filters.length}
          </span>
        )}
      </Button>

      {/* Advanced Search Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-lg p-4 space-y-4"
          >
            {/* Filters */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">الفلاتر</h3>
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {searchFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value as 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="contains">يحتوي على</option>
                    <option value="equals">يساوي</option>
                    <option value="startsWith">يبدأ بـ</option>
                    <option value="endsWith">ينتهي بـ</option>
                    <option value="greaterThan">أكبر من</option>
                    <option value="lessThan">أصغر من</option>
                    <option value="between">بين</option>
                  </select>

                  {filter.operator === 'between' ? (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Input
                        type={searchFields.find(f => f.key === filter.field)?.type || 'text'}
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="من"
                        className="w-24"
                      />
                      <span className="text-gray-500">إلى</span>
                      <Input
                        type={searchFields.find(f => f.key === filter.field)?.type || 'text'}
                        value={filter.value2 || ''}
                        onChange={(e) => updateFilter(index, { value2: e.target.value })}
                        placeholder="إلى"
                        className="w-24"
                      />
                    </div>
                  ) : (
                    <Input
                      type={searchFields.find(f => f.key === filter.field)?.type || 'text'}
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="القيمة"
                      className="flex-1"
                    />
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFilter(index)}
                    className="p-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addFilter}
                className="w-full"
              >
                إضافة فلتر
              </Button>
            </div>

            {/* Date Ranges */}
            {dateRangeFields.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">النطاقات الزمنية</h3>
                {dateRangeFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Input
                        type="date"
                        value={dateRanges[field.key]?.from || ''}
                        onChange={(e) => updateDateRange(field.key, 'from', e.target.value)}
                        placeholder="من تاريخ"
                      />
                      <Input
                        type="date"
                        value={dateRanges[field.key]?.to || ''}
                        onChange={(e) => updateDateRange(field.key, 'to', e.target.value)}
                        placeholder="إلى تاريخ"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleClear}
              >
                مسح الكل
              </Button>
              <Button
                onClick={handleSearch}
              >
                تطبيق البحث
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdvancedSearch