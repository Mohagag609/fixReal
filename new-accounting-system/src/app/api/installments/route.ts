import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const installmentSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  dueDate: z.string().transform((str) => new Date(str)),
  status: z.enum(['مدفوع', 'معلق', 'متأخر']).default('معلق'),
  notes: z.string().optional(),
})

// GET /api/installments - Get all installments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const unitId = searchParams.get('unitId') || ''

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        unit: {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
          ],
        },
      }),
      ...(status && { status }),
      ...(unitId && { unitId }),
    }

    const [installments, total] = await Promise.all([
      prisma.installment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          unit: {
            select: { code: true, name: true, totalPrice: true },
          },
        },
      }),
      prisma.installment.count({ where }),
    ])

    return NextResponse.json({
      data: installments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching installments:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الأقساط' },
      { status: 500 }
    )
  }
}

// POST /api/installments - Create new installment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = installmentSchema.parse(body)

    // Check if unit exists
    const unit = await prisma.unit.findFirst({
      where: { id: validatedData.unitId, deletedAt: null },
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    const installment = await prisma.installment.create({
      data: validatedData,
      include: {
        unit: {
          select: { code: true, name: true, totalPrice: true },
        },
      },
    })

    return NextResponse.json(installment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating installment:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء القسط' },
      { status: 500 }
    )
  }
}