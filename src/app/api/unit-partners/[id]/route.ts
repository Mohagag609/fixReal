import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE - Remove partner from unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if unit-partner relationship exists
    const existingUnitPartner = await prisma.unitPartner.findFirst({
      where: {
        id: params.id
      }
    })

    if (!existingUnitPartner) {
      return NextResponse.json(
        { success: false, error: 'العلاقة غير موجودة' },
        { status: 404 }
      )
    }

    // Delete the relationship
    await prisma.unitPartner.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إزالة الشريك من الوحدة بنجاح'
    })
  } catch (error) {
    console.error('Error removing partner from unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في إزالة الشريك' },
      { status: 500 }
    )
  }
}