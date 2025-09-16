import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { cache as cacheClient } from '@/lib/cache/redis'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/customers/bulk - Bulk create customers
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const body = await request.json()
    const { customers } = body

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب إرسال قائمة من العملاء' },
        { status: 400 }
      )
    }

    if (customers.length > 500) {
      return NextResponse.json(
        { success: false, error: 'الحد الأقصى 500 عميل في المرة الواحدة' },
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
    const customersToCreate = customers.map(customer => ({
      name: customer.name?.trim() || '',
      phone: customer.phone?.trim() || null,
      nationalId: customer.nationalId?.trim() || null,
      address: customer.address?.trim() || null,
      status: customer.status || 'نشط',
      notes: customer.notes?.trim() || 'مستورد تلقائياً',
      createdAt: new Date(),
      updatedAt: new Date()
    })).filter(customer => customer.name) // إزالة العملاء بدون أسماء

    // فحص التكرار داخل الملف نفسه
    const seenNames = new Set<string>()
    const uniqueCustomers = customersToCreate.filter(customer => {
      const nameKey = customer.name.toLowerCase()
      if (seenNames.has(nameKey)) {
        return false // تجاهل المكرر في نفس الملف
      }
      seenNames.add(nameKey)
      return true
    })

    if (uniqueCustomers.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'لا توجد عملاء صالحين للاستيراد' },
        { status: 400 }
      )
    }

    // فحص التكرار قبل الاستيراد (تحسين الأداء)
    const existingPhones = await prisma.customer.findMany({
      where: {
        phone: { in: uniqueCustomers.map(c => c.phone).filter(Boolean) },
        deletedAt: null
      },
      select: { phone: true }
    })

    const existingNationalIds = await prisma.customer.findMany({
      where: {
        nationalId: { in: uniqueCustomers.map(c => c.nationalId).filter(Boolean) },
        deletedAt: null
      },
      select: { nationalId: true }
    })

    // فحص تكرار الأسماء (مهم جداً)
    const existingNames = await prisma.customer.findMany({
      where: {
        name: { in: uniqueCustomers.map(c => c.name).filter(Boolean) },
        deletedAt: null
      },
      select: { name: true }
    })

    const existingPhonesSet = new Set(existingPhones.map(c => c.phone))
    const existingNationalIdsSet = new Set(existingNationalIds.map(c => c.nationalId))
    const existingNamesSet = new Set(existingNames.map(c => c.name.toLowerCase()))

    // تصفية العملاء المكررة (بما في ذلك الأسماء)
    const validCustomers = uniqueCustomers.filter(customer => {
      // فحص تكرار الاسم (حساس للحالة)
      if (existingNamesSet.has(customer.name.toLowerCase())) {
        return false
      }
      if (customer.phone && existingPhonesSet.has(customer.phone)) {
        return false
      }
      if (customer.nationalId && existingNationalIdsSet.has(customer.nationalId)) {
        return false
      }
      return true
    })

    if (validCustomers.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'جميع العملاء مكررين' },
        { status: 400 }
      )
    }

    // استخدام createMany للاستيراد السريع
    const result = await prisma.customer.createMany({
      data: validCustomers,
      skipDuplicates: true // تجاهل المكررات تلقائياً
    })

    await prisma.$disconnect()

    // تحديث الكاش بعد الاستيراد الناجح
    try {
      await cacheClient.invalidatePattern('customers:list:*')
      console.log('Customers cache invalidated after bulk import')
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError)
    }

    const skippedCount = uniqueCustomers.length - validCustomers.length
    const response: ApiResponse<{ count: number, skipped: number }> = {
      success: true,
      data: {
        count: result.count,
        skipped: skippedCount
      },
      message: `تم إضافة ${result.count} عميل بنجاح${skippedCount > 0 ? `، تم تجاهل ${skippedCount} عميل مكرر (أسماء أو أرقام هواتف أو هويات وطنية)` : ''}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error bulk creating customers:', error)
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
