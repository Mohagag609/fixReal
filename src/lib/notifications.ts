// Notification utilities

import { prisma } from './db'

export interface NotificationData {
  type: 'critical' | 'important' | 'info'
  title: string
  message: string
  category: string
  data?: Record<string, unknown>
  expiresAt?: Date
}

// Create notification
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        category: data.category,
        data: data.data ? JSON.stringify(data.data) : null,
        expiresAt: data.expiresAt
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Get notifications with pagination
export async function getNotifications(
  page: number = 1,
  limit: number = 50,
  filters: {
    type?: string
    category?: string
    acknowledged?: boolean
    expired?: boolean
  } = {}
): Promise<{ data: unknown[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    
    const whereClause: Record<string, unknown> = {}
    
    if (filters.type) {
      whereClause.type = filters.type
    }
    
    if (filters.category) {
      whereClause.category = filters.category
    }
    
    if (filters.acknowledged !== undefined) {
      whereClause.acknowledged = filters.acknowledged
    }
    
    if (filters.expired !== undefined) {
      if (filters.expired) {
        whereClause.expiresAt = { lt: new Date() }
      } else {
        whereClause.OR = [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    }
    
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error getting notifications:', error)
    throw error
  }
}

// Acknowledge notification
export async function acknowledgeNotification(
  notificationId: string,
  acknowledgedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy
      }
    })
    
    return {
      success: true,
      message: 'تم تأكيد الإشعار بنجاح'
    }
  } catch (error) {
    console.error('Error acknowledging notification:', error)
    return {
      success: false,
      message: 'خطأ في تأكيد الإشعار'
    }
  }
}

// Get unacknowledged notifications count
export async function getUnacknowledgedCount(): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        acknowledged: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    })
  } catch (error) {
    console.error('Error getting unacknowledged notifications count:', error)
    return 0
  }
}

// Clean expired notifications
export async function cleanExpiredNotifications(): Promise<void> {
  try {
    await prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  } catch (error) {
    console.error('Error cleaning expired notifications:', error)
  }
}

// Create critical notification
export async function createCriticalNotification(
  title: string,
  message: string,
  category: string,
  data?: Record<string, unknown>
): Promise<void> {
  await createNotification({
    type: 'critical',
    title,
    message,
    category,
    data,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  })
}

// Create important notification
export async function createImportantNotification(
  title: string,
  message: string,
  category: string,
  data?: Record<string, unknown>
): Promise<void> {
  await createNotification({
    type: 'important',
    title,
    message,
    category,
    data,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  })
}

// Create info notification
export async function createInfoNotification(
  title: string,
  message: string,
  category: string,
  data?: Record<string, unknown>
): Promise<void> {
  await createNotification({
    type: 'info',
    title,
    message,
    category,
    data,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  })
}

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  SYSTEM: 'system',
  USER: 'user',
  DATA: 'data',
  SECURITY: 'security',
  BACKUP: 'backup',
  AUDIT: 'audit'
} as const

// Common notification messages
export const NOTIFICATION_MESSAGES = {
  USER_LOGIN: 'تم تسجيل دخول مستخدم جديد',
  USER_LOGOUT: 'تم تسجيل خروج مستخدم',
  DATA_CREATED: 'تم إنشاء بيانات جديدة',
  DATA_UPDATED: 'تم تحديث البيانات',
  DATA_DELETED: 'تم حذف البيانات',
  BACKUP_CREATED: 'تم إنشاء نسخة احتياطية',
  BACKUP_RESTORED: 'تم استرجاع نسخة احتياطية',
  SECURITY_ALERT: 'تنبيه أمني',
  SYSTEM_ERROR: 'خطأ في النظام'
} as const