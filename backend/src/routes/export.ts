import { Router } from 'express'
import { ExportController } from '../controllers/exportController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// تصدير العملاء
router.get('/customers', ExportController.exportCustomers)

// تصدير الوحدات
router.get('/units', ExportController.exportUnits)

// تصدير العقود
router.get('/contracts', ExportController.exportContracts)

// تصدير الأقساط
router.get('/installments', ExportController.exportInstallments)

// تصدير شامل
router.get('/all', ExportController.exportAll)

export default router