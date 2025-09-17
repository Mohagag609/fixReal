import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const settingsService = {
  // Get all settings
  getAllSettings: async () => {
    try {
      const settings = await prisma.settings.findMany({
        orderBy: { key: 'asc' }
      });
      return settings;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw error;
    }
  },

  // Get setting by key
  getSettingByKey: async (key: string) => {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key }
      });
      return setting;
    } catch (error) {
      console.error('Error getting setting by key:', error);
      throw error;
    }
  },

  // Create new setting
  createSetting: async (data: any) => {
    try {
      const setting = await prisma.settings.create({
        data: {
          key: data.key,
          value: data.value
        }
      });
      return setting;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  },

  // Update setting
  updateSetting: async (id: string, data: any) => {
    try {
      const setting = await prisma.settings.update({
        where: { id },
        data: {
          key: data.key,
          value: data.value
        }
      });
      return setting;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  },

  // Update multiple settings
  updateMultipleSettings: async (settingsData: Record<string, string>) => {
    try {
      const updatePromises = Object.entries(settingsData).map(async ([key, value]) => {
        return prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      });

      const updatedSettings = await Promise.all(updatePromises);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating multiple settings:', error);
      throw error;
    }
  },

  // Delete setting
  deleteSetting: async (id: string) => {
    try {
      const deleted = await prisma.settings.delete({
        where: { id }
      });
      return deleted;
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  },

  // Import settings
  importSettings: async (settings: any[]) => {
    try {
      const importPromises = settings.map(async (setting) => {
        return prisma.settings.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value }
        });
      });

      const importedSettings = await Promise.all(importPromises);
      return importedSettings;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  },

  // Reset to default settings
  resetToDefault: async () => {
    try {
      // Delete all existing settings
      await prisma.settings.deleteMany({});

      // Create default settings
      const defaultSettings = [
        { key: 'app_name', value: 'نظام إدارة العقارات' },
        { key: 'app_version', value: '1.0.0' },
        { key: 'currency', value: 'EGP' },
        { key: 'currency_symbol', value: 'ج.م' },
        { key: 'date_format', value: 'DD/MM/YYYY' },
        { key: 'timezone', value: 'Africa/Cairo' },
        { key: 'language', value: 'ar' },
        { key: 'theme', value: 'light' },
        { key: 'items_per_page', value: '10' },
        { key: 'auto_backup', value: 'true' },
        { key: 'backup_frequency', value: 'daily' },
        { key: 'notification_enabled', value: 'true' },
        { key: 'email_notifications', value: 'true' },
        { key: 'sms_notifications', value: 'false' },
        { key: 'maintenance_mode', value: 'false' },
        { key: 'registration_enabled', value: 'true' },
        { key: 'password_min_length', value: '8' },
        { key: 'session_timeout', value: '30' },
        { key: 'max_login_attempts', value: '5' },
        { key: 'lockout_duration', value: '15' }
      ];

      const createdSettings = await prisma.settings.createMany({
        data: defaultSettings
      });

      return createdSettings;
    } catch (error) {
      console.error('Error resetting to default settings:', error);
      throw error;
    }
  },

  // Get setting value by key (helper method)
  getSettingValue: async (key: string, defaultValue: string = '') => {
    try {
      const setting = await prisma.settings.findUnique({
        where: { key }
      });
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting value:', error);
      return defaultValue;
    }
  },

  // Set setting value by key (helper method)
  setSettingValue: async (key: string, value: string) => {
    try {
      const setting = await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
      return setting;
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  }
};