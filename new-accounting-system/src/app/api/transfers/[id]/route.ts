import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const transferSchema = z.object({
  fromSafeId: z.string().min(1, 'الخزينة المصدر مطلوبة'),
  toSafeId: z.string().min(1, 'الخزينة الوجهة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  description: z.string().optional(),
})

// GET /api/transfers/[id] - Get transfer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await prisma.transfer.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        fromSafe: {
          select: { name: true },
        },
        toSafe: {
          select: { name: true },
        },
      },
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'التحويل غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(transfer)
  } catch (error) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json(
      { error: 'فشل في جلب التحويل' },
      { status: 500 }
    )
  }
}

// PUT /api/transfers/[id] - Update transfer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = transferSchema.parse(body)

    // Check if transfer exists
    const existingTransfer = await prisma.transfer.findFirst({
      where: { id: params.id, deletedAt: null },
    })

    if (!existingTransfer) {
      return NextResponse.json(
        { error: 'التحويل غير موجود' },
        { status: 404 }
      )
    }

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

    // Update transfer and balances in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Revert old transfer
      await tx.safe.update({
        where: { id: existingTransfer.fromSafeId },
        data: { balance: { increment: existingTransfer.amount } },
      })

      await tx.safe.update({
        where: { id: existingTransfer.toSafeId },
        data: { balance: { decrement: existingTransfer.amount } },
      })

      // Check if new source safe has enough balance
      const newFromSafe = await tx.safe.findUnique({
        where: { id: validatedData.fromSafeId },
      })

      if (newFromSafe!.balance < validatedData.amount) {
        throw new Error('الرصيد غير كافي في الخزينة المصدر')
      }

      // Apply new transfer
      await tx.safe.update({
        where: { id: validatedData.fromSafeId },
        data: { balance: { decrement: validatedData.amount } },
      })

      await tx.safe.update({
        where: { id: validatedData.toSafeId },
        data: { balance: { increment: validatedData.amount } },
      })

      // Update transfer
      const transfer = await tx.transfer.update({
        where: { id: params.id },
        data: validatedData,
        include: {
          fromSafe: {
            select: { name: true },
          },
          toSafe: {
            select: { name: true },
          },
        },
      })

      return transfer
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث التحويل' },
      { status: 500 }
    )
  }
}

// DELETE /api/transfers/[id] - Soft delete transfer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transfer = await prisma.transfer.findFirst({
      where: { id: params.id, deletedAt: null },
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'التحويل غير موجود' },
        { status: 404 }
      )
    }

    // Revert transfer and update balances in a transaction
    await prisma.$transaction(async (tx) => {
      // Revert balances
      await tx.safe.update({
        where: { id: transfer.fromSafeId },
        data: { balance: { increment: transfer.amount } },
      })

      await tx.safe.update({
        where: { id: transfer.toSafeId },
        data: { balance: { decrement: transfer.amount } },
      })

      // Soft delete transfer
      await tx.transfer.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      })
    })

    return NextResponse.json({ message: 'تم حذف التحويل بنجاح' })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json(
      { error: 'فشل في حذف التحويل' },
      { status: 500 }
    )
  }
}