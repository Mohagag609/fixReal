import { Router } from 'express'
import { PartnerDebtController } from '../controllers/partnerDebtController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// إنشاء دين شريك جديد
router.post('/', PartnerDebtController.createPartnerDebt)

// الحصول على ديون الشركاء
router.get('/', PartnerDebtController.getPartnerDebts)

// الحصول على دين شريك محدد
router.get('/:id', PartnerDebtController.getPartnerDebtById)

// تحديث دين الشريك
router.put('/:id', PartnerDebtController.updatePartnerDebt)

// حذف دين الشريك
router.delete('/:id', PartnerDebtController.deletePartnerDebt)

// تسجيل سداد دين الشريك
router.patch('/:id/pay', PartnerDebtController.payPartnerDebt)

// إلغاء سداد دين الشريك
router.patch('/:id/unpay', PartnerDebtController.unpayPartnerDebt)

// الحصول على ديون شريك محدد
router.get('/partner/:partnerId', PartnerDebtController.getPartnerDebtsByPartner)

// الحصول على إحصائيات ديون الشركاء
router.get('/stats/overview', PartnerDebtController.getPartnerDebtStats)

// الحصول على الديون المستحقة
router.get('/overdue/list', PartnerDebtController.getOverdueDebts)

// الحصول على الديون المستحقة قريباً
router.get('/upcoming/list', PartnerDebtController.getUpcomingDebts)

export default router