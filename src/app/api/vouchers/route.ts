import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, Voucher, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/vouchers - Get vouchers with pagination
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
    const type = searchParams.get('type') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { payer: { contains: search, mode: 'insensitive' } },
        { beneficiary: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      whereClause.type = type
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

    const vouchers = await prisma.voucher.findMany({
      where: whereClause,
      include: {
        safe: true,
        unit: true
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = vouchers.length > limit
    const data = hasMore ? vouchers.slice(0, limit) : vouchers
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<Voucher> = {
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
    console.error('Error getting vouchers:', error)
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

// POST /api/vouchers - Create new voucher
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
    const { type, date, amount, safeId, description, payer, beneficiary, linkedRef } = body

    // Validation
    if (!type || !date || !amount || !safeId || !description) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    if (type !== 'receipt' && type !== 'payment') {
      return NextResponse.json(
        { success: false, error: 'نوع السند يجب أن يكون receipt أو payment' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if safe exists
    const safe = await prisma.safe.findUnique({
      where: { id: safeId }
    })

    if (!safe) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 400 }
      )
    }

    // Check if linked unit exists (if provided)
    if (linkedRef) {
      const unit = await prisma.unit.findUnique({
        where: { id: linkedRef }
      })

      if (!unit) {
        return NextResponse.json(
          { success: false, error: 'الوحدة المرتبطة غير موجودة' },
          { status: 400 }
        )
      }
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        type,
        date: new Date(date),
        amount,
        safeId,
        description,
        payer,
        beneficiary,
        linkedRef
      },
      include: {
        safe: true,
        unit: true
      }
    })

    // Update safe balance
    const balanceChange = type === 'receipt' ? amount : -amount
    await prisma.safe.update({
      where: { id: safeId },
      data: { balance: { increment: balanceChange } }
    })

    const response: ApiResponse<Voucher> = {
      success: true,
      data: voucher,
      message: 'تم إضافة السند بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating voucher:', error)
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