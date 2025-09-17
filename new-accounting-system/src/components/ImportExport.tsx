'use client'

import React, { useState, useRef } from 'react'
import { Download, Upload, FileTextIcon, AlertIcon, CheckCircle } from './icons'
import { Button } from './ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Modal } from './ui/Modal'
import { exportData, prepareTableDataForExport, importFromCSV, validateImportData } from '../lib/exportUtils'
import { ExportOptions } from '../lib/exportUtils'

interface ImportExportProps<T> {
  data: T[]
  columns: Array<{
    key: string
    label: string
    accessorKey?: string
    cell?: (row: Record<string, unknown>) => string | number
  }>
  title?: string
  subtitle?: string
  onImport?: (data: T[]) => void
  requiredFields?: string[]
  validator?: (row: Record<string, string>) => string | null
  className?: string
}

export const ImportExport = <T,>({
  data,
  columns,
  title,
  subtitle,
  onImport,
  requiredFields = [],
  validator,
  className = '',
}: ImportExportProps<T>) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importMode, setImportMode] = useState<'export' | 'import'>('export')
  const [importData, setImportData] = useState<Array<Record<string, string>>>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const preparedData = prepareTableDataForExport(data as Record<string, unknown>[], columns, title, subtitle)
      const options: ExportOptions = {
        format,
        filename: `${title || 'export'}_${new Date().toISOString().split('T')[0]}`,
        includeHeaders: true,
      }
      
      exportData(preparedData, options)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsValidating(true)
      const importedData = await importFromCSV(file)
      
      // Validate data
      const validation = validateImportData(importedData, requiredFields, validator)
      
      if (validation.valid) {
        setImportData(importedData)
        setImportErrors([])
      } else {
        setImportErrors(validation.errors)
        setImportData([])
      }
    } catch (error) {
      setImportErrors([`خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`])
      setImportData([])
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = () => {
    if (onImport && importData.length > 0) {
      // Convert imported data to the expected format
      const convertedData = importData.map(row => {
        const converted: Record<string, unknown> = {}
        columns.forEach(col => {
          const key = col.accessorKey || col.key
          converted[key] = row[col.label] || row[key] || ''
        })
        return converted
      })
      
      onImport(convertedData as T[])
      setIsModalOpen(false)
      setImportData([])
      setImportErrors([])
    }
  }

  const resetImport = () => {
    setImportData([])
    setImportErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-2 space-x-reverse">
        <Button
          variant="outline"
          onClick={() => {
            setImportMode('export')
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Download className="w-4 h-4 ml-2" />
          تصدير
        </Button>
        
        {onImport && (
          <Button
            variant="outline"
            onClick={() => {
              setImportMode('import')
              setIsModalOpen(true)
            }}
            className="flex items-center"
          >
            <Upload className="w-4 h-4 ml-2" />
            استيراد
          </Button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetImport()
        }}
        title={importMode === 'export' ? 'تصدير البيانات' : 'استيراد البيانات'}
        size="md"
      >
        <div className="space-y-6">
          {importMode === 'export' ? (
            <div className="space-y-4">
              <div className="text-center">
                <FileTextIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">تصدير البيانات</h3>
                <p className="text-gray-600">اختر صيغة التصدير المطلوبة</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => handleExport('excel')}
                  className="flex items-center justify-center"
                >
                  <FileTextIcon className="w-4 h-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center justify-center"
                >
                  <FileTextIcon className="w-4 h-4 ml-2" />
                  تصدير PDF
                </Button>
                <Button
                  onClick={() => handleExport('csv')}
                  className="flex items-center justify-center"
                >
                  <FileTextIcon className="w-4 h-4 ml-2" />
                  تصدير CSV
                </Button>
              </div>

              <div className="text-sm text-gray-500 text-center">
                سيتم تصدير {data.length} عنصر
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">استيراد البيانات</h3>
                <p className="text-gray-600">اختر ملف CSV للاستيراد</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  اختر ملف CSV
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  فقط ملفات CSV مدعومة
                </p>
              </div>

              {/* Import Results */}
              <div>
                {importData.length > 0 && (
                  <div
                    className="space-y-2"
                  >
                    <div className="flex items-center text-red-600">
                      <AlertIcon className="w-4 h-4 ml-2" />
                      <span className="text-sm font-medium">أخطاء في البيانات:</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <ul className="text-sm text-red-700 space-y-1">
                        {importErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetImport()
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importData.length === 0 || importErrors.length > 0 || isValidating}
                >
                  {isValidating ? 'جاري التحقق...' : 'استيراد'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ImportExport