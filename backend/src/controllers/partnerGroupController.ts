import { Request, Response } from 'express'
import { PartnerGroupService } from '../services/partnerGroupService'

export class PartnerGroupController {
  // إنشاء مجموعة شركاء جديدة
  static async createPartnerGroup(req: Request, res: Response) {
    try {
      const { name, notes } = req.body

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'اسم المجموعة مطلوب'
        })
      }

      const partnerGroup = await PartnerGroupService.createPartnerGroup({
        name,
        notes
      })

      res.status(201).json({
        success: true,
        data: partnerGroup,
        message: 'تم إنشاء مجموعة الشركاء بنجاح'
      })
    } catch (error) {
      console.error('Create partner group error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء مجموعة الشركاء'
      })
    }
  }

  // الحصول على مجموعات الشركاء
  static async getPartnerGroups(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      
      const filters = {
        name: req.query.name as string,
        search: req.query.search as string
      }

      const result = await PartnerGroupService.getPartnerGroups(page, limit, filters)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get partner groups error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل مجموعات الشركاء'
      })
    }
  }

  // الحصول على مجموعة شركاء محددة
  static async getPartnerGroupById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const partnerGroup = await PartnerGroupService.getPartnerGroupById(id)
      
      if (!partnerGroup) {
        return res.status(404).json({
          success: false,
          error: 'مجموعة الشركاء غير موجودة'
        })
      }

      res.json({
        success: true,
        data: partnerGroup
      })
    } catch (error) {
      console.error('Get partner group error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل مجموعة الشركاء'
      })
    }
  }

  // تحديث مجموعة الشركاء
  static async updatePartnerGroup(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, notes } = req.body

      const partnerGroup = await PartnerGroupService.updatePartnerGroup(id, {
        name,
        notes
      })

      res.json({
        success: true,
        data: partnerGroup,
        message: 'تم تحديث مجموعة الشركاء بنجاح'
      })
    } catch (error) {
      console.error('Update partner group error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث مجموعة الشركاء'
      })
    }
  }

  // حذف مجموعة الشركاء
  static async deletePartnerGroup(req: Request, res: Response) {
    try {
      const { id } = req.params
      await PartnerGroupService.deletePartnerGroup(id)

      res.json({
        success: true,
        message: 'تم حذف مجموعة الشركاء بنجاح'
      })
    } catch (error) {
      console.error('Delete partner group error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في حذف مجموعة الشركاء'
      })
    }
  }

  // إضافة شريك لمجموعة
  static async addPartnerToGroup(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { partnerId, percentage } = req.body

      if (!partnerId || !percentage) {
        return res.status(400).json({
          success: false,
          error: 'معرف الشريك والنسبة مطلوبان'
        })
      }

      const partnerGroupPartner = await PartnerGroupService.addPartnerToGroup(id, {
        partnerId,
        percentage
      })

      res.status(201).json({
        success: true,
        data: partnerGroupPartner,
        message: 'تم إضافة الشريك للمجموعة بنجاح'
      })
    } catch (error) {
      console.error('Add partner to group error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إضافة الشريك للمجموعة'
      })
    }
  }

  // إزالة شريك من مجموعة
  static async removePartnerFromGroup(req: Request, res: Response) {
    try {
      const { id, partnerId } = req.params
      await PartnerGroupService.removePartnerFromGroup(id, partnerId)

      res.json({
        success: true,
        message: 'تم إزالة الشريك من المجموعة بنجاح'
      })
    } catch (error) {
      console.error('Remove partner from group error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إزالة الشريك من المجموعة'
      })
    }
  }

  // تحديث نسبة الشريك
  static async updatePartnerPercentage(req: Request, res: Response) {
    try {
      const { id, partnerId } = req.params
      const { percentage } = req.body

      if (!percentage) {
        return res.status(400).json({
          success: false,
          error: 'النسبة مطلوبة'
        })
      }

      await PartnerGroupService.updatePartnerPercentage(id, partnerId, percentage)

      res.json({
        success: true,
        message: 'تم تحديث نسبة الشريك بنجاح'
      })
    } catch (error) {
      console.error('Update partner percentage error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحديث نسبة الشريك'
      })
    }
  }

  // ربط مجموعة بوحدة
  static async linkGroupToUnit(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { unitId } = req.body

      if (!unitId) {
        return res.status(400).json({
          success: false,
          error: 'معرف الوحدة مطلوب'
        })
      }

      const unitPartnerGroup = await PartnerGroupService.linkGroupToUnit(id, unitId)

      res.status(201).json({
        success: true,
        data: unitPartnerGroup,
        message: 'تم ربط المجموعة بالوحدة بنجاح'
      })
    } catch (error) {
      console.error('Link group to unit error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في ربط المجموعة بالوحدة'
      })
    }
  }

  // إلغاء ربط مجموعة بوحدة
  static async unlinkGroupFromUnit(req: Request, res: Response) {
    try {
      const { id, unitId } = req.params
      await PartnerGroupService.unlinkGroupFromUnit(id, unitId)

      res.json({
        success: true,
        message: 'تم إلغاء ربط المجموعة بالوحدة بنجاح'
      })
    } catch (error) {
      console.error('Unlink group from unit error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في إلغاء ربط المجموعة بالوحدة'
      })
    }
  }

  // الحصول على إحصائيات مجموعات الشركاء
  static async getPartnerGroupStats(req: Request, res: Response) {
    try {
      const stats = await PartnerGroupService.getPartnerGroupStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get partner group stats error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'فشل في تحميل إحصائيات مجموعات الشركاء'
      })
    }
  }
}