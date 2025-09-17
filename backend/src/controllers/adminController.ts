import { Request, Response } from 'express'
import { AdminService } from '../services/adminService'
import { auditMiddleware } from '../middleware/auditMiddleware'

export class AdminController {
  // الحصول على إحصائيات النظام
  static async getSystemStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getSystemStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting system stats:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على إحصائيات النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على صحة النظام
  static async getSystemHealth(req: Request, res: Response) {
    try {
      const health = await AdminService.getSystemHealth()

      res.json({
        success: true,
        data: health
      })
    } catch (error) {
      console.error('Error getting system health:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في فحص صحة النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على سجلات النظام
  static async getSystemLogs(req: Request, res: Response) {
    try {
      const { limit = 100, level } = req.query

      const logs = await AdminService.getSystemLogs(
        parseInt(limit as string),
        level as string
      )

      res.json({
        success: true,
        data: logs
      })
    } catch (error) {
      console.error('Error getting system logs:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على سجلات النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تنظيف النظام
  static async cleanupSystem(req: Request, res: Response) {
    try {
      const result = await AdminService.cleanupSystem()

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SYSTEM_CLEANUP', {
        results: result.results
      })

      res.json({
        success: true,
        message: 'تم تنظيف النظام بنجاح',
        data: result
      })
    } catch (error) {
      console.error('Error cleaning up system:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تنظيف النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // إعادة تشغيل النظام
  static async restartSystem(req: Request, res: Response) {
    try {
      const result = await AdminService.restartSystem()

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SYSTEM_RESTART')

      res.json({
        success: true,
        message: result.message,
        data: result
      })
    } catch (error) {
      console.error('Error restarting system:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إعادة تشغيل النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على معلومات النظام
  static async getSystemInfo(req: Request, res: Response) {
    try {
      const info = await AdminService.getSystemInfo()

      res.json({
        success: true,
        data: info
      })
    } catch (error) {
      console.error('Error getting system info:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على معلومات النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على لوحة المعلومات الإدارية
  static async getAdminDashboard(req: Request, res: Response) {
    try {
      const [stats, health, logs, info] = await Promise.all([
        AdminService.getSystemStats(),
        AdminService.getSystemHealth(),
        AdminService.getSystemLogs(50),
        AdminService.getSystemInfo()
      ])

      const dashboard = {
        stats,
        health,
        recentLogs: logs,
        systemInfo: info,
        lastUpdated: new Date().toISOString()
      }

      res.json({
        success: true,
        data: dashboard
      })
    } catch (error) {
      console.error('Error getting admin dashboard:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على لوحة المعلومات الإدارية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على تقرير النظام
  static async getSystemReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, format = 'json' } = req.query

      const [stats, health, logs] = await Promise.all([
        AdminService.getSystemStats(),
        AdminService.getSystemHealth(),
        AdminService.getSystemLogs(1000)
      ])

      const report = {
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: endDate || new Date().toISOString()
        },
        summary: {
          stats,
          health,
          totalLogs: logs.length,
          errorLogs: logs.filter(log => log.level === 'error').length,
          warningLogs: logs.filter(log => log.level === 'warning').length,
          criticalLogs: logs.filter(log => log.level === 'critical').length
        },
        details: {
          logs: logs.slice(0, 100) // آخر 100 سجل
        }
      }

      if (format === 'pdf') {
        // يمكن إضافة تصدير PDF هنا
        res.json({
          success: true,
          message: 'تقرير PDF غير متاح حالياً',
          data: report
        })
      } else {
        res.json({
          success: true,
          data: report
        })
      }
    } catch (error) {
      console.error('Error getting system report:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على تقرير النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على تنبيهات النظام
  static async getSystemAlerts(req: Request, res: Response) {
    try {
      const health = await AdminService.getSystemHealth()
      const logs = await AdminService.getSystemLogs(100, 'critical')

      const alerts = [
        ...health.issues.map(issue => ({
          type: 'health',
          level: 'warning',
          message: issue,
          timestamp: new Date().toISOString()
        })),
        ...logs.map(log => ({
          type: 'log',
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          component: log.component
        }))
      ]

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          criticalCount: alerts.filter(a => a.level === 'critical').length,
          warningCount: alerts.filter(a => a.level === 'warning').length
        }
      })
    } catch (error) {
      console.error('Error getting system alerts:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على تنبيهات النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على توصيات النظام
  static async getSystemRecommendations(req: Request, res: Response) {
    try {
      const health = await AdminService.getSystemHealth()
      const stats = await AdminService.getSystemStats()

      const recommendations = [
        ...health.recommendations.map(rec => ({
          type: 'health',
          priority: 'medium',
          message: rec,
          category: 'system'
        })),
        ...this.generatePerformanceRecommendations(stats),
        ...this.generateSecurityRecommendations(stats)
      ]

      res.json({
        success: true,
        data: {
          recommendations,
          count: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === 'high').length,
          mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
          lowPriority: recommendations.filter(r => r.priority === 'low').length
        }
      })
    } catch (error) {
      console.error('Error getting system recommendations:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على توصيات النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // توليد توصيات الأداء
  private static generatePerformanceRecommendations(stats: any) {
    const recommendations = []

    if (stats.performance.memoryUsage > 80) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'استخدام الذاكرة مرتفع - فكر في زيادة الذاكرة',
        category: 'performance'
      })
    }

    if (stats.performance.cpuUsage > 70) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'استخدام المعالج مرتفع - فكر في تحسين الكود',
        category: 'performance'
      })
    }

    if (stats.storage.usage > 90) {
      recommendations.push({
        type: 'storage',
        priority: 'high',
        message: 'مساحة التخزين منخفضة - فكر في تنظيف الملفات',
        category: 'storage'
      })
    }

    return recommendations
  }

  // توليد توصيات الأمان
  private static generateSecurityRecommendations(stats: any) {
    const recommendations = []

    if (stats.security.failedLogins > 10) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'عدد محاولات تسجيل الدخول الفاشلة مرتفع - تحقق من محاولات الاختراق',
        category: 'security'
      })
    }

    if (stats.security.blockedIPs > 5) {
      recommendations.push({
        type: 'security',
        priority: 'medium',
        message: 'عدد عناوين IP المحظورة مرتفع - تحقق من إعدادات الأمان',
        category: 'security'
      })
    }

    return recommendations
  }

  // تصدير بيانات النظام
  static async exportSystemData(req: Request, res: Response) {
    try {
      const { format = 'json' } = req.query

      const [stats, health, logs, info] = await Promise.all([
        AdminService.getSystemStats(),
        AdminService.getSystemHealth(),
        AdminService.getSystemLogs(1000),
        AdminService.getSystemInfo()
      ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        stats,
        health,
        logs,
        systemInfo: info
      }

      if (format === 'csv') {
        // يمكن إضافة تصدير CSV هنا
        res.json({
          success: true,
          message: 'تصدير CSV غير متاح حالياً',
          data: exportData
        })
      } else {
        res.json({
          success: true,
          data: exportData
        })
      }
    } catch (error) {
      console.error('Error exporting system data:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تصدير بيانات النظام',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }
}