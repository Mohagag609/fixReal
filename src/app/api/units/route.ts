import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { validateUnit } from '@/utils/validation'
import { ApiResponse, Unit, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/units - Get units with pagination
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { unitType: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
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

    const units = await prisma.unit.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        code: true,
        name: true,
        unitType: true,
        area: true,
        floor: true,
        building: true,
        totalPrice: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    const hasMore = units.length > limit
    const data = hasMore ? units.slice(0, limit) : units
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<Unit> = {
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
    console.error('Error getting units:', error)
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

// POST /api/units - Create new unit
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

    const body = await request.json()
    const { name, unitType, area, floor, building, totalPrice, status, notes, partnerGroupId } = body

    // Validate required fields - الاسم فقط مطلوب
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الوحدة مطلوب' },
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

    // Generate code from building, floor, and name (reversed order)
    const sanitizedBuilding = (building || 'غير محدد').replace(/\s/g, '')
    const sanitizedFloor = (floor || 'غير محدد').replace(/\s/g, '')
    const sanitizedName = name.replace(/\s/g, '')
    const code = `${sanitizedName}-${sanitizedFloor}-${sanitizedBuilding}`

    // Check if code already exists
    const existingUnit = await prisma.unit.findFirst({
      where: { 
        code,
        deletedAt: null
      }
    })

    if (existingUnit) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'وحدة بنفس الاسم والدور والبرج موجودة بالفعل' },
        { status: 400 }
      )
    }

    // Check if partner group exists and has 100% total (only if partnerGroupId is provided)
    let partnerGroup = null
    if (partnerGroupId && partnerGroupId.trim()) {
      partnerGroup = await prisma.partnerGroup.findFirst({
        where: { 
          id: partnerGroupId,
          deletedAt: null
        },
        include: { partners: true }
      })

      if (!partnerGroup) {
        await prisma.$disconnect()
        return NextResponse.json(
          { success: false, error: 'مجموعة الشركاء غير موجودة' },
          { status: 400 }
        )
      }

      const totalPercent = partnerGroup.partners.reduce((sum, p) => sum + p.percentage, 0)
      if (totalPercent !== 100) {
        await prisma.$disconnect()
        return NextResponse.json(
          { success: false, error: `مجموع نسب الشركاء في هذه المجموعة هو ${totalPercent}% ويجب أن يكون 100% بالضبط` },
          { status: 400 }
        )
      }
    }

    // Create unit and link partners in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create unit
      const unit = await tx.unit.create({
        data: {
          code,
          name,
          unitType: unitType || 'سكني',
          area: area || null,
          floor: floor || null,
          building: building || null,
          totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
          status: status || 'متاحة',
          notes: notes || null
        }
      })

      // Link partners from the group to the unit (only if partnerGroup exists)
      if (partnerGroup) {
        for (const groupPartner of partnerGroup.partners) {
          await tx.unitPartner.create({
            data: {
              unitId: unit.id,
              partnerId: groupPartner.partnerId,
              percentage: groupPartner.percentage
            }
          })
        }
      }

      return unit
    })

    await prisma.$disconnect()

    const response: ApiResponse<Unit> = {
      success: true,
      data: result,
      message: 'تم إضافة الوحدة وربط الشركاء بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating unit:', error)
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