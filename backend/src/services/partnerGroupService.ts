import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PartnerGroupData {
  name: string
  notes?: string
}

export interface PartnerGroupPartnerData {
  partnerId: string
  percentage: number
}

export class PartnerGroupService {
  // إنشاء مجموعة شركاء جديدة
  static async createPartnerGroup(data: PartnerGroupData) {
    try {
      const partnerGroup = await prisma.partnerGroup.create({
        data: {
          name: data.name,
          notes: data.notes
        }
      })
      return partnerGroup
    } catch (error) {
      console.error('Error creating partner group:', error)
      throw new Error('فشل في إنشاء مجموعة الشركاء')
    }
  }

  // الحصول على جميع مجموعات الشركاء
  static async getPartnerGroups(page: number = 1, limit: number = 50, filters?: {
    name?: string
    search?: string
  }) {
    try {
      const skip = (page - 1) * limit
      
      const where: any = {
        deletedAt: null
      }
      
      if (filters?.name) {
        where.name = { contains: filters.name, mode: 'insensitive' }
      }
      
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const [partnerGroups, total] = await Promise.all([
        prisma.partnerGroup.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            partners: {
              include: {
                partner: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                }
              }
            },
            unitPartnerGroups: {
              include: {
                unit: {
                  select: {
                    id: true,
                    code: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.partnerGroup.count({ where })
      ])

      return {
        data: partnerGroups,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching partner groups:', error)
      throw new Error('فشل في تحميل مجموعات الشركاء')
    }
  }

  // الحصول على مجموعة شركاء محددة
  static async getPartnerGroupById(id: string) {
    try {
      const partnerGroup = await prisma.partnerGroup.findUnique({
        where: { id },
        include: {
          partners: {
            include: {
              partner: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          unitPartnerGroups: {
            include: {
              unit: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          }
        }
      })
      return partnerGroup
    } catch (error) {
      console.error('Error fetching partner group:', error)
      throw new Error('فشل في تحميل مجموعة الشركاء')
    }
  }

  // تحديث مجموعة الشركاء
  static async updatePartnerGroup(id: string, data: Partial<PartnerGroupData>) {
    try {
      const partnerGroup = await prisma.partnerGroup.update({
        where: { id },
        data: {
          name: data.name,
          notes: data.notes
        }
      })
      return partnerGroup
    } catch (error) {
      console.error('Error updating partner group:', error)
      throw new Error('فشل في تحديث مجموعة الشركاء')
    }
  }

  // حذف مجموعة الشركاء
  static async deletePartnerGroup(id: string) {
    try {
      await prisma.partnerGroup.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      })
      return true
    } catch (error) {
      console.error('Error deleting partner group:', error)
      throw new Error('فشل في حذف مجموعة الشركاء')
    }
  }

  // إضافة شريك لمجموعة
  static async addPartnerToGroup(groupId: string, data: PartnerGroupPartnerData) {
    try {
      // التحقق من أن مجموع النسب لا يتجاوز 100%
      const existingPartners = await prisma.partnerGroupPartner.findMany({
        where: { partnerGroupId: groupId }
      })
      
      const totalPercentage = existingPartners.reduce((sum, p) => sum + p.percentage, 0)
      if (totalPercentage + data.percentage > 100) {
        throw new Error('مجموع النسب لا يمكن أن يتجاوز 100%')
      }

      const partnerGroupPartner = await prisma.partnerGroupPartner.create({
        data: {
          partnerGroupId: groupId,
          partnerId: data.partnerId,
          percentage: data.percentage
        },
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return partnerGroupPartner
    } catch (error) {
      console.error('Error adding partner to group:', error)
      throw new Error('فشل في إضافة الشريك للمجموعة')
    }
  }

  // إزالة شريك من مجموعة
  static async removePartnerFromGroup(groupId: string, partnerId: string) {
    try {
      await prisma.partnerGroupPartner.deleteMany({
        where: {
          partnerGroupId: groupId,
          partnerId: partnerId
        }
      })
      return true
    } catch (error) {
      console.error('Error removing partner from group:', error)
      throw new Error('فشل في إزالة الشريك من المجموعة')
    }
  }

  // تحديث نسبة الشريك في المجموعة
  static async updatePartnerPercentage(groupId: string, partnerId: string, percentage: number) {
    try {
      // التحقق من أن مجموع النسب لا يتجاوز 100%
      const existingPartners = await prisma.partnerGroupPartner.findMany({
        where: { 
          partnerGroupId: groupId,
          partnerId: { not: partnerId }
        }
      })
      
      const totalPercentage = existingPartners.reduce((sum, p) => sum + p.percentage, 0)
      if (totalPercentage + percentage > 100) {
        throw new Error('مجموع النسب لا يمكن أن يتجاوز 100%')
      }

      const partnerGroupPartner = await prisma.partnerGroupPartner.updateMany({
        where: {
          partnerGroupId: groupId,
          partnerId: partnerId
        },
        data: {
          percentage: percentage
        }
      })
      return partnerGroupPartner
    } catch (error) {
      console.error('Error updating partner percentage:', error)
      throw new Error('فشل في تحديث نسبة الشريك')
    }
  }

  // ربط مجموعة شركاء بوحدة
  static async linkGroupToUnit(groupId: string, unitId: string) {
    try {
      const unitPartnerGroup = await prisma.unitPartnerGroup.create({
        data: {
          unitId: unitId,
          partnerGroupId: groupId
        },
        include: {
          unit: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          partnerGroup: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      return unitPartnerGroup
    } catch (error) {
      console.error('Error linking group to unit:', error)
      throw new Error('فشل في ربط المجموعة بالوحدة')
    }
  }

  // إلغاء ربط مجموعة شركاء بوحدة
  static async unlinkGroupFromUnit(groupId: string, unitId: string) {
    try {
      await prisma.unitPartnerGroup.deleteMany({
        where: {
          unitId: unitId,
          partnerGroupId: groupId
        }
      })
      return true
    } catch (error) {
      console.error('Error unlinking group from unit:', error)
      throw new Error('فشل في إلغاء ربط المجموعة بالوحدة')
    }
  }

  // إحصائيات مجموعات الشركاء
  static async getPartnerGroupStats() {
    try {
      const [
        totalGroups,
        activeGroups,
        totalPartners,
        totalUnits
      ] = await Promise.all([
        prisma.partnerGroup.count({
          where: { deletedAt: null }
        }),
        prisma.partnerGroup.count({
          where: {
            deletedAt: null,
            partners: {
              some: {}
            }
          }
        }),
        prisma.partnerGroupPartner.count({
          where: {
            partnerGroup: {
              deletedAt: null
            }
          }
        }),
        prisma.unitPartnerGroup.count({
          where: {
            partnerGroup: {
              deletedAt: null
            }
          }
        })
      ])

      return {
        totalGroups,
        activeGroups,
        totalPartners,
        totalUnits
      }
    } catch (error) {
      console.error('Error fetching partner group stats:', error)
      throw new Error('فشل في تحميل إحصائيات مجموعات الشركاء')
    }
  }
}