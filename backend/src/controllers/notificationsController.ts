import { Request, Response } from 'express';
import { notificationsService } from '../services/notificationsService';
import { validateNotification } from '../validations/notificationsValidation';

export const notificationsController = {
  // Get all notifications
  getAllNotifications: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, type, category, acknowledged } = req.query;
      
      const notifications = await notificationsService.getAllNotifications({
        page: Number(page),
        limit: Number(limit),
        type: type as string,
        category: category as string,
        acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined
      });

      res.json({
        success: true,
        data: notifications,
        message: 'تم جلب الإشعارات بنجاح'
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الإشعارات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get notification by ID
  getNotificationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await notificationsService.getNotificationById(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'تم جلب الإشعار بنجاح'
      });
    } catch (error) {
      console.error('Error getting notification:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الإشعار',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Create new notification
  createNotification: async (req: Request, res: Response) => {
    try {
      const { error, value } = validateNotification(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.details
        });
      }

      const notification = await notificationsService.createNotification(value);
      res.status(201).json({
        success: true,
        data: notification,
        message: 'تم إنشاء الإشعار بنجاح'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء الإشعار',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update notification
  updateNotification: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error, value } = validateNotification(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: error.details
        });
      }

      const notification = await notificationsService.updateNotification(id, value);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'تم تحديث الإشعار بنجاح'
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث الإشعار',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Acknowledge notification
  acknowledgeNotification: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const notification = await notificationsService.acknowledgeNotification(id, userId);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'تم تعيين الإشعار كمقروء بنجاح'
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تعيين الإشعار كمقروء',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Acknowledge all notifications
  acknowledgeAllNotifications: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      const result = await notificationsService.acknowledgeAllNotifications(userId);
      
      res.json({
        success: true,
        data: result,
        message: 'تم تعيين جميع الإشعارات كمقروءة بنجاح'
      });
    } catch (error) {
      console.error('Error acknowledging all notifications:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تعيين جميع الإشعارات كمقروءة',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Unacknowledge notification
  unacknowledgeNotification: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const notification = await notificationsService.unacknowledgeNotification(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'تم تعيين الإشعار كغير مقروء بنجاح'
      });
    } catch (error) {
      console.error('Error unacknowledging notification:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تعيين الإشعار كغير مقروء',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete notification
  deleteNotification: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await notificationsService.deleteNotification(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف الإشعار',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete all acknowledged notifications
  deleteAcknowledgedNotifications: async (req: Request, res: Response) => {
    try {
      const result = await notificationsService.deleteAcknowledgedNotifications();
      
      res.json({
        success: true,
        data: result,
        message: 'تم حذف جميع الإشعارات المقروءة بنجاح'
      });
    } catch (error) {
      console.error('Error deleting acknowledged notifications:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف الإشعارات المقروءة',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get unread count
  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const count = await notificationsService.getUnreadCount();
      
      res.json({
        success: true,
        data: { count },
        message: 'تم جلب عدد الإشعارات غير المقروءة بنجاح'
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب عدد الإشعارات غير المقروءة',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Clean expired notifications
  cleanExpiredNotifications: async (req: Request, res: Response) => {
    try {
      const result = await notificationsService.cleanExpiredNotifications();
      
      res.json({
        success: true,
        data: result,
        message: 'تم تنظيف الإشعارات المنتهية الصلاحية بنجاح'
      });
    } catch (error) {
      console.error('Error cleaning expired notifications:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تنظيف الإشعارات المنتهية الصلاحية',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};