import { Router } from 'express'
import { BackupController } from '../controllers/backupController'
import { authMiddleware } from '../middleware/authMiddleware'
import { adminMiddleware } from '../middleware/adminMiddleware'
import multer from 'multer'

const router = Router()

// إعداد multer لرفع الملفات
const upload = multer({
  dest: 'uploads/backups/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'application/gzip' ||
        file.originalname.endsWith('.json') ||
        file.originalname.endsWith('.gz')) {
      cb(null, true)
    } else {
      cb(new Error('نوع الملف غير مدعوم. يجب أن يكون ملف JSON أو GZ'))
    }
  }
})

// جميع المسارات تتطلب مصادقة
router.use(authMiddleware)

// إنشاء نسخة احتياطية
router.post('/create', adminMiddleware, BackupController.createBackup)

// استعادة نسخة احتياطية
router.post('/restore/:backupId', adminMiddleware, BackupController.restoreBackup)

// الحصول على قائمة النسخ الاحتياطية
router.get('/list', BackupController.getBackupList)

// حذف نسخة احتياطية
router.delete('/:backupId', adminMiddleware, BackupController.deleteBackup)

// تحميل نسخة احتياطية
router.get('/download/:backupId', BackupController.downloadBackup)

// رفع نسخة احتياطية
router.post('/upload', adminMiddleware, upload.single('backup'), BackupController.uploadBackup)

// فحص صحة النسخة الاحتياطية
router.get('/validate/:backupId', BackupController.validateBackup)

// تنظيف النسخ الاحتياطية القديمة
router.post('/cleanup', adminMiddleware, BackupController.cleanupOldBackups)

// الحصول على إحصائيات النسخ الاحتياطية
router.get('/stats', BackupController.getBackupStats)

// جدولة النسخ الاحتياطية التلقائية
router.post('/schedule', adminMiddleware, BackupController.scheduleBackup)

export default router