import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { ApiResponse, PartnerDebt, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/partner-debts - Get partner debts with pagination
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
    const partnerId = searchParams.get('partnerId')

    let whereClause: any = { deletedAt: null }

    if (partnerId) {
      whereClause.partnerId = partnerId
    }

    if (search) {
      whereClause.OR = [
        { partner: { name: { contains: search, mode: 'insensitive' } } },
        { status: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // BEFORE: Include full partner relation (slow)
    // AFTER: Select only essential partner fields (fast)
    
    const partnerDebts = await prisma.partnerDebt.findMany({
      where: whereClause,
      select: {
        id: true,
        partnerId: true,
        amount: true,
        dueDate: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        partner: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    })

    const hasMore = partnerDebts.length > limit
    const data = hasMore ? partnerDebts.slice(0, limit) : partnerDebts
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<PartnerDebt> = {
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
      console.error('Error in partner-debts:', error)
      return NextResponse.json(
        { success: false, error: 'خطأ في قاعدة البيانات' },
        { status: 500 }
      )
    }
}

// POST /api/partner-debts - Create new partner debt
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

    const body = await request.json()
    const { partnerId, amount, dueDate, notes } = body

    // Validation
    if (!partnerId || !amount || !dueDate) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الشريك والمبلغ وتاريخ الاستحقاق مطلوبة' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      await prisma.$disconnect()

    return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 400 }
      )
    }

    // Create partner debt
    const partnerDebt = await prisma.partnerDebt.create({
      data: {
        partnerId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes: notes || null,
        status: 'غير مدفوع'
      },
      include: {
        partner: true
      }
    })

    const response: ApiResponse<PartnerDebt> = {
      success: true,
      data: partnerDebt,
      message: 'تم إضافة دين الشريك بنجاح'
    }

    await prisma.$disconnect()

    return NextResponse.json(response)
  } catch (error) {
      console.error('Error in partner-debts:', error)
      return NextResponse.json(
        { success: false, error: 'خطأ في قاعدة البيانات' },
        { status: 500 }
      )
    }
}