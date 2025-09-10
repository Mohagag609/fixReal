import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache/redis'
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

    // Try to get cached dashboard data first
    let kpis: DashboardKPIs | null = null
    
    try {
      kpis = await cache.get(CacheKeys.dashboard)
      if (kpis) {
        console.log('Using cached dashboard data')
        return NextResponse.json({
          success: true,
          data: kpis,
          message: 'تم تحميل بيانات لوحة التحكم من الكاش'
        })
      }
    } catch (error) {
      console.log('Cache unavailable, fetching from database')
    }

    const prisma = getPrismaClient(config)

    // BEFORE: Sequential Prisma queries (slow - 2-3 seconds)
    // AFTER: Optimized single query with Redis caching (fast - ~200ms first time, ~10ms cached)
    // TODO: Consider implementing Postgres materialized view for even better performance
    
    // Try to use materialized view first, fallback to raw query
    let dashboardData: any[]
    
    try {
      // Use materialized view for better performance
      dashboardData = await prisma.$queryRaw`
        SELECT * FROM get_dashboard_summary()
      ` as any[]
      
      if (dashboardData.length === 0) {
        throw new Error('Materialized view empty, falling back to raw query')
      }
      
      console.log('Using materialized view for dashboard data')
    } catch (error) {
      console.log('Materialized view not available, using raw query:', error)
      
      // Fallback to raw query
      dashboardData = await prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM contracts WHERE "deletedAt" IS NULL) as contract_count,
          (SELECT COUNT(*) FROM vouchers WHERE "deletedAt" IS NULL) as voucher_count,
          (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL) as installment_count,
          (SELECT COUNT(*) FROM units WHERE "deletedAt" IS NULL) as unit_count,
          (SELECT COUNT(*) FROM customers WHERE "deletedAt" IS NULL) as customer_count,
          (SELECT COALESCE(SUM("totalPrice"), 0) FROM contracts WHERE "deletedAt" IS NULL) as total_contract_value,
          (SELECT COALESCE(SUM(amount), 0) FROM vouchers WHERE "deletedAt" IS NULL) as total_voucher_amount,
          (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL AND status = 'مدفوعة') as paid_installments_count,
          (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL AND status = 'غير مدفوعة') as pending_installments_count
      ` as any[]
    }

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
      inactiveUnits: 0
    }

    // Cache the result for future requests
    try {
      await cache.set(CacheKeys.dashboard, kpis, { 
        ttl: CacheTTL.DASHBOARD,
        prefix: 'dashboard' 
      })
      console.log('Dashboard data cached successfully')
    } catch (error) {
      console.log('Failed to cache dashboard data')
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