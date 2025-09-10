import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get single unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        unitPartners: {
          include: {
            partner: true
          }
        }
      }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: unit
    })
  } catch (error) {
    console.error('Error fetching unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحميل الوحدة' },
      { status: 500 }
    )
  }
}

// PATCH - Update unit
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, name, unitType, area, floor, building, totalPrice, notes } = body

    // Check if unit exists
    const existingUnit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Update unit
    const updatedUnit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(unitType && { unitType }),
        ...(area !== undefined && { area: area || null }),
        ...(floor !== undefined && { floor: floor || null }),
        ...(building !== undefined && { building: building || null }),
        ...(totalPrice !== undefined && { totalPrice: totalPrice ? parseFloat(totalPrice) : 0 }),
        ...(notes !== undefined && { notes: notes || null })
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUnit,
      message: 'تم تحديث الوحدة بنجاح'
    })
  } catch (error) {
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحديث الوحدة' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if unit exists
    const existingUnit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Soft delete unit
    await prisma.unit.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف الوحدة بنجاح'
    })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في حذف الوحدة' },
      { status: 500 }
    )
  }
}