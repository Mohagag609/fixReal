import { Request, Response } from 'express'
import { PartnerDebtService } from '../services/partnerDebtService'

export class PartnerDebtController {
  // إنشاء دين شريك جديد
  static async createPartnerDebt(req: Request, res: Response) {
    try {
      const { partnerId, amount, dueDate, notes } = req.body

      if (!partnerId || !amount || !dueDate) {
        return res.status(400).json({
          success: false,
          error: 'معرف الشريك والمبلغ وتاريخ الاستحقاق مطلوبة'
        })
      }

      const partnerDebt = await PartnerDebtService.createPartnerDebt({
        partnerId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes
      })

      res.status(201).json({
        success: true,
        data: partnerDebt,
        message: 'تم إنشاء دين الشريك بنجاح'
      })
    } catch (error) {
      console.error('Create partner debt error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء دين الشريك'
      })
    }
  }

  // الحصول على ديون الشركاء
  static async getPartnerDebts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      
      const filters = {
        partnerId: req.query.partnerId as string,
        status: req.query.status as string,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin as string) : undefined,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax as string) : undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        search: req.query.search as string
      }

      const result = await PartnerDebtService.getPartnerDebts(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get partner debts error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل ديون الشركاء'
      })
    }
  }

  // الحصول على دين شريك محدد
  static async getPartnerDebtById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const partnerDebt = await PartnerDebtService.getPartnerDebtById(id)
      
      if (!partnerDebt) {
        return res.status(404).json({
          success: false,
          error: 'دين الشريك غير موجود'
        })
      }

      res.json({
        success: true,
        data: partnerDebt
      })
    } catch (error) {
      console.error('Get partner debt error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل دين الشريك'
      })
    }
  }

  // تحديث دين الشريك
  static async updatePartnerDebt(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { amount, dueDate, notes } = req.body

      const partnerDebt = await PartnerDebtService.updatePartnerDebt(id, {
        amount: amount ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes
      })

      res.json({
        success: true,
        data: partnerDebt,
        message: 'تم تحديث دين الشريك بنجاح'
      })
    } catch (error) {
      console.error('Update partner debt error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث دين الشريك'
      })
    }
  }

  // حذف دين الشريك
  static async deletePartnerDebt(req: Request, res: Response) {
    try {
      const { id } = req.params
      await PartnerDebtService.deletePartnerDebt(id)

      res.json({
        success: true,
        message: 'تم حذف دين الشريك بنجاح'
      })
    } catch (error) {
      console.error('Delete partner debt error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف دين الشريك'
      })
    }
  }

  // تسجيل سداد دين الشريك
  static async payPartnerDebt(req: Request, res: Response) {
    try {
      const { id } = req.params
      const partnerDebt = await PartnerDebtService.payPartnerDebt(id)

      res.json({
        success: true,
        data: partnerDebt,
        message: 'تم تسجيل سداد دين الشريك بنجاح'
      })
    } catch (error) {
      console.error('Pay partner debt error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تسجيل سداد دين الشريك'
      })
    }
  }

  // إلغاء سداد دين الشريك
  static async unpayPartnerDebt(req: Request, res: Response) {
    try {
      const { id } = req.params
      const partnerDebt = await PartnerDebtService.unpayPartnerDebt(id)

      res.json({
        success: true,
        data: partnerDebt,
        message: 'تم إلغاء سداد دين الشريك بنجاح'
      })
    } catch (error) {
      console.error('Unpay partner debt error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إلغاء سداد دين الشريك'
      })
    }
  }

  // الحصول على ديون شريك محدد
  static async getPartnerDebtsByPartner(req: Request, res: Response) {
    try {
      const { partnerId } = req.params
      const partnerDebts = await PartnerDebtService.getPartnerDebtsByPartner(partnerId)
      
      res.json({
        success: true,
        data: partnerDebts
      })
    } catch (error) {
      console.error('Get partner debts by partner error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل ديون الشريك'
      })
    }
  }

  // الحصول على إحصائيات ديون الشركاء
  static async getPartnerDebtStats(req: Request, res: Response) {
    try {
      const stats = await PartnerDebtService.getPartnerDebtStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get partner debt stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات ديون الشركاء'
      })
    }
  }

  // الحصول على الديون المستحقة
  static async getOverdueDebts(req: Request, res: Response) {
    try {
      const overdueDebts = await PartnerDebtService.getOverdueDebts()
      
      res.json({
        success: true,
        data: overdueDebts
      })
    } catch (error) {
      console.error('Get overdue debts error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل الديون المستحقة'
      })
    }
  }

  // الحصول على الديون المستحقة قريباً
  static async getUpcomingDebts(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7
      const upcomingDebts = await PartnerDebtService.getUpcomingDebts(days)
      
      res.json({
        success: true,
        data: upcomingDebts
      })
    } catch (error) {
      console.error('Get upcoming debts error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل الديون المستحقة قريباً'
      })
    }
  }
}