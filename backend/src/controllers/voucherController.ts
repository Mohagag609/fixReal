import { Request, Response } from 'express'
import { VoucherService } from '../services/voucherService'

export class VoucherController {
  // إنشاء سند جديد
  static async createVoucher(req: Request, res: Response) {
    try {
      const { type, date, amount, safeId, description, payer, beneficiary, linkedRef } = req.body

      if (!type || !date || !amount || !safeId || !description) {
        return res.status(400).json({
          success: false,
          error: 'النوع والتاريخ والمبلغ ومعرف الخزنة والوصف مطلوبة'
        })
      }

      if (type !== 'receipt' && type !== 'payment') {
        return res.status(400).json({
          success: false,
          error: 'نوع السند يجب أن يكون receipt أو payment'
        })
      }

      const voucher = await VoucherService.createVoucher({
        type,
        date: new Date(date),
        amount: parseFloat(amount),
        safeId,
        description,
        payer,
        beneficiary,
        linkedRef
      })

      res.status(201).json({
        success: true,
        data: voucher,
        message: 'تم إنشاء السند بنجاح'
      })
    } catch (error) {
      console.error('Create voucher error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء السند'
      })
    }
  }

  // الحصول على السندات
  static async getVouchers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      
      const filters = {
        type: req.query.type as string,
        safeId: req.query.safeId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin as string) : undefined,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax as string) : undefined,
        search: req.query.search as string
      }

      const result = await VoucherService.getVouchers(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get vouchers error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل السندات'
      })
    }
  }

  // الحصول على سند محدد
  static async getVoucherById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const voucher = await VoucherService.getVoucherById(id)
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          error: 'السند غير موجود'
        })
      }

      res.json({
        success: true,
        data: voucher
      })
    } catch (error) {
      console.error('Get voucher error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل السند'
      })
    }
  }

  // تحديث السند
  static async updateVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { type, date, amount, safeId, description, payer, beneficiary, linkedRef } = req.body

      if (type && type !== 'receipt' && type !== 'payment') {
        return res.status(400).json({
          success: false,
          error: 'نوع السند يجب أن يكون receipt أو payment'
        })
      }

      const voucher = await VoucherService.updateVoucher(id, {
        type,
        date: date ? new Date(date) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        safeId,
        description,
        payer,
        beneficiary,
        linkedRef
      })

      res.json({
        success: true,
        data: voucher,
        message: 'تم تحديث السند بنجاح'
      })
    } catch (error) {
      console.error('Update voucher error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث السند'
      })
    }
  }

  // حذف السند
  static async deleteVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params
      await VoucherService.deleteVoucher(id)

      res.json({
        success: true,
        message: 'تم حذف السند بنجاح'
      })
    } catch (error) {
      console.error('Delete voucher error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف السند'
      })
    }
  }

  // الحصول على إحصائيات السندات
  static async getVoucherStats(req: Request, res: Response) {
    try {
      const stats = await VoucherService.getVoucherStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get voucher stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات السندات'
      })
    }
  }

  // الحصول على سندات خزنة محددة
  static async getVouchersBySafe(req: Request, res: Response) {
    try {
      const { safeId } = req.params
      const vouchers = await VoucherService.getVouchersBySafe(safeId)
      
      res.json({
        success: true,
        data: vouchers
      })
    } catch (error) {
      console.error('Get vouchers by safe error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل سندات الخزنة'
      })
    }
  }

  // الحصول على سندات وحدة محددة
  static async getVouchersByUnit(req: Request, res: Response) {
    try {
      const { unitId } = req.params
      const vouchers = await VoucherService.getVouchersByUnit(unitId)
      
      res.json({
        success: true,
        data: vouchers
      })
    } catch (error) {
      console.error('Get vouchers by unit error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل سندات الوحدة'
      })
    }
  }
}