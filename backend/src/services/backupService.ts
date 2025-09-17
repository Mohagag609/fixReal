import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { promisify } from 'util'

const prisma = new PrismaClient()
const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export interface BackupOptions {
  includeData?: boolean
  includeSchema?: boolean
  includeSettings?: boolean
  includeFiles?: boolean
  compression?: boolean
}

export class BackupService {
  // إنشاء نسخة احتياطية
  static async createBackup(options: BackupOptions = {}) {
    try {
      const {
        includeData = true,
        includeSchema = true,
        includeSettings = true,
        includeFiles = false,
        compression = true
      } = options

      const backupId = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
      const backupDir = path.join(process.cwd(), 'backups', backupId)
      
      // إنشاء مجلد النسخة الاحتياطية
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const backupData: any = {
        id: backupId,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        options,
        data: {}
      }

      // نسخ البيانات
      if (includeData) {
        console.log('نسخ البيانات...')
        backupData.data = await this.exportAllData()
      }

      // نسخ المخطط
      if (includeSchema) {
        console.log('نسخ المخطط...')
        backupData.schema = await this.exportSchema()
      }

      // نسخ الإعدادات
      if (includeSettings) {
        console.log('نسخ الإعدادات...')
        backupData.settings = await this.exportSettings()
      }

      // نسخ الملفات
      if (includeFiles) {
        console.log('نسخ الملفات...')
        backupData.files = await this.exportFiles(backupDir)
      }

      // حفظ النسخة الاحتياطية
      const backupFile = path.join(backupDir, 'backup.json')
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))

      // ضغط النسخة الاحتياطية
      let finalBackupPath = backupFile
      if (compression) {
        console.log('ضغط النسخة الاحتياطية...')
        const compressedData = await gzip(JSON.stringify(backupData, null, 2))
        finalBackupPath = path.join(backupDir, 'backup.json.gz')
        fs.writeFileSync(finalBackupPath, compressedData)
      }

      // إنشاء ملف معلومات النسخة الاحتياطية
      const infoFile = path.join(backupDir, 'info.json')
      const backupInfo = {
        id: backupId,
        createdAt: new Date().toISOString(),
        size: fs.statSync(finalBackupPath).size,
        compressed: compression,
        options,
        status: 'completed'
      }
      fs.writeFileSync(infoFile, JSON.stringify(backupInfo, null, 2))

      return {
        id: backupId,
        path: finalBackupPath,
        size: fs.statSync(finalBackupPath).size,
        compressed: compression,
        createdAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      throw new Error('فشل في إنشاء النسخة الاحتياطية')
    }
  }

  // استعادة نسخة احتياطية
  static async restoreBackup(backupPath: string, options: {
    restoreData?: boolean
    restoreSchema?: boolean
    restoreSettings?: boolean
    restoreFiles?: boolean
    clearExisting?: boolean
  } = {}) {
    try {
      const {
        restoreData = true,
        restoreSchema = true,
        restoreSettings = true,
        restoreFiles = true,
        clearExisting = false
      } = options

      // قراءة النسخة الاحتياطية
      let backupData: any
      if (backupPath.endsWith('.gz')) {
        const compressedData = fs.readFileSync(backupPath)
        const decompressedData = await gunzip(compressedData)
        backupData = JSON.parse(decompressedData.toString())
      } else {
        backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
      }

      // مسح البيانات الموجودة إذا طُلب ذلك
      if (clearExisting) {
        console.log('مسح البيانات الموجودة...')
        await this.clearAllData()
      }

      // استعادة البيانات
      if (restoreData && backupData.data) {
        console.log('استعادة البيانات...')
        await this.importAllData(backupData.data)
      }

      // استعادة المخطط
      if (restoreSchema && backupData.schema) {
        console.log('استعادة المخطط...')
        await this.importSchema(backupData.schema)
      }

      // استعادة الإعدادات
      if (restoreSettings && backupData.settings) {
        console.log('استعادة الإعدادات...')
        await this.importSettings(backupData.settings)
      }

      // استعادة الملفات
      if (restoreFiles && backupData.files) {
        console.log('استعادة الملفات...')
        await this.importFiles(backupData.files)
      }

      return {
        success: true,
        message: 'تم استعادة النسخة الاحتياطية بنجاح',
        restoredAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      throw new Error('فشل في استعادة النسخة الاحتياطية')
    }
  }

  // تصدير جميع البيانات
  private static async exportAllData() {
    try {
      const data: any = {}

      // تصدير جميع الجداول
      const tables = [
        'Customer', 'Unit', 'Contract', 'Installment', 'Partner', 'PartnerDebt',
        'Safe', 'Transfer', 'Voucher', 'Broker', 'BrokerDue', 'PartnerGroup',
        'PartnerGroupPartner', 'UnitPartnerGroup', 'AuditLog', 'Settings',
        'KeyVal', 'User', 'Notification'
      ]

      for (const table of tables) {
        try {
          const records = await (prisma as any)[table.toLowerCase()].findMany()
          data[table] = records
        } catch (error) {
          console.warn(`Warning: Could not export table ${table}:`, error)
        }
      }

      return data
    } catch (error) {
      console.error('Error exporting data:', error)
      throw new Error('فشل في تصدير البيانات')
    }
  }

  // استيراد جميع البيانات
  private static async importAllData(data: any) {
    try {
      for (const [tableName, records] of Object.entries(data)) {
        if (Array.isArray(records) && records.length > 0) {
          try {
            // حذف البيانات الموجودة
            await (prisma as any)[tableName.toLowerCase()].deleteMany({})
            
            // إدراج البيانات الجديدة
            await (prisma as any)[tableName.toLowerCase()].createMany({
              data: records
            })
          } catch (error) {
            console.warn(`Warning: Could not import table ${tableName}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error importing data:', error)
      throw new Error('فشل في استيراد البيانات')
    }
  }

  // تصدير المخطط
  private static async exportSchema() {
    try {
      // قراءة ملف schema.prisma
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      if (fs.existsSync(schemaPath)) {
        return fs.readFileSync(schemaPath, 'utf8')
      }
      return null
    } catch (error) {
      console.error('Error exporting schema:', error)
      throw new Error('فشل في تصدير المخطط')
    }
  }

  // استيراد المخطط
  private static async importSchema(schema: string) {
    try {
      // كتابة المخطط إلى ملف
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      fs.writeFileSync(schemaPath, schema)
      
      // تشغيل migration
      // await prisma.$executeRaw`npx prisma migrate dev`
    } catch (error) {
      console.error('Error importing schema:', error)
      throw new Error('فشل في استيراد المخطط')
    }
  }

  // تصدير الإعدادات
  private static async exportSettings() {
    try {
      const settings = await prisma.settings.findMany()
      const settingsObj: Record<string, string> = {}
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value
      })
      return settingsObj
    } catch (error) {
      console.error('Error exporting settings:', error)
      throw new Error('فشل في تصدير الإعدادات')
    }
  }

  // استيراد الإعدادات
  private static async importSettings(settings: Record<string, string>) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      }
    } catch (error) {
      console.error('Error importing settings:', error)
      throw new Error('فشل في استيراد الإعدادات')
    }
  }

  // تصدير الملفات
  private static async exportFiles(backupDir: string) {
    try {
      const filesDir = path.join(process.cwd(), 'uploads')
      const filesBackupDir = path.join(backupDir, 'files')
      
      if (fs.existsSync(filesDir)) {
        fs.mkdirSync(filesBackupDir, { recursive: true })
        
        // نسخ الملفات
        const files = fs.readdirSync(filesDir)
        for (const file of files) {
          const srcPath = path.join(filesDir, file)
          const destPath = path.join(filesBackupDir, file)
          
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath)
          }
        }
        
        return files
      }
      
      return []
    } catch (error) {
      console.error('Error exporting files:', error)
      throw new Error('فشل في تصدير الملفات')
    }
  }

  // استيراد الملفات
  private static async importFiles(files: string[]) {
    try {
      const filesDir = path.join(process.cwd(), 'uploads')
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true })
      }
      
      // الملفات ستكون في مجلد files في النسخة الاحتياطية
      // هذا يتطلب معرفة مسار النسخة الاحتياطية
      console.log('Files import requires backup path context')
    } catch (error) {
      console.error('Error importing files:', error)
      throw new Error('فشل في استيراد الملفات')
    }
  }

  // مسح جميع البيانات
  private static async clearAllData() {
    try {
      const tables = [
        'Customer', 'Unit', 'Contract', 'Installment', 'Partner', 'PartnerDebt',
        'Safe', 'Transfer', 'Voucher', 'Broker', 'BrokerDue', 'PartnerGroup',
        'PartnerGroupPartner', 'UnitPartnerGroup', 'AuditLog', 'Settings',
        'KeyVal', 'User', 'Notification'
      ]

      for (const table of tables) {
        try {
          await (prisma as any)[table.toLowerCase()].deleteMany({})
        } catch (error) {
          console.warn(`Warning: Could not clear table ${table}:`, error)
        }
      }
    } catch (error) {
      console.error('Error clearing data:', error)
      throw new Error('فشل في مسح البيانات')
    }
  }

  // الحصول على قائمة النسخ الاحتياطية
  static async getBackupList() {
    try {
      const backupsDir = path.join(process.cwd(), 'backups')
      
      if (!fs.existsSync(backupsDir)) {
        return []
      }

      const backups = []
      const backupDirs = fs.readdirSync(backupsDir)
      
      for (const backupDir of backupDirs) {
        const infoPath = path.join(backupsDir, backupDir, 'info.json')
        if (fs.existsSync(infoPath)) {
          const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
          backups.push(info)
        }
      }

      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Error getting backup list:', error)
      throw new Error('فشل في الحصول على قائمة النسخ الاحتياطية')
    }
  }

  // حذف نسخة احتياطية
  static async deleteBackup(backupId: string) {
    try {
      const backupDir = path.join(process.cwd(), 'backups', backupId)
      
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true })
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error deleting backup:', error)
      throw new Error('فشل في حذف النسخة الاحتياطية')
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  static async cleanupOldBackups(retentionDays: number = 30) {
    try {
      const backups = await this.getBackupList()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      
      let deletedCount = 0
      
      for (const backup of backups) {
        if (new Date(backup.createdAt) < cutoffDate) {
          await this.deleteBackup(backup.id)
          deletedCount++
        }
      }
      
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up old backups:', error)
      throw new Error('فشل في تنظيف النسخ الاحتياطية القديمة')
    }
  }

  // فحص صحة النسخة الاحتياطية
  static async validateBackup(backupPath: string) {
    try {
      let backupData: any
      
      if (backupPath.endsWith('.gz')) {
        const compressedData = fs.readFileSync(backupPath)
        const decompressedData = await gunzip(compressedData)
        backupData = JSON.parse(decompressedData.toString())
      } else {
        backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
      }

      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        info: {
          id: backupData.id,
          createdAt: backupData.createdAt,
          version: backupData.version,
          hasData: !!backupData.data,
          hasSchema: !!backupData.schema,
          hasSettings: !!backupData.settings,
          hasFiles: !!backupData.files
        }
      }

      // التحقق من وجود البيانات المطلوبة
      if (!backupData.id) {
        validation.errors.push('معرف النسخة الاحتياطية مفقود')
        validation.valid = false
      }

      if (!backupData.createdAt) {
        validation.errors.push('تاريخ إنشاء النسخة الاحتياطية مفقود')
        validation.valid = false
      }

      if (!backupData.data && !backupData.schema && !backupData.settings) {
        validation.warnings.push('النسخة الاحتياطية لا تحتوي على بيانات')
      }

      return validation
    } catch (error) {
      console.error('Error validating backup:', error)
      return {
        valid: false,
        errors: ['فشل في قراءة النسخة الاحتياطية'],
        warnings: [],
        info: null
      }
    }
  }
}