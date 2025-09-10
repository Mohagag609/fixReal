import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, Safe, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/safes - Get safes with pagination
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
      whereClause.name = { contains: search, mode: 'insensitive' }
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

    // BEFORE: Complex include with multiple relations (very slow)
    // AFTER: Select only essential fields with counts (fast)
    // TODO: Consider implementing separate endpoints for safe details
    
    const safes = await prisma.safe.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        // Only include counts instead of full relations
        _count: {
          select: {
            vouchers: {
              where: { deletedAt: null }
            },
            transfersFrom: {
              where: { deletedAt: null }
            },
            transfersTo: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = safes.length > limit
    const data = hasMore ? safes.slice(0, limit) : safes
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<Safe> = {
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
    console.error('Error getting safes:', error)
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

// POST /api/safes - Create new safe
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

    const body = await request.json()
    const { name, balance } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مطلوب' },
        { status: 400 }
      )
    }

    if (balance && balance < 0) {
      return NextResponse.json(
        { success: false, error: 'الرصيد لا يمكن أن يكون سالباً' },
        { status: 400 }
      )
    }

    // Check if safe name already exists
    const existingSafe = await prisma.safe.findUnique({
      where: { name }
    })

    if (existingSafe) {
      await prisma.$disconnect()
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create safe
    const safe = await prisma.safe.create({
      data: {
        name,
        balance: balance || 0
      }
    })

    await prisma.$disconnect()

    const response: ApiResponse<Safe> = {
      success: true,
      data: safe,
      message: 'تم إضافة الخزنة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating safe:', error)
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