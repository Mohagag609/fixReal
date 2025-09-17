import { Router } from 'express'
import { AdminController } from '../controllers/adminController'
import { authMiddleware } from '../middleware/authMiddleware'
import { adminMiddleware } from '../middleware/adminMiddleware'

const router = Router()

// جميع المسارات تتطلب مصادقة
router.use(authMiddleware)

// الحصول على إحصائيات النظام
router.get('/stats', AdminController.getSystemStats)

// الحصول على صحة النظام
router.get('/health', AdminController.getSystemHealth)

// الحصول على سجلات النظام
router.get('/logs', AdminController.getSystemLogs)

// الحصول على معلومات النظام
router.get('/info', AdminController.getSystemInfo)

// الحصول على لوحة المعلومات الإدارية
router.get('/dashboard', AdminController.getAdminDashboard)

// الحصول على تقرير النظام
router.get('/report', AdminController.getSystemReport)

// الحصول على تنبيهات النظام
router.get('/alerts', AdminController.getSystemAlerts)

// الحصول على توصيات النظام
router.get('/recommendations', AdminController.getSystemRecommendations)

// تصدير بيانات النظام
router.get('/export', AdminController.exportSystemData)

// تنظيف النظام (يتطلب صلاحيات إدارية)
router.post('/cleanup', adminMiddleware, AdminController.cleanupSystem)

// إعادة تشغيل النظام (يتطلب صلاحيات إدارية)
router.post('/restart', adminMiddleware, AdminController.restartSystem)

export default router