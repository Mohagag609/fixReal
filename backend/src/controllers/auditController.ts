import { Request, Response } from 'express'
import { AuditService } from '../services/auditService'

export class AuditController {
  // الحصول على سجلات التدقيق
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      
      const filters = {
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        userId: req.query.userId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      }

      const result = await AuditService.getAuditLogs(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get audit logs error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل سجلات التدقيق'
      })
    }
  }

  // الحصول على سجل تدقيق محدد
  static async getAuditLogById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const auditLog = await AuditService.getAuditLogById(id)
      
      if (!auditLog) {
        return res.status(404).json({
          success: false,
          error: 'سجل التدقيق غير موجود'
        })
      }

      res.json({
        success: true,
        data: auditLog
      })
    } catch (error) {
      console.error('Get audit log error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل سجل التدقيق'
      })
    }
  }

  // حذف سجلات التدقيق القديمة
  static async deleteOldAuditLogs(req: Request, res: Response) {
    try {
      const daysToKeep = parseInt(req.body.daysToKeep as string) || 90
      const deletedCount = await AuditService.deleteOldAuditLogs(daysToKeep)
      
      res.json({
        success: true,
        message: `تم حذف ${deletedCount} سجل تدقيق قديم`,
        deletedCount
      })
    } catch (error) {
      console.error('Delete old audit logs error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف سجلات التدقيق القديمة'
      })
    }
  }

  // الحصول على إحصائيات سجل التدقيق
  static async getAuditStats(req: Request, res: Response) {
    try {
      const stats = await AuditService.getAuditStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get audit stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات سجل التدقيق'
      })
    }
  }
}