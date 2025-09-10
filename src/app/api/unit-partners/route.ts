import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, UnitPartner, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/unit-partners - Get unit partners with pagination
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
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect()
    } catch (error) {
      console.log('Reconnecting to database...')
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const cursor = searchParams.get('cursor')
    const unitId = searchParams.get('unitId')
    const partnerId = searchParams.get('partnerId')

    let whereClause: any = { deletedAt: null }

    if (unitId) {
      whereClause.unitId = unitId
    }

    if (partnerId) {
      whereClause.partnerId = partnerId
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    const unitPartners = await prisma.unitPartner.findMany({
      where: whereClause,
      include: {
        unit: true,
        partner: true
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = unitPartners.length > limit
    const data = hasMore ? unitPartners.slice(0, limit) : unitPartners
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<UnitPartner> = {
      success: true,
      data,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    }

    await prisma.$disconnect()

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting unit partners:', error)
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

// POST /api/unit-partners - Create new unit partner
export async function POST(request: NextRequest) {
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
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect()
    } catch (error) {
      console.log('Reconnecting to database...')
    }

    const body = await request.json()
    const { unitId, partnerId, percentage } = body

    // Validation
    if (!unitId || !partnerId || !percentage) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (percentage <= 0 || percentage > 100) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'النسبة يجب أن تكون بين 0 و 100' },
        { status: 400 }
      )
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    })

    if (!unit) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 400 }
      )
    }

    // Check if partner is already linked to this unit
    const existingLink = await prisma.unitPartner.findFirst({
      where: { unitId, partnerId, deletedAt: null }
    })

    if (existingLink) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'هذا الشريك مرتبط بالفعل بهذه الوحدة' },
        { status: 400 }
      )
    }

    // Check total percentage
    const currentTotal = await prisma.unitPartner.aggregate({
      where: { unitId, deletedAt: null },
      _sum: { percentage: true }
    })

    const currentTotalPercent = currentTotal._sum.percentage || 0
    if (currentTotalPercent + percentage > 100) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: `لا يمكن إضافة هذه النسبة. الإجمالي الحالي هو ${currentTotalPercent}%. إضافة ${percentage}% سيجعل المجموع يتجاوز 100%.` },
        { status: 400 }
      )
    }

    // Create unit partner
    const unitPartner = await prisma.unitPartner.create({
      data: {
        unitId,
        partnerId,
        percentage
      },
      include: {
        unit: true,
        partner: true
      }
    })

    const response: ApiResponse<UnitPartner> = {
      success: true,
      data: unitPartner,
      message: 'تم ربط الشريك بالوحدة بنجاح'
    }

    await prisma.$disconnect()

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating unit partner:', error)
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