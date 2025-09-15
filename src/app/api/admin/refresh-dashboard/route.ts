import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
// import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { cache as cacheClient } from '@/lib/cache/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/refresh-dashboard - Clear dashboard cache
export async function POST(_request: NextRequest) {
  try {
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    try {
      // Clear dashboard cache
      await cacheClient.del('dashboard:kpis')
      console.log('Dashboard cache cleared successfully')

      return NextResponse.json({
        success: true,
        message: 'تم مسح كاش لوحة التحكم بنجاح'
      })

    } catch (error) {
      console.error('Error clearing cache:', error)
      
      return NextResponse.json({
        success: false,
        error: 'فشل في مسح الكاش',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in refresh-dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// GET /api/admin/refresh-dashboard - Get cache status
export async function GET(_request: NextRequest) {
  try {
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    try {
      // Check cache status
      const cacheExists = await cacheClient.get('dashboard:kpis') !== null
      
      return NextResponse.json({
        success: true,
        cacheExists: !!cacheExists,
        message: cacheExists ? 'الكاش موجود ويعمل' : 'الكاش غير موجود'
      })

    } catch (error) {
      console.error('Error checking cache:', error)
      
      return NextResponse.json({
        success: false,
        error: 'خطأ في فحص الكاش',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in refresh-dashboard GET:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

