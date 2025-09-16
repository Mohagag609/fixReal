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

// GET /api/units/[id] - Get unit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await prisma.unit.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        contracts: {
          where: { deletedAt: null },
          include: {
            customer: {
              select: { name: true, phone: true },
            },
          },
        },
        unitPartners: {
          where: { deletedAt: null },
          include: {
            partner: {
              select: { name: true, phone: true },
            },
          },
        },
        installments: {
          where: { deletedAt: null },
          orderBy: { dueDate: 'asc' },
        },
        vouchers: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error fetching unit:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الوحدة' },
      { status: 500 }
    )
  }
}

// PUT /api/units/[id] - Update unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = unitSchema.parse(body)

    // Check if unit exists
    const existingUnit = await prisma.unit.findFirst({
      where: { id: params.id, deletedAt: null },
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Check for duplicate code (excluding current unit)
    const existingCode = await prisma.unit.findFirst({
      where: { 
        code: validatedData.code, 
        deletedAt: null,
        id: { not: params.id }
      },
    })
    if (existingCode) {
      return NextResponse.json(
        { error: 'كود الوحدة موجود بالفعل' },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(unit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث الوحدة' },
      { status: 500 }
    )
  }
}

// DELETE /api/units/[id] - Soft delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await prisma.unit.findFirst({
      where: { id: params.id, deletedAt: null },
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if unit has active contracts
    const activeContracts = await prisma.contract.count({
      where: { unitId: params.id, deletedAt: null },
    })

    if (activeContracts > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الوحدة لوجود عقود نشطة' },
        { status: 400 }
      )
    }

    await prisma.unit.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'تم حذف الوحدة بنجاح' })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { error: 'فشل في حذف الوحدة' },
      { status: 500 }
    )
  }
}