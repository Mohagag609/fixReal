import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { cache as cacheClient, CacheKeys } from '@/lib/cache/redis'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/units/bulk - Bulk create units
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const body = await request.json()
    const { units } = body

    if (!units || !Array.isArray(units) || units.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب إرسال قائمة من الوحدات' },
        { status: 400 }
      )
    }

    if (units.length > 500) {
      return NextResponse.json(
        { success: false, error: 'الحد الأقصى 500 وحدة في المرة الواحدة' },
        { status: 400 }
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
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect()
    } catch (error) {
      console.log('Reconnecting to database...')
    }

    // تحضير البيانات للاستيراد
    const unitsToCreate = units.map(unit => {
      const sanitizedBuilding = (unit.building || 'غير محدد').replace(/\s/g, '')
      const sanitizedFloor = (unit.floor || 'غير محدد').replace(/\s/g, '')
      const sanitizedName = (unit.name || '').replace(/\s/g, '')
      const code = `${sanitizedName}-${sanitizedFloor}-${sanitizedBuilding}`
      
      return {
        code,
        name: unit.name?.trim() || '',
        unitType: unit.unitType || 'سكني',
        area: unit.area?.trim() || null,
        floor: unit.floor?.trim() || null,
        building: unit.building?.trim() || null,
        totalPrice: unit.totalPrice ? parseFloat(unit.totalPrice) : 0,
        status: unit.status || 'متاحة',
        notes: unit.notes?.trim() || 'مستورد تلقائياً',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }).filter(unit => unit.name) // إزالة الوحدات بدون أسماء

    if (unitsToCreate.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'لا توجد وحدات صالحة للاستيراد' },
        { status: 400 }
      )
    }

    // فحص التكرار قبل الاستيراد
    const existingCodes = await prisma.unit.findMany({
      where: {
        code: { in: unitsToCreate.map(u => u.code) },
        deletedAt: null
      },
      select: { code: true }
    })

    const existingCodesSet = new Set(existingCodes.map(u => u.code))

    // تصفية الوحدات المكررة
    const validUnits = unitsToCreate.filter(unit => !existingCodesSet.has(unit.code))

    if (validUnits.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'جميع الوحدات مكررة' },
        { status: 400 }
      )
    }

    // استخدام createMany للاستيراد السريع
    const result = await prisma.unit.createMany({
      data: validUnits,
      skipDuplicates: true
    })

    await prisma.$disconnect()

    // تعطيل cache invalidation أثناء bulk insert لتحسين الأداء
    cacheClient.invalidatePattern('units:list:*').catch(err => 
      console.log('Cache invalidation error:', err)
    )

    const response: ApiResponse<{ count: number, skipped: number }> = {
      success: true,
      data: {
        count: result.count,
        skipped: unitsToCreate.length - validUnits.length
      },
      message: `تم إضافة ${result.count} وحدة بنجاح${result.count < validUnits.length ? `، تم تجاهل ${unitsToCreate.length - validUnits.length} وحدة مكررة` : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error bulk creating units:', error)
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
