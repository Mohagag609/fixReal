import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const safeSchema = z.object({
  name: z.string().min(1, 'اسم الخزينة مطلوب'),
  balance: z.number().min(0, 'الرصيد يجب أن يكون أكبر من أو يساوي صفر'),
})

// GET /api/safes - Get all safes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        name: { contains: search },
      }),
    }

    const [safes, total] = await Promise.all([
      prisma.safe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vouchers: {
            where: { deletedAt: null },
            select: { id: true, type: true, amount: true, date: true },
          },
          transfersFrom: {
            where: { deletedAt: null },
            select: { id: true, amount: true, toSafe: { select: { name: true } } },
          },
          transfersTo: {
            where: { deletedAt: null },
            select: { id: true, amount: true, fromSafe: { select: { name: true } } },
          },
        },
      }),
      prisma.safe.count({ where }),
    ])

    return NextResponse.json({
      data: safes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching safes:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الخزائن' },
      { status: 500 }
    )
  }
}

// POST /api/safes - Create new safe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = safeSchema.parse(body)

    // Check for duplicate name
    const existingSafe = await prisma.safe.findFirst({
      where: { name: validatedData.name, deletedAt: null },
    })
    if (existingSafe) {
      return NextResponse.json(
        { error: 'اسم الخزينة موجود بالفعل' },
        { status: 400 }
      )
    }

    const safe = await prisma.safe.create({
      data: validatedData,
    })

    return NextResponse.json(safe, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating safe:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الخزينة' },
      { status: 500 }
    )
  }
}