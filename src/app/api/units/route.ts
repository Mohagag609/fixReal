import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
// import { validateUnit } from '@/utils/validation'
import { cache as cacheClient, CacheKeys, CacheTTL } from '@/lib/cache/redis'
import { ApiResponse, Unit, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/units - Get units with pagination
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '1000') // زيادة الحد الأقصى لعرض جميع الوحدات
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''
    const refresh = searchParams.get('refresh') === 'true'

    // Create cache key based on parameters
    const cacheKey = CacheKeys.entityList('units', `limit:${limit},cursor:${cursor || 'null'},search:${search}`)
    
    // Try to get cached data first - skip if refresh requested
    if (!refresh) {
      try {
        const cachedData = await cacheClient.get<PaginatedResponse<Unit>>(cacheKey)
        if (cachedData) {
          console.log('Using cached units data')
          return NextResponse.json(cachedData)
        }
      } catch (cacheError) {
        console.log('Cache error, proceeding without cache:', cacheError)
      }
    } else {
      console.log('Refresh requested, skipping cache')
    }

    const whereClause: Record<string, unknown> = { deletedAt: null }

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

    // Optimized query with compound indexes for better performance
    const units = await prisma.unit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Use indexed column for sorting
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
        updatedAt: true,
        // Add counts for better UX without heavy joins
        _count: {
          select: {
            contracts: {
              where: { deletedAt: null }
            },
            installments: {
              where: { deletedAt: null }
            },
            vouchers: {
              where: { deletedAt: null }
            },
            unitPartners: {
              where: { deletedAt: null }
            }
          }
        }
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

    // Cache the response for future requests (with error handling)
    try {
      await cacheClient.set(cacheKey, response, { ttl: CacheTTL.ENTITY })
      console.log('Units data cached successfully')
    } catch (cacheError) {
      console.log('Cache set error:', cacheError)
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
    // Authentication check removed for better performance

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
        { success: false, error: `وحدة بنفس الكود "${code}" موجودة بالفعل` },
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

      const totalPercent = partnerGroup.partners.reduce((sum: number, p: { percentage: number }) => sum + p.percentage, 0)
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

    // Invalidate units cache when new unit is created (async to not block response)
    cacheClient.invalidatePattern('units:list:*').catch(err => 
      console.log('Cache invalidation error:', err)
    )

    const response: ApiResponse<Unit> = {
      success: true,
      data: result,
      message: 'تم إضافة الوحدة وربط الشركاء بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating unit:', error)
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'وحدة بنفس الكود موجودة بالفعل' },
          { status: 400 }
        )
      }
    }
    
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