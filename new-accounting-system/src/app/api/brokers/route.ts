import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const brokerSchema = z.object({
  name: z.string().min(1, 'اسم الوسيط مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/brokers - Get all brokers
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
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    }

    const [brokers, total] = await Promise.all([
      prisma.broker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          brokerDues: {
            where: { deletedAt: null },
            select: { id: true, amount: true, dueDate: true, status: true },
          },
        },
      }),
      prisma.broker.count({ where }),
    ])

    return NextResponse.json({
      data: brokers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching brokers:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الوسطاء' },
      { status: 500 }
    )
  }
}

// POST /api/brokers - Create new broker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = brokerSchema.parse(body)

    // Check for duplicate name
    const existingBroker = await prisma.broker.findFirst({
      where: { name: validatedData.name, deletedAt: null },
    })
    if (existingBroker) {
      return NextResponse.json(
        { error: 'اسم الوسيط موجود بالفعل' },
        { status: 400 }
      )
    }

    const broker = await prisma.broker.create({
      data: validatedData,
    })

    return NextResponse.json(broker, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating broker:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الوسيط' },
      { status: 500 }
    )
  }
}