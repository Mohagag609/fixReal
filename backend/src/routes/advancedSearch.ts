import { Router } from 'express'
import { AdvancedSearchController } from '../controllers/advancedSearchController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

// جميع المسارات تتطلب مصادقة
router.use(authMiddleware)

// البحث في جداول محددة
router.post('/customers', AdvancedSearchController.searchCustomers)
router.post('/units', AdvancedSearchController.searchUnits)
router.post('/contracts', AdvancedSearchController.searchContracts)
router.post('/transactions', AdvancedSearchController.searchTransactions)
router.post('/invoices', AdvancedSearchController.searchInvoices)
router.post('/partners', AdvancedSearchController.searchPartners)
router.post('/brokers', AdvancedSearchController.searchBrokers)
router.post('/safes', AdvancedSearchController.searchSafes)
router.post('/vouchers', AdvancedSearchController.searchVouchers)

// البحث الشامل
router.post('/global', AdvancedSearchController.globalSearch)

// البحث السريع
router.get('/quick', AdvancedSearchController.quickSearch)

// البحث المتقدم
router.post('/advanced', AdvancedSearchController.advancedSearch)

// الحصول على الحقول المتاحة للبحث
router.get('/fields/:table', AdvancedSearchController.getSearchableFields)

// الحصول على أنواع الفلاتر المتاحة
router.get('/filter-types', AdvancedSearchController.getFilterTypes)

// الحصول على إحصائيات البحث
router.get('/stats', AdvancedSearchController.getSearchStats)

// حفظ البحث
router.post('/save', AdvancedSearchController.saveSearch)

// الحصول على عمليات البحث المحفوظة
router.get('/saved', AdvancedSearchController.getSavedSearches)

export default router