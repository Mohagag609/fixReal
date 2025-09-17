import { Request, Response } from 'express'
import { ReportBuilderService } from '../services/reportBuilderService'
import { auditMiddleware } from '../middleware/auditMiddleware'

export class ReportBuilderController {
  // إنشاء قالب تقرير جديد
  static async createTemplate(req: Request, res: Response) {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.user?.id || 'system'
      }

      const template = await ReportBuilderService.createTemplate(templateData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CREATE_REPORT_TEMPLATE', {
        templateId: template.id,
        templateName: template.name
      })

      res.status(201).json({
        success: true,
        message: 'تم إنشاء قالب التقرير بنجاح',
        data: template
      })
    } catch (error) {
      console.error('Error creating report template:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء قالب التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحديث قالب تقرير
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params
      const templateData = req.body

      const template = await ReportBuilderService.updateTemplate(id, templateData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'UPDATE_REPORT_TEMPLATE', {
        templateId: id,
        templateName: template.name
      })

      res.json({
        success: true,
        message: 'تم تحديث قالب التقرير بنجاح',
        data: template
      })
    } catch (error) {
      console.error('Error updating report template:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحديث قالب التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // حذف قالب تقرير
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params

      await ReportBuilderService.deleteTemplate(id)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'DELETE_REPORT_TEMPLATE', {
        templateId: id
      })

      res.json({
        success: true,
        message: 'تم حذف قالب التقرير بنجاح'
      })
    } catch (error) {
      console.error('Error deleting report template:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في حذف قالب التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على قائمة قوالب التقارير
  static async getTemplates(req: Request, res: Response) {
    try {
      const { category, isPublic } = req.query

      const templates = await ReportBuilderService.getTemplates(
        category as string,
        isPublic === 'true' ? true : isPublic === 'false' ? false : undefined
      )

      res.json({
        success: true,
        data: templates
      })
    } catch (error) {
      console.error('Error getting report templates:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على قوالب التقارير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على قالب تقرير
  static async getTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params

      const template = await ReportBuilderService.getTemplate(id)

      res.json({
        success: true,
        data: template
      })
    } catch (error) {
      console.error('Error getting report template:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على قالب التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تشغيل تقرير
  static async runReport(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { customFilters } = req.body

      const report = await ReportBuilderService.runReport(id, customFilters)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'RUN_REPORT', {
        templateId: id,
        recordCount: report.totalRecords
      })

      res.json({
        success: true,
        data: report
      })
    } catch (error) {
      console.error('Error running report:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تشغيل التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تصدير التقرير إلى Excel
  static async exportToExcel(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { customFilters } = req.body

      const result = await ReportBuilderService.exportToExcel(id, customFilters)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'EXPORT_REPORT_EXCEL', {
        templateId: id,
        fileName: result.fileName
      })

      res.json({
        success: true,
        message: 'تم تصدير التقرير إلى Excel بنجاح',
        data: result
      })
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تصدير التقرير إلى Excel',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تصدير التقرير إلى PDF
  static async exportToPDF(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { customFilters } = req.body

      const result = await ReportBuilderService.exportToPDF(id, customFilters)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'EXPORT_REPORT_PDF', {
        templateId: id,
        fileName: result.fileName
      })

      res.json({
        success: true,
        message: 'تم تصدير التقرير إلى PDF بنجاح',
        data: result
      })
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تصدير التقرير إلى PDF',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحميل ملف التقرير
  static async downloadReport(req: Request, res: Response) {
    try {
      const { fileName } = req.params
      const filePath = `uploads/reports/${fileName}`

      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error downloading report:', err)
          res.status(500).json({
            success: false,
            message: 'فشل في تحميل ملف التقرير'
          })
        }
      })
    } catch (error) {
      console.error('Error downloading report:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحميل ملف التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على الحقول المتاحة
  static async getAvailableFields(req: Request, res: Response) {
    try {
      const fields = await ReportBuilderService.getAvailableFields()

      res.json({
        success: true,
        data: fields
      })
    } catch (error) {
      console.error('Error getting available fields:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على الحقول المتاحة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على الفئات
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await ReportBuilderService.getCategories()

      res.json({
        success: true,
        data: categories
      })
    } catch (error) {
      console.error('Error getting categories:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على الفئات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // نسخ قالب تقرير
  static async duplicateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, description } = req.body

      const originalTemplate = await ReportBuilderService.getTemplate(id)
      
      const newTemplate = await ReportBuilderService.createTemplate({
        ...originalTemplate,
        id: undefined,
        name: name || `${originalTemplate.name} - نسخة`,
        description: description || originalTemplate.description,
        createdBy: req.user?.id || 'system',
        isPublic: false
      })

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'DUPLICATE_REPORT_TEMPLATE', {
        originalTemplateId: id,
        newTemplateId: newTemplate.id
      })

      res.status(201).json({
        success: true,
        message: 'تم نسخ قالب التقرير بنجاح',
        data: newTemplate
      })
    } catch (error) {
      console.error('Error duplicating report template:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في نسخ قالب التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // مشاركة قالب تقرير
  static async shareTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { isPublic } = req.body

      const template = await ReportBuilderService.updateTemplate(id, { isPublic })

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SHARE_REPORT_TEMPLATE', {
        templateId: id,
        isPublic
      })

      res.json({
        success: true,
        message: isPublic ? 'تم مشاركة قالب التقرير بنجاح' : 'تم إلغاء مشاركة قالب التقرير بنجاح',
        data: template
      })
    } catch (error) {
      console.error('Error sharing report template:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في مشاركة قالب التقرير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على إحصائيات قوالب التقارير
  static async getTemplateStats(req: Request, res: Response) {
    try {
      const templates = await ReportBuilderService.getTemplates()
      
      const stats = {
        totalTemplates: templates.length,
        publicTemplates: templates.filter(t => t.isPublic).length,
        privateTemplates: templates.filter(t => !t.isPublic).length,
        categories: [...new Set(templates.map(t => t.category))],
        recentTemplates: templates
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting template stats:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على إحصائيات قوالب التقارير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }
}