import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SettingData {
  key: string
  value: string
}

export class SettingsService {
  // الحصول على جميع الإعدادات
  static async getAllSettings() {
    try {
      const settings = await prisma.settings.findMany({
        orderBy: { key: 'asc' }
      })
      
      // تحويل إلى كائن
      const settingsObj: Record<string, string> = {}
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value
      })
      
      return settingsObj
    } catch (error) {
      console.error('Error fetching settings:', error)
      throw new Error('فشل في تحميل الإعدادات')
    }
  }

  // الحصول على إعداد محدد
  static async getSetting(key: string) {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key }
      })
      return setting
    } catch (error) {
      console.error('Error fetching setting:', error)
      throw new Error('فشل في تحميل الإعداد')
    }
  }

  // تحديث إعداد
  static async updateSetting(key: string, value: string) {
    try {
      const setting = await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
      return setting
    } catch (error) {
      console.error('Error updating setting:', error)
      throw new Error('فشل في تحديث الإعداد')
    }
  }

  // تحديث عدة إعدادات
  static async updateSettings(settings: Record<string, string>) {
    try {
      const results = []
      
      for (const [key, value] of Object.entries(settings)) {
        const setting = await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
        results.push(setting)
      }
      
      return results
    } catch (error) {
      console.error('Error updating settings:', error)
      throw new Error('فشل في تحديث الإعدادات')
    }
  }

  // حذف إعداد
  static async deleteSetting(key: string) {
    try {
      await prisma.settings.delete({
        where: { key }
      })
      return true
    } catch (error) {
      console.error('Error deleting setting:', error)
      throw new Error('فشل في حذف الإعداد')
    }
  }

  // الحصول على إعدادات النظام
  static async getSystemSettings() {
    try {
      const defaultSettings = {
        'app_name': 'نظام إدارة العقارات',
        'app_version': '1.0.0',
        'company_name': 'شركة العقارات',
        'company_address': 'العنوان',
        'company_phone': 'الهاتف',
        'company_email': 'البريد الإلكتروني',
        'currency': 'ريال سعودي',
        'currency_symbol': 'ر.س',
        'date_format': 'dd/mm/yyyy',
        'timezone': 'Asia/Riyadh',
        'language': 'ar',
        'theme': 'light',
        'items_per_page': '50',
        'auto_backup': 'true',
        'backup_frequency': 'daily',
        'notification_enabled': 'true',
        'email_notifications': 'true',
        'sms_notifications': 'false',
        'maintenance_mode': 'false',
        'registration_enabled': 'true',
        'password_min_length': '8',
        'session_timeout': '3600',
        'max_login_attempts': '5',
        'lockout_duration': '900',
        'audit_log_retention_days': '90',
        'file_upload_max_size': '10485760',
        'allowed_file_types': 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx',
        'database_backup_enabled': 'true',
        'database_backup_retention_days': '30',
        'email_smtp_host': '',
        'email_smtp_port': '587',
        'email_smtp_username': '',
        'email_smtp_password': '',
        'email_smtp_secure': 'true',
        'sms_provider': 'twilio',
        'sms_api_key': '',
        'sms_api_secret': '',
        'sms_from_number': '',
        'payment_gateway': 'stripe',
        'payment_public_key': '',
        'payment_secret_key': '',
        'payment_webhook_secret': '',
        'social_login_google': 'false',
        'social_login_facebook': 'false',
        'social_login_github': 'false',
        'google_client_id': '',
        'google_client_secret': '',
        'facebook_app_id': '',
        'facebook_app_secret': '',
        'github_client_id': '',
        'github_client_secret': '',
        'recaptcha_enabled': 'false',
        'recaptcha_site_key': '',
        'recaptcha_secret_key': '',
        'analytics_enabled': 'false',
        'analytics_tracking_id': '',
        'monitoring_enabled': 'true',
        'log_level': 'info',
        'cache_enabled': 'true',
        'cache_ttl': '3600',
        'rate_limiting_enabled': 'true',
        'rate_limit_requests': '100',
        'rate_limit_window': '900',
        'cors_enabled': 'true',
        'cors_origins': '*',
        'security_headers': 'true',
        'content_security_policy': 'true',
        'xss_protection': 'true',
        'csrf_protection': 'true',
        'api_documentation_enabled': 'true',
        'api_rate_limiting': 'true',
        'api_versioning': 'true',
        'api_deprecation_warnings': 'true'
      }

      // الحصول على الإعدادات من قاعدة البيانات
      const dbSettings = await this.getAllSettings()
      
      // دمج الإعدادات الافتراضية مع إعدادات قاعدة البيانات
      const mergedSettings = { ...defaultSettings, ...dbSettings }
      
      return mergedSettings
    } catch (error) {
      console.error('Error fetching system settings:', error)
      throw new Error('فشل في تحميل إعدادات النظام')
    }
  }

  // تحديث إعدادات النظام
  static async updateSystemSettings(settings: Record<string, string>) {
    try {
      // التحقق من صحة الإعدادات
      const validatedSettings = this.validateSettings(settings)
      
      // تحديث الإعدادات
      const results = await this.updateSettings(validatedSettings)
      
      return results
    } catch (error) {
      console.error('Error updating system settings:', error)
      throw new Error('فشل في تحديث إعدادات النظام')
    }
  }

  // التحقق من صحة الإعدادات
  private static validateSettings(settings: Record<string, string>) {
    const validatedSettings: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(settings)) {
      switch (key) {
        case 'items_per_page':
          const itemsPerPage = parseInt(value)
          if (itemsPerPage < 10 || itemsPerPage > 100) {
            throw new Error('عدد العناصر في الصفحة يجب أن يكون بين 10 و 100')
          }
          validatedSettings[key] = value
          break
          
        case 'password_min_length':
          const minLength = parseInt(value)
          if (minLength < 6 || minLength > 32) {
            throw new Error('الحد الأدنى لطول كلمة المرور يجب أن يكون بين 6 و 32')
          }
          validatedSettings[key] = value
          break
          
        case 'session_timeout':
          const timeout = parseInt(value)
          if (timeout < 300 || timeout > 86400) {
            throw new Error('مهلة الجلسة يجب أن تكون بين 5 دقائق و 24 ساعة')
          }
          validatedSettings[key] = value
          break
          
        case 'max_login_attempts':
          const attempts = parseInt(value)
          if (attempts < 3 || attempts > 10) {
            throw new Error('الحد الأقصى لمحاولات تسجيل الدخول يجب أن يكون بين 3 و 10')
          }
          validatedSettings[key] = value
          break
          
        case 'lockout_duration':
          const duration = parseInt(value)
          if (duration < 300 || duration > 3600) {
            throw new Error('مدة الحظر يجب أن تكون بين 5 دقائق و ساعة واحدة')
          }
          validatedSettings[key] = value
          break
          
        case 'audit_log_retention_days':
          const retention = parseInt(value)
          if (retention < 30 || retention > 365) {
            throw new Error('مدة الاحتفاظ بسجل التدقيق يجب أن تكون بين 30 و 365 يوم')
          }
          validatedSettings[key] = value
          break
          
        case 'file_upload_max_size':
          const maxSize = parseInt(value)
          if (maxSize < 1048576 || maxSize > 104857600) {
            throw new Error('الحد الأقصى لحجم الملف يجب أن يكون بين 1MB و 100MB')
          }
          validatedSettings[key] = value
          break
          
        case 'email_smtp_port':
          const port = parseInt(value)
          if (port < 1 || port > 65535) {
            throw new Error('منفذ SMTP يجب أن يكون بين 1 و 65535')
          }
          validatedSettings[key] = value
          break
          
        case 'rate_limit_requests':
          const requests = parseInt(value)
          if (requests < 10 || requests > 1000) {
            throw new Error('حد الطلبات يجب أن يكون بين 10 و 1000')
          }
          validatedSettings[key] = value
          break
          
        case 'rate_limit_window':
          const window = parseInt(value)
          if (window < 60 || window > 3600) {
            throw new Error('نافذة الحد يجب أن تكون بين 60 و 3600 ثانية')
          }
          validatedSettings[key] = value
          break
          
        case 'cache_ttl':
          const ttl = parseInt(value)
          if (ttl < 60 || ttl > 86400) {
            throw new Error('مدة التخزين المؤقت يجب أن تكون بين 60 و 86400 ثانية')
          }
          validatedSettings[key] = value
          break
          
        default:
          validatedSettings[key] = value
          break
      }
    }
    
    return validatedSettings
  }

  // إعادة تعيين الإعدادات للقيم الافتراضية
  static async resetToDefaults() {
    try {
      // حذف جميع الإعدادات
      await prisma.settings.deleteMany({})
      
      // إعادة إنشاء الإعدادات الافتراضية
      const defaultSettings = await this.getSystemSettings()
      const results = await this.updateSettings(defaultSettings)
      
      return results
    } catch (error) {
      console.error('Error resetting settings to defaults:', error)
      throw new Error('فشل في إعادة تعيين الإعدادات')
    }
  }

  // تصدير الإعدادات
  static async exportSettings() {
    try {
      const settings = await this.getAllSettings()
      return {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      console.error('Error exporting settings:', error)
      throw new Error('فشل في تصدير الإعدادات')
    }
  }

  // استيراد الإعدادات
  static async importSettings(settingsData: any) {
    try {
      if (!settingsData.settings) {
        throw new Error('بيانات الإعدادات غير صحيحة')
      }

      const validatedSettings = this.validateSettings(settingsData.settings)
      const results = await this.updateSettings(validatedSettings)
      
      return results
    } catch (error) {
      console.error('Error importing settings:', error)
      throw new Error('فشل في استيراد الإعدادات')
    }
  }
}