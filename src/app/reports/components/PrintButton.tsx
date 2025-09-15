/**
 * زر الطباعة - Print Button Component
 * زر لطباعة التقرير مباشرة
 */

'use client'

import { generatePrintHTML } from '../../../lib/reports/transformers'

interface PrintButtonProps {
  onPrint: () => void
}

export function PrintButton({ onPrint }: PrintButtonProps) {
  const handlePrint = () => {
    onPrint()
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      طباعة
    </button>
  )
}

/**
 * دالة طباعة التقرير
 */
export function printReport(data: unknown[], reportType: string, title: string) {
  const html = generatePrintHTML(data, reportType, title)
  
  // إنشاء نافذة جديدة للطباعة
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة')
    return
  }
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  // انتظار تحميل الصفحة ثم الطباعة
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    
    // إغلاق النافذة بعد الطباعة
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }
}