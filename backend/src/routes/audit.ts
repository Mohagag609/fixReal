import { Router } from 'express'
import { AuditController } from '../controllers/auditController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// الحصول على سجلات التدقيق
router.get('/', AuditController.getAuditLogs)

// الحصول على سجل تدقيق محدد
router.get('/:id', AuditController.getAuditLogById)

// حذف سجلات التدقيق القديمة
router.delete('/old', AuditController.deleteOldAuditLogs)

// الحصول على إحصائيات سجل التدقيق
router.get('/stats/overview', AuditController.getAuditStats)

export default router