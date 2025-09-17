import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface BrokerDueData {
  brokerId: string
  amount: number
  dueDate: Date
  notes?: string
}

export class BrokerDueService {
  // إنشاء مستحقة سمسار جديدة
  static async createBrokerDue(data: BrokerDueData) {
    try {
      const brokerDue = await prisma.brokerDue.create({
        data: {
          brokerId: data.brokerId,
          amount: data.amount,
          dueDate: data.dueDate,
          notes: data.notes
        },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return brokerDue
    } catch (error) {
      console.error('Error creating broker due:', error)
      throw new Error('فشل في إنشاء مستحقة السمسار')
    }
  }

  // الحصول على مستحقات السماسرة
  static async getBrokerDues(page: number = 1, limit: number = 50, filters?: {
    brokerId?: string
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
      
      if (filters?.brokerId) {
        where.brokerId = filters.brokerId
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
          { broker: { name: { contains: filters.search, mode: 'insensitive' } } }
        ]
      }

      const [brokerDues, total] = await Promise.all([
        prisma.brokerDue.findMany({
          where,
          skip,
          take: limit,
          orderBy: { dueDate: 'asc' },
          include: {
            broker: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }),
        prisma.brokerDue.count({ where })
      ])

      return {
        data: brokerDues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching broker dues:', error)
      throw new Error('فشل في تحميل مستحقات السماسرة')
    }
  }

  // الحصول على مستحقة سمسار محددة
  static async getBrokerDueById(id: string) {
    try {
      const brokerDue = await prisma.brokerDue.findUnique({
        where: { id },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return brokerDue
    } catch (error) {
      console.error('Error fetching broker due:', error)
      throw new Error('فشل في تحميل مستحقة السمسار')
    }
  }

  // تحديث مستحقة السمسار
  static async updateBrokerDue(id: string, data: Partial<BrokerDueData>) {
    try {
      const brokerDue = await prisma.brokerDue.update({
        where: { id },
        data: {
          amount: data.amount,
          dueDate: data.dueDate,
          notes: data.notes
        },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return brokerDue
    } catch (error) {
      console.error('Error updating broker due:', error)
      throw new Error('فشل في تحديث مستحقة السمسار')
    }
  }

  // حذف مستحقة السمسار
  static async deleteBrokerDue(id: string) {
    try {
      await prisma.brokerDue.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      })
      return true
    } catch (error) {
      console.error('Error deleting broker due:', error)
      throw new Error('فشل في حذف مستحقة السمسار')
    }
  }

  // تسجيل سداد مستحقة السمسار
  static async payBrokerDue(id: string) {
    try {
      const brokerDue = await prisma.brokerDue.update({
        where: { id },
        data: {
          status: 'مدفوع',
          updatedAt: new Date()
        },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return brokerDue
    } catch (error) {
      console.error('Error paying broker due:', error)
      throw new Error('فشل في تسجيل سداد مستحقة السمسار')
    }
  }

  // إلغاء سداد مستحقة السمسار
  static async unpayBrokerDue(id: string) {
    try {
      const brokerDue = await prisma.brokerDue.update({
        where: { id },
        data: {
          status: 'معلق',
          updatedAt: new Date()
        },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return brokerDue
    } catch (error) {
      console.error('Error unpaying broker due:', error)
      throw new Error('فشل في إلغاء سداد مستحقة السمسار')
    }
  }

  // الحصول على مستحقات سمسار محدد
  static async getBrokerDuesByBroker(brokerId: string) {
    try {
      const brokerDues = await prisma.brokerDue.findMany({
        where: {
          brokerId,
          deletedAt: null
        },
        orderBy: { dueDate: 'asc' },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return brokerDues
    } catch (error) {
      console.error('Error fetching broker dues by broker:', error)
      throw new Error('فشل في تحميل مستحقات السمسار')
    }
  }

  // إحصائيات مستحقات السماسرة
  static async getBrokerDueStats() {
    try {
      const [
        totalDues,
        paidDues,
        pendingDues,
        overdueDues,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount
      ] = await Promise.all([
        prisma.brokerDue.count({
          where: { deletedAt: null }
        }),
        prisma.brokerDue.count({
          where: { 
            deletedAt: null,
            status: 'مدفوع'
          }
        }),
        prisma.brokerDue.count({
          where: { 
            deletedAt: null,
            status: 'معلق'
          }
        }),
        prisma.brokerDue.count({
          where: { 
            deletedAt: null,
            status: 'معلق',
            dueDate: {
              lt: new Date()
            }
          }
        }),
        prisma.brokerDue.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true }
        }),
        prisma.brokerDue.aggregate({
          where: { 
            deletedAt: null,
            status: 'مدفوع'
          },
          _sum: { amount: true }
        }),
        prisma.brokerDue.aggregate({
          where: { 
            deletedAt: null,
            status: 'معلق'
          },
          _sum: { amount: true }
        }),
        prisma.brokerDue.aggregate({
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
        totalDues,
        paidDues,
        pendingDues,
        overdueDues,
        totalAmount: totalAmount._sum.amount || 0,
        paidAmount: paidAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0,
        overdueAmount: overdueAmount._sum.amount || 0
      }
    } catch (error) {
      console.error('Error fetching broker due stats:', error)
      throw new Error('فشل في تحميل إحصائيات مستحقات السماسرة')
    }
  }

  // الحصول على المستحقات المستحقة
  static async getOverdueDues() {
    try {
      const overdueDues = await prisma.brokerDue.findMany({
        where: {
          deletedAt: null,
          status: 'معلق',
          dueDate: {
            lt: new Date()
          }
        },
        orderBy: { dueDate: 'asc' },
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return overdueDues
    } catch (error) {
      console.error('Error fetching overdue dues:', error)
      throw new Error('فشل في تحميل المستحقات المستحقة')
    }
  }

  // الحصول على المستحقات المستحقة قريباً
  static async getUpcomingDues(days: number = 7) {
    try {
      const upcomingDate = new Date()
      upcomingDate.setDate(upcomingDate.getDate() + days)

      const upcomingDues = await prisma.brokerDue.findMany({
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
          broker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
      return upcomingDues
    } catch (error) {
      console.error('Error fetching upcoming dues:', error)
      throw new Error('فشل في تحميل المستحقات المستحقة قريباً')
    }
  }
}