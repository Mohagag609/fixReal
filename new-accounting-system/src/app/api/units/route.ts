import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const unitSchema = z.object({
  code: z.string().min(1, 'كود الوحدة مطلوب'),
  name: z.string().optional(),
  unitType: z.string().default('سكني'),
  area: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  totalPrice: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
  status: z.string().default('متاحة'),
  notes: z.string().optional(),
})

// GET /api/units - Get all units
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const unitType = searchParams.get('unitType') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search } },
          { name: { contains: search } },
          { building: { contains: search } },
        ],
      }),
      ...(status && { status }),
      ...(unitType && { unitType }),
      ...(minPrice && { totalPrice: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { totalPrice: { lte: parseFloat(maxPrice) } }),
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contracts: {
            where: { deletedAt: null },
            select: { id: true, totalPrice: true, start: true },
          },
          unitPartners: {
            where: { deletedAt: null },
            include: {
              partner: {
                select: { name: true, phone: true },
              },
            },
          },
        },
      }),
      prisma.unit.count({ where }),
    ])

    return NextResponse.json({
      data: units,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الوحدات' },
      { status: 500 }
    )
  }
}

// POST /api/units - Create new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = unitSchema.parse(body)

    // Check for duplicate code
    const existingUnit = await prisma.unit.findFirst({
      where: { code: validatedData.code, deletedAt: null },
    })
    if (existingUnit) {
      return NextResponse.json(
        { error: 'كود الوحدة موجود بالفعل' },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.create({
      data: validatedData,
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الوحدة' },
      { status: 500 }
    )
  }
}