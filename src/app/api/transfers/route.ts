import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, Transfer, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/transfers - Get transfers with pagination
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''

    const whereClause: Record<string, unknown> = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { fromSafe: { name: { contains: search, mode: 'insensitive' } } },
        { toSafe: { name: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // BEFORE: Include full safe relations (slow)
    // AFTER: Select only essential safe fields (fast)
    
    const transfers = await prisma.transfer.findMany({
      where: whereClause,
      select: {
        id: true,
        fromSafeId: true,
        toSafeId: true,
        amount: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        fromSafe: {
          select: {
            id: true,
            name: true,
            balance: true
          }
        },
        toSafe: {
          select: {
            id: true,
            name: true,
            balance: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = transfers.length > limit
    const data = hasMore ? transfers.slice(0, limit) : transfers
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<Transfer> = {
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
    console.error('Error getting transfers:', error)
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

// POST /api/transfers - Create new transfer
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for better performance

    const body = await request.json()
    const { fromSafeId, toSafeId, amount, description } = body

    // Validate required fields
    if (!fromSafeId || !toSafeId || !amount) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (fromSafeId === toSafeId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن التحويل من نفس الخزنة إلى نفسها' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if safes exist
    const [fromSafe, toSafe] = await Promise.all([
      prisma.safe.findUnique({ where: { id: fromSafeId } }),
      prisma.safe.findUnique({ where: { id: toSafeId } })
    ])

    if (!fromSafe || !toSafe) {
      return NextResponse.json(
        { success: false, error: 'إحدى الخزائن غير موجودة' },
        { status: 400 }
      )
    }

    if (fromSafe.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'الرصيد غير كافي في الخزنة المصدر' },
        { status: 400 }
      )
    }

    // Create transfer and update balances in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer
      const transfer = await tx.transfer.create({
        data: {
          fromSafeId,
          toSafeId,
          amount,
          description: description || `تحويل من ${fromSafe.name} إلى ${toSafe.name}`
        },
        include: {
          fromSafe: true,
          toSafe: true
        }
      })

      // Update balances
      await tx.safe.update({
        where: { id: fromSafeId },
        data: { balance: { decrement: amount } }
      })

      await tx.safe.update({
        where: { id: toSafeId },
        data: { balance: { increment: amount } }
      })

      return transfer
    })

    const response: ApiResponse<Transfer> = {
      success: true,
      data: result,
      message: 'تم إجراء التحويل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating transfer:', error)
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