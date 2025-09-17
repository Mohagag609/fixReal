import { Router } from 'express'
import { ReportBuilderController } from '../controllers/reportBuilderController'
import { authMiddleware } from '../middleware/authMiddleware'
import { adminMiddleware } from '../middleware/adminMiddleware'

const router = Router()

// جميع المسارات تتطلب مصادقة
router.use(authMiddleware)

// إنشاء قالب تقرير جديد
router.post('/templates', ReportBuilderController.createTemplate)

// الحصول على قائمة قوالب التقارير
router.get('/templates', ReportBuilderController.getTemplates)

// الحصول على قالب تقرير
router.get('/templates/:id', ReportBuilderController.getTemplate)

// تحديث قالب تقرير
router.put('/templates/:id', ReportBuilderController.updateTemplate)

// حذف قالب تقرير
router.delete('/templates/:id', adminMiddleware, ReportBuilderController.deleteTemplate)

// نسخ قالب تقرير
router.post('/templates/:id/duplicate', ReportBuilderController.duplicateTemplate)

// مشاركة قالب تقرير
router.patch('/templates/:id/share', ReportBuilderController.shareTemplate)

// تشغيل تقرير
router.post('/templates/:id/run', ReportBuilderController.runReport)

// تصدير التقرير إلى Excel
router.post('/templates/:id/export/excel', ReportBuilderController.exportToExcel)

// تصدير التقرير إلى PDF
router.post('/templates/:id/export/pdf', ReportBuilderController.exportToPDF)

// تحميل ملف التقرير
router.get('/download/:fileName', ReportBuilderController.downloadReport)

// الحصول على الحقول المتاحة
router.get('/fields', ReportBuilderController.getAvailableFields)

// الحصول على الفئات
router.get('/categories', ReportBuilderController.getCategories)

// الحصول على إحصائيات قوالب التقارير
router.get('/stats', ReportBuilderController.getTemplateStats)

export default router