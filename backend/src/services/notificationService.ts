import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface NotificationData {
  type: 'critical' | 'important' | 'info' | 'warning' | 'success'
  title: string
  message: string
  category: string
  acknowledged?: boolean
  expiresAt?: Date
  data?: any
}

export class NotificationService {
  // إنشاء إشعار جديد
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          category: data.category,
          acknowledged: data.acknowledged || false,
          expiresAt: data.expiresAt,
          data: data.data ? JSON.stringify(data.data) : null
        }
      })
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw new Error('فشل في إنشاء الإشعار')
    }
  }

  // الحصول على الإشعارات
  static async getNotifications(page: number = 1, limit: number = 20, filters?: {
    type?: string
    category?: string
    acknowledged?: boolean
    expired?: boolean
  }) {
    try {
      const skip = (page - 1) * limit
      
      const where: any = {}
      
      if (filters?.type) {
        where.type = filters.type
      }
      
      if (filters?.category) {
        where.category = { contains: filters.category, mode: 'insensitive' }
      }
      
      if (filters?.acknowledged !== undefined) {
        where.acknowledged = filters.acknowledged
      }
      
      if (filters?.expired !== undefined) {
        if (filters.expired) {
          where.expiresAt = { lt: new Date() }
        } else {
          where.OR = [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ])

      return {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw new Error('فشل في تحميل الإشعارات')
    }
  }

  // الحصول على إشعار محدد
  static async getNotificationById(id: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id }
      })
      return notification
    } catch (error) {
      console.error('Error fetching notification:', error)
      throw new Error('فشل في تحميل الإشعار')
    }
  }

  // تأكيد الإشعار
  static async acknowledgeNotification(id: string, acknowledgedBy?: string) {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy
        }
      })
      return notification
    } catch (error) {
      console.error('Error acknowledging notification:', error)
      throw new Error('فشل في تأكيد الإشعار')
    }
  }

  // تأكيد جميع الإشعارات
  static async acknowledgeAllNotifications(acknowledgedBy?: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          acknowledged: false
        },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy
        }
      })
      return result.count
    } catch (error) {
      console.error('Error acknowledging all notifications:', error)
      throw new Error('فشل في تأكيد جميع الإشعارات')
    }
  }

  // حذف الإشعار
  static async deleteNotification(id: string) {
    try {
      await prisma.notification.delete({
        where: { id }
      })
      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw new Error('فشل في حذف الإشعار')
    }
  }

  // حذف الإشعارات المنتهية الصلاحية
  static async deleteExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      return result.count
    } catch (error) {
      console.error('Error deleting expired notifications:', error)
      throw new Error('فشل في حذف الإشعارات المنتهية الصلاحية')
    }
  }

  // إحصائيات الإشعارات
  static async getNotificationStats() {
    try {
      const [
        totalNotifications,
        unreadNotifications,
        criticalNotifications,
        todayNotifications,
        typeStats,
        categoryStats
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({
          where: { acknowledged: false }
        }),
        prisma.notification.count({
          where: { 
            type: 'critical',
            acknowledged: false
          }
        }),
        prisma.notification.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          _count: { type: true },
          where: { acknowledged: false }
        }),
        prisma.notification.groupBy({
          by: ['category'],
          _count: { category: true },
          where: { acknowledged: false }
        })
      ])

      return {
        totalNotifications,
        unreadNotifications,
        criticalNotifications,
        todayNotifications,
        typeStats,
        categoryStats
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error)
      throw new Error('فشل في تحميل إحصائيات الإشعارات')
    }
  }

  // إنشاء إشعارات تلقائية
  static async createSystemNotifications() {
    try {
      const notifications = []

      // إشعار الأقساط المستحقة
      const overdueInstallments = await prisma.installment.count({
        where: {
          status: 'معلق',
          dueDate: {
            lt: new Date()
          }
        }
      })

      if (overdueInstallments > 0) {
        notifications.push({
          type: 'warning' as const,
          title: 'أقساط مستحقة',
          message: `يوجد ${overdueInstallments} أقساط مستحقة تحتاج متابعة`,
          category: 'installments',
          data: { count: overdueInstallments }
        })
      }

      // إشعار الخزائن منخفضة الرصيد
      const lowBalanceSafes = await prisma.safe.findMany({
        where: {
          balance: {
            lt: 1000 // أقل من 1000
          }
        }
      })

      if (lowBalanceSafes.length > 0) {
        notifications.push({
          type: 'important' as const,
          title: 'خزائن منخفضة الرصيد',
          message: `${lowBalanceSafes.length} خزائن تحتاج إعادة تعبئة`,
          category: 'treasury',
          data: { safes: lowBalanceSafes.map(s => s.name) }
        })
      }

      // إشعار العقود المنتهية قريباً
      const upcomingContracts = await prisma.contract.count({
        where: {
          start: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 يوم
          }
        }
      })

      if (upcomingContracts > 0) {
        notifications.push({
          type: 'info' as const,
          title: 'عقود جديدة',
          message: `${upcomingContracts} عقود جديدة في الشهر القادم`,
          category: 'contracts',
          data: { count: upcomingContracts }
        })
      }

      // إنشاء الإشعارات
      for (const notification of notifications) {
        await this.createNotification(notification)
      }

      return notifications.length
    } catch (error) {
      console.error('Error creating system notifications:', error)
      throw new Error('فشل في إنشاء الإشعارات التلقائية')
    }
  }
}