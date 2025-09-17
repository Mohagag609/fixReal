import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface VoucherData {
  type: 'receipt' | 'payment'
  date: Date
  amount: number
  safeId: string
  description: string
  payer?: string
  beneficiary?: string
  linkedRef?: string
}

export class VoucherService {
  // إنشاء سند جديد
  static async createVoucher(data: VoucherData) {
    try {
      // تحديث رصيد الخزنة
      const safe = await prisma.safe.findUnique({
        where: { id: data.safeId }
      })

      if (!safe) {
        throw new Error('الخزنة غير موجودة')
      }

      // حساب الرصيد الجديد
      const amountChange = data.type === 'receipt' ? data.amount : -data.amount
      const newBalance = safe.balance + amountChange

      if (newBalance < 0) {
        throw new Error('رصيد الخزنة غير كافي')
      }

      // إنشاء السند وتحديث رصيد الخزنة في معاملة واحدة
      const result = await prisma.$transaction(async (tx) => {
        const voucher = await tx.voucher.create({
          data: {
            type: data.type,
            date: data.date,
            amount: data.amount,
            safeId: data.safeId,
            description: data.description,
            payer: data.payer,
            beneficiary: data.beneficiary,
            linkedRef: data.linkedRef
          },
          include: {
            safe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            },
            unit: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        })

        await tx.safe.update({
          where: { id: data.safeId },
          data: { balance: newBalance }
        })

        return voucher
      })

      return result
    } catch (error) {
      console.error('Error creating voucher:', error)
      throw new Error('فشل في إنشاء السند')
    }
  }

  // الحصول على السندات
  static async getVouchers(page: number = 1, limit: number = 50, filters?: {
    type?: string
    safeId?: string
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
      
      if (filters?.type) {
        where.type = filters.type
      }
      
      if (filters?.safeId) {
        where.safeId = filters.safeId
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        where.date = {}
        if (filters.dateFrom) {
          where.date.gte = filters.dateFrom
        }
        if (filters.dateTo) {
          where.date.lte = filters.dateTo
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
          { payer: { contains: filters.search, mode: 'insensitive' } },
          { beneficiary: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const [vouchers, total] = await Promise.all([
        prisma.voucher.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: 'desc' },
          include: {
            safe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            },
            unit: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }),
        prisma.voucher.count({ where })
      ])

      return {
        data: vouchers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      throw new Error('فشل في تحميل السندات')
    }
  }

  // الحصول على سند محدد
  static async getVoucherById(id: string) {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id },
        include: {
          safe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          unit: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      })
      return voucher
    } catch (error) {
      console.error('Error fetching voucher:', error)
      throw new Error('فشل في تحميل السند')
    }
  }

  // تحديث السند
  static async updateVoucher(id: string, data: Partial<VoucherData>) {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id }
      })

      if (!voucher) {
        throw new Error('السند غير موجود')
      }

      // إذا تم تغيير المبلغ أو النوع، نحتاج لتحديث رصيد الخزنة
      if (data.amount !== undefined || data.type !== undefined) {
        const safe = await prisma.safe.findUnique({
          where: { id: voucher.safeId }
        })

        if (!safe) {
          throw new Error('الخزنة غير موجودة')
        }

        // حساب التغيير في الرصيد
        const oldAmountChange = voucher.type === 'receipt' ? voucher.amount : -voucher.amount
        const newAmountChange = (data.type || voucher.type) === 'receipt' ? (data.amount || voucher.amount) : -(data.amount || voucher.amount)
        const balanceChange = newAmountChange - oldAmountChange

        const newBalance = safe.balance + balanceChange

        if (newBalance < 0) {
          throw new Error('رصيد الخزنة غير كافي')
        }

        // تحديث السند ورصيد الخزنة في معاملة واحدة
        const result = await prisma.$transaction(async (tx) => {
          const updatedVoucher = await tx.voucher.update({
            where: { id },
            data: {
              type: data.type,
              date: data.date,
              amount: data.amount,
              safeId: data.safeId,
              description: data.description,
              payer: data.payer,
              beneficiary: data.beneficiary,
              linkedRef: data.linkedRef
            },
            include: {
              safe: {
                select: {
                  id: true,
                  name: true,
                  balance: true
                }
              },
              unit: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          })

          await tx.safe.update({
            where: { id: voucher.safeId },
            data: { balance: newBalance }
          })

          return updatedVoucher
        })

        return result
      } else {
        // تحديث السند بدون تغيير المبلغ
        const updatedVoucher = await prisma.voucher.update({
          where: { id },
          data: {
            type: data.type,
            date: data.date,
            safeId: data.safeId,
            description: data.description,
            payer: data.payer,
            beneficiary: data.beneficiary,
            linkedRef: data.linkedRef
          },
          include: {
            safe: {
              select: {
                id: true,
                name: true,
                balance: true
              }
            },
            unit: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        })

        return updatedVoucher
      }
    } catch (error) {
      console.error('Error updating voucher:', error)
      throw new Error('فشل في تحديث السند')
    }
  }

  // حذف السند
  static async deleteVoucher(id: string) {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id }
      })

      if (!voucher) {
        throw new Error('السند غير موجود')
      }

      // إعادة رصيد الخزنة
      const safe = await prisma.safe.findUnique({
        where: { id: voucher.safeId }
      })

      if (!safe) {
        throw new Error('الخزنة غير موجودة')
      }

      const amountChange = voucher.type === 'receipt' ? -voucher.amount : voucher.amount
      const newBalance = safe.balance + amountChange

      // حذف السند وإعادة رصيد الخزنة في معاملة واحدة
      await prisma.$transaction(async (tx) => {
        await tx.voucher.update({
          where: { id },
          data: { deletedAt: new Date() }
        })

        await tx.safe.update({
          where: { id: voucher.safeId },
          data: { balance: newBalance }
        })
      })

      return true
    } catch (error) {
      console.error('Error deleting voucher:', error)
      throw new Error('فشل في حذف السند')
    }
  }

  // إحصائيات السندات
  static async getVoucherStats() {
    try {
      const [
        totalVouchers,
        receiptVouchers,
        paymentVouchers,
        totalReceipts,
        totalPayments,
        todayVouchers,
        todayReceipts,
        todayPayments
      ] = await Promise.all([
        prisma.voucher.count({
          where: { deletedAt: null }
        }),
        prisma.voucher.count({
          where: { 
            deletedAt: null,
            type: 'receipt'
          }
        }),
        prisma.voucher.count({
          where: { 
            deletedAt: null,
            type: 'payment'
          }
        }),
        prisma.voucher.aggregate({
          where: { 
            deletedAt: null,
            type: 'receipt'
          },
          _sum: { amount: true }
        }),
        prisma.voucher.aggregate({
          where: { 
            deletedAt: null,
            type: 'payment'
          },
          _sum: { amount: true }
        }),
        prisma.voucher.count({
          where: {
            deletedAt: null,
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.voucher.aggregate({
          where: {
            deletedAt: null,
            type: 'receipt',
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { amount: true }
        }),
        prisma.voucher.aggregate({
          where: {
            deletedAt: null,
            type: 'payment',
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { amount: true }
        })
      ])

      return {
        totalVouchers,
        receiptVouchers,
        paymentVouchers,
        totalReceipts: totalReceipts._sum.amount || 0,
        totalPayments: totalPayments._sum.amount || 0,
        netAmount: (totalReceipts._sum.amount || 0) - (totalPayments._sum.amount || 0),
        todayVouchers,
        todayReceipts: todayReceipts._sum.amount || 0,
        todayPayments: todayPayments._sum.amount || 0,
        todayNet: (todayReceipts._sum.amount || 0) - (todayPayments._sum.amount || 0)
      }
    } catch (error) {
      console.error('Error fetching voucher stats:', error)
      throw new Error('فشل في تحميل إحصائيات السندات')
    }
  }

  // الحصول على سندات خزنة محددة
  static async getVouchersBySafe(safeId: string) {
    try {
      const vouchers = await prisma.voucher.findMany({
        where: {
          safeId,
          deletedAt: null
        },
        orderBy: { date: 'desc' },
        include: {
          safe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          unit: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      })
      return vouchers
    } catch (error) {
      console.error('Error fetching vouchers by safe:', error)
      throw new Error('فشل في تحميل سندات الخزنة')
    }
  }

  // الحصول على سندات وحدة محددة
  static async getVouchersByUnit(unitId: string) {
    try {
      const vouchers = await prisma.voucher.findMany({
        where: {
          linkedRef: unitId,
          deletedAt: null
        },
        orderBy: { date: 'desc' },
        include: {
          safe: {
            select: {
              id: true,
              name: true,
              balance: true
            }
          },
          unit: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      })
      return vouchers
    } catch (error) {
      console.error('Error fetching vouchers by unit:', error)
      throw new Error('فشل في تحميل سندات الوحدة')
    }
  }
}