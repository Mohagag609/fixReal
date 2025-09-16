/**
 * محولات البيانات - Data Transformers
 * يحتوي على دوال تحويل وتنسيق البيانات للعرض والتصدير
 */

import dayjs from 'dayjs'
import numeral from 'numeral'

// إعدادات التنسيق
numeral.register('locale', 'ar', {
  delimiters: {
    thousands: ',',
    decimal: '.'
  },
  abbreviations: {
    thousand: 'ألف',
    million: 'مليون',
    billion: 'مليار',
    trillion: 'تريليون'
  },
  currency: {
    symbol: 'ر.س'
  },
  ordinal: (number: number) => {
    return number.toString()
  }
})

numeral.locale('ar')

export interface ColumnDefinition {
  key: string
  title: string
  type: 'text' | 'number' | 'date' | 'currency' | 'status'
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: string
}

/**
 * تعريفات أعمدة التقارير
 */
export const reportColumns: Record<string, ColumnDefinition[]> = {
  installments: [
    { key: 'unitCode', title: 'كود الوحدة', type: 'text', width: 120 },
    { key: 'unitName', title: 'اسم الوحدة', type: 'text', width: 200 },
    { key: 'customerName', title: 'اسم العميل', type: 'text', width: 150 },
    { key: 'customerPhone', title: 'هاتف العميل', type: 'text', width: 120 },
    { key: 'amount', title: 'المبلغ', type: 'currency', width: 120, align: 'right' },
    { key: 'dueDate', title: 'تاريخ الاستحقاق', type: 'date', width: 120 },
    { key: 'status', title: 'الحالة', type: 'status', width: 100, align: 'center' },
    { key: 'notes', title: 'ملاحظات', type: 'text', width: 200 }
  ],
  
  payments: [
    { key: 'unitCode', title: 'كود الوحدة', type: 'text', width: 120 },
    { key: 'unitName', title: 'اسم الوحدة', type: 'text', width: 200 },
    { key: 'customerName', title: 'اسم العميل', type: 'text', width: 150 },
    { key: 'customerPhone', title: 'هاتف العميل', type: 'text', width: 120 },
    { key: 'amount', title: 'المبلغ', type: 'currency', width: 120, align: 'right' },
    { key: 'date', title: 'تاريخ التحصيل', type: 'date', width: 120 },
    { key: 'method', title: 'طريقة الدفع', type: 'text', width: 150 },
    { key: 'safeName', title: 'الخزينة', type: 'text', width: 120 },
    { key: 'description', title: 'الوصف', type: 'text', width: 200 }
  ],
  
  aging: [
    { key: 'unitCode', title: 'كود الوحدة', type: 'text', width: 120 },
    { key: 'unitName', title: 'اسم الوحدة', type: 'text', width: 200 },
    { key: 'customerName', title: 'اسم العميل', type: 'text', width: 150 },
    { key: 'customerPhone', title: 'هاتف العميل', type: 'text', width: 120 },
    { key: 'amount', title: 'المبلغ', type: 'currency', width: 120, align: 'right' },
    { key: 'dueDate', title: 'تاريخ الاستحقاق', type: 'date', width: 120 },
    { key: 'daysOverdue', title: 'أيام التأخير', type: 'number', width: 100, align: 'center' },
    { key: 'agingCategory', title: 'فئة التأخير', type: 'status', width: 100, align: 'center' },
    { key: 'status', title: 'الحالة', type: 'status', width: 100, align: 'center' }
  ]
}

/**
 * تنسيق القيم حسب النوع
 */
export function formatValue(value: unknown, type: string, format?: string): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  
  switch (type) {
    case 'currency':
      return numeral(value).format('0,0.00') + ' ر.س'
    
    case 'number':
      return numeral(value).format(format || '0,0')
    
    case 'date':
      return dayjs(value as string | Date).format('YYYY-MM-DD')
    
    case 'status':
      return getStatusLabel(value as string)
    
    default:
      return String(value)
  }
}

/**
 * تنسيق القيم للتصدير (بدون رموز)
 */
export function formatValueForExport(value: unknown, type: string, format?: string): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  
  switch (type) {
    case 'currency':
      return numeral(value).format(format || '0,0')
    
    case 'number':
      return numeral(value).format(format || '0,0')
    
    case 'date':
      return dayjs(value as string | Date).format('YYYY-MM-DD')
    
    default:
      return String(value)
  }
}

/**
 * تسميات الحالات
 */
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'معلق': 'معلق',
    'مسدد': 'مسدد',
    'متأخر': 'متأخر',
    'ملغي': 'ملغي',
    '0-30': '0-30 يوم',
    '31-60': '31-60 يوم',
    '61-90': '61-90 يوم',
    '>90': 'أكثر من 90 يوم'
  }
  
  return statusLabels[status] || status
}

/**
 * ألوان الحالات
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'معلق': 'bg-yellow-100 text-yellow-800',
    'مسدد': 'bg-green-100 text-green-800',
    'متأخر': 'bg-red-100 text-red-800',
    'ملغي': 'bg-gray-100 text-gray-800',
    '0-30': 'bg-green-100 text-green-800',
    '31-60': 'bg-yellow-100 text-yellow-800',
    '61-90': 'bg-orange-100 text-orange-800',
    '>90': 'bg-red-100 text-red-800'
  }
  
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * تحويل البيانات للجدول
 */
export function transformDataForTable(data: unknown[], reportType: string) {
  const columns = reportColumns[reportType] || []
  
  return data.map(row => {
    const transformedRow: Record<string, unknown> = {}
    
    columns.forEach(column => {
      const value = (row as any)[column.key]
      transformedRow[column.key] = {
        raw: value,
        formatted: formatValue(value, column.type, column.format),
        type: column.type,
        align: column.align || 'left'
      }
    })
    
    return transformedRow
  })
}

/**
 * حساب الإجماليات
 */
export function calculateTotals(data: unknown[], reportType: string) {
  const columns = reportColumns[reportType] || []
  const totals: Record<string, number> = {}
  
  columns.forEach(column => {
    if (column.type === 'currency' || column.type === 'number') {
      totals[column.key] = data.reduce((sum, row) => {
        const value = (row as any)[column.key]?.raw || (row as any)[column.key]
        return sum + (Number(value) || 0)
      }, 0)
    }
  })
  
  return totals
}

/**
 * تحضير البيانات للتصدير
 */
export function prepareDataForExport(data: unknown[], reportType: string) {
  const columns = reportColumns[reportType] || []
  
  return data.map(row => {
    const exportRow: Record<string, string> = {}
    
    columns.forEach(column => {
      const value = (row as any)[column.key]?.raw || (row as any)[column.key]
      exportRow[column.title] = formatValueForExport(value, column.type, column.format)
    })
    
    return exportRow
  })
}

/**
 * تحضير رؤوس الأعمدة للتصدير
 */
export function getExportHeaders(reportType: string): string[] {
  const columns = reportColumns[reportType] || []
  return columns.map(column => column.title)
}

/**
 * تحضير HTML للطباعة
 */
export function generatePrintHTML(data: unknown[], reportType: string, title: string): string {
  const columns = reportColumns[reportType] || []
  const totals = calculateTotals(data, reportType)
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="/styles/print.css">
    </head>
    <body>
      <div class="print-container">
        <header class="print-header">
          <h1>${title}</h1>
          <div class="print-meta">
            <span>تاريخ التقرير: ${dayjs().format('YYYY-MM-DD')}</span>
            <span>عدد السجلات: ${data.length}</span>
          </div>
        </header>
        
        <table class="print-table">
          <thead>
            <tr>
              ${columns.map(col => `<th class="text-${col.align || 'left'}">${col.title}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => {
                  const value = (row as any)[col.key]?.formatted || (row as any)[col.key] || '-'
                  return `<td class="text-${col.align || 'left'}">${value}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
          ${Object.keys(totals).length > 0 ? `
            <tfoot>
              <tr class="totals-row">
                ${columns.map(col => {
                  if (totals[col.key]) {
                    return `<td class="text-${col.align || 'left'} font-bold">${formatValue(totals[col.key], col.type)}</td>`
                  }
                  return `<td class="text-${col.align || 'left'}"></td>`
                }).join('')}
              </tr>
            </tfoot>
          ` : ''}
        </table>
        
        <footer class="print-footer">
          <p>تم إنشاء التقرير في ${dayjs().format('YYYY-MM-DD HH:mm')}</p>
        </footer>
      </div>
    </body>
    </html>
  `
  
  return html
}