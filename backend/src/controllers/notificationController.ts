import { Request, Response } from 'express'
import { NotificationService } from '../services/notificationService'

export class NotificationController {
  // الحصول على الإشعارات
  static async getNotifications(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      
      const filters = {
        type: req.query.type as string,
        category: req.query.category as string,
        acknowledged: req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined,
        expired: req.query.expired === 'true' ? true : req.query.expired === 'false' ? false : undefined
      }

      const result = await NotificationService.getNotifications(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get notifications error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل الإشعارات'
      })
    }
  }

  // الحصول على إشعار محدد
  static async getNotificationById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const notification = await NotificationService.getNotificationById(id)
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'الإشعار غير موجود'
        })
      }

      res.json({
        success: true,
        data: notification
      })
    } catch (error) {
      console.error('Get notification error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل الإشعار'
      })
    }
  }

  // تأكيد الإشعار
  static async acknowledgeNotification(req: Request, res: Response) {
    try {
      const { id } = req.params
      const acknowledgedBy = (req as any).user?.id
      
      const notification = await NotificationService.acknowledgeNotification(id, acknowledgedBy)
      
      res.json({
        success: true,
        data: notification,
        message: 'تم تأكيد الإشعار بنجاح'
      })
    } catch (error) {
      console.error('Acknowledge notification error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تأكيد الإشعار'
      })
    }
  }

  // تأكيد جميع الإشعارات
  static async acknowledgeAllNotifications(req: Request, res: Response) {
    try {
      const acknowledgedBy = (req as any).user?.id
      const count = await NotificationService.acknowledgeAllNotifications(acknowledgedBy)
      
      res.json({
        success: true,
        message: `تم تأكيد ${count} إشعار بنجاح`,
        count
      })
    } catch (error) {
      console.error('Acknowledge all notifications error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تأكيد جميع الإشعارات'
      })
    }
  }

  // حذف الإشعار
  static async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params
      await NotificationService.deleteNotification(id)
      
      res.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
      })
    } catch (error) {
      console.error('Delete notification error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف الإشعار'
      })
    }
  }

  // حذف الإشعارات المنتهية الصلاحية
  static async deleteExpiredNotifications(req: Request, res: Response) {
    try {
      const count = await NotificationService.deleteExpiredNotifications()
      
      res.json({
        success: true,
        message: `تم حذف ${count} إشعار منتهي الصلاحية`,
        count
      })
    } catch (error) {
      console.error('Delete expired notifications error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف الإشعارات المنتهية الصلاحية'
      })
    }
  }

  // الحصول على إحصائيات الإشعارات
  static async getNotificationStats(req: Request, res: Response) {
    try {
      const stats = await NotificationService.getNotificationStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get notification stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات الإشعارات'
      })
    }
  }

  // إنشاء إشعارات تلقائية
  static async createSystemNotifications(req: Request, res: Response) {
    try {
      const count = await NotificationService.createSystemNotifications()
      
      res.json({
        success: true,
        message: `تم إنشاء ${count} إشعار تلقائي`,
        count
      })
    } catch (error) {
      console.error('Create system notifications error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء الإشعارات التلقائية'
      })
    }
  }
}