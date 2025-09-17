import { PrismaClient } from '@prisma/client'
import * as ExcelJS from 'exceljs'
import * as PDFDocument from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

export interface ReportField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency'
  source: string
  table: string
  column: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  format?: string
  displayName?: string
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null'
  value: any
  value2?: any
  logicalOperator?: 'AND' | 'OR'
}

export interface ReportSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface ReportGroup {
  field: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  category: string
  fields: ReportField[]
  filters: ReportFilter[]
  sorts: ReportSort[]
  groups: ReportGroup[]
  format: 'table' | 'chart' | 'summary'
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area'
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export class ReportBuilderService {
  // إنشاء قالب تقرير جديد
  static async createTemplate(templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const template = await prisma.reportTemplate.create({
        data: {
          ...templateData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return template
    } catch (error) {
      console.error('Error creating report template:', error)
      throw new Error('فشل في إنشاء قالب التقرير')
    }
  }

  // تحديث قالب تقرير
  static async updateTemplate(id: string, templateData: Partial<ReportTemplate>) {
    try {
      const template = await prisma.reportTemplate.update({
        where: { id },
        data: {
          ...templateData,
          updatedAt: new Date()
        }
      })

      return template
    } catch (error) {
      console.error('Error updating report template:', error)
      throw new Error('فشل في تحديث قالب التقرير')
    }
  }

  // حذف قالب تقرير
  static async deleteTemplate(id: string) {
    try {
      await prisma.reportTemplate.delete({
        where: { id }
      })

      return true
    } catch (error) {
      console.error('Error deleting report template:', error)
      throw new Error('فشل في حذف قالب التقرير')
    }
  }

  // الحصول على قائمة قوالب التقارير
  static async getTemplates(category?: string, isPublic?: boolean) {
    try {
      const where: any = {}
      
      if (category) {
        where.category = category
      }
      
      if (isPublic !== undefined) {
        where.isPublic = isPublic
      }

      const templates = await prisma.reportTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      return templates
    } catch (error) {
      console.error('Error getting report templates:', error)
      throw new Error('فشل في الحصول على قوالب التقارير')
    }
  }

  // الحصول على قالب تقرير
  static async getTemplate(id: string) {
    try {
      const template = await prisma.reportTemplate.findUnique({
        where: { id }
      })

      if (!template) {
        throw new Error('قالب التقرير غير موجود')
      }

      return template
    } catch (error) {
      console.error('Error getting report template:', error)
      throw new Error('فشل في الحصول على قالب التقرير')
    }
  }

  // تشغيل تقرير
  static async runReport(templateId: string, customFilters?: ReportFilter[]) {
    try {
      const template = await this.getTemplate(templateId)
      
      // دمج الفلاتر المخصصة مع فلاتر القالب
      const allFilters = [...template.filters, ...(customFilters || [])]
      
      // بناء استعلام البيانات
      const data = await this.buildQuery(template, allFilters)
      
      // تطبيق التجميع إذا كان مطلوباً
      const aggregatedData = this.applyAggregation(data, template.groups)
      
      // تطبيق الترتيب
      const sortedData = this.applySorting(aggregatedData, template.sorts)
      
      return {
        template,
        data: sortedData,
        totalRecords: data.length,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error running report:', error)
      throw new Error('فشل في تشغيل التقرير')
    }
  }

  // بناء استعلام البيانات
  private static async buildQuery(template: ReportTemplate, filters: ReportFilter[]) {
    try {
      // تحديد الجداول المطلوبة
      const tables = new Set(template.fields.map(field => field.table))
      
      // بناء الاستعلام الأساسي
      let query = this.buildBaseQuery(template.fields, Array.from(tables))
      
      // تطبيق الفلاتر
      if (filters.length > 0) {
        const whereClause = this.buildWhereClause(filters)
        query += ` WHERE ${whereClause}`
      }
      
      // تنفيذ الاستعلام
      const result = await prisma.$queryRawUnsafe(query)
      
      return result
    } catch (error) {
      console.error('Error building query:', error)
      throw new Error('فشل في بناء استعلام البيانات')
    }
  }

  // بناء الاستعلام الأساسي
  private static buildBaseQuery(fields: ReportField[], tables: string[]) {
    const selectFields = fields.map(field => {
      const tableAlias = field.table.toLowerCase()
      return `${tableAlias}.${field.column} as ${field.id}`
    }).join(', ')

    const fromClause = tables.map(table => {
      const tableName = table.toLowerCase()
      const tableAlias = tableName
      return `${tableName} ${tableAlias}`
    }).join(' JOIN ')

    return `SELECT ${selectFields} FROM ${fromClause}`
  }

  // بناء شرط WHERE
  private static buildWhereClause(filters: ReportFilter[]) {
    const conditions = filters.map(filter => {
      const tableAlias = filter.field.split('.')[0].toLowerCase()
      const column = filter.field.split('.')[1]
      
      switch (filter.operator) {
        case 'equals':
          return `${tableAlias}.${column} = '${filter.value}'`
        case 'not_equals':
          return `${tableAlias}.${column} != '${filter.value}'`
        case 'contains':
          return `${tableAlias}.${column} LIKE '%${filter.value}%'`
        case 'not_contains':
          return `${tableAlias}.${column} NOT LIKE '%${filter.value}%'`
        case 'starts_with':
          return `${tableAlias}.${column} LIKE '${filter.value}%'`
        case 'ends_with':
          return `${tableAlias}.${column} LIKE '%${filter.value}'`
        case 'greater_than':
          return `${tableAlias}.${column} > ${filter.value}`
        case 'less_than':
          return `${tableAlias}.${column} < ${filter.value}`
        case 'between':
          return `${tableAlias}.${column} BETWEEN ${filter.value} AND ${filter.value2}`
        case 'in':
          const values = Array.isArray(filter.value) ? filter.value : [filter.value]
          return `${tableAlias}.${column} IN (${values.map(v => `'${v}'`).join(', ')})`
        case 'not_in':
          const notValues = Array.isArray(filter.value) ? filter.value : [filter.value]
          return `${tableAlias}.${column} NOT IN (${notValues.map(v => `'${v}'`).join(', ')})`
        case 'is_null':
          return `${tableAlias}.${column} IS NULL`
        case 'is_not_null':
          return `${tableAlias}.${column} IS NOT NULL`
        default:
          return '1=1'
      }
    })

    return conditions.join(' AND ')
  }

  // تطبيق التجميع
  private static applyAggregation(data: any[], groups: ReportGroup[]) {
    if (groups.length === 0) {
      return data
    }

    const groupedData = new Map()
    
    data.forEach(row => {
      const groupKey = groups.map(group => row[group.field]).join('|')
      
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, {})
      }
      
      const group = groupedData.get(groupKey)
      
      // تطبيق التجميع
      groups.forEach(groupField => {
        if (groupField.aggregation) {
          const value = parseFloat(row[groupField.field]) || 0
          
          if (!group[groupField.field]) {
            group[groupField.field] = {
              sum: 0,
              count: 0,
              min: value,
              max: value
            }
          }
          
          switch (groupField.aggregation) {
            case 'sum':
              group[groupField.field].sum += value
              break
            case 'avg':
              group[groupField.field].sum += value
              group[groupField.field].count += 1
              break
            case 'count':
              group[groupField.field].count += 1
              break
            case 'min':
              group[groupField.field].min = Math.min(group[groupField.field].min, value)
              break
            case 'max':
              group[groupField.field].max = Math.max(group[groupField.field].max, value)
              break
          }
        } else {
          group[groupField.field] = row[groupField.field]
        }
      })
    })

    // تحويل النتائج المجمعة
    const result = Array.from(groupedData.values()).map(group => {
      const processedGroup = { ...group }
      
      groups.forEach(groupField => {
        if (groupField.aggregation && group[groupField.field]) {
          const agg = group[groupField.field]
          
          switch (groupField.aggregation) {
            case 'avg':
              processedGroup[groupField.field] = agg.count > 0 ? agg.sum / agg.count : 0
              break
            case 'sum':
              processedGroup[groupField.field] = agg.sum
              break
            case 'count':
              processedGroup[groupField.field] = agg.count
              break
            case 'min':
              processedGroup[groupField.field] = agg.min
              break
            case 'max':
              processedGroup[groupField.field] = agg.max
              break
          }
        }
      })
      
      return processedGroup
    })

    return result
  }

  // تطبيق الترتيب
  private static applySorting(data: any[], sorts: ReportSort[]) {
    if (sorts.length === 0) {
      return data
    }

    return data.sort((a, b) => {
      for (const sort of sorts) {
        const aValue = a[sort.field]
        const bValue = b[sort.field]
        
        let comparison = 0
        
        if (aValue < bValue) {
          comparison = -1
        } else if (aValue > bValue) {
          comparison = 1
        }
        
        if (sort.direction === 'desc') {
          comparison = -comparison
        }
        
        if (comparison !== 0) {
          return comparison
        }
      }
      
      return 0
    })
  }

  // تصدير التقرير إلى Excel
  static async exportToExcel(templateId: string, customFilters?: ReportFilter[]) {
    try {
      const report = await this.runReport(templateId, customFilters)
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Report')
      
      // إضافة العنوان
      worksheet.addRow([report.template.name])
      worksheet.addRow([`Generated at: ${report.generatedAt}`])
      worksheet.addRow([])
      
      // إضافة رؤوس الأعمدة
      const headers = report.template.fields.map(field => field.displayName || field.name)
      worksheet.addRow(headers)
      
      // إضافة البيانات
      report.data.forEach(row => {
        const rowData = report.template.fields.map(field => {
          const value = row[field.id]
          return this.formatValue(value, field.type, field.format)
        })
        worksheet.addRow(rowData)
      })
      
      // تنسيق الجدول
      worksheet.getRow(4).font = { bold: true }
      worksheet.getRow(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      // حفظ الملف
      const fileName = `report_${templateId}_${Date.now()}.xlsx`
      const filePath = path.join(process.cwd(), 'uploads', 'reports', fileName)
      
      // إنشاء مجلد التقارير إذا لم يكن موجوداً
      const reportsDir = path.dirname(filePath)
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }
      
      await workbook.xlsx.writeFile(filePath)
      
      return {
        fileName,
        filePath,
        size: fs.statSync(filePath).size
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      throw new Error('فشل في تصدير التقرير إلى Excel')
    }
  }

  // تصدير التقرير إلى PDF
  static async exportToPDF(templateId: string, customFilters?: ReportFilter[]) {
    try {
      const report = await this.runReport(templateId, customFilters)
      
      const doc = new PDFDocument()
      const fileName = `report_${templateId}_${Date.now()}.pdf`
      const filePath = path.join(process.cwd(), 'uploads', 'reports', fileName)
      
      // إنشاء مجلد التقارير إذا لم يكن موجوداً
      const reportsDir = path.dirname(filePath)
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }
      
      doc.pipe(fs.createWriteStream(filePath))
      
      // إضافة العنوان
      doc.fontSize(20).text(report.template.name, 50, 50)
      doc.fontSize(12).text(`Generated at: ${report.generatedAt}`, 50, 80)
      
      // إضافة البيانات
      let yPosition = 120
      const pageHeight = 800
      const rowHeight = 20
      
      // رؤوس الأعمدة
      const headers = report.template.fields.map(field => field.displayName || field.name)
      const colWidth = 500 / headers.length
      
      headers.forEach((header, index) => {
        doc.rect(50 + index * colWidth, yPosition, colWidth, rowHeight).stroke()
        doc.text(header, 55 + index * colWidth, yPosition + 5)
      })
      
      yPosition += rowHeight
      
      // البيانات
      report.data.forEach((row, rowIndex) => {
        if (yPosition > pageHeight - 100) {
          doc.addPage()
          yPosition = 50
        }
        
        report.template.fields.forEach((field, colIndex) => {
          const value = row[field.id]
          const formattedValue = this.formatValue(value, field.type, field.format)
          
          doc.rect(50 + colIndex * colWidth, yPosition, colWidth, rowHeight).stroke()
          doc.text(formattedValue.toString(), 55 + colIndex * colWidth, yPosition + 5)
        })
        
        yPosition += rowHeight
      })
      
      doc.end()
      
      return {
        fileName,
        filePath,
        size: fs.statSync(filePath).size
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      throw new Error('فشل في تصدير التقرير إلى PDF')
    }
  }

  // تنسيق القيم
  private static formatValue(value: any, type: string, format?: string) {
    if (value === null || value === undefined) {
      return ''
    }
    
    switch (type) {
      case 'number':
        return format ? value.toLocaleString(format) : value.toString()
      case 'currency':
        return format ? value.toLocaleString(format) : value.toLocaleString()
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value
      case 'boolean':
        return value ? 'نعم' : 'لا'
      default:
        return value.toString()
    }
  }

  // الحصول على قائمة الحقول المتاحة
  static async getAvailableFields() {
    try {
      const fields = [
        // حقول العملاء
        { id: 'customer_id', name: 'معرف العميل', type: 'string', source: 'customers', table: 'Customer', column: 'id' },
        { id: 'customer_name', name: 'اسم العميل', type: 'string', source: 'customers', table: 'Customer', column: 'name' },
        { id: 'customer_phone', name: 'هاتف العميل', type: 'string', source: 'customers', table: 'Customer', column: 'phone' },
        { id: 'customer_email', name: 'بريد العميل', type: 'string', source: 'customers', table: 'Customer', column: 'email' },
        
        // حقول الوحدات
        { id: 'unit_id', name: 'معرف الوحدة', type: 'string', source: 'units', table: 'Unit', column: 'id' },
        { id: 'unit_name', name: 'اسم الوحدة', type: 'string', source: 'units', table: 'Unit', column: 'name' },
        { id: 'unit_price', name: 'سعر الوحدة', type: 'currency', source: 'units', table: 'Unit', column: 'price' },
        
        // حقول العقود
        { id: 'contract_id', name: 'معرف العقد', type: 'string', source: 'contracts', table: 'Contract', column: 'id' },
        { id: 'contract_date', name: 'تاريخ العقد', type: 'date', source: 'contracts', table: 'Contract', column: 'contractDate' },
        { id: 'contract_amount', name: 'مبلغ العقد', type: 'currency', source: 'contracts', table: 'Contract', column: 'amount' },
        
        // حقول المعاملات
        { id: 'transaction_id', name: 'معرف المعاملة', type: 'string', source: 'transactions', table: 'Transaction', column: 'id' },
        { id: 'transaction_date', name: 'تاريخ المعاملة', type: 'date', source: 'transactions', table: 'Transaction', column: 'date' },
        { id: 'transaction_amount', name: 'مبلغ المعاملة', type: 'currency', source: 'transactions', table: 'Transaction', column: 'amount' },
        { id: 'transaction_type', name: 'نوع المعاملة', type: 'string', source: 'transactions', table: 'Transaction', column: 'type' }
      ]
      
      return fields
    } catch (error) {
      console.error('Error getting available fields:', error)
      throw new Error('فشل في الحصول على الحقول المتاحة')
    }
  }

  // الحصول على قائمة الفئات
  static async getCategories() {
    try {
      const categories = [
        'العملاء',
        'الوحدات',
        'العقود',
        'المعاملات',
        'التقارير المالية',
        'التقارير الإدارية',
        'التقارير الإحصائية'
      ]
      
      return categories
    } catch (error) {
      console.error('Error getting categories:', error)
      throw new Error('فشل في الحصول على الفئات')
    }
  }
}