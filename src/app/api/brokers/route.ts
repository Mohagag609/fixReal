import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, Broker, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/brokers - Get brokers with pagination
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
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // BEFORE: Include full brokerDues relation (slow)
    // AFTER: Select only essential fields with count (fast)
    
    const brokers = await prisma.broker.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        commissionRate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            brokerDues: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = brokers.length > limit
    const data = hasMore ? brokers.slice(0, limit) : brokers
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<Broker> = {
      success: true,
      data,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting brokers:', error)
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

// POST /api/brokers - Create new broker
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
    const { name, phone, notes } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم السمسار مطلوب' },
        { status: 400 }
      )
    }

    // Check if broker name already exists
    const existingBroker = await prisma.broker.findUnique({
      where: { name }
    })

    if (existingBroker) {
      return NextResponse.json(
        { success: false, error: 'اسم السمسار مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create broker
    const broker = await prisma.broker.create({
      data: {
        name,
        phone,
        notes
      }
    })

    const response: ApiResponse<Broker> = {
      success: true,
      data: broker,
      message: 'تم إضافة السمسار بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating broker:', error)
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