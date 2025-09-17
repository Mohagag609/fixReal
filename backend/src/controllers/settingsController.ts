import { Request, Response } from 'express';
import { settingsService } from '../services/settingsService';
import { validateSettings } from '../validations/settingsValidation';

export const settingsController = {
  // Get all settings
  getAllSettings: async (req: Request, res: Response) => {
    try {
      const settings = await settingsService.getAllSettings();
      res.json({
        success: true,
        data: settings,
        message: 'تم جلب الإعدادات بنجاح'
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get setting by key
  getSettingByKey: async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'الإعداد غير موجود'
        });
      }

      res.json({
        success: true,
        data: setting,
        message: 'تم جلب الإعداد بنجاح'
      });
    } catch (error) {
      console.error('Error getting setting:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Create new setting
  createSetting: async (req: Request, res: Response) => {
    try {
      const { error, value } = validateSettings(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.details
        });
      }

      const setting = await settingsService.createSetting(value);
      res.status(201).json({
        success: true,
        data: setting,
        message: 'تم إنشاء الإعداد بنجاح'
      });
    } catch (error) {
      console.error('Error creating setting:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update setting
  updateSetting: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error, value } = validateSettings(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.details
        });
      }

      const setting = await settingsService.updateSetting(id, value);
      
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'الإعداد غير موجود'
        });
      }

      res.json({
        success: true,
        data: setting,
        message: 'تم تحديث الإعداد بنجاح'
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update multiple settings (bulk update)
  updateMultipleSettings: async (req: Request, res: Response) => {
    try {
      const { settings } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'بيانات الإعدادات غير صحيحة'
        });
      }

      const updatedSettings = await settingsService.updateMultipleSettings(settings);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'تم تحديث الإعدادات بنجاح'
      });
    } catch (error) {
      console.error('Error updating multiple settings:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete setting
  deleteSetting: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await settingsService.deleteSetting(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'الإعداد غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف الإعداد بنجاح'
      });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Export settings
  exportSettings: async (req: Request, res: Response) => {
    try {
      const settings = await settingsService.getAllSettings();
      res.json({
        success: true,
        data: settings,
        message: 'تم تصدير الإعدادات بنجاح'
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تصدير الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Import settings
  importSettings: async (req: Request, res: Response) => {
    try {
      const { settings } = req.body;
      
      if (!Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          message: 'بيانات الإعدادات غير صحيحة'
        });
      }

      const importedSettings = await settingsService.importSettings(settings);
      
      res.json({
        success: true,
        data: importedSettings,
        message: 'تم استيراد الإعدادات بنجاح'
      });
    } catch (error) {
      console.error('Error importing settings:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في استيراد الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Reset settings to default
  resetToDefault: async (req: Request, res: Response) => {
    try {
      const resetSettings = await settingsService.resetToDefault();
      
      res.json({
        success: true,
        data: resetSettings,
        message: 'تم إعادة تعيين الإعدادات إلى الافتراضية بنجاح'
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إعادة تعيين الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};