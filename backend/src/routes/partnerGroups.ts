import { Router } from 'express'
import { PartnerGroupController } from '../controllers/partnerGroupController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// إنشاء مجموعة شركاء جديدة
router.post('/', PartnerGroupController.createPartnerGroup)

// الحصول على مجموعات الشركاء
router.get('/', PartnerGroupController.getPartnerGroups)

// الحصول على مجموعة شركاء محددة
router.get('/:id', PartnerGroupController.getPartnerGroupById)

// تحديث مجموعة الشركاء
router.put('/:id', PartnerGroupController.updatePartnerGroup)

// حذف مجموعة الشركاء
router.delete('/:id', PartnerGroupController.deletePartnerGroup)

// إضافة شريك لمجموعة
router.post('/:id/partners', PartnerGroupController.addPartnerToGroup)

// إزالة شريك من مجموعة
router.delete('/:id/partners/:partnerId', PartnerGroupController.removePartnerFromGroup)

// تحديث نسبة الشريك
router.put('/:id/partners/:partnerId', PartnerGroupController.updatePartnerPercentage)

// ربط مجموعة بوحدة
router.post('/:id/units', PartnerGroupController.linkGroupToUnit)

// إلغاء ربط مجموعة بوحدة
router.delete('/:id/units/:unitId', PartnerGroupController.unlinkGroupFromUnit)

// الحصول على إحصائيات مجموعات الشركاء
router.get('/stats/overview', PartnerGroupController.getPartnerGroupStats)

export default router