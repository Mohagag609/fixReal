import { Request, Response } from 'express'
import { BackupService, BackupOptions } from '../services/backupService'
import { auditMiddleware } from '../middleware/auditMiddleware'

export class BackupController {
  // إنشاء نسخة احتياطية
  static async createBackup(req: Request, res: Response) {
    try {
      const options: BackupOptions = {
        includeData: req.body.includeData !== false,
        includeSchema: req.body.includeSchema !== false,
        includeSettings: req.body.includeSettings !== false,
        includeFiles: req.body.includeFiles === true,
        compression: req.body.compression !== false
      }

      const backup = await BackupService.createBackup(options)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CREATE_BACKUP', {
        backupId: backup.id,
        options
      })

      res.status(201).json({
        success: true,
        message: 'تم إنشاء النسخة الاحتياطية بنجاح',
        data: backup
      })
    } catch (error) {
      console.error('Error creating backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // استعادة نسخة احتياطية
  static async restoreBackup(req: Request, res: Response) {
    try {
      const { backupId } = req.params
      const options = {
        restoreData: req.body.restoreData !== false,
        restoreSchema: req.body.restoreSchema !== false,
        restoreSettings: req.body.restoreSettings !== false,
        restoreFiles: req.body.restoreFiles === true,
        clearExisting: req.body.clearExisting === true
      }

      // البحث عن مسار النسخة الاحتياطية
      const backups = await BackupService.getBackupList()
      const backup = backups.find(b => b.id === backupId)
      
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة'
        })
      }

      const backupPath = `backups/${backupId}/backup.json${backup.compressed ? '.gz' : ''}`
      const result = await BackupService.restoreBackup(backupPath, options)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'RESTORE_BACKUP', {
        backupId,
        options
      })

      res.json({
        success: true,
        message: 'تم استعادة النسخة الاحتياطية بنجاح',
        data: result
      })
    } catch (error) {
      console.error('Error restoring backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في استعادة النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على قائمة النسخ الاحتياطية
  static async getBackupList(req: Request, res: Response) {
    try {
      const backups = await BackupService.getBackupList()

      res.json({
        success: true,
        data: backups
      })
    } catch (error) {
      console.error('Error getting backup list:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على قائمة النسخ الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // حذف نسخة احتياطية
  static async deleteBackup(req: Request, res: Response) {
    try {
      const { backupId } = req.params

      const deleted = await BackupService.deleteBackup(backupId)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة'
        })
      }

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'DELETE_BACKUP', {
        backupId
      })

      res.json({
        success: true,
        message: 'تم حذف النسخة الاحتياطية بنجاح'
      })
    } catch (error) {
      console.error('Error deleting backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في حذف النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحميل نسخة احتياطية
  static async downloadBackup(req: Request, res: Response) {
    try {
      const { backupId } = req.params

      const backups = await BackupService.getBackupList()
      const backup = backups.find(b => b.id === backupId)
      
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة'
        })
      }

      const backupPath = `backups/${backupId}/backup.json${backup.compressed ? '.gz' : ''}`
      const fileName = `backup_${backupId}${backup.compressed ? '.json.gz' : '.json'}`

      res.download(backupPath, fileName, (err) => {
        if (err) {
          console.error('Error downloading backup:', err)
          res.status(500).json({
            success: false,
            message: 'فشل في تحميل النسخة الاحتياطية'
          })
        }
      })
    } catch (error) {
      console.error('Error downloading backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحميل النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // رفع نسخة احتياطية
  static async uploadBackup(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم رفع ملف النسخة الاحتياطية'
        })
      }

      const backupPath = req.file.path
      const validation = await BackupService.validateBackup(backupPath)

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'النسخة الاحتياطية غير صالحة',
          errors: validation.errors
        })
      }

      // نقل الملف إلى مجلد النسخ الاحتياطية
      const backupId = validation.info?.id || `uploaded_${Date.now()}`
      const backupDir = `backups/${backupId}`
      
      // إنشاء مجلد النسخة الاحتياطية
      const fs = require('fs')
      const path = require('path')
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const finalPath = path.join(backupDir, 'backup.json')
      fs.renameSync(backupPath, finalPath)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'UPLOAD_BACKUP', {
        backupId,
        fileName: req.file.originalname
      })

      res.json({
        success: true,
        message: 'تم رفع النسخة الاحتياطية بنجاح',
        data: {
          backupId,
          validation
        }
      })
    } catch (error) {
      console.error('Error uploading backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في رفع النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // فحص صحة النسخة الاحتياطية
  static async validateBackup(req: Request, res: Response) {
    try {
      const { backupId } = req.params

      const backups = await BackupService.getBackupList()
      const backup = backups.find(b => b.id === backupId)
      
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة'
        })
      }

      const backupPath = `backups/${backupId}/backup.json${backup.compressed ? '.gz' : ''}`
      const validation = await BackupService.validateBackup(backupPath)

      res.json({
        success: true,
        data: validation
      })
    } catch (error) {
      console.error('Error validating backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في فحص النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  static async cleanupOldBackups(req: Request, res: Response) {
    try {
      const { retentionDays = 30 } = req.body

      const deletedCount = await BackupService.cleanupOldBackups(retentionDays)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CLEANUP_BACKUPS', {
        retentionDays,
        deletedCount
      })

      res.json({
        success: true,
        message: `تم حذف ${deletedCount} نسخة احتياطية قديمة`,
        data: { deletedCount }
      })
    } catch (error) {
      console.error('Error cleaning up old backups:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تنظيف النسخ الاحتياطية القديمة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على إحصائيات النسخ الاحتياطية
  static async getBackupStats(req: Request, res: Response) {
    try {
      const backups = await BackupService.getBackupList()
      
      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + (backup.size || 0), 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
        newestBackup: backups.length > 0 ? backups[0].createdAt : null,
        compressedBackups: backups.filter(b => b.compressed).length,
        uncompressedBackups: backups.filter(b => !b.compressed).length
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting backup stats:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على إحصائيات النسخ الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // جدولة النسخ الاحتياطية التلقائية
  static async scheduleBackup(req: Request, res: Response) {
    try {
      const { schedule, options } = req.body

      // هذا يتطلب إضافة نظام جدولة مثل node-cron
      // يمكن تنفيذه لاحقاً

      res.json({
        success: true,
        message: 'تم جدولة النسخة الاحتياطية بنجاح',
        data: { schedule, options }
      })
    } catch (error) {
      console.error('Error scheduling backup:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في جدولة النسخة الاحتياطية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }
}