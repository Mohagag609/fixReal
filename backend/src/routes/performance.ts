import { Router } from 'express'
import { PerformanceController } from '../controllers/performanceController'
import { authMiddleware } from '../middleware/authMiddleware'
import { adminMiddleware } from '../middleware/adminMiddleware'

const router = Router()

// جميع المسارات تتطلب مصادقة
router.use(authMiddleware)

// الحصول على مقاييس الأداء الحالية
router.get('/metrics/current', PerformanceController.getCurrentMetrics)

// الحصول على إحصائيات الأداء
router.get('/stats', PerformanceController.getPerformanceStats)

// تحليل الاستعلامات
router.get('/queries/analyze', adminMiddleware, PerformanceController.analyzeQueries)

// تحسين قاعدة البيانات
router.post('/database/optimize', adminMiddleware, PerformanceController.optimizeDatabase)

// اقتراح فهارس جديدة
router.get('/database/indexes/suggest', adminMiddleware, PerformanceController.suggestIndexes)

// مراقبة الذاكرة
router.get('/memory/monitor', PerformanceController.monitorMemory)

// تنظيف الذاكرة
router.post('/memory/cleanup', adminMiddleware, PerformanceController.cleanupMemory)

// بدء مراقبة الأداء
router.post('/monitoring/start', adminMiddleware, PerformanceController.startMonitoring)

// إيقاف مراقبة الأداء
router.post('/monitoring/stop', adminMiddleware, PerformanceController.stopMonitoring)

// الحصول على تقرير الأداء
router.get('/report', PerformanceController.getPerformanceReport)

// الحصول على تنبيهات الأداء
router.get('/alerts', PerformanceController.getPerformanceAlerts)

// الحصول على توصيات الأداء
router.get('/recommendations', PerformanceController.getPerformanceRecommendations)

// إعادة تشغيل الخدمة
router.post('/restart', adminMiddleware, PerformanceController.restartService)

export default router