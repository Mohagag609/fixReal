import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

const customerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  status: z.string().default('نشط'),
  notes: z.string().optional(),
})

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { nationalId: { contains: search } },
        ],
      }),
      ...(status && { status }),
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contracts: {
            where: { deletedAt: null },
            select: { id: true, totalPrice: true, start: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'فشل في جلب العملاء' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = customerSchema.parse(body)

    // Check for duplicate phone or nationalId
    if (validatedData.phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: { phone: validatedData.phone, deletedAt: null },
      })
      if (existingPhone) {
        return NextResponse.json(
          { error: 'رقم الهاتف موجود بالفعل' },
          { status: 400 }
        )
      }
    }

    if (validatedData.nationalId) {
      const existingNationalId = await prisma.customer.findFirst({
        where: { nationalId: validatedData.nationalId, deletedAt: null },
      })
      if (existingNationalId) {
        return NextResponse.json(
          { error: 'الرقم القومي موجود بالفعل' },
          { status: 400 }
        )
      }
    }

    // Filter out undefined values to satisfy Prisma's exactOptionalPropertyTypes
    const createData = {
      name: validatedData.name,
      status: validatedData.status,
      ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
      ...(validatedData.nationalId !== undefined && { nationalId: validatedData.nationalId }),
      ...(validatedData.address !== undefined && { address: validatedData.address }),
      ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
    }

    const customer = await prisma.customer.create({
      data: createData,
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'فشل في إنشاء العميل' },
      { status: 500 }
    )
  }
}