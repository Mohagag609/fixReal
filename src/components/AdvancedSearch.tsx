'use client'

import { useState } from 'react'

interface SearchFilter {
  field: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number
  value2?: string | number
}

interface AdvancedSearchProps {
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'select'
    options?: Array<{ value: string; label: string }>
  }>
  onSearch: (filters: SearchFilter[]) => void
  onClear: () => void
}

export function AdvancedSearch({ fields, onSearch, onClear }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilter[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const addFilter = () => {
    setFilters([...filters, { field: fields[0].key, operator: 'contains', value: '' }])
  }

  const updateFilter = (index: number, updates: Partial<SearchFilter>) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    setFilters(newFilters)
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const handleSearch = () => {
    const activeFilters = filters.filter(f => f.value !== '')
    onSearch(activeFilters)
  }

  const handleClear = () => {
    setFilters([])
    onClear()
  }

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return [
          { value: 'contains', label: 'يحتوي على' },
          { value: 'equals', label: 'يساوي' },
          { value: 'startsWith', label: 'يبدأ بـ' },
          { value: 'endsWith', label: 'ينتهي بـ' }
        ]
      case 'number':
        return [
          { value: 'equals', label: 'يساوي' },
          { value: 'greaterThan', label: 'أكبر من' },
          { value: 'lessThan', label: 'أصغر من' },
          { value: 'between', label: 'بين' }
        ]
      case 'date':
        return [
          { value: 'equals', label: 'يساوي' },
          { value: 'greaterThan', label: 'بعد' },
          { value: 'lessThan', label: 'قبل' },
          { value: 'between', label: 'بين' }
        ]
      default:
        return [{ value: 'contains', label: 'يحتوي على' }]
    }
  }

  return (
    <div className="panel">
      <div className="tools">
        <button 
          className="btn secondary" 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'إخفاء البحث المتقدم' : 'البحث المتقدم'}
        </button>
        <button className="btn secondary" onClick={addFilter}>
          إضافة فلتر
        </button>
        <button className="btn" onClick={handleSearch}>
          بحث
        </button>
        <button className="btn secondary" onClick={handleClear}>
          مسح
        </button>
      </div>

      {showAdvanced && (
        <div className="grid" style={{ marginTop: '16px' }}>
          {filters.map((filter, index) => {
            const field = fields.find(f => f.key === filter.field)
            if (!field) return null

            return (
              <div key={index} className="card" style={{ padding: '12px' }}>
                <div className="grid-3" style={{ gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">الحقل</label>
                    <select
                      className="select"
                      value={filter.field}
                      onChange={(e) => updateFilter(index, { field: e.target.value })}
                    >
                      {fields.map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">المشغل</label>
                    <select
                      className="select"
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                    >
                      {getOperatorOptions(field.type).map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">القيمة</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {field.type === 'select' ? (
                        <select
                          className="select"
                          value={filter.value as string}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                        >
                          <option value="">اختر...</option>
                          {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          className="input"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                          placeholder="أدخل القيمة..."
                        />
                      )}
                      
                      {filter.operator === 'between' && (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          className="input"
                          value={filter.value2 || ''}
                          onChange={(e) => updateFilter(index, { value2: e.target.value })}
                          placeholder="إلى..."
                        />
                      )}
                      
                      <button 
                        className="btn warn" 
                        onClick={() => removeFilter(index)}
                        style={{ padding: '8px' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}