import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-static'

// GET /api/reports/dashboard - Get dashboard statistics
export async function GET() {
  try {
    // const { searchParams } = new URL(request.url)
    // const _startDate = searchParams.get('startDate')
    // const _endDate = searchParams.get('endDate')

    // Date filter for future use
    // const dateFilter = {
    //   ...(startDate && { gte: new Date(startDate) }),
    //   ...(endDate && { lte: new Date(endDate) }),
    // }

    // Get basic counts
    const [
      totalCustomers,
      totalUnits,
      totalContracts,
      totalSafes,
      availableUnits,
      soldUnits,
      activeContracts,
      totalVouchers,
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { deletedAt: null } }),
      prisma.contract.count({ where: { deletedAt: null } }),
      prisma.safe.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { status: 'متاحة', deletedAt: null } }),
      prisma.unit.count({ where: { status: 'مباعة', deletedAt: null } }),
      prisma.contract.count({ where: { deletedAt: null } }),
      prisma.voucher.count({ where: { deletedAt: null } }),
    ])

    // Get financial data
    const [
      totalSales,
      totalRevenue,
      totalExpenses,
      totalSafesBalance,
      recentVouchers,
      recentContracts,
    ] = await Promise.all([
      prisma.contract.aggregate({
        where: { deletedAt: null },
        _sum: { totalPrice: true },
      }),
      prisma.voucher.aggregate({
        where: { type: 'receipt', deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.voucher.aggregate({
        where: { type: 'payment', deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.safe.aggregate({
        where: { deletedAt: null },
        _sum: { balance: true },
      }),
      prisma.voucher.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          safe: { select: { name: true } },
        },
      }),
      prisma.contract.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { code: true, name: true } },
          customer: { select: { name: true } },
        },
      }),
    ])

    // Get monthly sales data for charts
    const monthlySales = await prisma.contract.groupBy({
      by: ['start'],
      where: { deletedAt: null },
      _sum: { totalPrice: true },
      _count: { id: true },
    })

    // Get unit types distribution
    const unitTypesDistribution = await prisma.unit.groupBy({
      by: ['unitType'],
      where: { deletedAt: null },
      _count: { id: true },
    })

    // Get payment status distribution
    const paymentStatusDistribution = await prisma.installment.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { amount: true },
    })

    const dashboardData = {
      overview: {
        totalCustomers,
        totalUnits,
        totalContracts,
        totalSafes,
        availableUnits,
        soldUnits,
        activeContracts,
        totalVouchers,
      },
      financial: {
        totalSales: totalSales._sum.totalPrice || 0,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        totalSafesBalance: totalSafesBalance._sum.balance || 0,
        netProfit: (totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      },
      recent: {
        vouchers: recentVouchers,
        contracts: recentContracts,
      },
      charts: {
        monthlySales,
        unitTypesDistribution,
        paymentStatusDistribution,
      },
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'فشل في جلب بيانات لوحة التحكم' },
      { status: 500 }
    )
  }
}