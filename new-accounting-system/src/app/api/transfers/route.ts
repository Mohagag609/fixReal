import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const transferSchema = z.object({
  fromSafeId: z.string().min(1, 'الخزينة المصدر مطلوبة'),
  toSafeId: z.string().min(1, 'الخزينة الوجهة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  description: z.string().optional(),
})

// GET /api/transfers - Get all transfers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const fromSafeId = searchParams.get('fromSafeId') || ''
    const toSafeId = searchParams.get('toSafeId') || ''

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        description: { contains: search },
      }),
      ...(fromSafeId && { fromSafeId }),
      ...(toSafeId && { toSafeId }),
    }

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromSafe: {
            select: { name: true },
          },
          toSafe: {
            select: { name: true },
          },
        },
      }),
      prisma.transfer.count({ where }),
    ])

    return NextResponse.json({
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'فشل في جلب التحويلات' },
      { status: 500 }
    )
  }
}

// POST /api/transfers - Create new transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = transferSchema.parse(body)

    // Check if both safes exist
    const [fromSafe, toSafe] = await Promise.all([
      prisma.safe.findFirst({
        where: { id: validatedData.fromSafeId, deletedAt: null },
      }),
      prisma.safe.findFirst({
        where: { id: validatedData.toSafeId, deletedAt: null },
      }),
    ])

    if (!fromSafe) {
      return NextResponse.json(
        { error: 'الخزينة المصدر غير موجودة' },
        { status: 404 }
      )
    }

    if (!toSafe) {
      return NextResponse.json(
        { error: 'الخزينة الوجهة غير موجودة' },
        { status: 404 }
      )
    }

    if (fromSafe.id === toSafe.id) {
      return NextResponse.json(
        { error: 'لا يمكن التحويل لنفس الخزينة' },
        { status: 400 }
      )
    }

    // Check if source safe has enough balance
    if (fromSafe.balance < validatedData.amount) {
      return NextResponse.json(
        { error: 'الرصيد غير كافي في الخزينة المصدر' },
        { status: 400 }
      )
    }

    // Filter out undefined values to satisfy Prisma's exactOptionalPropertyTypes
    const createData = {
      fromSafeId: validatedData.fromSafeId,
      toSafeId: validatedData.toSafeId,
      amount: validatedData.amount,
      ...(validatedData.description !== undefined && { description: validatedData.description }),
    }

    // Create transfer and update balances in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer
      const transfer = await tx.transfer.create({
        data: createData,
        include: {
          fromSafe: {
            select: { name: true },
          },
          toSafe: {
            select: { name: true },
          },
        },
      })

      // Update balances
      await tx.safe.update({
        where: { id: validatedData.fromSafeId },
        data: { balance: { decrement: validatedData.amount } },
      })

      await tx.safe.update({
        where: { id: validatedData.toSafeId },
        data: { balance: { increment: validatedData.amount } },
      })

      return transfer
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء التحويل' },
      { status: 500 }
    )
  }
}