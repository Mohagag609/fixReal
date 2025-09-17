import { Router } from 'express'
import { NotificationController } from '../controllers/notificationController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// الحصول على الإشعارات
router.get('/', NotificationController.getNotifications)

// الحصول على إشعار محدد
router.get('/:id', NotificationController.getNotificationById)

// تأكيد الإشعار
router.patch('/:id/acknowledge', NotificationController.acknowledgeNotification)

// تأكيد جميع الإشعارات
router.patch('/acknowledge-all', NotificationController.acknowledgeAllNotifications)

// حذف الإشعار
router.delete('/:id', NotificationController.deleteNotification)

// حذف الإشعارات المنتهية الصلاحية
router.delete('/expired', NotificationController.deleteExpiredNotifications)

// الحصول على إحصائيات الإشعارات
router.get('/stats/overview', NotificationController.getNotificationStats)

// إنشاء إشعارات تلقائية
router.post('/system/create', NotificationController.createSystemNotifications)

export default router