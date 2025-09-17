import { Router } from 'express'
import { SettingsController } from '../controllers/settingsController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware)

// الحصول على جميع الإعدادات
router.get('/', SettingsController.getAllSettings)

// الحصول على إعداد محدد
router.get('/:key', SettingsController.getSetting)

// تحديث إعداد
router.put('/:key', SettingsController.updateSetting)

// تحديث عدة إعدادات
router.put('/', SettingsController.updateSettings)

// حذف إعداد
router.delete('/:key', SettingsController.deleteSetting)

// الحصول على إعدادات النظام
router.get('/system/all', SettingsController.getSystemSettings)

// تحديث إعدادات النظام
router.put('/system/update', SettingsController.updateSystemSettings)

// إعادة تعيين الإعدادات للقيم الافتراضية
router.post('/system/reset', SettingsController.resetToDefaults)

// تصدير الإعدادات
router.get('/export/data', SettingsController.exportSettings)

// استيراد الإعدادات
router.post('/import/data', SettingsController.importSettings)

// الحصول على إعدادات التطبيق
router.get('/app/config', SettingsController.getAppSettings)

// الحصول على إعدادات الأمان
router.get('/security/config', SettingsController.getSecuritySettings)

// الحصول على إعدادات البريد الإلكتروني
router.get('/email/config', SettingsController.getEmailSettings)

export default router