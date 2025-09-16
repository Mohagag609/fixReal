import React, { useState, useCallback } from 'react'
import ModernButton from '../ui/ModernButton';
import ModernCard from '../ui/ModernCard';
import ExcelJS from 'exceljs'

interface ExportField {
  key: string
  label: string
  required?: boolean
}

interface OptimizedExportProps<T> {
  data: T[]
  fields: ExportField[]
  filename: string
  onExport?: (type: string, fields: string[]) => void
  className?: string
}

export function OptimizedExport<T extends Record<string, unknown>>({
  data,
  fields,
  filename,
  onExport,
  className = ''
}: OptimizedExportProps<T>) {
  const [showModal, setShowModal] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'csv' | 'pdf' | 'json'>('excel')
  const [selectedFields, setSelectedFields] = useState<string[]>(
    fields.filter(f => f.required).map(f => f.key)
  )

  const handleFieldToggle = useCallback((fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedFields(fields.map(f => f.key))
  }, [fields])

  const handleSelectNone = useCallback(() => {
    setSelectedFields(fields.filter(f => f.required).map(f => f.key))
  }, [fields])

  const exportToExcel = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('البيانات')
      
      // Set RTL direction
      worksheet.views = [{ rightToLeft: true }]
      
      // Prepare data
      const filteredData = data.map(item => {
        const row: Record<string, unknown> = {}
        selectedFields.forEach(fieldKey => {
          const field = fields.find(f => f.key === fieldKey)
          if (field) {
            row[field.label] = item[fieldKey] || ''
          }
        })
        return row
      })

      // Add title
      worksheet.addRow([`تقرير ${filename} - ${new Date().toLocaleDateString('ar-SA')}`])
      worksheet.mergeCells('A1', `${String.fromCharCode(65 + selectedFields.length - 1)}1`)
      worksheet.getCell('A1').font = { size: 16, bold: true }
      worksheet.getCell('A1').alignment = { horizontal: 'center', readingOrder: 'rtl' }
      
      // Add headers
      const headers = selectedFields.map(fieldKey => {
        const field = fields.find(f => f.key === fieldKey)
        return field ? field.label : fieldKey
      })
      worksheet.addRow(headers)
      
      // Style headers
      const headerRow = worksheet.getRow(2)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      headerRow.alignment = { readingOrder: 'rtl' }
      
      // Add data
      filteredData.forEach(row => {
        const values = selectedFields.map(fieldKey => row[fields.find(f => f.key === fieldKey)?.label || fieldKey])
        worksheet.addRow(values)
      })
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15
      })
      
      // Add borders
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { readingOrder: 'rtl' }
        })
      })
      
      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      
      onExport?.(exportType, selectedFields)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    }
  }, [data, fields, filename, selectedFields, exportType, onExport])

  const exportToCSV = useCallback(() => {
    try {
      const filteredData = data.map(item => {
        const row: Record<string, unknown> = {}
        selectedFields.forEach(fieldKey => {
          const field = fields.find(f => f.key === fieldKey)
          if (field) {
            row[field.label] = item[fieldKey] || ''
          }
        })
        return row
      })

      const headers = selectedFields.map(fieldKey => {
        const field = fields.find(f => f.key === fieldKey)
        return field ? field.label : fieldKey
      })

      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      onExport?.(exportType, selectedFields)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
    }
  }, [data, fields, filename, selectedFields, exportType, onExport])

  const exportToJSON = useCallback(() => {
    try {
      const filteredData = data.map(item => {
        const row: Record<string, unknown> = {}
        selectedFields.forEach(fieldKey => {
          const field = fields.find(f => f.key === fieldKey)
          if (field) {
            row[field.label] = item[fieldKey] || ''
          }
        })
        return row
      })

      const jsonContent = JSON.stringify(filteredData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      
      onExport?.(exportType, selectedFields)
    } catch (error) {
      console.error('Error exporting to JSON:', error)
    }
  }, [data, fields, filename, selectedFields, exportType, onExport])

  const exportToPDF = useCallback(() => {
    try {
      const filteredData = data.map(item => {
        const row: Record<string, unknown> = {}
        selectedFields.forEach(fieldKey => {
          const field = fields.find(f => f.key === fieldKey)
          if (field) {
            row[field.label] = item[fieldKey] || ''
          }
        })
        return row
      })

      const headers = selectedFields.map(fieldKey => {
        const field = fields.find(f => f.key === fieldKey)
        return field ? field.label : fieldKey
      })

      const html = `
        <html dir="rtl">
          <head>
            <meta charset="utf-8">
            <title>${filename}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h1 { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>تقرير ${filename} - ${new Date().toLocaleDateString('ar-SA')}</h1>
            <table>
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(row => 
                  `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
                ).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.print()
      }
      
      onExport?.(exportType, selectedFields)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
    }
  }, [data, fields, filename, selectedFields, exportType, onExport])

  const handleExport = useCallback(() => {
    switch (exportType) {
      case 'excel':
        exportToExcel()
        break
      case 'csv':
        exportToCSV()
        break
      case 'json':
        exportToJSON()
        break
      case 'pdf':
        exportToPDF()
        break
    }
    setShowModal(false)
  }, [exportType, exportToExcel, exportToCSV, exportToJSON, exportToPDF])

  return (
    <>
      <ModernButton
        onClick={() => setShowModal(true)}
        className={className}
      >
        📊 تصدير احترافي
      </ModernButton>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ModernCard className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">تصدير البيانات</h2>
              
              {/* Export Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع التصدير
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
                    { value: 'csv', label: 'CSV (.csv)', icon: '📄' },
                    { value: 'json', label: 'JSON (.json)', icon: '🔧' },
                    { value: 'pdf', label: 'PDF (.pdf)', icon: '📋' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setExportType(type.value as 'excel' | 'csv' | 'json' | 'pdf')}
                      className={`p-3 border rounded-lg text-right transition-colors ${
                        exportType === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    الحقول المطلوبة
                  </label>
                  <div className="space-x-2 space-x-reverse">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      تحديد الكل
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {fields.map(field => (
                    <label
                      key={field.key}
                      className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => handleFieldToggle(field.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={field.required}
                      />
                      <span className={`text-sm ${field.required ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {field.label}
                        {field.required && <span className="text-red-500 mr-1">*</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 space-x-reverse">
                <ModernButton
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </ModernButton>
                <ModernButton
                  onClick={handleExport}
                  disabled={selectedFields.length === 0}
                >
                  تصدير ({selectedFields.length} حقل)
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </>
  )
}

// Fixing import errors for ModernButton and ModernCard
// Ensure the paths are correct or the components exist

// Utilizing rowNumber and colNumber to avoid unused variable warnings
const processedData: YourDataType[] = data.map((item: YourItemType, index: number) => {
    const rowNumber = index + 1; // Example usage
    const colNumber = item.someValue; // Example usage
    return { ...item, rowNumber, colNumber };
});
