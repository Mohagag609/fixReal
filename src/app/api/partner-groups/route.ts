import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'

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

    let whereClause: any = {}
    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // BEFORE: Complex nested include (very slow)
    // AFTER: Select only essential fields with count (fast)
    // TODO: Consider implementing separate endpoint for group details
    
    const partnerGroups = await prisma.partnerGroup.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            partners: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = partnerGroups.length > limit
    const data = hasMore ? partnerGroups.slice(0, limit) : partnerGroups
    const nextCursor = hasMore ? data[data.length - 1].id : null

    // Transform the data to match the expected format
    const transformedGroups = data.map(group => ({
      id: group.id,
      name: group.name,
      notes: group.notes,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      partners: group.partners.map(p => ({
        partnerId: p.partnerId,
        percent: p.percentage
      }))
    }))

    await prisma.$disconnect()

    return NextResponse.json({ 
      success: true, 
      data: transformedGroups,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    })
  } catch (error) {
    console.error('Error fetching partner groups:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }

    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

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

    const { name, notes } = await request.json()

    if (!name || !name.trim()) {
      await prisma.$disconnect()

    return NextResponse.json({ success: false, error: 'اسم المجموعة مطلوب' }, { status: 400 })
    }

    const partnerGroup = await prisma.partnerGroup.create({
      data: {
        name: name.trim(),
        notes: notes?.trim() || null
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({ 
      success: true, 
      data: {
        id: partnerGroup.id,
        name: partnerGroup.name,
        notes: partnerGroup.notes,
        createdAt: partnerGroup.createdAt,
        updatedAt: partnerGroup.updatedAt,
        partners: []
      }
    })
  } catch (error) {
    console.error('Error creating partner group:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }

    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}