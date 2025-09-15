'use client'

import { useState } from 'react'
import ExportMenu from './ExportMenu'
import { PrintButton } from './PrintButton'

interface ReportPreviewProps {
  report: {
    type: string
    data: unknown[]
    filters: unknown
    title: string
    columns: unknown[]
    summary?: unknown
  }
  onClose: () => void
  onConfirm: () => void
  onExport: (format: string) => void
  onPrint: () => void
}

export default function ReportPreview({ 
  report, 
  onClose, 
  onConfirm, 
  onExport, 
  onPrint 
}: ReportPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'summary'>('preview')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{report.title}</h2>
              <p className="text-blue-100 mt-1">
                {report.data.length} سجل • معاينة قبل التحميل
              </p>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <ExportMenu onExport={onExport} />
              <PrintButton onPrint={onPrint} />
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 rtl:space-x-reverse px-6">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              معاينة البيانات
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ملخص التقرير
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'preview' ? (
            <div className="space-y-4">
              {/* Filters Applied */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">الفلاتر المطبقة:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.filters).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {report.columns.slice(0, 5).map((column, index) => (
                          <th
                            key={index}
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column.header || column.key}
                          </th>
                        ))}
                        {report.columns.length > 5 && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ...
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.data.slice(0, 10).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {report.columns.slice(0, 5).map((column, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {column.format ? column.format(row[column.key]) : row[column.key]}
                            </td>
                          ))}
                          {report.columns.length > 5 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ...
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.data.length > 10 && (
                  <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500 text-center">
                    عرض 10 من {report.data.length} سجل
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              {report.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(report.summary).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {key}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Report Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات التقرير</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">نوع التقرير:</span>
                    <p className="text-gray-900">{report.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">عدد السجلات:</span>
                    <p className="text-gray-900">{report.data.length}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">تاريخ الإنشاء:</span>
                    <p className="text-gray-900">{new Date().toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">عدد الأعمدة:</span>
                    <p className="text-gray-900">{report.columns.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            تأكد من صحة البيانات قبل المتابعة
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تأكيد وعرض التقرير
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}