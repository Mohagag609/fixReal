import { Request, Response } from 'express'
import { BrokerDueService } from '../services/brokerDueService'

export class BrokerDueController {
  // إنشاء مستحقة سمسار جديدة
  static async createBrokerDue(req: Request, res: Response) {
    try {
      const { brokerId, amount, dueDate, notes } = req.body

      if (!brokerId || !amount || !dueDate) {
        return res.status(400).json({
          success: false,
          error: 'معرف السمسار والمبلغ وتاريخ الاستحقاق مطلوبة'
        })
      }

      const brokerDue = await BrokerDueService.createBrokerDue({
        brokerId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes
      })

      res.status(201).json({
        success: true,
        data: brokerDue,
        message: 'تم إنشاء مستحقة السمسار بنجاح'
      })
    } catch (error) {
      console.error('Create broker due error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء مستحقة السمسار'
      })
    }
  }

  // الحصول على مستحقات السماسرة
  static async getBrokerDues(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      
      const filters = {
        brokerId: req.query.brokerId as string,
        status: req.query.status as string,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin as string) : undefined,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax as string) : undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        search: req.query.search as string
      }

      const result = await BrokerDueService.getBrokerDues(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get broker dues error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل مستحقات السماسرة'
      })
    }
  }

  // الحصول على مستحقة سمسار محددة
  static async getBrokerDueById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const brokerDue = await BrokerDueService.getBrokerDueById(id)
      
      if (!brokerDue) {
        return res.status(404).json({
          success: false,
          error: 'مستحقة السمسار غير موجودة'
        })
      }

      res.json({
        success: true,
        data: brokerDue
      })
    } catch (error) {
      console.error('Get broker due error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل مستحقة السمسار'
      })
    }
  }

  // تحديث مستحقة السمسار
  static async updateBrokerDue(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { amount, dueDate, notes } = req.body

      const brokerDue = await BrokerDueService.updateBrokerDue(id, {
        amount: amount ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes
      })

      res.json({
        success: true,
        data: brokerDue,
        message: 'تم تحديث مستحقة السمسار بنجاح'
      })
    } catch (error) {
      console.error('Update broker due error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث مستحقة السمسار'
      })
    }
  }

  // حذف مستحقة السمسار
  static async deleteBrokerDue(req: Request, res: Response) {
    try {
      const { id } = req.params
      await BrokerDueService.deleteBrokerDue(id)

      res.json({
        success: true,
        message: 'تم حذف مستحقة السمسار بنجاح'
      })
    } catch (error) {
      console.error('Delete broker due error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف مستحقة السمسار'
      })
    }
  }

  // تسجيل سداد مستحقة السمسار
  static async payBrokerDue(req: Request, res: Response) {
    try {
      const { id } = req.params
      const brokerDue = await BrokerDueService.payBrokerDue(id)

      res.json({
        success: true,
        data: brokerDue,
        message: 'تم تسجيل سداد مستحقة السمسار بنجاح'
      })
    } catch (error) {
      console.error('Pay broker due error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تسجيل سداد مستحقة السمسار'
      })
    }
  }

  // إلغاء سداد مستحقة السمسار
  static async unpayBrokerDue(req: Request, res: Response) {
    try {
      const { id } = req.params
      const brokerDue = await BrokerDueService.unpayBrokerDue(id)

      res.json({
        success: true,
        data: brokerDue,
        message: 'تم إلغاء سداد مستحقة السمسار بنجاح'
      })
    } catch (error) {
      console.error('Unpay broker due error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إلغاء سداد مستحقة السمسار'
      })
    }
  }

  // الحصول على مستحقات سمسار محدد
  static async getBrokerDuesByBroker(req: Request, res: Response) {
    try {
      const { brokerId } = req.params
      const brokerDues = await BrokerDueService.getBrokerDuesByBroker(brokerId)
      
      res.json({
        success: true,
        data: brokerDues
      })
    } catch (error) {
      console.error('Get broker dues by broker error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل مستحقات السمسار'
      })
    }
  }

  // الحصول على إحصائيات مستحقات السماسرة
  static async getBrokerDueStats(req: Request, res: Response) {
    try {
      const stats = await BrokerDueService.getBrokerDueStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get broker due stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات مستحقات السماسرة'
      })
    }
  }

  // الحصول على المستحقات المستحقة
  static async getOverdueDues(req: Request, res: Response) {
    try {
      const overdueDues = await BrokerDueService.getOverdueDues()
      
      res.json({
        success: true,
        data: overdueDues
      })
    } catch (error) {
      console.error('Get overdue dues error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل المستحقات المستحقة'
      })
    }
  }

  // الحصول على المستحقات المستحقة قريباً
  static async getUpcomingDues(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7
      const upcomingDues = await BrokerDueService.getUpcomingDues(days)
      
      res.json({
        success: true,
        data: upcomingDues
      })
    } catch (error) {
      console.error('Get upcoming dues error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل المستحقات المستحقة قريباً'
      })
    }
  }
}