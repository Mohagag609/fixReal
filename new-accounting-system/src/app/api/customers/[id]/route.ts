import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  // Return empty array for static generation
  return [];
}

const customerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  status: z.string().default('نشط'),
  notes: z.string().optional(),
})

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await prisma.customer.findFirst({
      where: { id: id, deletedAt: null },
      include: {
        contracts: {
          where: { deletedAt: null },
          include: {
            unit: {
              select: { code: true, name: true, totalPrice: true },
            },
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'فشل في جلب العميل' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = customerSchema.parse(body)

    // Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { id: id, deletedAt: null },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Check for duplicate phone or nationalId (excluding current customer)
    if (validatedData.phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: { 
          phone: validatedData.phone, 
          deletedAt: null,
          id: { not: id }
        },
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
        where: { 
          nationalId: validatedData.nationalId, 
          deletedAt: null,
          id: { not: id }
        },
      })
      if (existingNationalId) {
        return NextResponse.json(
          { error: 'الرقم القومي موجود بالفعل' },
          { status: 400 }
        )
      }
    }

    // Filter out undefined values to satisfy Prisma's exactOptionalPropertyTypes
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    )

    const customer = await prisma.customer.update({
      where: { id: id },
      data: updateData,
    })

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث العميل' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Soft delete customer
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await prisma.customer.findFirst({
      where: { id: id, deletedAt: null },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Check if customer has active contracts
    const activeContracts = await prisma.contract.count({
      where: { customerId: id, deletedAt: null },
    })

    if (activeContracts > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف العميل لوجود عقود نشطة' },
        { status: 400 }
      )
    }

    await prisma.customer.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'تم حذف العميل بنجاح' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'فشل في حذف العميل' },
      { status: 500 }
    )
  }
}