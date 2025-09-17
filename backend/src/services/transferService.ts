import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TransferData {
  fromSafeId: string
  toSafeId: string
  amount: number
  description?: string
}

export class TransferService {
  // إنشاء تحويل جديد
  static async createTransfer(data: TransferData) {
    try {
      // التحقق من أن الخزنتين مختلفتان
      if (data.fromSafeId === data.toSafeId) {
        throw new Error('لا يمكن التحويل لنفس الخزنة')
      }

      // التحقق من وجود الخزنتين
      const [fromSafe, toSafe] = await Promise.all([
        prisma.safe.findUnique({ where: { id: data.fromSafeId } }),
        prisma.safe.findUnique({ where: { id: data.toSafeId } })
      ])

      if (!fromSafe) {
        throw new Error('الخزنة المصدر غير موجودة')
      }

      if (!toSafe) {
        throw new Error('الخزنة الهدف غير موجودة')
      }

      // التحقق من أن الرصيد كافي
      if (fromSafe.balance < data.amount) {
        throw new Error('رصيد الخزنة المصدر غير كافي')
      }

      // تنفيذ التحويل في معاملة واحدة
      const result = await prisma.$transaction(async (tx) => {
        // إنشاء سجل التحويل
        const transfer = await tx.transfer.create({
          data: {
            fromSafeId: data.fromSafeId,
            toSafeId: data.toSafeId,
            amount: data.amount,
            description: data.description
          },
          include: {
            fromSafe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            },
            toSafe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            }
          }
        })

        // تحديث رصيد الخزنة المصدر
        await tx.safe.update({
          where: { id: data.fromSafeId },
          data: { 
            balance: fromSafe.balance - data.amount,
            updatedAt: new Date()
          }
        })

        // تحديث رصيد الخزنة الهدف
        await tx.safe.update({
          where: { id: data.toSafeId },
          data: { 
            balance: toSafe.balance + data.amount,
            updatedAt: new Date()
          }
        })

        return transfer
      })

      return result
    } catch (error) {
      console.error('Error creating transfer:', error)
      throw new Error('فشل في إنشاء التحويل')
    }
  }

  // الحصول على التحويلات
  static async getTransfers(page: number = 1, limit: number = 50, filters?: {
    fromSafeId?: string
    toSafeId?: string
    dateFrom?: Date
    dateTo?: Date
    amountMin?: number
    amountMax?: number
    search?: string
  }) {
    try {
      const skip = (page - 1) * limit
      
      const where: any = {
        deletedAt: null
      }
      
      if (filters?.fromSafeId) {
        where.fromSafeId = filters.fromSafeId
      }
      
      if (filters?.toSafeId) {
        where.toSafeId = filters.toSafeId
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo
        }
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
      
      if (filters?.search) {
        where.OR = [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { fromSafe: { name: { contains: filters.search, mode: 'insensitive' } } },
          { toSafe: { name: { contains: filters.search, mode: 'insensitive' } } }
        ]
      }

      const [transfers, total] = await Promise.all([
        prisma.transfer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            fromSafe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            },
            toSafe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            }
          }
        }),
        prisma.transfer.count({ where })
      ])

      return {
        data: transfers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
      throw new Error('فشل في تحميل التحويلات')
    }
  }

  // الحصول على تحويل محدد
  static async getTransferById(id: string) {
    try {
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          fromSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          toSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          }
        }
      })
      return transfer
    } catch (error) {
      console.error('Error fetching transfer:', error)
      throw new Error('فشل في تحميل التحويل')
    }
  }

  // تحديث التحويل
  static async updateTransfer(id: string, data: Partial<TransferData>) {
    try {
      const transfer = await prisma.transfer.findUnique({
        where: { id }
      })

      if (!transfer) {
        throw new Error('التحويل غير موجود')
      }

      // إذا تم تغيير المبلغ أو الخزائن، نحتاج لإعادة التحويل
      if (data.amount !== undefined || data.fromSafeId !== undefined || data.toSafeId !== undefined) {
        throw new Error('لا يمكن تعديل المبلغ أو الخزائن بعد إنشاء التحويل')
      }

      // تحديث الوصف فقط
      const updatedTransfer = await prisma.transfer.update({
        where: { id },
        data: {
          description: data.description
        },
        include: {
          fromSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          toSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          }
        }
      })

      return updatedTransfer
    } catch (error) {
      console.error('Error updating transfer:', error)
      throw new Error('فشل في تحديث التحويل')
    }
  }

  // حذف التحويل
  static async deleteTransfer(id: string) {
    try {
      const transfer = await prisma.transfer.findUnique({
        where: { id }
      })

      if (!transfer) {
        throw new Error('التحويل غير موجود')
      }

      // إعادة الأموال للخزنة المصدر
      const [fromSafe, toSafe] = await Promise.all([
        prisma.safe.findUnique({ where: { id: transfer.fromSafeId } }),
        prisma.safe.findUnique({ where: { id: transfer.toSafeId } })
      ])

      if (!fromSafe || !toSafe) {
        throw new Error('إحدى الخزائن غير موجودة')
      }

      // التحقق من أن الخزنة الهدف لديها رصيد كافي لإعادة التحويل
      if (toSafe.balance < transfer.amount) {
        throw new Error('رصيد الخزنة الهدف غير كافي لإلغاء التحويل')
      }

      // إلغاء التحويل في معاملة واحدة
      await prisma.$transaction(async (tx) => {
        // حذف سجل التحويل
        await tx.transfer.update({
          where: { id },
          data: { deletedAt: new Date() }
        })

        // إعادة الأموال للخزنة المصدر
        await tx.safe.update({
          where: { id: transfer.fromSafeId },
          data: { 
            balance: fromSafe.balance + transfer.amount,
            updatedAt: new Date()
          }
        })

        // خصم الأموال من الخزنة الهدف
        await tx.safe.update({
          where: { id: transfer.toSafeId },
          data: { 
            balance: toSafe.balance - transfer.amount,
            updatedAt: new Date()
          }
        })
      })

      return true
    } catch (error) {
      console.error('Error deleting transfer:', error)
      throw new Error('فشل في حذف التحويل')
    }
  }

  // إحصائيات التحويلات
  static async getTransferStats() {
    try {
      const [
        totalTransfers,
        todayTransfers,
        totalAmount,
        todayAmount,
        safeStats
      ] = await Promise.all([
        prisma.transfer.count({
          where: { deletedAt: null }
        }),
        prisma.transfer.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.transfer.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true }
        }),
        prisma.transfer.aggregate({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { amount: true }
        }),
        prisma.transfer.groupBy({
          by: ['fromSafeId', 'toSafeId'],
          _count: { id: true },
          _sum: { amount: true },
          where: { deletedAt: null }
        })
      ])

      return {
        totalTransfers,
        todayTransfers,
        totalAmount: totalAmount._sum.amount || 0,
        todayAmount: todayAmount._sum.amount || 0,
        safeStats
      }
    } catch (error) {
      console.error('Error fetching transfer stats:', error)
      throw new Error('فشل في تحميل إحصائيات التحويلات')
    }
  }

  // الحصول على تحويلات خزنة محددة
  static async getTransfersBySafe(safeId: string) {
    try {
      const transfers = await prisma.transfer.findMany({
        where: {
          OR: [
            { fromSafeId: safeId },
            { toSafeId: safeId }
          ],
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        include: {
          fromSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          toSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          }
        }
      })
      return transfers
    } catch (error) {
      console.error('Error fetching transfers by safe:', error)
      throw new Error('فشل في تحميل تحويلات الخزنة')
    }
  }

  // الحصول على تحويلات اليوم
  static async getTodayTransfers() {
    try {
      const transfers = await prisma.transfer.findMany({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          fromSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          toSafe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          }
        }
      })
      return transfers
    } catch (error) {
      console.error('Error fetching today transfers:', error)
      throw new Error('فشل في تحميل تحويلات اليوم')
    }
  }
}