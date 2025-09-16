import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const installmentSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  dueDate: z.string().transform((str) => new Date(str)),
  status: z.enum(['مدفوع', 'معلق', 'متأخر']).default('معلق'),
  notes: z.string().optional(),
})

// GET /api/installments/[id] - Get installment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installment = await prisma.installment.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        unit: {
          select: { code: true, name: true, totalPrice: true },
        },
      },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(installment)
  } catch (error) {
    console.error('Error fetching installment:', error)
    return NextResponse.json(
      { error: 'فشل في جلب القسط' },
      { status: 500 }
    )
  }
}

// PUT /api/installments/[id] - Update installment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = installmentSchema.parse(body)

    // Check if installment exists
    const existingInstallment = await prisma.installment.findFirst({
      where: { id: params.id, deletedAt: null },
    })

    if (!existingInstallment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

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

    const installment = await prisma.installment.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        unit: {
          select: { code: true, name: true, totalPrice: true },
        },
      },
    })

    return NextResponse.json(installment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating installment:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث القسط' },
      { status: 500 }
    )
  }
}

// DELETE /api/installments/[id] - Soft delete installment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installment = await prisma.installment.findFirst({
      where: { id: params.id, deletedAt: null },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    await prisma.installment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'تم حذف القسط بنجاح' })
  } catch (error) {
    console.error('Error deleting installment:', error)
    return NextResponse.json(
      { error: 'فشل في حذف القسط' },
      { status: 500 }
    )
  }
}