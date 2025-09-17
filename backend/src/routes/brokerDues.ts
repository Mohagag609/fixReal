import { Router } from 'express'
import { BrokerDueController } from '../controllers/brokerDueController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// إنشاء مستحقة سمسار جديدة
router.post('/', BrokerDueController.createBrokerDue)

// الحصول على مستحقات السماسرة
router.get('/', BrokerDueController.getBrokerDues)

// الحصول على مستحقة سمسار محددة
router.get('/:id', BrokerDueController.getBrokerDueById)

// تحديث مستحقة السمسار
router.put('/:id', BrokerDueController.updateBrokerDue)

// حذف مستحقة السمسار
router.delete('/:id', BrokerDueController.deleteBrokerDue)

// تسجيل سداد مستحقة السمسار
router.patch('/:id/pay', BrokerDueController.payBrokerDue)

// إلغاء سداد مستحقة السمسار
router.patch('/:id/unpay', BrokerDueController.unpayBrokerDue)

// الحصول على مستحقات سمسار محدد
router.get('/broker/:brokerId', BrokerDueController.getBrokerDuesByBroker)

// الحصول على إحصائيات مستحقات السماسرة
router.get('/stats/overview', BrokerDueController.getBrokerDueStats)

// الحصول على المستحقات المستحقة
router.get('/overdue/list', BrokerDueController.getOverdueDues)

// الحصول على المستحقات المستحقة قريباً
router.get('/upcoming/list', BrokerDueController.getUpcomingDues)

export default router