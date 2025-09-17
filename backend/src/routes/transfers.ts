import { Router } from 'express'
import { TransferController } from '../controllers/transferController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// إنشاء تحويل جديد
router.post('/', TransferController.createTransfer)

// الحصول على التحويلات
router.get('/', TransferController.getTransfers)

// الحصول على تحويل محدد
router.get('/:id', TransferController.getTransferById)

// تحديث التحويل
router.put('/:id', TransferController.updateTransfer)

// حذف التحويل
router.delete('/:id', TransferController.deleteTransfer)

// الحصول على إحصائيات التحويلات
router.get('/stats/overview', TransferController.getTransferStats)

// الحصول على تحويلات خزنة محددة
router.get('/safe/:safeId', TransferController.getTransfersBySafe)

// الحصول على تحويلات اليوم
router.get('/today/list', TransferController.getTodayTransfers)

export default router