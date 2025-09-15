/**
 * مكون بناء التقارير - Report Builder Component
 * واجهة ديناميكية لبناء وتشغيل التقارير مع فلاتر متقدمة
 */

'use client'

import { useState, useEffect } from 'react'
import { reportDefinitions, validateFilters, applyDefaultFilters, messages } from './fields'
import { useNotifications } from '../../../components/NotificationSystem'

interface ReportBuilderProps {
  onReportGenerated: (reportType: string, data: unknown[], filters: unknown) => void
  onLoadingChange: (loading: boolean) => void
}

export default function ReportBuilder({ onReportGenerated, onLoadingChange }: ReportBuilderProps) {
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<Array<{ value: string; label: string }>>([])
  const { addNotification } = useNotifications()

  // تحميل الوحدات عند بدء التطبيق
  useEffect(() => {
    loadUnits()
  }, [] // TODO: Review dependencies) // TODO: Review dependencies

  // تطبيق الفلاتر الافتراضية عند تغيير نوع التقرير
  useEffect(() => {
    if (selectedReport) {
      const defaultFilters = applyDefaultFilters(selectedReport)
      setFilters(defaultFilters)
    }
  }, [selectedReport])

  const loadUnits = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const unitsOptions = data.data?.map((unit: unknown) => ({
          value: unit.id,
          label: `${unit.code} - ${unit.name || 'بدون اسم'}`
        })) || []
        
        setUnits(unitsOptions)
        
        // تحديث خيارات الوحدات في جميع التقارير
        reportDefinitions.forEach(report => {
          const unitFilter = report.filters.find(f => f.key === 'projectId')
          if (unitFilter) {
            unitFilter.options = unitsOptions
          }
        })
      }
    } catch (error) {
      console.error('Error loading units:', error)
    }
  }

  const handleReportChange = (reportId: string) => {
    setSelectedReport(reportId)
  }

  const handleFilterChange = (key: string, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'يرجى اختيار نوع التقرير'
      })
      return
    }

    // التحقق من صحة الفلاتر
    const errors = validateFilters(filters, selectedReport)
    if (errors.length > 0) {
      addNotification({
        type: 'error',
        title: 'خطأ في الفلاتر',
        message: errors.join(', ')
      })
      return
    }

    setLoading(true)
    onLoadingChange(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/reports/${selectedReport}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filters)
      })

      if (response.ok) {
        const data = await response.json()
        onReportGenerated(selectedReport, data.rows, filters)
        
        addNotification({
          type: 'success',
          title: 'تم بنجاح',
          message: `تم إنشاء تقرير ${reportDefinitions.find(r => r.id === selectedReport)?.name}`
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'فشل في إنشاء التقرير')
      }
    } catch (error) {
      console.error('Report generation error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: error instanceof Error ? error.message : 'فشل في إنشاء التقرير'
      })
    } finally {
      setLoading(false)
      onLoadingChange(false)
    }
  }

  const handleClearFilters = () => {
    if (selectedReport) {
      const defaultFilters = applyDefaultFilters(selectedReport)
      setFilters(defaultFilters)
    }
  }

  const selectedReportDef = reportDefinitions.find(r => r.id === selectedReport)

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">بناء التقارير</h2>
        <p className="text-gray-600">اختر نوع التقرير وحدد الفلاتر المطلوبة</p>
      </div>

      {/* اختيار نوع التقرير */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          نوع التقرير
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportDefinitions.map((report) => (
            <div
              key={report.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleReportChange(report.id)}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`w-12 h-12 bg-gradient-to-r ${report.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-2xl">{report.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* الفلاتر */}
      {selectedReportDef && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">الفلاتر</h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              مسح الفلاتر
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedReportDef.filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                  {filter.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                
                {filter.type === 'text' && (
                  <input
                    type="text"
                    value={filters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                
                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={filters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                
                {filter.type === 'number' && (
                  <input
                    type="number"
                    value={filters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                
                {filter.type === 'select' && (
                  <select
                    value={filters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{filter.placeholder || 'اختر...'}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'multiselect' && (
                  <div className="space-y-2">
                    {filter.options?.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters[filter.key]?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentValues = filters[filter.key] || []
                            if (e.target.checked) {
                              handleFilterChange(filter.key, [...currentValues, option.value])
                            } else {
                              handleFilterChange(filter.key, currentValues.filter((v: string) => v !== option.value))
                            }
                          }}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* أزرار التحكم */}
      <div className="flex items-center justify-end space-x-3 space-x-reverse">
        <button
          onClick={handleClearFilters}
          className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          مسح
        </button>
        
        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedReport}
          className={`px-8 py-2 rounded-lg font-medium transition-all ${
            loading || !selectedReport
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25'
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              جاري الإنشاء...
            </div>
          ) : (
            'إنشاء التقرير'
          )}
        </button>
      </div>
    </div>
  )
}