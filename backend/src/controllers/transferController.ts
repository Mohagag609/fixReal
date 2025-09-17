import { Request, Response } from 'express'
import { TransferService } from '../services/transferService'

export class TransferController {
  // إنشاء تحويل جديد
  static async createTransfer(req: Request, res: Response) {
    try {
      const { fromSafeId, toSafeId, amount, description } = req.body

      if (!fromSafeId || !toSafeId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'معرف الخزنة المصدر ومعرف الخزنة الهدف والمبلغ مطلوبة'
        })
      }

      if (fromSafeId === toSafeId) {
        return res.status(400).json({
          success: false,
          error: 'لا يمكن التحويل لنفس الخزنة'
        })
      }

      const transfer = await TransferService.createTransfer({
        fromSafeId,
        toSafeId,
        amount: parseFloat(amount),
        description
      })

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'تم إنشاء التحويل بنجاح'
      })
    } catch (error) {
      console.error('Create transfer error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء التحويل'
      })
    }
  }

  // الحصول على التحويلات
  static async getTransfers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      
      const filters = {
        fromSafeId: req.query.fromSafeId as string,
        toSafeId: req.query.toSafeId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin as string) : undefined,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax as string) : undefined,
        search: req.query.search as string
      }

      const result = await TransferService.getTransfers(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get transfers error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل التحويلات'
      })
    }
  }

  // الحصول على تحويل محدد
  static async getTransferById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const transfer = await TransferService.getTransferById(id)
      
      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: 'التحويل غير موجود'
        })
      }

      res.json({
        success: true,
        data: transfer
      })
    } catch (error) {
      console.error('Get transfer error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل التحويل'
      })
    }
  }

  // تحديث التحويل
  static async updateTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { description } = req.body

      const transfer = await TransferService.updateTransfer(id, {
        description
      })

      res.json({
        success: true,
        data: transfer,
        message: 'تم تحديث التحويل بنجاح'
      })
    } catch (error) {
      console.error('Update transfer error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث التحويل'
      })
    }
  }

  // حذف التحويل
  static async deleteTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params
      await TransferService.deleteTransfer(id)

      res.json({
        success: true,
        message: 'تم حذف التحويل بنجاح'
      })
    } catch (error) {
      console.error('Delete transfer error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف التحويل'
      })
    }
  }

  // الحصول على إحصائيات التحويلات
  static async getTransferStats(req: Request, res: Response) {
    try {
      const stats = await TransferService.getTransferStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get transfer stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات التحويلات'
      })
    }
  }

  // الحصول على تحويلات خزنة محددة
  static async getTransfersBySafe(req: Request, res: Response) {
    try {
      const { safeId } = req.params
      const transfers = await TransferService.getTransfersBySafe(safeId)
      
      res.json({
        success: true,
        data: transfers
      })
    } catch (error) {
      console.error('Get transfers by safe error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل تحويلات الخزنة'
      })
    }
  }

  // الحصول على تحويلات اليوم
  static async getTodayTransfers(req: Request, res: Response) {
    try {
      const transfers = await TransferService.getTodayTransfers()
      
      res.json({
        success: true,
        data: transfers
      })
    } catch (error) {
      console.error('Get today transfers error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل تحويلات اليوم'
      })
    }
  }
}