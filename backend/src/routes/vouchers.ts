import { Router } from 'express'
import { VoucherController } from '../controllers/voucherController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// إنشاء سند جديد
router.post('/', VoucherController.createVoucher)

// الحصول على السندات
router.get('/', VoucherController.getVouchers)

// الحصول على سند محدد
router.get('/:id', VoucherController.getVoucherById)

// تحديث السند
router.put('/:id', VoucherController.updateVoucher)

// حذف السند
router.delete('/:id', VoucherController.deleteVoucher)

// الحصول على إحصائيات السندات
router.get('/stats/overview', VoucherController.getVoucherStats)

// الحصول على سندات خزنة محددة
router.get('/safe/:safeId', VoucherController.getVouchersBySafe)

// الحصول على سندات وحدة محددة
router.get('/unit/:unitId', VoucherController.getVouchersByUnit)

export default router