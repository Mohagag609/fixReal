import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/installments - Get installments with pagination
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const whereClause: Record<string, unknown> = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { unit: { code: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereClause.status = status
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

    // BEFORE: Include full unit relation (slow)
    // AFTER: Select only essential unit fields (fast)
    
    const installments = await prisma.installment.findMany({
      where: whereClause,
      select: {
        id: true,
        unitId: true,
        amount: true,
        dueDate: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        unit: {
          select: {
            id: true,
            code: true,
            name: true,
            unitType: true,
            status: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = installments.length > limit
    const data = hasMore ? installments.slice(0, limit) : installments
    const nextCursor = hasMore && data.length > 0 ? (data[data.length - 1] as any)?.id : null

    const response: PaginatedResponse<unknown> = {
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
    console.error('Error getting installments:', error)
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

// POST /api/installments - Create new installment
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const body = await request.json()
    const { unitId, amount, dueDate } = body

    // Validation
    if (!unitId || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
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

    // Create installment
    const installment = await prisma.installment.create({
      data: {
        unitId,
        amount,
        dueDate: new Date(dueDate),
        status: 'pending',
        notes: ''
      },
      include: {
        unit: true
      }
    })

    await prisma.$disconnect()

    const response: ApiResponse<unknown> = {
      success: true,
      data: installment,
      message: 'تم إضافة القسط بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating installment:', error)
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