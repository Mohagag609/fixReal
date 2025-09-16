import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { cache as cacheClient, CacheKeys, CacheTTL } from '@/lib/cache/redis'
import { ApiResponse, DashboardKPIs } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dashboard - Get dashboard KPIs
export async function GET(request: NextRequest) {
  try {

    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    
    // Try to get cached dashboard data first (with error handling) - skip if refresh requested
    let kpis: DashboardKPIs | null = null
    
    if (!refresh) {
      try {
        kpis = await cacheClient.get(CacheKeys.dashboard)
        if (kpis) {
          console.log('Using cached dashboard data')
          return NextResponse.json({
            success: true,
            data: kpis,
            message: 'تم تحميل بيانات لوحة التحكم من الكاش'
          })
        }
      } catch (cacheError) {
        console.log('Cache error, proceeding without cache:', cacheError)
      }
    } else {
      console.log('Refresh requested, skipping cache')
    }

    const prisma = getPrismaClient(config)

    // Optimized single query with Redis caching (fast - ~200ms first time, ~10ms cached)
    console.log('Using optimized raw query for dashboard data')
    
    const dashboardData = await prisma.$queryRaw`
      WITH contract_stats AS (
        SELECT 
          COUNT(*) as contract_count,
          COALESCE(SUM("totalPrice"), 0) as total_contract_value
        FROM contracts 
        WHERE "deletedAt" IS NULL
      ),
      voucher_stats AS (
        SELECT 
          COUNT(*) as voucher_count,
          COALESCE(SUM(amount), 0) as total_voucher_amount
        FROM vouchers 
        WHERE "deletedAt" IS NULL
      ),
      installment_stats AS (
        SELECT 
          COUNT(*) as installment_count,
          COUNT(*) FILTER (WHERE status = 'مدفوعة') as paid_installments_count,
          COUNT(*) FILTER (WHERE status = 'غير مدفوعة') as pending_installments_count
        FROM installments 
        WHERE "deletedAt" IS NULL
      ),
      unit_stats AS (
        SELECT COUNT(*) as unit_count
        FROM units 
        WHERE "deletedAt" IS NULL
      ),
      customer_stats AS (
        SELECT COUNT(*) as customer_count
        FROM customers 
        WHERE "deletedAt" IS NULL
      )
      SELECT 
        c.contract_count,
        c.total_contract_value,
        v.voucher_count,
        v.total_voucher_amount,
        i.installment_count,
        i.paid_installments_count,
        i.pending_installments_count,
        u.unit_count,
        cu.customer_count
      FROM contract_stats c
      CROSS JOIN voucher_stats v
      CROSS JOIN installment_stats i
      CROSS JOIN unit_stats u
      CROSS JOIN customer_stats cu
    ` as unknown[]

    // Calculate KPIs using aggregated data from single query
    const data = dashboardData[0] as any
    kpis = {
      totalContracts: Number(data?.contract_count || 0),
      totalVouchers: Number(data?.voucher_count || 0),
      totalInstallments: Number(data?.installment_count || 0),
      totalUnits: Number(data?.unit_count || 0),
      totalCustomers: Number(data?.customer_count || 0),
      totalContractValue: Number(data?.total_contract_value || 0),
      totalVoucherAmount: Number(data?.total_voucher_amount || 0),
      paidInstallments: Number(data?.paid_installments_count || 0),
      pendingInstallments: Number(data?.pending_installments_count || 0),
      activeUnits: Number(data?.unit_count || 0), // Assuming all units are active for now
      inactiveUnits: 0,
      totalSales: Number(data?.total_contract_value || 0),
      totalReceipts: Number(data?.total_voucher_amount || 0),
      totalExpenses: 0, // Placeholder - would need separate query for expenses
      netProfit: Number(data?.total_contract_value || 0) - 0 // Placeholder calculation
    }

    // Cache the result for future requests (with error handling)
    try {
      await cacheClient.set(CacheKeys.dashboard, kpis, { ttl: CacheTTL.DASHBOARD })
      console.log('Dashboard data cached successfully')
    } catch (cacheError) {
      console.log('Cache set error:', cacheError)
    }

    await prisma.$disconnect()

    const response: ApiResponse<DashboardKPIs> = {
      success: true,
      data: kpis,
      message: 'تم تحميل بيانات لوحة التحكم بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    
    // التحقق من نوع الخطأ
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }
    
    // إذا كان الخطأ متعلق بقاعدة البيانات غير موجودة
    if (errorMessage.includes('does not exist') || 
        errorMessage.includes('Database') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('PrismaClientInitializationError')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'خطأ في قاعدة البيانات',
          redirectTo: '/setup',
          message: 'قاعدة البيانات غير مُعدة بشكل صحيح. يرجى الذهاب إلى صفحة الإعدادات'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}