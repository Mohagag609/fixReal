import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
// Removed unused import
import { ApiResponse, DashboardKPIs } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dashboard - Get dashboard KPIs
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, token } = await getSharedAuth(request)
    
    if (!user || !token) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient(config)

    // Get all data for calculations
    // Get only counts and aggregated data for better performance
    const [
      contractCount,
      voucherCount,
      installmentCount,
      unitCount,
      customerCount,
      totalContractValue,
      totalVoucherAmount,
      paidInstallmentsCount,
      pendingInstallmentsCount
    ] = await Promise.all([
      prisma.contract.count({ where: { deletedAt: null } }),
      prisma.voucher.count({ where: { deletedAt: null } }),
      prisma.installment.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.contract.aggregate({
        where: { deletedAt: null },
        _sum: { totalPrice: true }
      }),
      prisma.voucher.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.installment.count({ 
        where: { deletedAt: null, status: 'مدفوعة' } 
      }),
      prisma.installment.count({ 
        where: { deletedAt: null, status: 'غير مدفوعة' } 
      })
    ])

    // Calculate KPIs using aggregated data
    const kpis: DashboardKPIs = {
      totalContracts: contractCount,
      totalVouchers: voucherCount,
      totalInstallments: installmentCount,
      totalUnits: unitCount,
      totalCustomers: customerCount,
      totalContractValue: totalContractValue._sum.totalPrice || 0,
      totalVoucherAmount: totalVoucherAmount._sum.amount || 0,
      paidInstallments: paidInstallmentsCount,
      pendingInstallments: pendingInstallmentsCount,
      activeUnits: unitCount, // Assuming all units are active for now
      inactiveUnits: 0
    }

    const response: ApiResponse<DashboardKPIs> = {
      success: true,
      data: kpis,
      message: 'تم تحميل بيانات لوحة التحكم بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}