import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationFilters {
  page: number;
  limit: number;
  type?: string;
  category?: string;
  acknowledged?: boolean;
}

export const notificationsService = {
  // Get all notifications with filters
  getAllNotifications: async (filters: NotificationFilters) => {
    try {
      const { page, limit, type, category, acknowledged } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (type) where.type = type;
      if (category) where.category = category;
      if (acknowledged !== undefined) where.acknowledged = acknowledged;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all notifications:', error);
      throw error;
    }
  },

  // Get notification by ID
  getNotificationById: async (id: string) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id }
      });
      return notification;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  },

  // Create new notification
  createNotification: async (data: any) => {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          category: data.category,
          acknowledged: data.acknowledged || false,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          data: data.data ? JSON.stringify(data.data) : null
        }
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Update notification
  updateNotification: async (id: string, data: any) => {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          category: data.category,
          acknowledged: data.acknowledged,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          data: data.data ? JSON.stringify(data.data) : null
        }
      });
      return notification;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },

  // Acknowledge notification
  acknowledgeNotification: async (id: string, userId?: string) => {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId
        }
      });
      return notification;
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      throw error;
    }
  },

  // Acknowledge all notifications
  acknowledgeAllNotifications: async (userId?: string) => {
    try {
      const result = await prisma.notification.updateMany({
        where: { acknowledged: false },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId
        }
      });
      return result;
    } catch (error) {
      console.error('Error acknowledging all notifications:', error);
      throw error;
    }
  },

  // Unacknowledge notification
  unacknowledgeNotification: async (id: string) => {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: {
          acknowledged: false,
          acknowledgedAt: null,
          acknowledgedBy: null
        }
      });
      return notification;
    } catch (error) {
      console.error('Error unacknowledging notification:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    try {
      const deleted = await prisma.notification.delete({
        where: { id }
      });
      return deleted;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Delete all acknowledged notifications
  deleteAcknowledgedNotifications: async () => {
    try {
      const result = await prisma.notification.deleteMany({
        where: { acknowledged: true }
      });
      return result;
    } catch (error) {
      console.error('Error deleting acknowledged notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const count = await prisma.notification.count({
        where: { acknowledged: false }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  // Clean expired notifications
  cleanExpiredNotifications: async () => {
    try {
      const now = new Date();
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });
      return result;
    } catch (error) {
      console.error('Error cleaning expired notifications:', error);
      throw error;
    }
  },

  // Create system notification
  createSystemNotification: async (type: 'critical' | 'important' | 'info', title: string, message: string, category: string, data?: any) => {
    try {
      const notification = await prisma.notification.create({
        data: {
          type,
          title,
          message,
          category,
          acknowledged: false,
          data: data ? JSON.stringify(data) : null
        }
      });
      return notification;
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  },

  // Create financial notification
  createFinancialNotification: async (title: string, message: string, data?: any) => {
    return notificationsService.createSystemNotification('important', title, message, 'financial', data);
  },

  // Create contract notification
  createContractNotification: async (title: string, message: string, data?: any) => {
    return notificationsService.createSystemNotification('info', title, message, 'contracts', data);
  },

  // Create payment notification
  createPaymentNotification: async (title: string, message: string, data?: any) => {
    return notificationsService.createSystemNotification('important', title, message, 'payments', data);
  },

  // Create maintenance notification
  createMaintenanceNotification: async (title: string, message: string, data?: any) => {
    return notificationsService.createSystemNotification('info', title, message, 'maintenance', data);
  },

  // Create security notification
  createSecurityNotification: async (title: string, message: string, data?: any) => {
    return notificationsService.createSystemNotification('critical', title, message, 'security', data);
  }
};