import * as XLSX from 'xlsx'

export interface ExportData {
  [key: string]: unknown
}

export function exportToExcel(data: ExportData[], filename: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToCSV(data: ExportData[], filename: string) {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportDashboardData(kpis: { totalSales: number; totalReceipts: number; totalDebt: number; totalExpenses: number; netProfit: number; collectionPercentage: number; unitCounts: { total: number; available: number; sold: number; reserved: number } }, installments: unknown[], transactions: unknown[]) {
  const wb = XLSX.utils.book_new()
  
  // KPIs Sheet
  const kpiData = [
    ['المؤشر', 'القيمة'],
    ['إجمالي المبيعات', kpis.totalSales],
    ['إجمالي المتحصلات', kpis.totalReceipts],
    ['إجمالي المديونية', kpis.totalDebt],
    ['إجمالي المصروفات', kpis.totalExpenses],
    ['صافي الربح', kpis.netProfit],
    ['نسبة التحصيل', `${kpis.collectionPercentage.toFixed(2)}%`],
    ['إجمالي الوحدات', kpis.unitCounts.total],
    ['الوحدات المتاحة', kpis.unitCounts.available],
    ['الوحدات المباعة', kpis.unitCounts.sold],
    ['الوحدات المحجوزة', kpis.unitCounts.reserved],
    ['عدد المستثمرين', kpis.investorCount]
  ]
  const wsKpis = XLSX.utils.aoa_to_sheet(kpiData)
  XLSX.utils.book_append_sheet(wb, wsKpis, "المؤشرات الرئيسية")
  
  // Installments Sheet
  if (installments.length > 0) {
    const wsInstallments = XLSX.utils.json_to_sheet(installments)
    XLSX.utils.book_append_sheet(wb, wsInstallments, "الأقساط")
  }
  
  // Transactions Sheet
  if (transactions.length > 0) {
    const wsTransactions = XLSX.utils.json_to_sheet(transactions)
    XLSX.utils.book_append_sheet(wb, wsTransactions, "الحركات المالية")
  }
  
  const today = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `dashboard_export_${today}.xlsx`)
}

export function importFromExcel(file: File): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'))
    reader.readAsArrayBuffer(file)
  })
}