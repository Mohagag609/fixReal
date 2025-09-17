import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PartnerDebtData {
  partnerId: string
  amount: number
  dueDate: Date
  notes?: string
}

export class PartnerDebtService {
  // إنشاء دين شريك جديد
  static async createPartnerDebt(data: PartnerDebtData) {
    try {
      const partnerDebt = await prisma.partnerDebt.create({
        data: {
          partnerId: data.partnerId,
          amount: data.amount,
          dueDate: data.dueDate,
          notes: data.notes
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
      return partnerDebt
    } catch (error) {
      console.error('Error creating partner debt:', error)
      throw new Error('فشل في إنشاء دين الشريك')
    }
  }

  // الحصول على ديون الشركاء
  static async getPartnerDebts(page: number = 1, limit: number = 50, filters?: {
    partnerId?: string
    status?: string
    amountMin?: number
    amountMax?: number
    dueDateFrom?: Date
    dueDateTo?: Date
    search?: string
  }) {
    try {
      const skip = (page - 1) * limit
      
      const where: any = {
        deletedAt: null
      }
      
      if (filters?.partnerId) {
        where.partnerId = filters.partnerId
      }
      
      if (filters?.status) {
        where.status = filters.status
      }
      
      if (filters?.amountMin || filters?.amountMax) {
        where.amount = {}
        if (filters.amountMin) {
          where.amount.gte = filters.amountMin
        }
        if (filters.amountMax) {
          where.amount.lte = filters.amountMax
        }
      }
      
      if (filters?.dueDateFrom || filters?.dueDateTo) {
        where.dueDate = {}
        if (filters.dueDateFrom) {
          where.dueDate.gte = filters.dueDateFrom
        }
        if (filters.dueDateTo) {
          where.dueDate.lte = filters.dueDateTo
        }
      }
      
      if (filters?.search) {
        where.OR = [
          { notes: { contains: filters.search, mode: 'insensitive' } },
          { partner: { name: { contains: filters.search, mode: 'insensitive' } } }
        ]
      }

      const [partnerDebts, total] = await Promise.all([
        prisma.partnerDebt.findMany({
          where,
          skip,
          take: limit,
          orderBy: { dueDate: 'asc' },
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }),
        prisma.partnerDebt.count({ where })
      ])

      return {
        data: partnerDebts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching partner debts:', error)
      throw new Error('فشل في تحميل ديون الشركاء')
    }
  }

  // الحصول على دين شريك محدد
  static async getPartnerDebtById(id: string) {
    try {
      const partnerDebt = await prisma.partnerDebt.findUnique({
        where: { id },
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
      return partnerDebt
    } catch (error) {
      console.error('Error fetching partner debt:', error)
      throw new Error('فشل في تحميل دين الشريك')
    }
  }

  // تحديث دين الشريك
  static async updatePartnerDebt(id: string, data: Partial<PartnerDebtData>) {
    try {
      const partnerDebt = await prisma.partnerDebt.update({
        where: { id },
        data: {
          amount: data.amount,
          dueDate: data.dueDate,
          notes: data.notes
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
      return partnerDebt
    } catch (error) {
      console.error('Error updating partner debt:', error)
      throw new Error('فشل في تحديث دين الشريك')
    }
  }

  // حذف دين الشريك
  static async deletePartnerDebt(id: string) {
    try {
      await prisma.partnerDebt.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      })
      return true
    } catch (error) {
      console.error('Error deleting partner debt:', error)
      throw new Error('فشل في حذف دين الشريك')
    }
  }

  // تسجيل سداد دين الشريك
  static async payPartnerDebt(id: string) {
    try {
      const partnerDebt = await prisma.partnerDebt.update({
        where: { id },
        data: {
          status: 'مدفوع',
          updatedAt: new Date()
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
      return partnerDebt
    } catch (error) {
      console.error('Error paying partner debt:', error)
      throw new Error('فشل في تسجيل سداد دين الشريك')
    }
  }

  // إلغاء سداد دين الشريك
  static async unpayPartnerDebt(id: string) {
    try {
      const partnerDebt = await prisma.partnerDebt.update({
        where: { id },
        data: {
          status: 'معلق',
          updatedAt: new Date()
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
      return partnerDebt
    } catch (error) {
      console.error('Error unpaying partner debt:', error)
      throw new Error('فشل في إلغاء سداد دين الشريك')
    }
  }

  // الحصول على ديون شريك محدد
  static async getPartnerDebtsByPartner(partnerId: string) {
    try {
      const partnerDebts = await prisma.partnerDebt.findMany({
        where: {
          partnerId,
          deletedAt: null
        },
        orderBy: { dueDate: 'asc' },
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
      return partnerDebts
    } catch (error) {
      console.error('Error fetching partner debts by partner:', error)
      throw new Error('فشل في تحميل ديون الشريك')
    }
  }

  // إحصائيات ديون الشركاء
  static async getPartnerDebtStats() {
    try {
      const [
        totalDebts,
        paidDebts,
        pendingDebts,
        overdueDebts,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount
      ] = await Promise.all([
        prisma.partnerDebt.count({
          where: { deletedAt: null }
        }),
        prisma.partnerDebt.count({
          where: { 
            deletedAt: null,
            status: 'مدفوع'
          }
        }),
        prisma.partnerDebt.count({
          where: { 
            deletedAt: null,
            status: 'معلق'
          }
        }),
        prisma.partnerDebt.count({
          where: { 
            deletedAt: null,
            status: 'معلق',
            dueDate: {
              lt: new Date()
            }
          }
        }),
        prisma.partnerDebt.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true }
        }),
        prisma.partnerDebt.aggregate({
          where: { 
            deletedAt: null,
            status: 'مدفوع'
          },
          _sum: { amount: true }
        }),
        prisma.partnerDebt.aggregate({
          where: { 
            deletedAt: null,
            status: 'معلق'
          },
          _sum: { amount: true }
        }),
        prisma.partnerDebt.aggregate({
          where: { 
            deletedAt: null,
            status: 'معلق',
            dueDate: {
              lt: new Date()
            }
          },
          _sum: { amount: true }
        })
      ])

      return {
        totalDebts,
        paidDebts,
        pendingDebts,
        overdueDebts,
        totalAmount: totalAmount._sum.amount || 0,
        paidAmount: paidAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        overdueAmount: overdueAmount._sum.amount || 0
      }
    } catch (error) {
      console.error('Error fetching partner debt stats:', error)
      throw new Error('فشل في تحميل إحصائيات ديون الشركاء')
    }
  }

  // الحصول على الديون المستحقة
  static async getOverdueDebts() {
    try {
      const overdueDebts = await prisma.partnerDebt.findMany({
        where: {
          deletedAt: null,
          status: 'معلق',
          dueDate: {
            lt: new Date()
          }
        },
        orderBy: { dueDate: 'asc' },
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
      return overdueDebts
    } catch (error) {
      console.error('Error fetching overdue debts:', error)
      throw new Error('فشل في تحميل الديون المستحقة')
    }
  }

  // الحصول على الديون المستحقة قريباً
  static async getUpcomingDebts(days: number = 7) {
    try {
      const upcomingDate = new Date()
      upcomingDate.setDate(upcomingDate.getDate() + days)

      const upcomingDebts = await prisma.partnerDebt.findMany({
        where: {
          deletedAt: null,
          status: 'معلق',
          dueDate: {
            gte: new Date(),
            lte: upcomingDate
          }
        },
        orderBy: { dueDate: 'asc' },
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
      return upcomingDebts
    } catch (error) {
      console.error('Error fetching upcoming debts:', error)
      throw new Error('فشل في تحميل الديون المستحقة قريباً')
    }
  }
}