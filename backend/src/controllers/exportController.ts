import { Request, Response } from 'express'
import { ExportService } from '../services/exportService'
import * as fs from 'fs'

export class ExportController {
  // تصدير العملاء
  static async exportCustomers(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'excel'
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {}
      
      const data = await ExportService.exportCustomers(filters)
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'لا توجد بيانات للتصدير'
        })
      }

      let result
      switch (format) {
        case 'excel':
          result = await ExportService.exportToExcel({
            format: 'excel',
            data,
            title: 'العملاء',
            fileName: `customers-${new Date().toISOString().split('T')[0]}.xlsx`
          })
          break
        case 'csv':
          result = await ExportService.exportToCSV({
            format: 'csv',
            data,
            title: 'العملاء',
            fileName: `customers-${new Date().toISOString().split('T')[0]}.csv`
          })
          break
        case 'pdf':
          result = await ExportService.exportToPDF({
            format: 'pdf',
            data,
            title: 'العملاء',
            fileName: `customers-${new Date().toISOString().split('T')[0]}.html`
          })
          break
        default:
          return res.status(400).json({
            success: false,
            error: 'صيغة التصدير غير مدعومة'
          })
      }

      // إرسال الملف
      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        // حذف الملف المؤقت بعد التحميل
        fs.unlink(result.filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr)
          }
        })
      })
    } catch (error) {
      console.error('Export customers error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تصدير بيانات العملاء'
      })
    }
  }

  // تصدير الوحدات
  static async exportUnits(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'excel'
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {}
      
      const data = await ExportService.exportUnits(filters)
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'لا توجد بيانات للتصدير'
        })
      }

      let result
      switch (format) {
        case 'excel':
          result = await ExportService.exportToExcel({
            format: 'excel',
            data,
            title: 'الوحدات',
            fileName: `units-${new Date().toISOString().split('T')[0]}.xlsx`
          })
          break
        case 'csv':
          result = await ExportService.exportToCSV({
            format: 'csv',
            data,
            title: 'الوحدات',
            fileName: `units-${new Date().toISOString().split('T')[0]}.csv`
          })
          break
        case 'pdf':
          result = await ExportService.exportToPDF({
            format: 'pdf',
            data,
            title: 'الوحدات',
            fileName: `units-${new Date().toISOString().split('T')[0]}.html`
          })
          break
        default:
          return res.status(400).json({
            success: false,
            error: 'صيغة التصدير غير مدعومة'
          })
      }

      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        fs.unlink(result.filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr)
          }
        })
      })
    } catch (error) {
      console.error('Export units error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تصدير بيانات الوحدات'
      })
    }
  }

  // تصدير العقود
  static async exportContracts(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'excel'
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {}
      
      const data = await ExportService.exportContracts(filters)
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'لا توجد بيانات للتصدير'
        })
      }

      let result
      switch (format) {
        case 'excel':
          result = await ExportService.exportToExcel({
            format: 'excel',
            data,
            title: 'العقود',
            fileName: `contracts-${new Date().toISOString().split('T')[0]}.xlsx`
          })
          break
        case 'csv':
          result = await ExportService.exportToCSV({
            format: 'csv',
            data,
            title: 'العقود',
            fileName: `contracts-${new Date().toISOString().split('T')[0]}.csv`
          })
          break
        case 'pdf':
          result = await ExportService.exportToPDF({
            format: 'pdf',
            data,
            title: 'العقود',
            fileName: `contracts-${new Date().toISOString().split('T')[0]}.html`
          })
          break
        default:
          return res.status(400).json({
            success: false,
            error: 'صيغة التصدير غير مدعومة'
          })
      }

      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        fs.unlink(result.filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr)
          }
        })
      })
    } catch (error) {
      console.error('Export contracts error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تصدير بيانات العقود'
      })
    }
  }

  // تصدير الأقساط
  static async exportInstallments(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'excel'
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {}
      
      const data = await ExportService.exportInstallments(filters)
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'لا توجد بيانات للتصدير'
        })
      }

      let result
      switch (format) {
        case 'excel':
          result = await ExportService.exportToExcel({
            format: 'excel',
            data,
            title: 'الأقساط',
            fileName: `installments-${new Date().toISOString().split('T')[0]}.xlsx`
          })
          break
        case 'csv':
          result = await ExportService.exportToCSV({
            format: 'csv',
            data,
            title: 'الأقساط',
            fileName: `installments-${new Date().toISOString().split('T')[0]}.csv`
          })
          break
        case 'pdf':
          result = await ExportService.exportToPDF({
            format: 'pdf',
            data,
            title: 'الأقساط',
            fileName: `installments-${new Date().toISOString().split('T')[0]}.html`
          })
          break
        default:
          return res.status(400).json({
            success: false,
            error: 'صيغة التصدير غير مدعومة'
          })
      }

      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        fs.unlink(result.filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr)
          }
        })
      })
    } catch (error) {
      console.error('Export installments error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تصدير بيانات الأقساط'
      })
    }
  }

  // تصدير شامل لجميع البيانات
  static async exportAll(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'excel'
      
      const [customers, units, contracts, installments] = await Promise.all([
        ExportService.exportCustomers(),
        ExportService.exportUnits(),
        ExportService.exportContracts(),
        ExportService.exportInstallments()
      ])

      const allData = {
        customers,
        units,
        contracts,
        installments
      }

      let result
      switch (format) {
        case 'excel':
          result = await ExportService.exportToExcel({
            format: 'excel',
            data: allData,
            title: 'تقرير شامل',
            fileName: `full-report-${new Date().toISOString().split('T')[0]}.xlsx`
          })
          break
        case 'csv':
          result = await ExportService.exportToCSV({
            format: 'csv',
            data: allData,
            title: 'تقرير شامل',
            fileName: `full-report-${new Date().toISOString().split('T')[0]}.csv`
          })
          break
        case 'pdf':
          result = await ExportService.exportToPDF({
            format: 'pdf',
            data: allData,
            title: 'تقرير شامل',
            fileName: `full-report-${new Date().toISOString().split('T')[0]}.html`
          })
          break
        default:
          return res.status(400).json({
            success: false,
            error: 'صيغة التصدير غير مدعومة'
          })
      }

      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Download error:', err)
        }
        fs.unlink(result.filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr)
          }
        })
      })
    } catch (error) {
      console.error('Export all error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تصدير البيانات الشاملة'
      })
    }
  }
}