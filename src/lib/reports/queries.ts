/**
 * استعلامات التقارير - Prisma Queries
 * يحتوي على جميع استعلامات قاعدة البيانات للتقارير المختلفة
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ReportFilters {
  projectId?: string
  from?: string
  to?: string
  status?: string
  method?: string
  q?: string
}

export interface InstallmentRow {
  id: string
  unitCode: string
  unitName: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  status: string
  notes?: string
  createdAt: string
}

export interface PaymentRow {
  id: string
  unitCode: string
  unitName: string
  customerName: string
  customerPhone: string
  amount: number
  date: string
  method: string
  description: string
  safeName: string
  createdAt: string
}

export interface AgingRow {
  id: string
  unitCode: string
  unitName: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate: string
  daysOverdue: number
  agingCategory: string
  status: string
  createdAt: string
}

/**
 * استعلام تقرير الأقساط
 */
export async function getInstallmentsReport(filters: ReportFilters): Promise<InstallmentRow[]> {
  const where: Record<string, unknown> = {}
  
  // فلترة حسب الوحدة
  if (filters.projectId) {
    where.unitId = filters.projectId
  }
  
  // فلترة حسب التاريخ
  if (filters.from || filters.to) {
    const dueDateFilter: Record<string, unknown> = {}
    if (filters.from) {
      dueDateFilter.gte = new Date(filters.from)
    }
    if (filters.to) {
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      dueDateFilter.lte = toDate
    }
    where.dueDate = dueDateFilter
  }
  
  // فلترة حسب الحالة
  if (filters.status) {
    where.status = filters.status
  }
  
  // فلترة حسب البحث النصي
  if (filters.q) {
    where.OR = [
      { unit: { code: { contains: filters.q, mode: 'insensitive' } } },
      { unit: { name: { contains: filters.q, mode: 'insensitive' } } },
      { notes: { contains: filters.q, mode: 'insensitive' } }
    ]
  }
  
  // استبعاد المحذوفة
  where.deletedAt = null
  
  const installments = await prisma.installment.findMany({
    where,
    include: {
      unit: {
        select: {
          code: true,
          name: true,
          contracts: {
            select: {
              customer: {
                select: {
                  name: true,
                  phone: true
                }
              }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  })
  
  return installments.map(installment => ({
    id: installment.id,
    unitCode: installment.unit.code,
    unitName: installment.unit.name || '',
    customerName: installment.unit.contracts[0]?.customer.name || '',
    customerPhone: installment.unit.contracts[0]?.customer.phone || '',
    amount: installment.amount,
    dueDate: installment.dueDate?.toISOString().split('T')[0] || 'غير محدد',
    status: installment.status,
    notes: installment.notes || '',
    createdAt: installment.createdAt?.toISOString().split('T')[0] || 'غير محدد'
  }))
}

/**
 * استعلام تقرير التحصيلات
 */
export async function getPaymentsReport(filters: ReportFilters): Promise<PaymentRow[]> {
  const where: Record<string, unknown> = {
    type: 'receipt' // سندات القبض فقط
  }
  
  // فلترة حسب التاريخ
  if (filters.from || filters.to) {
    const dateFilter: Record<string, unknown> = {}
    if (filters.from) {
      dateFilter.gte = new Date(filters.from)
    }
    if (filters.to) {
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }
    where.date = dateFilter
  }
  
  // فلترة حسب طريقة الدفع (من الوصف)
  if (filters.method) {
    where.description = { contains: filters.method, mode: 'insensitive' }
  }
  
  // فلترة حسب البحث النصي
  if (filters.q) {
    where.OR = [
      { description: { contains: filters.q, mode: 'insensitive' } },
      { payer: { contains: filters.q, mode: 'insensitive' } },
      { beneficiary: { contains: filters.q, mode: 'insensitive' } }
    ]
  }
  
  // استبعاد المحذوفة
  where.deletedAt = null
  
  const vouchers = await prisma.voucher.findMany({
    where,
    include: {
      safe: {
        select: { name: true }
      },
      unit: {
        select: {
          code: true,
          name: true,
          contracts: {
            select: {
              customer: {
                select: {
                  name: true,
                  phone: true
                }
              }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    },
    orderBy: { date: 'desc' }
  })
  
  return vouchers.map(voucher => ({
    id: voucher.id,
    unitCode: voucher.unit?.code || '',
    unitName: voucher.unit?.name || '',
    customerName: voucher.unit?.contracts[0]?.customer.name || voucher.payer || '',
    customerPhone: voucher.unit?.contracts[0]?.customer.phone || '',
    amount: voucher.amount,
    date: voucher.date || 'غير محدد'?.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد' || 'غير محدد',
    method: voucher.description || 'غير محدد',
    description: voucher.description,
    safeName: voucher.safe.name,
    createdAt: voucher.createdAt || 'غير محدد'.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'
  }))
}

/**
 * استعلام تقرير تحليل المتأخرات (Aging)
 */
export async function getAgingReport(filters: ReportFilters): Promise<AgingRow[]> {
  const where: Record<string, unknown> = {
    status: { not: 'مسدد' } // الأقساط غير المسددة فقط
  }
  
  // فلترة حسب الوحدة
  if (filters.projectId) {
    where.unitId = filters.projectId
  }
  
  // فلترة حسب التاريخ (تاريخ الاستحقاق)
  if (filters.from || filters.to) {
    const dueDateFilter: Record<string, unknown> = {}
    if (filters.from) {
      dueDateFilter.gte = new Date(filters.from)
    }
    if (filters.to) {
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      dueDateFilter.lte = toDate
    }
    where.dueDate = dueDateFilter
  }
  
  // فلترة حسب البحث النصي
  if (filters.q) {
    where.OR = [
      { unit: { code: { contains: filters.q, mode: 'insensitive' } } },
      { unit: { name: { contains: filters.q, mode: 'insensitive' } } },
      { notes: { contains: filters.q, mode: 'insensitive' } }
    ]
  }
  
  // استبعاد المحذوفة
  where.deletedAt = null
  
  const installments = await prisma.installment.findMany({
    where,
    include: {
      unit: {
        select: {
          code: true,
          name: true,
          contracts: {
            select: {
              customer: {
                select: {
                  name: true,
                  phone: true
                }
              }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  })
  
  const today = new Date()
  
  return installments.map(installment => {
    const daysOverdue = Math.floor((today.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let agingCategory = '0-30'
    if (daysOverdue > 90) {
      agingCategory = '>90'
    } else if (daysOverdue > 60) {
      agingCategory = '61-90'
    } else if (daysOverdue > 30) {
      agingCategory = '31-60'
    }
    
    return {
      id: installment.id,
      unitCode: installment.unit.code,
      unitName: installment.unit.name || '',
      customerName: installment.unit.contracts[0]?.customer.name || '',
      customerPhone: installment.unit.contracts[0]?.customer.phone || '',
      amount: installment.amount,
      dueDate: installment.dueDate?.toISOString().split('T')[0] || 'غير محدد',
      daysOverdue: Math.max(0, daysOverdue),
      agingCategory,
      status: installment.status,
      createdAt: installment.createdAt?.toISOString().split('T')[0] || 'غير محدد'
    }
  })
}

/**
 * إحصائيات سريعة للتقارير
 */
export async function getReportStats(filters: ReportFilters) {
  const [installments, payments, aging] = await Promise.all([
    getInstallmentsReport(filters),
    getPaymentsReport(filters),
    getAgingReport(filters)
  ])
  
  const totalInstallments = installments.reduce((sum, item) => sum + item.amount, 0)
  const totalPayments = payments.reduce((sum, item) => sum + item.amount, 0)
  const totalAging = aging.reduce((sum, item) => sum + item.amount, 0)
  
  const agingByCategory = aging.reduce((acc, item) => {
    acc[item.agingCategory] = (acc[item.agingCategory] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalInstallments,
    totalPayments,
    totalAging,
    agingByCategory,
    counts: {
      installments: installments.length,
      payments: payments.length,
      aging: aging.length
    }
  }
}