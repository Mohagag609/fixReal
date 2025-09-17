import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf'
  data: any[]
  title: string
  fileName?: string
  columns?: string[]
  filters?: any
}

export class ExportService {
  // تصدير إلى Excel
  static async exportToExcel(options: ExportOptions) {
    try {
      const workbook = XLSX.utils.book_new()
      
      // إضافة ورقة العمل الرئيسية
      const worksheet = XLSX.utils.json_to_sheet(options.data)
      XLSX.utils.book_append_sheet(workbook, worksheet, options.title)
      
      // إضافة ورقة ملخص
      const summaryData = this.generateSummaryData(options.data)
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص')
      
      // حفظ الملف
      const fileName = options.fileName || `${options.title}-${new Date().toISOString().split('T')[0]}.xlsx`
      const filePath = path.join(process.cwd(), 'temp', fileName)
      
      // إنشاء مجلد temp إذا لم يكن موجوداً
      const tempDir = path.dirname(filePath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      XLSX.writeFile(workbook, filePath)
      
      return {
        filePath,
        fileName,
        size: fs.statSync(filePath).size
      }
    } catch (error) {
      console.error('Excel export error:', error)
      throw new Error('فشل في تصدير ملف Excel')
    }
  }

  // تصدير إلى CSV
  static async exportToCSV(options: ExportOptions) {
    try {
      if (options.data.length === 0) {
        throw new Error('لا توجد بيانات للتصدير')
      }

      // تحويل البيانات إلى CSV
      const headers = Object.keys(options.data[0])
      const csvContent = [
        headers.join(','),
        ...options.data.map(row => 
          headers.map(header => {
            const value = row[header]
            // تنظيف القيم للـ CSV
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`
            }
            return value || ''
          }).join(',')
        )
      ].join('\n')

      const fileName = options.fileName || `${options.title}-${new Date().toISOString().split('T')[0]}.csv`
      const filePath = path.join(process.cwd(), 'temp', fileName)
      
      // إنشاء مجلد temp إذا لم يكن موجوداً
      const tempDir = path.dirname(filePath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      fs.writeFileSync(filePath, csvContent, 'utf8')
      
      return {
        filePath,
        fileName,
        size: fs.statSync(filePath).size
      }
    } catch (error) {
      console.error('CSV export error:', error)
      throw new Error('فشل في تصدير ملف CSV')
    }
  }

  // تصدير إلى PDF
  static async exportToPDF(options: ExportOptions) {
    try {
      // هذا يتطلب مكتبة PDF مثل puppeteer أو jsPDF
      // للتبسيط، سنقوم بإنشاء HTML يمكن تحويله إلى PDF
      const htmlContent = this.generateHTMLReport(options)
      
      const fileName = options.fileName || `${options.title}-${new Date().toISOString().split('T')[0]}.html`
      const filePath = path.join(process.cwd(), 'temp', fileName)
      
      // إنشاء مجلد temp إذا لم يكن موجوداً
      const tempDir = path.dirname(filePath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      fs.writeFileSync(filePath, htmlContent, 'utf8')
      
      return {
        filePath,
        fileName,
        size: fs.statSync(filePath).size
      }
    } catch (error) {
      console.error('PDF export error:', error)
      throw new Error('فشل في تصدير ملف PDF')
    }
  }

  // تصدير العملاء
  static async exportCustomers(filters?: any) {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          deletedAt: null,
          ...filters
        },
        include: {
          contracts: {
            select: {
              id: true,
              totalPrice: true,
              start: true
            }
          }
        }
      })

      const exportData = customers.map(customer => ({
        'الاسم': customer.name,
        'الهاتف': customer.phone || '',
        'الرقم القومي': customer.nationalId || '',
        'العنوان': customer.address || '',
        'الحالة': customer.status,
        'عدد العقود': customer.contracts.length,
        'إجمالي قيمة العقود': customer.contracts.reduce((sum, contract) => sum + contract.totalPrice, 0),
        'تاريخ الإنشاء': customer.createdAt.toLocaleDateString('ar-SA'),
        'آخر تحديث': customer.updatedAt.toLocaleDateString('ar-SA')
      }))

      return exportData
    } catch (error) {
      console.error('Export customers error:', error)
      throw new Error('فشل في تصدير بيانات العملاء')
    }
  }

  // تصدير الوحدات
  static async exportUnits(filters?: any) {
    try {
      const units = await prisma.unit.findMany({
        where: {
          deletedAt: null,
          ...filters
        },
        include: {
          contracts: {
            select: {
              id: true,
              totalPrice: true,
              start: true
            }
          }
        }
      })

      const exportData = units.map(unit => ({
        'الكود': unit.code,
        'الاسم': unit.name || '',
        'نوع الوحدة': unit.unitType,
        'المساحة': unit.area || '',
        'الطابق': unit.floor || '',
        'المبنى': unit.building || '',
        'السعر الإجمالي': unit.totalPrice,
        'الحالة': unit.status,
        'عدد العقود': unit.contracts.length,
        'إجمالي قيمة العقود': unit.contracts.reduce((sum, contract) => sum + contract.totalPrice, 0),
        'تاريخ الإنشاء': unit.createdAt.toLocaleDateString('ar-SA'),
        'آخر تحديث': unit.updatedAt.toLocaleDateString('ar-SA')
      }))

      return exportData
    } catch (error) {
      console.error('Export units error:', error)
      throw new Error('فشل في تصدير بيانات الوحدات')
    }
  }

  // تصدير العقود
  static async exportContracts(filters?: any) {
    try {
      const contracts = await prisma.contract.findMany({
        where: {
          deletedAt: null,
          ...filters
        },
        include: {
          customer: {
            select: {
              name: true,
              phone: true
            }
          },
          unit: {
            select: {
              code: true,
              name: true
            }
          }
        }
      })

      const exportData = contracts.map(contract => ({
        'رقم العقد': contract.id,
        'العميل': contract.customer.name,
        'هاتف العميل': contract.customer.phone || '',
        'كود الوحدة': contract.unit.code,
        'اسم الوحدة': contract.unit.name || '',
        'تاريخ البداية': contract.start.toLocaleDateString('ar-SA'),
        'السعر الإجمالي': contract.totalPrice,
        'مبلغ الخصم': contract.discountAmount,
        'اسم السمسار': contract.brokerName || '',
        'نسبة السمسار': contract.brokerPercent,
        'مبلغ السمسار': contract.brokerAmount,
        'نوع الأقساط': contract.installmentType,
        'عدد الأقساط': contract.installmentCount,
        'المقدم': contract.downPayment,
        'نوع الدفع': contract.paymentType,
        'تاريخ الإنشاء': contract.createdAt.toLocaleDateString('ar-SA')
      }))

      return exportData
    } catch (error) {
      console.error('Export contracts error:', error)
      throw new Error('فشل في تصدير بيانات العقود')
    }
  }

  // تصدير الأقساط
  static async exportInstallments(filters?: any) {
    try {
      const installments = await prisma.installment.findMany({
        where: {
          deletedAt: null,
          ...filters
        },
        include: {
          unit: {
            select: {
              code: true,
              name: true
            }
          }
        }
      })

      const exportData = installments.map(installment => ({
        'رقم القسط': installment.id,
        'كود الوحدة': installment.unit.code,
        'اسم الوحدة': installment.unit.name || '',
        'المبلغ': installment.amount,
        'تاريخ الاستحقاق': installment.dueDate.toLocaleDateString('ar-SA'),
        'الحالة': installment.status,
        'الملاحظات': installment.notes || '',
        'تاريخ الإنشاء': installment.createdAt.toLocaleDateString('ar-SA')
      }))

      return exportData
    } catch (error) {
      console.error('Export installments error:', error)
      throw new Error('فشل في تصدير بيانات الأقساط')
    }
  }

  // إنشاء بيانات الملخص
  private static generateSummaryData(data: any[]) {
    if (data.length === 0) return []

    const summary = [
      { 'المؤشر': 'إجمالي السجلات', 'القيمة': data.length },
      { 'المؤشر': 'تاريخ التصدير', 'القيمة': new Date().toLocaleString('ar-SA') }
    ]

    // إضافة ملخصات مالية إذا كانت البيانات تحتوي على مبالغ
    const amountFields = Object.keys(data[0]).filter(key => 
      key.includes('مبلغ') || key.includes('سعر') || key.includes('قيمة')
    )

    for (const field of amountFields) {
      const total = data.reduce((sum, row) => {
        const value = parseFloat(row[field]) || 0
        return sum + value
      }, 0)
      
      summary.push({
        'المؤشر': `إجمالي ${field}`,
        'القيمة': total.toLocaleString('ar-SA')
      })
    }

    return summary
  }

  // إنشاء تقرير HTML
  private static generateHTMLReport(options: ExportOptions) {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
            direction: rtl;
            text-align: right;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #333;
            margin: 0;
        }
        .header p {
            color: #666;
            margin: 5px 0 0 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${options.title}</h1>
        <p>تاريخ التصدير: ${new Date().toLocaleString('ar-SA')}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                ${Object.keys(options.data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${options.data.map(row => `
                <tr>
                    ${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="summary">
        <h3>ملخص التقرير</h3>
        <p>إجمالي السجلات: ${options.data.length}</p>
        <p>تاريخ التصدير: ${new Date().toLocaleString('ar-SA')}</p>
    </div>
    
    <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة نظام إدارة العقارات</p>
    </div>
</body>
</html>
    `
    
    return html
  }
}