import { Request, Response } from 'express'
import { PerformanceService } from '../services/performanceService'
import { auditMiddleware } from '../middleware/auditMiddleware'

export class PerformanceController {
  // الحصول على مقاييس الأداء الحالية
  static async getCurrentMetrics(req: Request, res: Response) {
    try {
      const metrics = await PerformanceService.collectMetrics()

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      console.error('Error getting current metrics:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على مقاييس الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على إحصائيات الأداء
  static async getPerformanceStats(req: Request, res: Response) {
    try {
      const stats = await PerformanceService.getPerformanceStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting performance stats:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على إحصائيات الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحليل الاستعلامات
  static async analyzeQueries(req: Request, res: Response) {
    try {
      const analysis = await PerformanceService.analyzeQueries()

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'ANALYZE_QUERIES', {
        queryCount: analysis.length
      })

      res.json({
        success: true,
        data: analysis
      })
    } catch (error) {
      console.error('Error analyzing queries:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحليل الاستعلامات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحسين قاعدة البيانات
  static async optimizeDatabase(req: Request, res: Response) {
    try {
      const result = await PerformanceService.optimizeDatabase()

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'OPTIMIZE_DATABASE', {
        optimizations: result.optimizations
      })

      res.json({
        success: true,
        message: 'تم تحسين قاعدة البيانات بنجاح',
        data: result
      })
    } catch (error) {
      console.error('Error optimizing database:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحسين قاعدة البيانات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // اقتراح فهارس جديدة
  static async suggestIndexes(req: Request, res: Response) {
    try {
      const suggestions = await PerformanceService.suggestIndexes()

      res.json({
        success: true,
        data: suggestions
      })
    } catch (error) {
      console.error('Error suggesting indexes:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في اقتراح الفهارس',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // مراقبة الذاكرة
  static async monitorMemory(req: Request, res: Response) {
    try {
      const memoryInfo = await PerformanceService.monitorMemory()

      res.json({
        success: true,
        data: memoryInfo
      })
    } catch (error) {
      console.error('Error monitoring memory:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في مراقبة الذاكرة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تنظيف الذاكرة
  static async cleanupMemory(req: Request, res: Response) {
    try {
      const result = await PerformanceService.cleanupMemory()

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CLEANUP_MEMORY', {
        success: result.success
      })

      res.json({
        success: true,
        message: result.message,
        data: result
      })
    } catch (error) {
      console.error('Error cleaning up memory:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تنظيف الذاكرة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // بدء مراقبة الأداء
  static async startMonitoring(req: Request, res: Response) {
    try {
      const { intervalMs = 60000 } = req.body

      PerformanceService.startMonitoring(intervalMs)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'START_PERFORMANCE_MONITORING', {
        intervalMs
      })

      res.json({
        success: true,
        message: 'تم بدء مراقبة الأداء بنجاح',
        data: { intervalMs }
      })
    } catch (error) {
      console.error('Error starting performance monitoring:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في بدء مراقبة الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // إيقاف مراقبة الأداء
  static async stopMonitoring(req: Request, res: Response) {
    try {
      PerformanceService.stopMonitoring()

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'STOP_PERFORMANCE_MONITORING')

      res.json({
        success: true,
        message: 'تم إيقاف مراقبة الأداء بنجاح'
      })
    } catch (error) {
      console.error('Error stopping performance monitoring:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إيقاف مراقبة الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على تقرير الأداء
  static async getPerformanceReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, format = 'json' } = req.query

      const stats = await PerformanceService.getPerformanceStats()
      const queryAnalysis = await PerformanceService.analyzeQueries()
      const memoryInfo = await PerformanceService.monitorMemory()

      const report = {
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: endDate || new Date().toISOString()
        },
        summary: {
          currentMetrics: stats.current,
          averageMetrics: stats.average,
          trends: stats.trends,
          alerts: stats.alerts,
          recommendations: stats.recommendations
        },
        details: {
          queryAnalysis,
          memoryInfo
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
      console.error('Error getting performance report:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على تقرير الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على تنبيهات الأداء
  static async getPerformanceAlerts(req: Request, res: Response) {
    try {
      const stats = await PerformanceService.getPerformanceStats()
      const alerts = stats.alerts || []

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          criticalCount: alerts.filter(a => a.type === 'critical').length,
          warningCount: alerts.filter(a => a.type === 'warning').length
        }
      })
    } catch (error) {
      console.error('Error getting performance alerts:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على تنبيهات الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على توصيات الأداء
  static async getPerformanceRecommendations(req: Request, res: Response) {
    try {
      const stats = await PerformanceService.getPerformanceStats()
      const recommendations = stats.recommendations || []

      res.json({
        success: true,
        data: {
          recommendations,
          count: recommendations.length
        }
      })
    } catch (error) {
      console.error('Error getting performance recommendations:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على توصيات الأداء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // إعادة تشغيل الخدمة
  static async restartService(req: Request, res: Response) {
    try {
      // تسجيل العملية
      await auditMiddleware.logAction(req, 'RESTART_SERVICE')

      res.json({
        success: true,
        message: 'تم إعادة تشغيل الخدمة بنجاح'
      })

      // إعادة تشغيل الخدمة بعد 2 ثانية
      setTimeout(() => {
        process.exit(0)
      }, 2000)
    } catch (error) {
      console.error('Error restarting service:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إعادة تشغيل الخدمة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }
}