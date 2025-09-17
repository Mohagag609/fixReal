import { Request, Response } from 'express'
import { SettingsService } from '../services/settingsService'

export class SettingsController {
  // الحصول على جميع الإعدادات
  static async getAllSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getAllSettings()
      
      res.json({
        success: true,
        data: settings
      })
    } catch (error) {
      console.error('Get all settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل الإعدادات'
      })
    }
  }

  // الحصول على إعداد محدد
  static async getSetting(req: Request, res: Response) {
    try {
      const { key } = req.params
      const setting = await SettingsService.getSetting(key)
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          error: 'الإعداد غير موجود'
        })
      }

      res.json({
        success: true,
        data: setting
      })
    } catch (error) {
      console.error('Get setting error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل الإعداد'
      })
    }
  }

  // تحديث إعداد
  static async updateSetting(req: Request, res: Response) {
    try {
      const { key } = req.params
      const { value } = req.body

      if (!value) {
        return res.status(400).json({
          success: false,
          error: 'قيمة الإعداد مطلوبة'
        })
      }

      const setting = await SettingsService.updateSetting(key, value)

      res.json({
        success: true,
        data: setting,
        message: 'تم تحديث الإعداد بنجاح'
      })
    } catch (error) {
      console.error('Update setting error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث الإعداد'
      })
    }
  }

  // تحديث عدة إعدادات
  static async updateSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'بيانات الإعدادات مطلوبة'
        })
      }

      const results = await SettingsService.updateSettings(settings)

      res.json({
        success: true,
        data: results,
        message: 'تم تحديث الإعدادات بنجاح'
      })
    } catch (error) {
      console.error('Update settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث الإعدادات'
      })
    }
  }

  // حذف إعداد
  static async deleteSetting(req: Request, res: Response) {
    try {
      const { key } = req.params
      await SettingsService.deleteSetting(key)

      res.json({
        success: true,
        message: 'تم حذف الإعداد بنجاح'
      })
    } catch (error) {
      console.error('Delete setting error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف الإعداد'
      })
    }
  }

  // الحصول على إعدادات النظام
  static async getSystemSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getSystemSettings()
      
      res.json({
        success: true,
        data: settings
      })
    } catch (error) {
      console.error('Get system settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إعدادات النظام'
      })
    }
  }

  // تحديث إعدادات النظام
  static async updateSystemSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'بيانات الإعدادات مطلوبة'
        })
      }

      const results = await SettingsService.updateSystemSettings(settings)

      res.json({
        success: true,
        data: results,
        message: 'تم تحديث إعدادات النظام بنجاح'
      })
    } catch (error) {
      console.error('Update system settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث إعدادات النظام'
      })
    }
  }

  // إعادة تعيين الإعدادات للقيم الافتراضية
  static async resetToDefaults(req: Request, res: Response) {
    try {
      const results = await SettingsService.resetToDefaults()

      res.json({
        success: true,
        data: results,
        message: 'تم إعادة تعيين الإعدادات للقيم الافتراضية بنجاح'
      })
    } catch (error) {
      console.error('Reset to defaults error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إعادة تعيين الإعدادات'
      })
    }
  }

  // تصدير الإعدادات
  static async exportSettings(req: Request, res: Response) {
    try {
      const settingsData = await SettingsService.exportSettings()

      res.json({
        success: true,
        data: settingsData
      })
    } catch (error) {
      console.error('Export settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تصدير الإعدادات'
      })
    }
  }

  // استيراد الإعدادات
  static async importSettings(req: Request, res: Response) {
    try {
      const { settingsData } = req.body

      if (!settingsData) {
        return res.status(400).json({
          success: false,
          error: 'بيانات الإعدادات مطلوبة'
        })
      }

      const results = await SettingsService.importSettings(settingsData)

      res.json({
        success: true,
        data: results,
        message: 'تم استيراد الإعدادات بنجاح'
      })
    } catch (error) {
      console.error('Import settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في استيراد الإعدادات'
      })
    }
  }

  // الحصول على إعدادات التطبيق
  static async getAppSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getSystemSettings()
      
      // إرجاع الإعدادات المهمة للتطبيق فقط
      const appSettings = {
        app_name: settings.app_name,
        app_version: settings.app_version,
        company_name: settings.company_name,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        date_format: settings.date_format,
        timezone: settings.timezone,
        language: settings.language,
        theme: settings.theme,
        items_per_page: settings.items_per_page,
        notification_enabled: settings.notification_enabled,
        email_notifications: settings.email_notifications,
        sms_notifications: settings.sms_notifications,
        maintenance_mode: settings.maintenance_mode,
        registration_enabled: settings.registration_enabled
      }

      res.json({
        success: true,
        data: appSettings
      })
    } catch (error) {
      console.error('Get app settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إعدادات التطبيق'
      })
    }
  }

  // الحصول على إعدادات الأمان
  static async getSecuritySettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getSystemSettings()
      
      // إرجاع إعدادات الأمان فقط
      const securitySettings = {
        password_min_length: settings.password_min_length,
        session_timeout: settings.session_timeout,
        max_login_attempts: settings.max_login_attempts,
        lockout_duration: settings.lockout_duration,
        audit_log_retention_days: settings.audit_log_retention_days,
        file_upload_max_size: settings.file_upload_max_size,
        allowed_file_types: settings.allowed_file_types,
        security_headers: settings.security_headers,
        content_security_policy: settings.content_security_policy,
        xss_protection: settings.xss_protection,
        csrf_protection: settings.csrf_protection,
        rate_limiting_enabled: settings.rate_limiting_enabled,
        rate_limit_requests: settings.rate_limit_requests,
        rate_limit_window: settings.rate_limit_window
      }

      res.json({
        success: true,
        data: securitySettings
      })
    } catch (error) {
      console.error('Get security settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إعدادات الأمان'
      })
    }
  }

  // الحصول على إعدادات البريد الإلكتروني
  static async getEmailSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getSystemSettings()
      
      // إرجاع إعدادات البريد الإلكتروني فقط
      const emailSettings = {
        email_notifications: settings.email_notifications,
        email_smtp_host: settings.email_smtp_host,
        email_smtp_port: settings.email_smtp_port,
        email_smtp_username: settings.email_smtp_username,
        email_smtp_secure: settings.email_smtp_secure
      }

      res.json({
        success: true,
        data: emailSettings
      })
    } catch (error) {
      console.error('Get email settings error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إعدادات البريد الإلكتروني'
      })
    }
  }
}