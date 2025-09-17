import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const partnerSchema = z.object({
  name: z.string().min(1, 'اسم الشريك مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/partners - Get all partners
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

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unitPartners: {
            where: { deletedAt: null },
            include: {
              unit: {
                select: { code: true, name: true, totalPrice: true },
              },
            },
          },
          partnerDebts: {
            where: { deletedAt: null },
            select: { id: true, amount: true, dueDate: true, status: true },
          },
          partnerGroupPartners: {
            where: { deletedAt: null },
            include: {
              partnerGroup: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.partner.count({ where }),
    ])

    return NextResponse.json({
      data: partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الشركاء' },
      { status: 500 }
    )
  }
}

// POST /api/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = partnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data: validatedData,
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating partner:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الشريك' },
      { status: 500 }
    )
  }
}