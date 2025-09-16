import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { cache as cacheClient, CacheKeys, CacheTTL } from '@/lib/cache/redis'
import { ApiResponse, Partner, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/partners - Get partners with pagination
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''

    // Create cache key based on parameters
    const cacheKey = CacheKeys.entityList('partners', `limit:${limit},cursor:${cursor || 'null'},search:${search}`)
    
    // Try to get cached data first
    const cachedData = await cacheClient.get<PaginatedResponse<Partner>>(cacheKey)
    if (cachedData) {
      console.log('Using cached partners data')
      return NextResponse.json(cachedData)
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

    const whereClause: Record<string, unknown> = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // BEFORE: Complex include with nested relations (slow)
    // AFTER: Optimized query with select only needed fields (fast)
    // TODO: Consider implementing separate endpoints for relations if needed
    
    const partners = await prisma.partner.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // Only include essential relations to avoid N+1 queries
        _count: {
          select: {
            unitPartners: {
              where: { deletedAt: null }
            },
            partnerDebts: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    await prisma.$disconnect()

    const hasMore = partners.length > limit
    const data = hasMore ? partners.slice(0, limit) : partners
    const nextCursor = hasMore && data.length > 0 ? (data[data.length - 1] as any)?.id : null

    const response: PaginatedResponse<Partner> = {
      success: true,
      data,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    }

    // Cache the response for future requests
    await cacheClient.set(cacheKey, response, { ttl: CacheTTL.ENTITY })
    console.log('Partners data cached successfully')

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting partners:', error)
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

// POST /api/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const body = await request.json()
    const { name, phone, notes } = body

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

    // Validation
    if (!name) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'اسم الشريك مطلوب' },
        { status: 400 }
      )
    }

    // Create partner
    const partner = await prisma.partner.create({
      data: {
        name,
        phone,
        notes
      }
    })

    await prisma.$disconnect()

    // Invalidate partners cache when new partner is created
    await cacheClient.invalidatePattern('partners:list:*')
    console.log('Partners cache invalidated after creation')

    const response: ApiResponse<Partner> = {
      success: true,
      data: partner,
      message: 'تم إضافة الشريك بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating partner:', error)
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