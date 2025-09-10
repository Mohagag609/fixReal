/**
 * مصدر تصدير Excel - Excel Export
 * يستخدم مكتبة exceljs لإنشاء ملفات Excel
 */

import ExcelJS from 'exceljs'
import { prepareDataForExport, getExportHeaders, calculateTotals } from '../transformers'

export interface ExcelExportOptions {
  title: string
  data: any[]
  reportType: string
  fileName?: string
}

/**
 * تصدير البيانات إلى Excel
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<Buffer> {
  const { title, data, reportType, fileName } = options
  
  // إنشاء مصنف جديد
  const workbook = new ExcelJS.Workbook()
  
  // إعدادات المصنف
  workbook.creator = 'نظام إدارة العقارات'
  workbook.lastModifiedBy = 'نظام إدارة العقارات'
  workbook.created = new Date()
  workbook.modified = new Date()
  
  // إنشاء ورقة العمل
  const worksheet = workbook.addWorksheet(title, {
    properties: {
      defaultRowHeight: 20
    }
  })
  
  // تحضير البيانات
  const exportData = prepareDataForExport(data, reportType)
  const headers = getExportHeaders(reportType)
  const totals = calculateTotals(data, reportType)
  
  // إعداد الأعمدة
  const columns = headers.map((header, index) => ({
    header,
    key: `col${index}`,
    width: 15
  }))
  
  worksheet.columns = columns
  
  // إضافة البيانات
  exportData.forEach((row, index) => {
    const rowData: any = {}
    headers.forEach((header, colIndex) => {
      rowData[`col${colIndex}`] = row[header]
    })
    worksheet.addRow(rowData)
  })
  
  // تنسيق الرأس
  const headerRow = worksheet.getRow(1)
  headerRow.height = 25
  headerRow.font = {
    bold: true,
    size: 12,
    color: { argb: 'FFFFFFFF' }
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E5BBA' }
  }
  headerRow.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  }
  
  // تنسيق البيانات
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20
      row.alignment = {
        vertical: 'middle'
      }
      
      // تنسيق الأرقام
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (header.includes('المبلغ') || header.includes('المبلغ')) {
          cell.numFmt = '#,##0.00'
          cell.alignment = { horizontal: 'right' }
        } else if (header.includes('تاريخ')) {
          cell.alignment = { horizontal: 'center' }
        }
      })
    }
  })
  
  // إضافة الإجماليات
  if (Object.keys(totals).length > 0) {
    const totalRow = worksheet.addRow({})
    totalRow.height = 25
    totalRow.font = { bold: true }
    
    headers.forEach((header, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1)
      if (totals[`col${colIndex}`]) {
        cell.value = totals[`col${colIndex}`]
        cell.numFmt = '#,##0.00'
        cell.alignment = { horizontal: 'right' }
      } else if (colIndex === 0) {
        cell.value = 'الإجمالي'
        cell.font = { bold: true }
        cell.alignment = { horizontal: 'right' }
      }
    })
  }
  
  // إضافة الحدود
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })
  
  // إضافة التصفية
  worksheet.autoFilter = {
    from: 'A1',
    to: `${String.fromCharCode(65 + headers.length - 1)}${exportData.length + 1}`
  }
  
  // تجميد الصف الأول
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 1
    }
  ]
  
  // إنشاء Buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * تصدير متعدد الأوراق
 */
export async function exportMultipleSheets(sheets: Array<{
  name: string
  data: any[]
  reportType: string
}>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'نظام إدارة العقارات'
  workbook.lastModifiedBy = 'نظام إدارة العقارات'
  workbook.created = new Date()
  workbook.modified = new Date()
  
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name)
    
    const exportData = prepareDataForExport(sheet.data, sheet.reportType)
    const headers = getExportHeaders(sheet.reportType)
    
    // إعداد الأعمدة
    const columns = headers.map((header, index) => ({
      header,
      key: `col${index}`,
      width: 15
    }))
    
    worksheet.columns = columns
    
    // إضافة البيانات
    exportData.forEach((row) => {
      const rowData: any = {}
      headers.forEach((header, colIndex) => {
        rowData[`col${colIndex}`] = row[header]
      })
      worksheet.addRow(rowData)
    })
    
    // تنسيق الرأس
    const headerRow = worksheet.getRow(1)
    headerRow.height = 25
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E5BBA' }
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  }
  
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}