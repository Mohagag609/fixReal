import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/broker-due - Get broker dues with pagination
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const brokerId = searchParams.get('brokerId') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { broker: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (brokerId) {
      whereClause.brokerId = brokerId
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    const brokerDues = await prisma.brokerDue.findMany({
      where: whereClause,
      include: {
        broker: true
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = brokerDues.length > limit
    const data = hasMore ? brokerDues.slice(0, limit) : brokerDues
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<any> = {
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
    console.error('Error getting broker dues:', error)
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