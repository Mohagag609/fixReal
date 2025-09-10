/**
 * مصدر تصدير CSV - CSV Export
 * يستخدم مكتبة papaparse لإنشاء ملفات CSV
 */

import Papa from 'papaparse'
import { prepareDataForExport, getExportHeaders } from '../transformers'

export interface CSVExportOptions {
  title: string
  data: any[]
  reportType: string
  fileName?: string
}

/**
 * تصدير البيانات إلى CSV
 */
export function exportToCSV(options: CSVExportOptions): string {
  const { data, reportType } = options
  
  // تحضير البيانات
  const exportData = prepareDataForExport(data, reportType)
  const headers = getExportHeaders(reportType)
  
  // إعدادات CSV
  const csvOptions: Papa.UnparseConfig = {
    header: true,
    delimiter: ',',
    quotes: true,
    quoteChar: '"',
    escapeChar: '"'
  }
  
  // تحويل البيانات
  const csv = Papa.unparse(exportData, csvOptions)
  
  // إضافة BOM للدعم الصحيح للعربية في Excel
  const BOM = '\uFEFF'
  return BOM + csv
}

/**
 * تصدير متعدد الملفات
 */
export function exportMultipleCSV(sheets: Array<{
  name: string
  data: any[]
  reportType: string
}>): Record<string, string> {
  const results: Record<string, string> = {}
  
  sheets.forEach(sheet => {
    results[sheet.name] = exportToCSV({
      title: sheet.name,
      data: sheet.data,
      reportType: sheet.reportType
    })
  })
  
  return results
}

/**
 * تحويل CSV إلى Buffer
 */
export function csvToBuffer(csv: string): Buffer {
  return Buffer.from(csv, 'utf-8')
}

/**
 * إنشاء ملف ZIP يحتوي على عدة ملفات CSV
 */
export async function createCSVZip(sheets: Array<{
  name: string
  data: any[]
  reportType: string
}>): Promise<Buffer> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  sheets.forEach(sheet => {
    const csv = exportToCSV({
      title: sheet.name,
      data: sheet.data,
      reportType: sheet.reportType
    })
    
    const fileName = `${sheet.name.replace(/\s+/g, '_')}.csv`
    zip.file(fileName, csv)
  })
  
  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  return buffer
}